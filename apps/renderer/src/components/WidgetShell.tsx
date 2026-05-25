import { GripHorizontal } from 'lucide-react';
import { cn } from '../lib/utils';

interface WidgetShellProps {
  title: string;
  children: React.ReactNode;
  className?: string;
}

export function WidgetShell({ title, children, className }: WidgetShellProps) {
  return (
    <div className={cn('h-full flex flex-col rounded-lg border border-zinc-800 bg-zinc-900 overflow-hidden', className)}>
      <div className="widget-drag-handle flex items-center gap-2 px-3 py-2 border-b border-zinc-800 cursor-grab active:cursor-grabbing select-none shrink-0">
        <GripHorizontal className="w-3.5 h-3.5 text-zinc-600" />
        <span className="text-xs font-medium text-zinc-500 uppercase tracking-widest">{title}</span>
      </div>
      <div className="flex-1 min-h-0 overflow-hidden">
        {children}
      </div>
    </div>
  );
}
