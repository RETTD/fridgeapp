import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import * as Localization from 'expo-localization';

import enTranslations from './locales/en.json';
import plTranslations from './locales/pl.json';

const languageDetector = {
  type: 'languageDetector' as const,
  async: false,
  detect: () => {
    const locales = Localization.getLocales();
    return locales[0]?.languageCode || 'en';
  },
  init: () => {},
  cacheUserLanguage: () => {},
};

i18n
  .use(languageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: {
        translation: enTranslations,
      },
      pl: {
        translation: plTranslations,
      },
    },
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false,
    },
  });

export default i18n;

