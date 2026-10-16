import { useState } from 'react';
import { Text, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { useReport } from '@/contexts/report';
import ConfirmDialog from './ConfirmDialog';

/** Cancela desde cualquier pestaña y vuelve al inicio incluso sin historial de navegación. */
export default function CancelReportButton({ disabled = false }: { disabled?: boolean }) {
  const [visible, setVisible] = useState(false);
  const { resetReport } = useReport();
  const router = useRouter();
  return <>
    <TouchableOpacity disabled={disabled} onPress={() => setVisible(true)}><Text style={{ textAlign: 'center', padding: 15, color: '#DC2626', fontWeight: '600' }}>Cancelar informe</Text></TouchableOpacity>
    <ConfirmDialog visible={visible} title="Cancelar informe" message="Se eliminarán los datos y fotografías del reporte actual. ¿Deseas continuar?" onCancel={() => setVisible(false)} onConfirm={() => { setVisible(false); resetReport(); router.dismissTo('/'); }} />
  </>;
}
