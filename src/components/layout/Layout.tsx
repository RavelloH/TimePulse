import { useEffect, useState, type ReactNode } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import Header from './Header';
import Footer from './Footer';
import UpdateToast from '@/features/notification/components/UpdateToast';
import { AutoResizer, AutoTransition } from '@/components/ui';
import { ThemeColorSynchronizer } from '@/app/providers/ThemeProvider';
import { useFullscreen } from '@/app/providers/FullscreenProvider';
import { usePageTransition } from '@/hooks/usePageTransition';
import { useTranslation } from '@/i18n/useTranslation';

type LayoutProps = {
  children: ReactNode;
  onHeaderHeightChange?: (height: number) => void;
};

const SCROLL_HINT_DISMISSED_KEY = 'timepulse-scroll-hint-dismissed';

function readScrollHintDismissed(): boolean {
  try {
    return localStorage.getItem(SCROLL_HINT_DISMISSED_KEY) === 'true';
  } catch {
    return false;
  }
}

export default function Layout({ children, onHeaderHeightChange }: LayoutProps) {
  const { t } = useTranslation();
  const { isFullscreen } = useFullscreen();
  const { isAbout, direction } = usePageTransition();
  const [scrollHintDismissed, setScrollHintDismissed] = useState(readScrollHintDismissed);

  useEffect(() => {
    if (!isAbout || scrollHintDismissed) return;

    setScrollHintDismissed(true);
    try {
      localStorage.setItem(SCROLL_HINT_DISMISSED_KEY, 'true');
    } catch {
      // Keep the hint dismissed for this session if storage is unavailable.
    }
  }, [isAbout, scrollHintDismissed]);

  return (
    <ThemeColorSynchronizer>
      <div className="relative flex h-full min-h-0 flex-col overflow-hidden">
        <Header onHeightChange={onHeaderHeightChange} />

        <div className="relative h-full min-h-0 overflow-hidden">
          {children}

          {!isFullscreen && (
            <AnimatePresence initial={false} custom={direction}>
              {isAbout ? (
                <motion.div
                  key="about-visible"
                  custom={direction}
                  variants={{
                    initial: (value: unknown) => ({ opacity: 0, y: value === 1 ? 56 : -56 }),
                    animate: {
                      opacity: 1,
                      y: 0,
                      transition: {
                        duration: 0.36,
                        delay: direction === 1 ? 0.3 : 0,
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
                  className="absolute inset-0 z-20 overflow-hidden"
                >
                  <div
                    className="absolute inset-0 flex items-center justify-center overflow-hidden"
                    style={{ backdropFilter: 'blur(16px)' }}
                    data-page-view="about"
                  >
                    <AutoResizer initial={false} className="w-full">
                      <Footer />
                    </AutoResizer>
                  </div>
                </motion.div>
              ) : null}
            </AnimatePresence>
          )}
        </div>

        <UpdateToast />

        <AutoTransition
          transitionKey={!isAbout && !isFullscreen && !scrollHintDismissed ? 'page-hint-visible' : 'page-hint-hidden'}
          initial={false}
          type="slideUp"
          className="pointer-events-none fixed bottom-24 left-0 right-0 z-20 mx-auto w-full text-center text-sm text-gray-400"
        >
          {!isAbout && !isFullscreen && !scrollHintDismissed ? (
            <motion.div
              animate={{ opacity: [0.6, 1, 0.6], y: [0, 10, 0] }}
              transition={{ repeat: Infinity, duration: 2 }}
            >
              <p>{t('footer.scrollDown', '向下滑动查看更多信息')}</p>
              <svg className="mx-auto mt-2 h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
              </svg>
            </motion.div>
          ) : null}
        </AutoTransition>
      </div>
    </ThemeColorSynchronizer>
  );
}
