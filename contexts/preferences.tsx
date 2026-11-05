import AsyncStorage from '@react-native-async-storage/async-storage';
import { useLocales } from 'expo-localization';
import { createContext, useContext, useEffect, useMemo, useRef, useState, type PropsWithChildren } from 'react';
import { Platform, useColorScheme } from 'react-native';
import { createTranslator, resolveLanguage, type Language, type Translate } from '@/utils/i18n';
import { defaultPreferences, palettes, parsePreferences, PREFERENCES_KEY, type AppColors, type Preferences } from '@/utils/app-preferences';

/** Las preferencias visuales no entran al contexto de datos ni a la generación del PDF. */
type PreferencesContext = {
  preferences: Preferences; language: Language; theme: 'light' | 'dark'; colors: AppColors; t: Translate;
  ready: boolean; storageError: 'load' | 'save' | null; updatePreferences: (change: Partial<Preferences>) => void;
};
const Context = createContext<PreferencesContext | null>(null);

/** Lee una vez y serializa escrituras para que la última selección sea la que persista. */
export function PreferencesProvider({ children }: PropsWithChildren) {
  const locales = useLocales();
  const systemTheme = useColorScheme();
  const [preferences, setPreferences] = useState(defaultPreferences);
  const [ready, setReady] = useState(false);
  const [storageError, setStorageError] = useState<'load' | 'save' | null>(null);
  const [changed, setChanged] = useState(false);
  const writes = useRef<Promise<void>>(Promise.resolve());
  useEffect(() => {
    let mounted = true;
    AsyncStorage.getItem(PREFERENCES_KEY).then(raw => { if (mounted) setPreferences(parsePreferences(raw)); })
      .catch(() => { if (mounted) setStorageError('load'); })
      .finally(() => { if (mounted) setReady(true); });
    return () => { mounted = false; };
  }, []);
  // La primera renderización web coincide con el HTML estático; luego lee el navegador.
  const hydratingWeb = Platform.OS === 'web' && !ready;
  const language = hydratingWeb ? 'en' : resolveLanguage(preferences.language, locales.map(locale => locale.languageCode));
  const theme = hydratingWeb ? 'light' : preferences.theme === 'system' ? systemTheme === 'dark' ? 'dark' : 'light' : preferences.theme;
  useEffect(() => {
    if (Platform.OS === 'web') { document.documentElement.lang = language; document.documentElement.style.colorScheme = theme; }
  }, [language, theme]);
  const t = useMemo(() => createTranslator(language), [language]);
  // No se escribe el valor inicial antes de terminar de cargar los ajustes guardados.
  useEffect(() => {
    if (!ready || !changed) return;
    writes.current = writes.current.then(() => AsyncStorage.setItem(PREFERENCES_KEY, JSON.stringify(preferences)))
      .then(() => setStorageError(null))
      .catch(() => setStorageError('save'));
  }, [preferences, ready, changed]);
  return <Context.Provider value={{ preferences, language, theme, colors: palettes[theme], t, ready, storageError,
    updatePreferences: change => { setChanged(true); setPreferences(current => ({ ...current, ...change })); } }}>{children}</Context.Provider>;
}

/** Un único acceso mantiene idioma y colores sincronizados en pantallas y diálogos. */
export function usePreferences() {
  const context = useContext(Context);
  if (!context) throw new Error('PreferencesProvider is required');
  return context;
}
