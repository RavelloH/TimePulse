import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { FiRefreshCw, FiX } from 'react-icons/fi';
import { useTranslation } from '@/i18n/useTranslation';
import { track } from '@/services/analytics';
import { AutoResizer, AutoTransition } from '@/components/ui';

export default function UpdateToast() {
  const { t } = useTranslation();
  const [showToast, setShowToast] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // 使用 ref 来跟踪最后处理的更新时间戳，避免重复提示
  const lastProcessedTimestampRef = useRef<string | number | null>(null);

  useEffect(() => {
    const handleCacheUpdated = (event: Event) => {
      const detail = (event as CustomEvent<{ hasUpdates?: boolean; timestamp?: string | number }>).detail;
      // 检查是否真的有更新，并且不是重复的同一更新
      if (detail?.hasUpdates) {
        const updateTimestamp = detail.timestamp ?? null;

        // 如果这个更新已经被处理过，则不再显示
        if (lastProcessedTimestampRef.current === updateTimestamp) {
          console.log('重复的更新提示，忽略');
          return;
        }

        // 记录这次处理的更新时间戳
        lastProcessedTimestampRef.current = updateTimestamp;
        setShowToast(true);
        console.log(`${new Date().toLocaleTimeString()} | [PWA] 检测到应用更新，提示用户刷新`);
      }
    };

    window.addEventListener('cacheUpdatedWithChanges', handleCacheUpdated);
    return () => window.removeEventListener('cacheUpdatedWithChanges', handleCacheUpdated);
  }, []); // 空依赖数组，只在组件挂载时绑定一次

  const handleRefresh = () => {
    setIsRefreshing(true);
    track('update_toast_refresh');
    // 关闭 toast
    setShowToast(false);

    // 延迟一点时间显示刷新动画，然后刷新页面
    setTimeout(() => {
      window.location.reload();
    }, 500);
  };

  const handleDismiss = () => {
    track('update_toast_dismiss');
    setShowToast(false);
  };

  return (
    <AutoTransition
      portal
      transitionKey={showToast ? 'update-toast-open' : 'update-toast-closed'}
      initial={false}
      type="fade"
      className="fixed inset-0 bg-black/50 p-4 flex items-center justify-center z-[550] backdrop-blur-sm"
      style={{ pointerEvents: showToast ? 'auto' : 'none' }}
      onClick={handleDismiss}
    >
      {showToast ? (
        <AutoResizer initial overflow="hidden">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="glass-card w-full max-w-md p-6 rounded-2xl"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center space-x-3">
                <div className="flex-shrink-0">
                  <FiRefreshCw className="w-6 h-6 text-primary-500" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    {t('updateToast.title', '应用已更新')}
                  </h3>
                </div>
              </div>
              <button
                onClick={handleDismiss}
                className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                <FiX className="w-5 h-5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300" />
              </button>
            </div>

            <div className="mb-6">
              <p className="text-sm text-gray-600 dark:text-gray-300">
                {t('updateToast.message', '发现新版本，建议刷新页面以获得最佳体验')}
              </p>
            </div>

            <div className="flex space-x-3">
              <button
                onClick={handleRefresh}
                disabled={isRefreshing}
                className={`flex-1 btn-glass-primary inline-flex items-center justify-center text-sm ${
                  isRefreshing
                    ? 'cursor-not-allowed opacity-60'
                    : ''
                }`}
              >
                <FiRefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
                {isRefreshing
                  ? t('updateToast.refreshing', '刷新中...')
                  : t('updateToast.refresh', '刷新')
                }
              </button>
              <button
                onClick={handleDismiss}
                className="flex-1 btn-glass-secondary inline-flex items-center justify-center text-sm"
              >
                {t('updateToast.later', '稍后')}
              </button>
            </div>
          </motion.div>
        </AutoResizer>
      ) : null}
    </AutoTransition>
  );
}
