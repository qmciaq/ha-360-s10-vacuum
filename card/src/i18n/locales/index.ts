import { en } from './en';
import { tr } from './tr';

export const locales = {
  en,
  tr,
};

export type SupportedLanguage = keyof typeof locales;
export type { Translation } from './en';
