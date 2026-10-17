import { StyleSheet } from 'react-native';
export const reportStyles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#F7F8FA' },
  content: { padding: 20, paddingBottom: 40, gap: 16 },
  title: { fontSize: 24, fontWeight: '700', color: '#202124' },
  text: { fontSize: 14, color: '#6B7280', lineHeight: 21 },
  card: { backgroundColor: '#FFFFFF', borderRadius: 14, padding: 16, gap: 12, borderWidth: 1, borderColor: '#DDE5E9' },
  category: { fontSize: 14, fontWeight: '700', color: '#315E78' },
  button: { minHeight: 52, backgroundColor: '#20B3AD', borderRadius: 26, padding: 14, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8 },
  buttonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
  secondary: { backgroundColor: '#315E78' },
  disabled: { opacity: 0.45 },
  row: { flexDirection: 'row', gap: 12, alignItems: 'center' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  photo: { width: '100%', height: 130, backgroundColor: '#F1F4F6' },
  photoCard: { width: '48%', borderRadius: 8, overflow: 'hidden', borderWidth: 1, borderColor: '#DDE5E9', backgroundColor: '#FFFFFF' },
  caption: { padding: 8, color: '#315E78', fontWeight: '600', fontSize: 12 },
});
