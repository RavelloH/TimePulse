import * as React from 'react';

import { cn } from '../ui/utils';

export interface ColorSwatchProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  color: string;
  selected?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

const ColorSwatch = React.forwardRef<HTMLButtonElement, ColorSwatchProps>(
  ({ color, selected = false, size = 'md', className, style, children, 'aria-label': ariaLabel, ...props }, ref) => (
    <button
      ref={ref}
      type="button"
      aria-label={ariaLabel ?? color}
      aria-pressed={selected}
      className={cn(
        'relative inline-flex shrink-0 items-center justify-center rounded-full border border-white/60 shadow-sm outline-none ring-offset-2 transition-transform hover:scale-105 focus-visible:ring-2 focus-visible:ring-primary-500 disabled:pointer-events-none disabled:opacity-50 dark:border-white/20',
        {
          'size-7': size === 'sm',
          'size-9': size === 'md',
          'size-11': size === 'lg',
          'ring-2 ring-primary-500 ring-offset-2': selected,
        },
        className,
      )}
      style={{ backgroundColor: color, ...style }}
      {...props}
    >
      {children}
      {selected ? <span aria-hidden className="text-xs font-semibold text-white drop-shadow">✓</span> : null}
    </button>
  ),
);
ColorSwatch.displayName = 'ColorSwatch';

export { ColorSwatch };
