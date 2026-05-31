import { GripHorizontal } from 'lucide-react';
import { cn } from '../lib/utils';

interface WidgetShellProps {
  title: string;
  children: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
}

export function WidgetShell({ title, children, actions, className }: WidgetShellProps) {
  return (
    <div className={cn('h-full flex flex-col rounded-lg border border-th-line bg-th-surface overflow-hidden', className)}>
      <div className="widget-drag-handle flex items-center gap-2 px-3 py-2 border-b border-th-line cursor-grab active:cursor-grabbing select-none shrink-0">
        <GripHorizontal className="w-3.5 h-3.5 text-th-ghost" />
        <span className="text-xs font-medium text-th-3 uppercase tracking-widest">{title}</span>
        {actions && (
          <div className="ml-auto" style={{ pointerEvents: 'auto', cursor: 'default' }}>
            {actions}
          </div>
        )}
      </div>
      <div className="flex-1 min-h-0 overflow-hidden">
        {children}
      </div>
    </div>
  );
}
