import { usePreferences } from '@/contexts/preferences';
import { useState } from 'react';
import { Text, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { useReport } from '@/contexts/report';
import ConfirmDialog from './ConfirmDialog';

/** Cancela desde cualquier pestaña y vuelve al inicio incluso sin historial de navegación. */
export default function CancelReportButton({ disabled = false }: { disabled?: boolean }) {
  const { t, colors } = usePreferences();
  const [visible, setVisible] = useState(false);
  const { resetReport } = useReport();
  const router = useRouter();
  return <>
    <TouchableOpacity disabled={disabled} onPress={() => setVisible(true)}><Text style={{ textAlign: 'center', padding: 15, color: colors.danger, fontWeight: '600' }}>{t('Cancelar informe')}</Text></TouchableOpacity>
    <ConfirmDialog visible={visible} title={t('Cancelar informe')} message={t('Se eliminarán los datos y fotografías del reporte actual. ¿Deseas continuar?')} onCancel={() => setVisible(false)} onConfirm={() => { setVisible(false); resetReport(); router.dismissTo('/'); }} />
  </>;
}
