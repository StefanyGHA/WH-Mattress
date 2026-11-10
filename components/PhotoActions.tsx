import { Image } from 'expo-image';
import { useState } from 'react';
import { Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { usePreferences } from '@/contexts/preferences';
import { useReportStyles } from './report-styles';
import PhotoSourceButtons from './PhotoSourceButtons';
import { reloadIcon, trashcanIcon } from '@/utils/photo-icons';
import type { ReportPhoto } from '@/utils/report-photos';

/** Usa los SVG locales y permite reemplazar desde cualquiera de las tres fuentes. */
export default function PhotoActions({ photo, disabled, onDelete, onReplace, onBusy }: {
  photo: ReportPhoto; disabled: boolean; onDelete: () => void; onReplace: (photo: ReportPhoto) => void; onBusy: (busy: boolean) => void;
}) {
  const { t, colors } = usePreferences();
  const s = useReportStyles();
  const [choosing, setChoosing] = useState(false);
  const [busy, setBusy] = useState(false);
  /** Mantiene el original si se cancela o falla la selección; el padre conserva su posición. */
  const replace = (photos: ReportPhoto[]) => {
    if (photos[0]) { onReplace(photos[0]); setChoosing(false); }
  };
  const close = () => { if (!busy) setChoosing(false); };
  return <>
    <View pointerEvents="box-none" style={styles.actions}>
      <TouchableOpacity accessibilityRole="button" accessibilityLabel={t('Eliminar foto {n}', { n: photo.number })} disabled={disabled || busy} onPress={onDelete} style={[styles.button, (disabled || busy) && s.disabled]}><Image source={trashcanIcon} style={styles.icon} tintColor="#ff0c0c" contentFit="contain" accessible={false} /></TouchableOpacity>
      <TouchableOpacity accessibilityRole="button" accessibilityLabel={t('Reemplazar foto {n}', { n: photo.number })} disabled={disabled || busy} onPress={() => setChoosing(true)} style={[styles.button, (disabled || busy) && s.disabled]}><Image source={reloadIcon} style={styles.icon} contentFit="contain" accessible={false} /></TouchableOpacity>
    </View>
    <Modal visible={choosing} transparent animationType="fade" onRequestClose={close}>
      <View style={{ flex: 1, justifyContent: 'center', padding: 24, backgroundColor: colors.overlay }}><View style={[s.card, { backgroundColor: colors.elevated }]} accessibilityViewIsModal>
        <Text style={s.title}>{t('Reemplazar foto {n}', { n: photo.number })}</Text>
        <PhotoSourceButtons category={photo.category} remaining={1} disabled={busy} onPhotos={replace} onBusy={value => { setBusy(value); onBusy(value); }} />
        <TouchableOpacity accessibilityRole="button" disabled={busy} onPress={close} style={[s.button, s.secondary]}><Text style={[s.buttonText, s.secondaryText]}>{t('Volver')}</Text></TouchableOpacity>
      </View></View>
    </Modal>
  </>;
}

/** Mantiene las áreas táctiles y posiciones de los controles existentes. */
const styles = StyleSheet.create({
  actions: { position: 'absolute', top: 4, left: 4, right: 4, flexDirection: 'row', justifyContent: 'space-between', zIndex: 2 },
  button: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#D8E1E8', alignItems: 'center', justifyContent: 'center', elevation: 3 },
  icon: { width: 24, height: 24 },
});
