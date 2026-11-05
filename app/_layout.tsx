import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ThemeProvider, DarkTheme, DefaultTheme } from '@react-navigation/native';
import 'react-native-reanimated';
import { ReportProvider } from '@/contexts/report';
import { PreferencesProvider, usePreferences } from '@/contexts/preferences';

/** También la navegación y la barra del sistema siguen el tema de la app. */
function AppNavigation() {
  const { colors, theme } = usePreferences();
  const base = theme === 'dark' ? DarkTheme : DefaultTheme;
  return <ThemeProvider value={{ ...base, colors: { ...base.colors, background: colors.background, card: colors.surface, text: colors.text, border: colors.border, primary: colors.primary } }}>
    <StatusBar style={theme === 'dark' ? 'light' : 'dark'} />
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.background } }} />
  </ThemeProvider>;
}

/** Los ajustes permanecen disponibles al crear, previsualizar y editar reportes. */
export default function RootLayout() {
  return <PreferencesProvider><ReportProvider><AppNavigation /></ReportProvider></PreferencesProvider>;
}
