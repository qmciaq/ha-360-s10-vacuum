import { locales, type SupportedLanguage } from './locales';

const CHROME_PACKS = new Set<string>(Object.keys(locales));

/** Chrome pack to the language code the Botslab integration ships. */
const BACKEND_LANGUAGE: Record<SupportedLanguage, string> = {
  en: 'en',
  tr: 'tr',
};

function languageCode(value: string): string {
  return value.trim().toLowerCase().replace(/_/g, '-');
}

export function normalizeChromeLanguage(code: string | undefined | null): SupportedLanguage {
  if (!code) return 'en';
  const normalized = languageCode(code);
  if (CHROME_PACKS.has(normalized)) return normalized as SupportedLanguage;
  const primary = normalized.split('-')[0];
  if (CHROME_PACKS.has(primary)) return primary as SupportedLanguage;
  return 'en';
}

export function resolveChromeLanguage(
  configLanguage: string | undefined,
  hassLanguage: string | undefined
): SupportedLanguage {
  if (configLanguage && configLanguage !== 'auto') {
    return normalizeChromeLanguage(configLanguage);
  }
  return normalizeChromeLanguage(hassLanguage);
}

export function resolveBackendLanguage(configLanguage: string | undefined, hassLanguage: string | undefined): string {
  if (!configLanguage || configLanguage === 'auto') {
    return hassLanguage?.trim() ? hassLanguage : 'en';
  }
  return BACKEND_LANGUAGE[normalizeChromeLanguage(configLanguage)];
}
