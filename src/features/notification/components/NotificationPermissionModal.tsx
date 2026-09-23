import { useState } from 'react';
import { motion } from 'framer-motion';
import { FiBell, FiX, FiCheck, FiAlertCircle } from 'react-icons/fi';
import { useTranslation } from '@/i18n/useTranslation';
import { track } from '@/services/analytics';
import { AutoResizer, AutoTransition } from '@/components/ui';
import { LinearDialogTransition } from '@/components/composed';

type NotificationPermissionModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onAllow: () => void | Promise<void>;
  onDeny: () => void;
};
type PermissionStep = 'request' | 'success' | 'failed';

export default function NotificationPermissionModal({ isOpen, onClose, onAllow, onDeny }: NotificationPermissionModalProps) {
  const { t } = useTranslation();
  const [step, setStep] = useState<PermissionStep>('request');
  const [stepDirection, setStepDirection] = useState<1 | -1>(1);
  const [isRequesting, setIsRequesting] = useState(false);

  const handleAllow = async () => {
    setIsRequesting(true);
    
    try {
      const permission = await Notification.requestPermission();
      track('notification_permission_result', { result: permission });

      if (permission === 'granted') {
        setStepDirection(1);
        setStep('success');
        setTimeout(() => {
          onAllow();
          handleClose();
        }, 2000);
      } else {
        setStepDirection(1);
        setStep('failed');
        setTimeout(() => {
          setStepDirection(-1);
          setStep('request');
        }, 3000);
      }
    } catch (error) {
      console.error('请求通知权限失败:', error);
      track('notification_permission_result', { result: 'error' });
      setStepDirection(1);
      setStep('failed');
      setTimeout(() => {
        setStepDirection(-1);
        setStep('request');
      }, 3000);
    } finally {
      setIsRequesting(false);
    }
  };

  const handleDeny = () => {
    track('notification_modal_deny');
    onDeny();
    handleClose();
  };

  const handleClose = () => {
    setStepDirection(-1);
    setStep('request');
    onClose();
  };

  const renderContent = () => {
    switch (step) {
      case 'success':
        return (
          <div className="text-center flow-root">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="mx-auto w-16 h-16 rounded-full bg-green-500/80 backdrop-blur-sm flex items-center justify-center mb-6"
            >
              <FiCheck className="w-8 h-8 text-white" />
            </motion.div>
            <h3 className="text-xl font-semibold mb-3">
              {t('notification.success')}
            </h3>
            <p className="text-gray-600 dark:text-gray-300">
              {t('notification.successMessage')}
            </p>
          </div>
        );

      case 'failed':
        return (
          <div className="text-center flow-root">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="mx-auto w-16 h-16 rounded-full bg-red-500/80 backdrop-blur-sm flex items-center justify-center mb-6"
            >
              <FiAlertCircle className="w-8 h-8 text-white" />
            </motion.div>
            <h3 className="text-xl font-semibold mb-3">
              {t('notification.failed')}
            </h3>
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              {t('notification.failedMessage')}
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {t('notification.failedRetry')}
            </p>
          </div>
        );

      default:
        return (
          <>
            <div className="flex items-center justify-between pb-6">
              <div className="flex items-center space-x-3">
                <div className="p-3 rounded-full bg-primary-500/80 backdrop-blur-sm">
                  <FiBell className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-semibold">
                  {t('notification.title')}
                </h3>
              </div>
            </div>

            <div className="pb-6 space-y-4">
              <p className="text-gray-600 dark:text-gray-300">
                {t('notification.description')}
              </p>
              <div className="p-4 rounded-lg bg-yellow-50/80 dark:bg-yellow-900/20 border-l-4 border-yellow-500/60 backdrop-blur-sm">
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  {t('notification.iosHint')}
                </p>
              </div>
            </div>

            <div className="flex space-x-3">
              <button
                onClick={handleAllow}
                disabled={isRequesting}
                className="flex-1 btn-glass-primary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isRequesting ? (
                  <div className="flex items-center justify-center space-x-2">
                    <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                    <span>{t('notification.requesting')}</span>
                  </div>
                ) : (
                  t('notification.allow')
                )}
              </button>
              <button
                onClick={handleDeny}
                disabled={isRequesting}
                className="flex-1 btn-glass-secondary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {t('notification.deny')}
              </button>
            </div>
          </>
        );
    }
  };

  return (
    <AutoTransition
      portal
      transitionKey={isOpen ? 'notification-permission-open' : 'notification-permission-closed'}
      initial={false}
      type="scale"
      className="fixed inset-0 bg-black/50 p-4 flex items-center justify-center z-50 backdrop-blur-sm overflow-x-hidden overflow-y-auto"
      style={{ pointerEvents: isOpen ? 'auto' : 'none' }}
      onClick={handleClose}
    >
      {isOpen ? (
        <AutoResizer initial overflow="hidden">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="glass-card w-full max-w-md p-6 rounded-2xl max-h-[90vh] overflow-x-hidden overflow-y-auto"
            onClick={e => e.stopPropagation()}
          >
            <LinearDialogTransition transitionKey={step} direction={stepDirection}>
              {renderContent()}
            </LinearDialogTransition>
          </motion.div>
        </AutoResizer>
      ) : null}
    </AutoTransition>
  );
}
