import { useState, useRef, useEffect, useCallback } from 'react';
import { Send, RotateCcw, Bot } from 'lucide-react';
import { cn } from '../../lib/utils';
import type { ClaudeMessage } from '@dash/shared';

const API_BASE = 'http://localhost:7432';

// ── Types ─────────────────────────────────────────────────────────────────────

interface DisplayMessage extends ClaudeMessage {
  id: string;
  streaming?: boolean;
}

// ── Streaming fetch ───────────────────────────────────────────────────────────

async function streamChat(
  messages: ClaudeMessage[],
  onChunk: (text: string) => void,
  onDone: () => void,
  onError: (msg: string) => void,
  signal: AbortSignal,
): Promise<void> {
  let res: Response;
  try {
    res = await fetch(`${API_BASE}/api/claude/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages }),
      signal,
    });
  } catch (err) {
    if ((err as Error).name === 'AbortError') return;
    onError('Network error — is the server running?');
    return;
  }

  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: res.statusText })) as { error?: string };
    onError(body.error ?? res.statusText);
    return;
  }

  const reader = res.body!.getReader();
  const decoder = new TextDecoder();
  let buf = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buf += decoder.decode(value, { stream: true });

    // SSE lines are separated by \n\n; parse each complete event
    const events = buf.split('\n\n');
    buf = events.pop() ?? ''; // last item may be incomplete

    for (const event of events) {
      for (const line of event.split('\n')) {
        if (!line.startsWith('data: ')) continue;
        const data = line.slice(6);
        if (data === '[DONE]') { onDone(); return; }
        try {
          const parsed = JSON.parse(data) as { text?: string; error?: string };
          if (parsed.error) { onError(parsed.error); return; }
          if (parsed.text) onChunk(parsed.text);
        } catch { /* malformed chunk — skip */ }
      }
    }
  }

  onDone();
}

// ── Message bubble ────────────────────────────────────────────────────────────

function MessageBubble({ msg }: { msg: DisplayMessage }) {
  const isUser = msg.role === 'user';
  return (
    <div className={cn('flex', isUser ? 'justify-end' : 'justify-start')}>
      {!isUser && (
        <div className="shrink-0 w-5 h-5 rounded-full bg-th-elevated border border-th-line flex items-center justify-center mt-0.5 mr-1.5">
          <Bot size={10} className="text-th-ghost" />
        </div>
      )}
      <div
        className={cn(
          'max-w-[85%] px-2.5 py-1.5 rounded-xl text-[11px] leading-relaxed whitespace-pre-wrap break-words',
          isUser
            ? 'bg-th-overlay text-th-hi rounded-tr-sm'
            : 'bg-th-elevated text-th-2 rounded-tl-sm',
          msg.streaming && 'after:content-["▋"] after:animate-pulse after:ml-0.5 after:text-th-ghost',
        )}
      >
        {msg.content || (msg.streaming ? '' : '…')}
      </div>
    </div>
  );
}

// ── Main widget ───────────────────────────────────────────────────────────────

export function ClaudeWidget() {
  const [messages, setMessages]   = useState<DisplayMessage[]>([]);
  const [input, setInput]         = useState('');
  const [loading, setLoading]     = useState(false);
  const [unconfigured, setUnconfigured] = useState(false);
  const abortRef  = useRef<AbortController | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll on new content
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Auto-resize textarea
  useEffect(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = 'auto';
    ta.style.height = `${Math.min(ta.scrollHeight, 80)}px`;
  }, [input]);

  const send = useCallback(async () => {
    const text = input.trim();
    if (!text || loading) return;

    setInput('');
    setUnconfigured(false);

    const userMsg: DisplayMessage = { id: crypto.randomUUID(), role: 'user', content: text };
    const assistantId = crypto.randomUUID();
    const assistantMsg: DisplayMessage = { id: assistantId, role: 'assistant', content: '', streaming: true };

    setMessages((prev) => [...prev, userMsg, assistantMsg]);
    setLoading(true);

    // Build history for the API (exclude the empty streaming placeholder)
    const history: ClaudeMessage[] = [...messages, userMsg].map(({ role, content }) => ({ role, content }));

    const ctrl = new AbortController();
    abortRef.current = ctrl;

    await streamChat(
      history,
      // onChunk
      (chunk) => {
        setMessages((prev) =>
          prev.map((m) => m.id === assistantId ? { ...m, content: m.content + chunk } : m),
        );
      },
      // onDone
      () => {
        setMessages((prev) =>
          prev.map((m) => m.id === assistantId ? { ...m, streaming: false } : m),
        );
        setLoading(false);
        abortRef.current = null;
      },
      // onError
      (err) => {
        const isConfig = err.includes('ANTHROPIC_API_KEY');
        setUnconfigured(isConfig);
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantId
              ? { ...m, content: isConfig ? '' : `Error: ${err}`, streaming: false }
              : m,
          ).filter((m) => !(m.id === assistantId && isConfig)),
        );
        setLoading(false);
        abortRef.current = null;
      },
      ctrl.signal,
    );
  }, [input, loading, messages]);

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      void send();
    }
  }

  function clearChat() {
    abortRef.current?.abort();
    setMessages([]);
    setLoading(false);
    setUnconfigured(false);
  }

  // ── Unconfigured state ──
  if (unconfigured) {
    return (
      <div className="h-full flex flex-col items-center justify-center gap-3 px-6 text-center">
        <Bot size={28} className="text-th-ghost" />
        <div className="flex flex-col gap-1">
          <p className="text-th-hi text-[12px] font-medium">API key not set</p>
          <p className="text-th-ghost text-[10px] leading-relaxed">
            Add <code className="bg-th-elevated px-1 py-0.5 rounded text-[9px] font-mono">ANTHROPIC_API_KEY</code> to your <code className="bg-th-elevated px-1 py-0.5 rounded text-[9px] font-mono">.env</code> and restart the server.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col min-h-0">
      {/* Messages */}
      <div className="flex-1 min-h-0 overflow-y-auto px-3 py-2 flex flex-col gap-2 scrollbar-thin">
        {messages.length === 0 && (
          <div className="flex-1 flex flex-col items-center justify-center gap-2 text-center pointer-events-none">
            <Bot size={22} className="text-th-ghost/50" />
            <p className="text-th-ghost text-[10px]">Ask me anything</p>
          </div>
        )}
        {messages.map((msg) => (
          <MessageBubble key={msg.id} msg={msg} />
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Input row */}
      <div className="shrink-0 border-t border-th-line px-2 py-2 flex items-end gap-1.5">
        {messages.length > 0 && (
          <button
            onClick={clearChat}
            title="Clear chat"
            className="shrink-0 p-1.5 rounded text-th-ghost hover:text-th-hi hover:bg-th-elevated transition-colors mb-0.5"
          >
            <RotateCcw size={11} />
          </button>
        )}
        <textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Message Claude… (Enter to send)"
          rows={1}
          className={cn(
            'flex-1 resize-none bg-th-elevated border border-th-line rounded-lg',
            'px-2.5 py-1.5 text-[11px] text-th-hi placeholder:text-th-ghost',
            'focus:outline-none focus:border-th-3 transition-colors leading-relaxed',
            'scrollbar-none',
          )}
        />
        <button
          onClick={() => void send()}
          disabled={!input.trim() || loading}
          title="Send"
          className="shrink-0 p-1.5 rounded-lg bg-th-overlay hover:bg-th-overlay/70 text-th-hi transition-colors disabled:opacity-30 disabled:cursor-not-allowed mb-0.5"
        >
          <Send size={11} />
        </button>
      </div>
    </div>
  );
}
