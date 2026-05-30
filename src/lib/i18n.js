import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import translationFR from '../locales/fr.json';
import translationEN from '../locales/en.json';
import translationES from '../locales/es.json';
import translationIT from '../locales/it.json';
import translationDE from '../locales/de.json';

const resources = {
  fr: { translation: translationFR },
  en: { translation: translationEN },
  es: { translation: translationES },
  it: { translation: translationIT },
  de: { translation: translationDE }
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: 'fr', // langue par défaut
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false // react s'occupe de l'échappement xss
    }
  });

export default i18n;
