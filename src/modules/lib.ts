import * as playerPackage from '../../package.json';

export const restrictionTimeToLocalTime = (time: string): string => new Date(`${new Date().toISOString().substring(0, 10)}T${time}`).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

export const isNumeric = (str: string | number): boolean => {
  if (typeof str === 'number') {
    return true;
  }
  return !Number.isNaN(str) && !Number.isNaN(parseFloat(str));
};

export function isAppleDevice(): boolean {
  return !!navigator.vendor && navigator.vendor.includes('Apple');
}

export function log(level: 'info' | 'error', message: unknown | string, data?: unknown): void {
  if (level === 'info') {
    console.info(`📼 %c${message}`, 'font-size: 11px;', data || '');
  }
  if (level === 'error') {
    console.error(`%c${message}`, 'font-size: 11px;', data || '');
  }
}

export function secondsToHumanreadableDuration(duration: number): string {
  const date = new Date(1970, 0, 1);
  if (duration !== Infinity) {
    date.setSeconds(duration);
    if (parseInt(date.toTimeString().substring(0, 2), 10) > 0) {
      return date.toTimeString().replace(/.*(\d{2}:\d{2}:\d{2}).*/, '$1');
    }

    return date.toTimeString().replace(/.*:(\d{2}:\d{2}).*/, '$1');
  }
  return '';
}

export function getCdnBaseUrl(): string {
  return typeof ENV !== 'undefined' && ENV === 'local' ? playerPackage.config.LOCAL_SECURE_CDN_BASE_URL : playerPackage.config.DISTANT_SECURE_CDN_BASE_URL;
}