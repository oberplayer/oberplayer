import Polyglot from 'node-polyglot';
import locales from '../locales.json';

type Phrases = typeof import('../locales.json');

export function isValidLocale(locale: string): boolean {
  const validLocales = ['fr', 'de', 'en'];
  return validLocales.includes(locale);
}

export default class i18n {
  static async handleLocales(locale: keyof Phrases, phrases?: Record<string, string>) {
    globalThis.instance = new Polyglot({
      phrases: { ...locales[locale], ...(phrases || {}) },
    });
}

static t(text: string, data?: { [key: string]: string | number }): string {
    if (globalThis.instance) {
      return globalThis.instance.t(text, data);
    }
    // case handleLocales() has not been called for some reason
    return text;
  }
}
