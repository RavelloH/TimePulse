import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { DEFAULT_BACKGROUND_SETTINGS, type BackgroundMode, type BackgroundSettings, type BackgroundType } from '@/domain/settings';

const STORAGE_KEY = 'timepulse_background_settings';

type BackgroundContextValue = {
  backgroundType: BackgroundType;
  customBackgroundId: string | null;
  backgroundMode: BackgroundMode;
  bgOpacity: number;
  blurAmount: number;
  isLoading: boolean;
  setBackgroundType: (type: BackgroundType) => void;
  setCustomBackgroundId: (id: string | null) => void;
  setBackgroundMode: (mode: BackgroundMode) => void;
  setBgOpacity: (opacity: number) => void;
  setBlurAmount: (amount: number) => void;
  setBackgroundConfig: (config: Partial<BackgroundSettings>) => void;
  clearCustomBackground: () => void;
  resetToDefaults: () => void;
};

const BackgroundContext = createContext<BackgroundContextValue | null>(null);

export function BackgroundProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<BackgroundSettings>(DEFAULT_BACKGROUND_SETTINGS);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed: unknown = JSON.parse(stored);
        if (typeof parsed === 'object' && parsed !== null) {
          setSettings((previous) => ({ ...previous, ...(parsed as Partial<BackgroundSettings>) }));
        }
      }
    } catch (error) {
      console.error('读取背景设置失败:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!isLoading) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
      } catch (error) {
        console.error('保存背景设置失败:', error);
      }
    }
  }, [settings, isLoading]);

  const value: BackgroundContextValue = {
    backgroundType: settings.backgroundType,
    customBackgroundId: settings.customBackgroundId,
    backgroundMode: settings.backgroundMode,
    bgOpacity: settings.bgOpacity,
    blurAmount: settings.blurAmount,
    isLoading,
    setBackgroundType: (backgroundType) => setSettings((previous) => ({ ...previous, backgroundType })),
    setCustomBackgroundId: (customBackgroundId) => setSettings((previous) => ({
      ...previous,
      customBackgroundId,
      backgroundType: customBackgroundId ? 'custom' : 'gradient',
    })),
    setBackgroundMode: (backgroundMode) => setSettings((previous) => ({ ...previous, backgroundMode })),
    setBgOpacity: (bgOpacity) => setSettings((previous) => ({ ...previous, bgOpacity })),
    setBlurAmount: (blurAmount) => setSettings((previous) => ({ ...previous, blurAmount })),
    setBackgroundConfig: (config) => setSettings((previous) => ({ ...previous, ...config })),
    clearCustomBackground: () => setSettings((previous) => ({
      ...DEFAULT_BACKGROUND_SETTINGS,
      backgroundMode: previous.backgroundMode,
      bgOpacity: previous.bgOpacity,
    })),
    resetToDefaults: () => setSettings(DEFAULT_BACKGROUND_SETTINGS),
  };

  return <BackgroundContext.Provider value={value}>{children}</BackgroundContext.Provider>;
}

export function useBackground(): BackgroundContextValue {
  const context = useContext(BackgroundContext);
  if (!context) throw new Error('useBackground must be used within BackgroundProvider');
  return context;
}

export default BackgroundContext;
