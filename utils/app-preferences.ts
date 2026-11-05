import type { Language } from './i18n';

/** Se guardan preferencias, no valores resueltos: «system» sigue los cambios del teléfono. */
export type Preferences = { language: 'system' | Language; theme: 'system' | 'light' | 'dark' };
export const defaultPreferences: Preferences = { language: 'system', theme: 'system' };
export const PREFERENCES_KEY = 'wh-mattress.preferences.v1';

/** Descarta valores desconocidos o datos antiguos sin bloquear el inicio de la app. */
export function parsePreferences(raw: string | null): Preferences {
  try {
    const value = JSON.parse(raw ?? '{}');
    return {
      language: ['system', 'en', 'es'].includes(value?.language) ? value.language : 'system',
      theme: ['system', 'light', 'dark'].includes(value?.theme) ? value.theme : 'system',
    };
  } catch { return { ...defaultPreferences }; }
}

/** Superficies Material oscuras de elevación creciente, con acentos desaturados. */
export const palettes = {
  light: {
    background: '#F7F8FA', surface: '#FFFFFF', elevated: '#FFFFFF', inset: '#EDF2F4',
    text: '#202124', muted: '#53616D', border: '#A4B2BA', primary: '#087C77', onPrimary: '#FFFFFF',
    secondary: '#315E78', onSecondary: '#FFFFFF', accent: '#315E78', selected: '#D5EFEB',
    header: '#087C77', onHeader: '#FFFFFF', danger: '#B91C1C', dangerSurface: '#B91C1C', onDanger: '#FFFFFF', overlay: 'rgba(0,0,0,0.55)',
  },
  dark: {
    background: '#121212', surface: '#1E1E1E', elevated: '#222222', inset: '#181818',
    text: '#FFFFFF', muted: '#C5C5C5', border: '#767676', primary: '#8EDBD6', onPrimary: '#092F2D',
    secondary: '#AFCADE', onSecondary: '#152C3A', accent: '#AFCADE', selected: '#253B3A',
    header: '#1E1E1E', onHeader: '#FFFFFF', danger: '#FFB4AB', dangerSurface: '#6D2525', onDanger: '#FFFFFF', overlay: 'rgba(0,0,0,0.72)',
  },
};
export type AppColors = typeof palettes.light;
