export const SITE_URL = 'https://firfita.ge';

export const LOCALES = ['en', 'ka'] as const;

// hreflang alternates for a page. `path` is the locale-less route, e.g. '' or '/order'.
export function localeAlternates(locale: string, path: string) {
  return {
    canonical: `${SITE_URL}/${locale}${path}`,
    languages: {
      en: `${SITE_URL}/en${path}`,
      ka: `${SITE_URL}/ka${path}`,
      'x-default': `${SITE_URL}/en${path}`,
    },
  };
}

export function ogLocale(locale: string) {
  return locale === 'ka' ? 'ka_GE' : 'en_US';
}
