import * as React from 'react';

import { cn } from '../ui/utils';

export type StatusPanelStatus = 'info' | 'success' | 'warning' | 'error';

export interface StatusPanelProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'title'> {
  status?: StatusPanelStatus;
  title?: React.ReactNode;
  description?: React.ReactNode;
  icon?: React.ReactNode;
  actions?: React.ReactNode;
}

const statusStyles: Record<StatusPanelStatus, string> = {
  info: 'border-primary-500/30 bg-primary-500/10 text-gray-800 dark:text-gray-100',
  success: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-900 dark:text-emerald-100',
  warning: 'border-amber-500/30 bg-amber-500/10 text-amber-900 dark:text-amber-100',
  error: 'border-red-500/30 bg-red-500/10 text-red-900 dark:text-red-100',
};

const StatusPanel = React.forwardRef<HTMLDivElement, StatusPanelProps>(
  ({ className, status = 'info', title, description, icon, actions, children, role, ...props }, ref) => (
    <div
      ref={ref}
      role={role ?? (status === 'error' ? 'alert' : 'status')}
      className={cn('flex items-start gap-3 rounded-xl border px-4 py-3 text-sm backdrop-blur-sm', statusStyles[status], className)}
      {...props}
    >
      {icon ? <div className="mt-0.5 shrink-0" aria-hidden={!title}>{icon}</div> : null}
      <div className="min-w-0 flex-1 space-y-1">
        {title ? <h3 className="font-semibold leading-tight">{title}</h3> : null}
        {description ? <p className="leading-relaxed opacity-90">{description}</p> : null}
        {children}
      </div>
      {actions ? <div className="ml-auto flex shrink-0 items-center gap-2">{actions}</div> : null}
    </div>
  ),
);
StatusPanel.displayName = 'StatusPanel';

export { StatusPanel };
