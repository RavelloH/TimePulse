import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { DEFAULT_FULLSCREEN_SETTINGS, type FontSize, type FullscreenSettings } from '@/domain/settings';

const STORAGE_KEY = 'timepulse_fullscreen_settings';

type FullscreenContextValue = {
  isFullscreen: boolean;
  isHeaderVisible: boolean;
  headerHideDelay: number;
  timerFontSize: FontSize;
  labelFontSize: FontSize;
  isLoading: boolean;
  setHeaderHideDelay: (delay: number) => void;
  setTimerFontSize: (size: FontSize) => void;
  setLabelFontSize: (size: FontSize) => void;
  showHeader: () => void;
  hideHeader: () => void;
  resetToDefaults: () => void;
};

const FullscreenContext = createContext<FullscreenContextValue | null>(null);

export function FullscreenProvider({ children }: { children: ReactNode }) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isHeaderVisible, setIsHeaderVisible] = useState(true);
  const [settings, setSettings] = useState<FullscreenSettings>(DEFAULT_FULLSCREEN_SETTINGS);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed: unknown = JSON.parse(stored);
        if (typeof parsed === 'object' && parsed !== null) {
          setSettings((previous) => ({ ...previous, ...(parsed as Partial<FullscreenSettings>) }));
        }
      }
    } catch (error) {
      console.error('读取全屏设置失败:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!isLoading) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
      } catch (error) {
        console.error('保存全屏设置失败:', error);
      }
    }
  }, [settings, isLoading]);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
      setIsHeaderVisible(true);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    handleFullscreenChange();
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const value: FullscreenContextValue = {
    isFullscreen,
    isHeaderVisible,
    headerHideDelay: settings.headerHideDelay,
    timerFontSize: settings.fontSize.timer,
    labelFontSize: settings.fontSize.label,
    isLoading,
    setHeaderHideDelay: (headerHideDelay) => setSettings((previous) => ({ ...previous, headerHideDelay })),
    setTimerFontSize: (timer) => setSettings((previous) => ({ ...previous, fontSize: { ...previous.fontSize, timer } })),
    setLabelFontSize: (label) => setSettings((previous) => ({ ...previous, fontSize: { ...previous.fontSize, label } })),
    showHeader: () => setIsHeaderVisible(true),
    hideHeader: () => setIsHeaderVisible(false),
    resetToDefaults: () => setSettings(DEFAULT_FULLSCREEN_SETTINGS),
  };

  return <FullscreenContext.Provider value={value}>{children}</FullscreenContext.Provider>;
}

export function useFullscreen(): FullscreenContextValue {
  const context = useContext(FullscreenContext);
  if (!context) throw new Error('useFullscreen must be used within FullscreenProvider');
  return context;
}

export default FullscreenContext;
