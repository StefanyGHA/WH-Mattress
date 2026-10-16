import { Modal, Text, TouchableOpacity, View } from 'react-native';
import { reportStyles as s } from './report-styles';

/** Confirmación visible tanto en web como en Android e iOS; Alert.alert no funciona en web. */
export default function ConfirmDialog({ visible, title, message, onConfirm, onCancel }: {
  visible: boolean; title: string; message: string; onConfirm: () => void; onCancel: () => void;
}) {
  return <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
    <View style={{ flex: 1, justifyContent: 'center', padding: 24, backgroundColor: 'rgba(0,0,0,0.45)' }}><View style={s.card}>
      <Text style={s.title}>{title}</Text><Text style={s.text}>{message}</Text>
      <TouchableOpacity style={[s.button, { backgroundColor: '#DC2626' }]} onPress={onConfirm}><Text style={s.buttonText}>Sí, confirmar</Text></TouchableOpacity>
      <TouchableOpacity style={[s.button, s.secondary]} onPress={onCancel}><Text style={s.buttonText}>Volver</Text></TouchableOpacity>
    </View></View>
  </Modal>;
}
