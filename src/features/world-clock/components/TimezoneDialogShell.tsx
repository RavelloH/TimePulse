import type { MouseEvent, ReactNode } from 'react';
import { motion } from 'framer-motion';
import { FiX } from 'react-icons/fi';
import { useTranslation } from '@/i18n/useTranslation';

type TimezoneDialogShellProps = {
  title: string;
  onClose: () => void;
  children: ReactNode;
};

export function TimezoneDialogShell({ title, onClose, children }: TimezoneDialogShellProps) {
  const { t } = useTranslation();
  const stopPropagation = (event: MouseEvent<HTMLDivElement>) => event.stopPropagation();

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 p-4 flex items-center justify-center z-50 backdrop-blur-sm overflow-x-hidden overflow-y-auto py-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="glass-card w-full max-w-2xl m-4 p-6 rounded-2xl max-h-[90vh] overflow-x-hidden overflow-y-auto"
        onClick={stopPropagation}
      >
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-semibold">{title}</h2>
          <button
            className="p-2 rounded-full btn-glass-hover border border-white/10 dark:border-white/10"
            onClick={onClose}
          >
            <FiX className="text-xl" />
          </button>
        </div>

        {children}

        <div className="mt-6 flex justify-end">
          <button className="btn-glass-secondary" onClick={onClose}>
            {t('common.cancel', '取消')}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
