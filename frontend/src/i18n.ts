import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import HttpBackend from 'i18next-http-backend';
import LanguageDetector from 'i18next-browser-languagedetector';

/**
 * i18n Configuration for Golden Noura ERP
 * Supports: Arabic (ar), Bengali (bn), English (en)
 * 
 * Special Print Rules:
 * - Bengali UI + Invoice/Contract → English print
 * - Arabic UI → Arabic print
 * - English UI → English print
 */

// Get saved language from localStorage or default to 'ar'
const getSavedLanguage = () => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('i18nLanguage') || 'ar';
  }
  return 'ar';
};

// Get direction based on language
export const getDirection = (lang: string): 'rtl' | 'ltr' => {
  return lang === 'ar' ? 'rtl' : 'ltr';
};

// Save language preference
export const saveLanguage = (lang: string) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('i18nLanguage', lang);
    document.documentElement.dir = getDirection(lang);
    document.documentElement.lang = lang;
  }
};

// Language names for display
export const languageNames: Record<string, { name: string; nativeName: string; flag: string }> = {
  ar: { name: 'Arabic', nativeName: 'العربية', flag: '🇸🇦' },
  bn: { name: 'Bengali', nativeName: 'বাংলা', flag: '🇧🇩' },
  en: { name: 'English', nativeName: 'English', flag: '🇬🇧' }
};

// Get next language in cycle: ar → bn → en → ar
export const getNextLanguage = (current: string): string => {
  const order = ['ar', 'bn', 'en'];
  const index = order.indexOf(current);
  return order[(index + 1) % order.length];
};

// Get print language based on document type
export const getPrintLanguage = (currentLang: string, documentType: 'invoice' | 'contract' | 'general'): string => {
  // Special rule: Bengali UI + Invoice/Contract → English
  if (currentLang === 'bn' && (documentType === 'invoice' || documentType === 'contract')) {
    return 'en';
  }
  return currentLang;
};

// Initialize i18n
i18n
  .use(HttpBackend)
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    backend: {
      loadPath: '/locales/{{lng}}/translation.json',
    },
    lng: getSavedLanguage(),
    fallbackLng: 'ar',
    supportedLngs: ['ar', 'bn', 'en'],
    debug: false,
    interpolation: {
      escapeValue: false,
    },
    detection: {
      order: ['localStorage', 'cookie', 'navigator', 'htmlTag'],
      caches: ['localStorage', 'cookie'],
      lookupLocalStorage: 'i18nLanguage',
      lookupCookie: 'i18nLanguage',
    },
    react: {
      useSuspense: false,
    },
  });

// Set initial direction
if (typeof window !== 'undefined') {
  document.documentElement.dir = getDirection(i18n.language);
  document.documentElement.lang = i18n.language;
}

// Listen for language changes
i18n.on('languageChanged', (lng) => {
  saveLanguage(lng);
  // Dispatch custom event for components to react
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('languageChanged', { detail: { language: lng } }));
  }
});

export default i18n;
