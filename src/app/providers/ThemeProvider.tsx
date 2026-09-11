import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import { useTimers } from './TimerProvider';

type Theme = 'light' | 'dark';

type ThemeContextValue = {
  theme: Theme;
  accentColor: string;
  toggleTheme: () => void;
  updateAccentColor: (color: string) => void;
};

function readInitialTheme(): Theme {
  try {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'light' || savedTheme === 'dark') return savedTheme;
    if (typeof window !== 'undefined' && window.matchMedia?.('(prefers-color-scheme: dark)').matches) {
      return 'dark';
    }
  } catch {
    // Keep the light theme when storage or matchMedia is unavailable.
  }
  return 'light';
}

function readInitialAccentColor(): string {
  try {
    return localStorage.getItem('accent-color') || '#0ea5e9';
  } catch {
    return '#0ea5e9';
  }
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

function updateCssVariables(color: string): void {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(color);
  const rgb = result
    ? [parseInt(result[1], 16), parseInt(result[2], 16), parseInt(result[3], 16)]
    : [14, 165, 233];
  document.documentElement.style.setProperty('--color-primary', rgb.join(', '));
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>(() => readInitialTheme());
  const [accentColor, setAccentColor] = useState(() => readInitialAccentColor());

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
    document.documentElement.style.colorScheme = theme;
  }, [theme]);

  useEffect(() => {
    updateCssVariables(accentColor);
  }, [accentColor]);

  const toggleTheme = useCallback(() => {
    setTheme((currentTheme) => {
      const nextTheme: Theme = currentTheme === 'light' ? 'dark' : 'light';
      try {
        localStorage.setItem('theme', nextTheme);
      } catch {
        // Theme state still updates when storage is unavailable.
      }
      console.log(`主题已切换到: ${nextTheme} - ${new Date().toLocaleString()}`);
      return nextTheme;
    });
  }, []);

  const updateAccentColor = useCallback((color: string) => {
    if (!color) return;
    setAccentColor(color);
    try {
      localStorage.setItem('accent-color', color);
    } catch {
      // Accent color state still updates when storage is unavailable.
    }
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, accentColor, updateAccentColor }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme must be used within ThemeProvider');
  return context;
}

export function ThemeColorSynchronizer({ children }: { children: ReactNode }) {
  const { getActiveTimer, activeTimerId } = useTimers();
  const { updateAccentColor } = useTheme();

  useEffect(() => {
    const activeTimer = getActiveTimer();
    if (activeTimer?.color) updateAccentColor(activeTimer.color);
  }, [activeTimerId, getActiveTimer, updateAccentColor]);

  return <>{children}</>;
}

export default ThemeContext;
