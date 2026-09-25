import { useState, useEffect } from 'react';
import { FiGithub, FiClock, FiInfo, FiWifiOff, FiRefreshCw } from 'react-icons/fi';
import { useTranslation } from '@/i18n/useTranslation';
import { AutoResizer, AutoTransition } from '@/components/ui';

type TranslationContextValue = {
  t: (key: string, defaultValue?: string) => string;
};

type CacheUpdatedDetail = {
  timestamp: string | number;
};

type ServiceWorkerWindow = Window & {
  updateServiceWorkerCache?: () => boolean;
};

export default function Footer() {
  const { t } = useTranslation();
  const [logs, setLogs] = useState<string[]>([]);
  const [currentTime, setCurrentTime] = useState('');
  const [isOffline, setIsOffline] = useState(false);
  const [isCacheUpdating, setIsCacheUpdating] = useState(false);
  const [lastCacheUpdate, setLastCacheUpdate] = useState<string | null>(null);

  // 检查网络状态
  useEffect(() => {
    if (typeof navigator !== 'undefined') {
      setIsOffline(!navigator.onLine);
      
      const handleOnline = () => setIsOffline(false);
      const handleOffline = () => setIsOffline(true);
      
      window.addEventListener('online', handleOnline);
      window.addEventListener('offline', handleOffline);
      
      return () => {
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
      };
    }
  }, []);

  // 更新当前时间
  useEffect(() => {
    const formatTime = () => {
      const now = new Date();
      setCurrentTime(now.toLocaleString());
    };

    // 初始化时间
    formatTime();
    
    // 每秒更新时间
    const interval = setInterval(formatTime, 1000);
    
    return () => clearInterval(interval);
  }, []);

  // 收集控制台日志
  useEffect(() => {
    const originalConsoleLog = console.log;
    const logs: string[] = [];
    
      console.log = (...args: unknown[]) => {
        originalConsoleLog.apply(console, args);
        logs.push(args.join(' '));
        if (logs.length > 50) logs.shift(); // 限制日志数量
      // TimerProvider also writes startup logs during its render phase. Defer
      // the mirror update so React 19 never receives a cross-component update
      // while another component is rendering.
      setTimeout(() => setLogs([...logs]), 0);
      };
    
    return () => {
      console.log = originalConsoleLog;
    };
  }, []);

  // 监听缓存更新事件
  useEffect(() => {
    const handleCacheUpdated = (event: Event) => {
      const { timestamp } = (event as CustomEvent<CacheUpdatedDetail>).detail;
      setIsCacheUpdating(false);
      setLastCacheUpdate(new Date(timestamp).toLocaleString());
    };
    
    window.addEventListener('cacheUpdated', handleCacheUpdated);
    return () => window.removeEventListener('cacheUpdated', handleCacheUpdated);
  }, []);
  
  // 更新缓存
  const updateCache = () => {
    const updateServiceWorkerCache = (window as ServiceWorkerWindow).updateServiceWorkerCache;
    if (typeof updateServiceWorkerCache === 'function') {
      const success = updateServiceWorkerCache();
      if (success) {
        setIsCacheUpdating(true);
        console.log('已发送缓存更新请求');
      } else {
        console.log('无法更新缓存：Service Worker 未激活');
      }
    } else {
      console.log('缓存更新功能不可用');
    }
  };

  return (
    <div className="pointer-events-auto w-full flex items-start justify-center text-gray-800 dark:text-white px-4 py-8 pt-20 sm:pt-24 pb-8 sm:pb-12">
      <div className="w-full max-w-4xl glass-card p-3 sm:p-4 md:p-6 rounded-2xl max-h-[calc(100vh-10rem)] sm:max-h-[calc(100vh-12rem)] overflow-y-auto mt-4">
        {/* 在移动设备上使用更紧凑的布局 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-6">
          <div>
            <h2 className="text-lg md:text-xl font-bold mb-2 md:mb-3 flex items-center text-gray-800 dark:text-white">
              <FiInfo className="mr-2" /> {t('footer.about', '关于 TimePulse')}
            </h2>
            <p className="mb-2 md:mb-3 text-sm text-gray-700 dark:text-gray-200">
              {t('footer.description', 'TimePulse 是一个现代化的倒计时应用，支持多个计时器、数据同步和美观的动效展示。')}
            </p>
            
            <div className="mb-3 md:mb-4">
              <a 
                href="https://github.com/RavelloH/TimePulse" 
                target="_blank" 
                rel="noopener noreferrer"
                className="btn-glass-secondary inline-flex items-center rounded-full px-3 py-1.5 text-sm transition-colors"
                data-insightflare-event="github_visit"
              >
                <FiGithub className="mr-1 md:mr-2" /> {t('footer.gitHubRepo', 'GitHub 仓库')}
              </a>
            </div>
            
            <div className="mb-3">
              <h3 className="text-sm md:text-base font-semibold mb-1 text-gray-800 dark:text-white">{t('footer.features', '功能特点')}</h3>
              <ul className="list-disc list-inside space-y-0.5 text-xs md:text-sm text-gray-700 dark:text-gray-200">
                <li>{t('footer.feature1', '精美的视觉效果和动画')}</li>
                <li>{t('footer.feature2', '支持多个计时器')}</li>
                <li>{t('footer.feature3', '数据本地存储')}</li>
                <li>{t('footer.feature4', '数据分享与同步')}</li>
                <li>{t('footer.feature5', '暗色/亮色主题')}</li>
                <li>{t('footer.feature6', '全屏模式')}</li>
                <li>{t('footer.feature7', '响应式设计')}</li>
              </ul>
            </div>
          </div>
          
          <div>
            <h2 className="text-lg md:text-xl font-bold mb-2 md:mb-3 flex items-center">
              <FiClock className="mr-2" /> {t('footer.runLog', '运行日志')}
            </h2>
            
            <div className="bg-gray-200/50 dark:bg-black/30 backdrop-blur-sm border border-gray-200/40 dark:border-white/10 rounded-lg p-2 mb-2">
              <p className="text-xs font-mono">{t('footer.currentTime', '当前时间')}: {currentTime}</p>
            </div>
            
            {/* 减少移动设备上的日志高度 */}
            <div className="h-24 sm:h-32 md:h-48 overflow-y-auto bg-gray-200/50 dark:bg-black/30 backdrop-blur-sm border border-gray-200/40 dark:border-white/10 rounded-lg p-2 font-mono text-xs">
              <AutoTransition transitionKey={logs.length > 0 ? `logs-${logs.length}` : 'logs-empty'} initial={false}>
                {logs.length > 0 ? (
                  <div>
                    {logs.map((log, index) => (
                      <AutoTransition
                        key={`${index}-${log}`}
                        transitionKey={`${index}-${log}`}
                        type="slideUp"
                        initial={false}
                        className="mb-1 break-words"
                      >
                        <span>{log}</span>
                      </AutoTransition>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-400">{t('footer.noLogs', '暂无日志记录...')}</p>
                )}
              </AutoTransition>
            </div>
          </div>
        </div>
        
        {/* 离线模式提示 - 位于页脚中间，使用低调样式 */}
        <div className="pt-3 md:pt-4">
        <AutoResizer className="text-center opacity-70 flex flex-col items-center gap-1" initial={false}>
          <AutoTransition transitionKey={isOffline ? 'offline' : 'online'} initial={false} type="slideDown">
            {isOffline ? (
              <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center justify-center">
                <FiWifiOff className="mr-1 w-3 h-3" />
                <span>{t('footer.offlineMode', '当前处于离线模式，部分功能可能不可用')}</span>
              </p>
            ) : null}
          </AutoTransition>
          
          {/* 缓存更新按钮 */}
          <div className="flex items-center space-x-2">
            <button 
              className={`text-xs flex items-center justify-center px-2 py-1 rounded text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors ${isCacheUpdating ? 'opacity-50 cursor-wait' : ''}`}
              onClick={updateCache}
              disabled={isCacheUpdating || isOffline}
              title={t('footer.updateCache', '更新应用缓存')}
              data-insightflare-event="cache_update_trigger"
            >
              <FiRefreshCw className={`mr-1 w-3 h-3 ${isCacheUpdating ? 'animate-spin' : ''}`} />
              <span>{t('footer.updateCacheText', '更新缓存')}</span>
            </button>
            
            <AutoTransition transitionKey={lastCacheUpdate ?? 'no-cache-update'} initial={false} className="inline-flex">
              {lastCacheUpdate ? (
                <span className="text-xs text-gray-400 dark:text-gray-500">
                  {t('footer.lastUpdate', '上次更新')}: {lastCacheUpdate}
                </span>
              ) : null}
            </AutoTransition>
          </div>
        </AutoResizer>
        </div>
        
        <div className="mt-3 md:mt-4 pt-2 border-t border-gray-300 dark:border-white/10 text-center text-xs text-gray-600 dark:text-gray-300">
          <p>
            © {new Date().getFullYear()} <a className="underline" href="https://timepulse.ravelloh.top/">TimePulse</a> by <a className="underline" href="https://ravelloh.top/">RavelloH</a>. {t('footer.builtWith', '使用 Vite 和 Framer Motion 构建')}。
          </p>
        </div>
      </div>
    </div>
  );
}
