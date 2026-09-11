import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from './utils';

const buttonVariants = cva(
  'btn inline-flex shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0',
  {
    variants: {
      variant: {
        glassPrimary:
          'btn-glass-primary shadow-sm hover:shadow-md active:scale-[0.98]',
        glassSecondary:
          'btn-glass-secondary hover:shadow-sm active:scale-[0.98]',
        glassHover:
          'btn-glass-hover border border-transparent hover:border-primary-300/30 active:scale-[0.98]',
        icon:
          'btn-glass-hover size-9 rounded-full border border-transparent p-0 hover:border-primary-300/30',
        danger:
          'border border-red-500/40 bg-red-500/15 text-red-700 backdrop-blur-sm hover:bg-red-500/25 dark:text-red-200',
      },
      size: {
        default: 'min-h-10 px-4 py-2',
        sm: 'min-h-9 rounded-md px-3 text-xs',
        lg: 'min-h-11 rounded-xl px-6',
        icon: 'size-9 p-0',
      },
    },
    defaultVariants: {
      variant: 'glassPrimary',
      size: 'default',
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, type = 'button', ...props }, ref) => (
    <button
      ref={ref}
      type={type}
      className={cn(buttonVariants({ variant, size }), className)}
      {...props}
    />
  ),
);
Button.displayName = 'Button';

export { Button, buttonVariants };
