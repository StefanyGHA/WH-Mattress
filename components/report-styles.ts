import { useMemo } from 'react';
import { StyleSheet } from 'react-native';
import { usePreferences } from '@/contexts/preferences';

/** Conserva las medidas existentes y aplica la paleta elegida en toda la interfaz. */
export function useReportStyles() {
  const { colors: c } = usePreferences();
  return useMemo(() => StyleSheet.create({
    screen: { flex: 1, backgroundColor: c.background },
    content: { padding: 20, paddingBottom: 40, gap: 16 },
    title: { fontSize: 24, fontWeight: '700', color: c.text },
    text: { fontSize: 14, color: c.muted, lineHeight: 21 },
    card: { backgroundColor: c.surface, borderRadius: 14, padding: 16, gap: 12, borderWidth: 1, borderColor: c.border },
    category: { fontSize: 14, fontWeight: '700', color: c.accent },
    button: { minHeight: 52, backgroundColor: c.primary, borderRadius: 26, padding: 14, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8 },
    buttonText: { color: c.onPrimary, fontSize: 16, fontWeight: '700' },
    secondary: { backgroundColor: c.secondary },
    secondaryText: { color: c.onSecondary },
    disabled: { opacity: 0.45 },
    row: { flexDirection: 'row', gap: 12, alignItems: 'center' },
    grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
    photo: { width: '100%', height: 130, backgroundColor: c.inset },
    photoCard: { width: '48%', borderRadius: 8, overflow: 'hidden', borderWidth: 1, borderColor: c.border, backgroundColor: c.surface },
    caption: { padding: 8, color: c.accent, fontWeight: '600', fontSize: 12 },
    input: { color: c.text, backgroundColor: c.inset },
  }), [c]);
}
