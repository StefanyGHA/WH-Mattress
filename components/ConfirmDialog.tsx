import { usePreferences } from '@/contexts/preferences';
import { Modal, Text, TouchableOpacity, View } from 'react-native';
import { useReportStyles } from './report-styles';

/** Confirmación visible tanto en web como en Android e iOS; Alert.alert no funciona en web. */
export default function ConfirmDialog({ visible, title, message, onConfirm, onCancel }: {
  visible: boolean; title: string; message: string; onConfirm: () => void; onCancel: () => void;
}) {
  const { t, colors } = usePreferences();
  const s = useReportStyles();
  return <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
    <View style={{ flex: 1, justifyContent: 'center', padding: 24, backgroundColor: colors.overlay }}><View style={[s.card, { backgroundColor: colors.elevated }]}>
      <Text style={s.title}>{title}</Text><Text style={s.text}>{message}</Text>
      <TouchableOpacity style={[s.button, { backgroundColor: colors.dangerSurface }]} onPress={onConfirm}><Text style={[s.buttonText, { color: colors.onDanger }]}>{t('Sí, confirmar')}</Text></TouchableOpacity>
      <TouchableOpacity style={[s.button, s.secondary]} onPress={onCancel}><Text style={s.buttonText}>{t('Volver')}</Text></TouchableOpacity>
    </View></View>
  </Modal>;
}
