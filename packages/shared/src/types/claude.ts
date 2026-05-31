export interface ClaudeMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface ClaudeChatRequest {
  messages: ClaudeMessage[];
}
