import * as React from 'react';

import { cn } from './utils';

const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, type, ...props }, ref) => (
    <input
      ref={ref}
      type={type}
      className={cn(
        'flex h-10 w-full rounded-lg border border-gray-200/80 bg-white/60 px-3 py-2 text-sm text-gray-900 shadow-sm outline-none transition-colors backdrop-blur-sm placeholder:text-gray-500 focus:border-primary-400 focus:ring-2 focus:ring-primary-500/20 disabled:cursor-not-allowed disabled:opacity-50 dark:border-white/10 dark:bg-black/20 dark:text-gray-100 dark:placeholder:text-gray-400',
        className,
      )}
      {...props}
    />
  ),
);
Input.displayName = 'Input';

export { Input };
