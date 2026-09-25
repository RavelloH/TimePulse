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
        'relative inline-flex shrink-0 items-center justify-center rounded-full border border-white/60 shadow-sm outline-none transition-[border-color,box-shadow,filter] hover:border-primary-500/70 hover:shadow-md focus-visible:ring-2 focus-visible:ring-primary-500 disabled:pointer-events-none disabled:opacity-50 dark:border-white/20',
        {
          'size-7': size === 'sm',
          'size-9': size === 'md',
          'size-11': size === 'lg',
          'ring-2 ring-primary-500': selected,
        },
        className,
      )}
      style={{
        backgroundColor: `color-mix(in srgb, ${color} 78%, transparent)`,
        WebkitBackdropFilter: 'blur(8px)',
        backdropFilter: 'blur(8px)',
        ...style,
      }}
      {...props}
    >
      {children}
      {selected ? <span aria-hidden className="text-xs font-semibold text-white drop-shadow">✓</span> : null}
    </button>
  ),
);
ColorSwatch.displayName = 'ColorSwatch';

export { ColorSwatch };
