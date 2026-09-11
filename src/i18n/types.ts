export type Language = 'zh-CN' | 'en-US';

export function normalizeLanguage(value: string | null | undefined): Language {
  return value === 'en-US' ? 'en-US' : 'zh-CN';
}
