import { useEffect, useState } from 'react';
import { normalizeLanguage, type Language } from './types';

type TranslationTree = Record<string, unknown>;
type TranslationFunction = (key: string, defaultValue?: string) => string;

function getLanguage(): Language {
  if (typeof window === 'undefined') return 'zh-CN';
  return normalizeLanguage(new URLSearchParams(window.location.search).get('lang'));
}

async function loadLanguageFile(language: Language): Promise<TranslationTree | null> {
  try {
    const locale = language === 'en-US' ? 'en' : 'zh';
    const response = await fetch(`/locales/${locale}/common.json`);
    if (!response.ok) throw new Error(`Failed to load ${locale} translations`);
    const value: unknown = await response.json();
    return typeof value === 'object' && value !== null ? value as TranslationTree : null;
  } catch (error) {
    console.error('Failed to load language file:', error);
    return null;
  }
}

function getNestedValue(tree: TranslationTree, path: string): unknown {
  return path.split('.').reduce<unknown>((current, key) => {
    if (typeof current !== 'object' || current === null) return null;
    return key in current ? (current as Record<string, unknown>)[key] : null;
  }, tree);
}

export function useTranslation(): {
  t: TranslationFunction;
  currentLang: Language;
  changeLanguage: (language: Language) => void;
  isLoading: boolean;
} {
  const [translations, setTranslations] = useState<TranslationTree>({});
  const [currentLang, setCurrentLang] = useState<Language>('zh-CN');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const initializeTranslations = async () => {
      const language = getLanguage();
      setCurrentLang(language);
      const translationData = await loadLanguageFile(language);
      const fallbackData = translationData ?? (await loadLanguageFile('zh-CN'));
      if (!cancelled && fallbackData) setTranslations(fallbackData);
      if (!cancelled) setIsLoading(false);
    };
    void initializeTranslations();
    return () => { cancelled = true; };
  }, []);

  const t: TranslationFunction = (key, defaultValue = '') => {
    if (isLoading) return defaultValue;
    const value = getNestedValue(translations, key);
    return typeof value === 'string' || typeof value === 'number' ? String(value) : (defaultValue || key);
  };

  const changeLanguage = (language: Language) => {
    const url = new URL(window.location.href);
    url.searchParams.set('lang', language);
    window.location.href = url.toString();
  };

  return { t, currentLang, changeLanguage, isLoading };
}
