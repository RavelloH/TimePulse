import { motion } from 'framer-motion';
import type { MouseEvent, ReactNode } from 'react';
import { AutoResizer } from '@/components/ui';

type LinearDialogShellProps = {
  onClose: () => void;
  children: ReactNode;
};

/**
 * Shared frame for a linear dialog chain. The frame is mounted once; callers
 * should transition only the content inside it.
 */
export function LinearDialogShell({ onClose, children }: LinearDialogShellProps) {
  const stopPropagation = (event: MouseEvent<HTMLDivElement>) => {
    event.stopPropagation();
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 p-4 flex items-center justify-center z-50 backdrop-blur-sm overflow-x-hidden overflow-y-auto"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="glass-card scrollbar-hide w-full max-w-md p-6 rounded-2xl max-h-[calc(90vh+0.5rem)] overflow-x-hidden overflow-y-auto"
        onClick={stopPropagation}
      >
        <AutoResizer className="w-full" overflow="hidden">
          {children}
        </AutoResizer>
      </motion.div>
    </motion.div>
  );
}
