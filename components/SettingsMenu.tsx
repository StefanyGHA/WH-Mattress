import { Modal, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { usePreferences } from '@/contexts/preferences';
import { useReportStyles } from './report-styles';

/** Menú modal: cambia los ajustes sin abandonar ni desmontar el reporte en curso. */
export default function SettingsMenu({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const { preferences, updatePreferences, t, colors, ready, storageError } = usePreferences();
  const s = useReportStyles();
  return <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
    <View style={{ flex: 1, justifyContent: 'center', padding: 24, backgroundColor: colors.overlay }}>
      <View style={[s.card, { backgroundColor: colors.elevated, maxHeight: '90%', width: '100%', maxWidth: 480, alignSelf: 'center', elevation: 12, shadowColor: '#000000', shadowOpacity: 0.3, shadowRadius: 18, shadowOffset: { width: 0, height: 6 } }]} accessibilityViewIsModal>
        <View style={[s.row, { justifyContent: 'space-between' }]}><Text style={s.title}>{t('Ajustes')}</Text><TouchableOpacity accessibilityRole="button" accessibilityLabel={t('Cerrar')} onPress={onClose} style={{ padding: 12 }}><Ionicons name="close" size={24} color={colors.text} /></TouchableOpacity></View>
        <ScrollView contentContainerStyle={{ gap: 16 }}>
          <Text style={s.category}>{t('Idioma')}</Text>
          <View accessibilityRole="radiogroup" accessibilityLabel={t('Idioma')} style={{ gap: 8 }}>{(['system', 'es', 'en'] as const).map(value => <TouchableOpacity key={value} accessibilityRole="radio" aria-checked={preferences.language === value} aria-disabled={!ready} disabled={!ready} onPress={() => updatePreferences({ language: value })} style={[s.row, { minHeight: 48, padding: 12, borderRadius: 8, backgroundColor: preferences.language === value ? colors.selected : colors.surface }]}><Ionicons name={preferences.language === value ? 'radio-button-on' : 'radio-button-off'} size={22} color={colors.accent} /><Text style={[s.text, { color: colors.text }]}>{t(value === 'system' ? 'Según el sistema' : value === 'es' ? 'Español' : 'Inglés')}</Text></TouchableOpacity>)}</View>
          <Text style={s.category}>{t('Apariencia')}</Text>
          <View accessibilityRole="radiogroup" accessibilityLabel={t('Apariencia')} style={{ gap: 8 }}>{(['system', 'light', 'dark'] as const).map(value => <TouchableOpacity key={value} accessibilityRole="radio" aria-checked={preferences.theme === value} aria-disabled={!ready} disabled={!ready} onPress={() => updatePreferences({ theme: value })} style={[s.row, { minHeight: 48, padding: 12, borderRadius: 8, backgroundColor: preferences.theme === value ? colors.selected : colors.surface }]}><Ionicons name={preferences.theme === value ? 'radio-button-on' : 'radio-button-off'} size={22} color={colors.accent} /><Text style={[s.text, { color: colors.text }]}>{t(value === 'system' ? 'Según el sistema' : value === 'light' ? 'Claro' : 'Oscuro')}</Text></TouchableOpacity>)}</View>
          <Text style={s.text}>{t('Los reportes PDF siempre se generan en inglés.')}</Text>
          <Text style={s.text}>{t('Los cambios se guardan automáticamente en este dispositivo.')}</Text>
          {storageError && <Text accessibilityRole="alert" style={{ color: colors.danger }}>{t(storageError === 'save' ? 'No se pudieron guardar los ajustes. Intenta nuevamente.' : 'No se pudieron cargar los ajustes guardados.')}</Text>}
          <TouchableOpacity accessibilityRole="button" style={s.button} onPress={onClose}><Text style={s.buttonText}>{t('Cerrar')}</Text></TouchableOpacity>
        </ScrollView>
      </View>
    </View>
  </Modal>;
}
