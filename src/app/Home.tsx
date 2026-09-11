import { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { AutoResizer, AutoTransition } from '@/components/ui';
import Layout from '@/components/layout/Layout';
import { CustomBackground, GradientBackground } from '@/features/background/components';
import { LoginModal } from '@/features/sync';
import BackgroundSettingsModal from '@/features/background/components/BackgroundSettingsModal';
import FullscreenSettingsModal from '@/features/fullscreen/components/FullscreenSettingsModal';
import TimerDisplay from '@/features/countdown/components/TimerDisplay';
import { useTimers } from './providers/TimerProvider';
import { useTheme } from './providers/ThemeProvider';
import { useFullscreen } from './providers/FullscreenProvider';
import { useTranslation } from '@/i18n/useTranslation';
import { parseShareUrl } from '@/services/sharing';
import { usePageTransition } from '@/hooks/usePageTransition';
import type { Timer } from '../domain/timer';

export default function Home() {
  const { timers, activeTimerId, setActiveTimerId, addTimer } = useTimers();
  const { theme, accentColor } = useTheme();
  const { isFullscreen } = useFullscreen();
  const { isAbout, direction } = usePageTransition();
  const { t } = useTranslation();
  const showMainPage = !isAbout || isFullscreen;
  
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isBackgroundSettingsOpen, setIsBackgroundSettingsOpen] = useState(false);
  const [isFullscreenSettingsOpen, setIsFullscreenSettingsOpen] = useState(false);
  const [log, setLog] = useState<string[]>([]);

  // 添加日志
  const addLog = (message: string) => {
    setLog(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${message}`]);
  };

  // 监听URL参数以同步数据
  useEffect(() => {
    const share = new URLSearchParams(window.location.search).get('share');
    if (share) {
      try {
        const sharedData = parseShareUrl(share) as { timers?: Timer[] } | null;
        if (sharedData?.timers && sharedData.timers.length > 0) {
          sharedData.timers.forEach(timer => {
            addTimer(timer);
          });
          setActiveTimerId(sharedData.timers[0].id);
          addLog('已从分享链接导入计时器数据');
        }
      } catch (error) {
        addLog(`解析分享数据错误: ${error instanceof Error ? error.message : String(error)}`);
      }
    }
  }, [addTimer, setActiveTimerId]);

  // 初始化日志
  useEffect(() => {
    addLog('TimePulse 初始化完成');
    addLog(`当前主题: ${theme}`);
    addLog(`加载了 ${timers.length} 个计时器`);
  }, [theme, timers.length]);

  // 监听 hash 变化打开弹窗
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace('#', '');

      switch (hash) {
        case 'background':
          setIsBackgroundSettingsOpen(true);
          break;
        case 'fullscreen-settings':
          setIsFullscreenSettingsOpen(true);
          break;
      }
    };

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  return (
    <>
      <Layout>
        <GradientBackground />
        <CustomBackground />

        <AnimatePresence initial={false} custom={direction}>
          {showMainPage ? (
            <motion.div
              key="timer-page-visible"
              custom={direction}
              variants={{
                initial: (value: unknown) => ({ opacity: 0, y: value === 1 ? 56 : -56 }),
                animate: {
                  opacity: 1,
                  y: 0,
                  transition: {
                    duration: 0.36,
                    delay: !isAbout && direction === -1 ? 0.3 : 0,
                    ease: 'easeOut',
                  },
                },
                exit: (value: unknown) => ({
                  opacity: 0,
                  y: value === 1 ? -56 : 56,
                  transition: { duration: 0.28, ease: 'easeIn' },
                }),
              }}
              initial="initial"
              animate="animate"
              exit="exit"
              className="absolute inset-0 z-10"
            >
              <main
                className={`relative flex h-full min-h-0 flex-col items-center justify-center ${isFullscreen ? '' : 'py-12'}`}
                data-page-view="main"
              >
                <AutoResizer className="w-full" initial={false} overflow="visible">
                  <TimerDisplay />
                </AutoResizer>
              </main>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </Layout>
      
      
      {/* 登录弹窗 */}
      <AutoTransition portal transitionKey={isLoginModalOpen ? 'login-open' : 'login-closed'} initial={false}>
        {isLoginModalOpen ? (
          <LoginModal onClose={() => {
            setIsLoginModalOpen(false);
            if (window.location.hash === '#login') {
              window.location.hash = '';
            }
          }} />
        ) : null}
      </AutoTransition>

      {/* 背景设置弹窗 */}
      <AutoTransition portal transitionKey={isBackgroundSettingsOpen ? 'background-open' : 'background-closed'} initial={false}>
        {isBackgroundSettingsOpen ? (
          <BackgroundSettingsModal onClose={() => {
            setIsBackgroundSettingsOpen(false);
            if (window.location.hash === '#background') {
              window.location.hash = '';
            }
          }} />
        ) : null}
      </AutoTransition>

      {/* 全屏设置弹窗 */}
      <AutoTransition portal transitionKey={isFullscreenSettingsOpen ? 'fullscreen-open' : 'fullscreen-closed'} initial={false}>
        {isFullscreenSettingsOpen ? (
          <FullscreenSettingsModal onClose={() => {
            setIsFullscreenSettingsOpen(false);
            if (window.location.hash === '#fullscreen-settings') {
              window.location.hash = '';
            }
          }} />
        ) : null}
      </AutoTransition>
    </>
  );
}
