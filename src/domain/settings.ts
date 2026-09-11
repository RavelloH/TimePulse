export type BackgroundType = 'gradient' | 'custom';
export type BackgroundMode = 'cover' | 'contain' | 'repeat';

export interface BackgroundSettings {
  backgroundType: BackgroundType;
  customBackgroundId: string | null;
  backgroundMode: BackgroundMode;
  bgOpacity: number;
  blurAmount: number;
  [key: string]: unknown;
}

export type FontSize = 'small' | 'medium' | 'large';

export interface FullscreenSettings {
  headerHideDelay: number;
  fontSize: {
    timer: FontSize;
    label: FontSize;
  };
  [key: string]: unknown;
}

export interface NotificationMessage {
  id: string;
  title: string;
  body?: string;
  targetTime: number;
  [key: string]: unknown;
}

export const DEFAULT_BACKGROUND_SETTINGS: BackgroundSettings = {
  backgroundType: 'gradient',
  customBackgroundId: null,
  backgroundMode: 'cover',
  bgOpacity: 0.3,
  blurAmount: 0,
};

export const DEFAULT_FULLSCREEN_SETTINGS: FullscreenSettings = {
  headerHideDelay: 3000,
  fontSize: { timer: 'medium', label: 'medium' },
};
