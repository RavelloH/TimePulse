import * as React from 'react';
import { Tabs as TabsPrimitive } from 'radix-ui';

import { cn } from './utils';

const Tabs = TabsPrimitive.Root;

const TabsList = React.forwardRef<
  HTMLDivElement,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.List>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.List
    ref={ref}
    className={cn(
      'inline-flex h-10 items-center justify-center rounded-lg bg-gray-500/10 p-1 text-gray-600 dark:text-gray-300',
      className,
    )}
    {...props}
  />
));
TabsList.displayName = TabsPrimitive.List.displayName ?? 'TabsList';

const TabsTrigger = React.forwardRef<
  HTMLButtonElement,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Trigger
    ref={ref}
    className={cn(
      'inline-flex min-h-8 items-center justify-center rounded-md px-3 py-1.5 text-sm font-medium outline-none transition-colors hover:text-gray-900 focus-visible:ring-2 focus-visible:ring-primary-500 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-white data-[state=active]:text-gray-900 data-[state=active]:shadow-sm dark:hover:text-gray-50 dark:data-[state=active]:bg-white/10 dark:data-[state=active]:text-gray-50',
      className,
    )}
    {...props}
  />
));
TabsTrigger.displayName = TabsPrimitive.Trigger.displayName ?? 'TabsTrigger';

const TabsContent = React.forwardRef<
  HTMLDivElement,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Content>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Content
    ref={ref}
    className={cn('mt-2 outline-none focus-visible:ring-2 focus-visible:ring-primary-500', className)}
    {...props}
  />
));
TabsContent.displayName = TabsPrimitive.Content.displayName ?? 'TabsContent';

export { Tabs, TabsContent, TabsList, TabsTrigger };
