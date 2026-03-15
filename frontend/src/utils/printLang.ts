import i18n from '../i18n';

export async function printWithLang(lang: 'ar'|'bn'|'en', action?: () => void) {
  const prev = i18n.language as 'ar'|'bn'|'en';
  if (prev !== lang) await i18n.changeLanguage(lang);
  try {
    action?.();
    window.print();
  } finally {
    if (prev !== lang) {
      await i18n.changeLanguage(prev);
    }
  }
}

