import type { ReactNode } from 'react';
import { motion } from 'framer-motion';
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
};

export default function Layout({ children }: LayoutProps) {
  const { t } = useTranslation();
  const { isFullscreen } = useFullscreen();
  const { isAbout } = usePageTransition();

  return (
    <ThemeColorSynchronizer>
      <div className="relative flex h-full min-h-0 flex-col overflow-hidden">
        <Header />

        <div className="relative h-full min-h-0 overflow-hidden">
          {children}

          {!isFullscreen && (
            <AutoTransition
              transitionKey={isAbout ? 'about-visible' : 'about-hidden'}
              initial={false}
              type="slideUp"
              customVariants={{
                initial: { opacity: 0, y: 24 },
                animate: { opacity: 1, y: 0 },
                exit: { opacity: 0, y: 24 },
              }}
              className="absolute inset-0 z-20 overflow-hidden"
            >
              {isAbout ? (
                <motion.div
                  className="absolute inset-0 flex items-center justify-center overflow-hidden"
                  style={{ backdropFilter: 'blur(16px)' }}
                  data-page-view="about"
                >
                  <AutoResizer initial={false} className="w-full">
                    <Footer />
                  </AutoResizer>
                </motion.div>
              ) : null}
            </AutoTransition>
          )}
        </div>

        <UpdateToast />

        <AutoTransition
          transitionKey={!isAbout && !isFullscreen ? 'page-hint-visible' : 'page-hint-hidden'}
          initial={false}
          type="slideUp"
          className="pointer-events-none fixed bottom-24 left-0 right-0 z-20 mx-auto w-full text-center text-sm text-gray-400"
        >
          {!isAbout && !isFullscreen ? (
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
