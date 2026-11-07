import { Image } from 'expo-image';
import { useRef, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { usePreferences } from '@/contexts/preferences';
import { acquirePhotos } from '@/utils/acquire-photos';
import { LocalizedError } from '@/utils/i18n';
import type { ReportPhoto } from '@/utils/report-photos';

/** SVG simples, renderizados por expo-image sin instalar otro módulo nativo. */
const removeIcon = { uri: 'data:image/svg+xml;utf8,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path d="M6 6L18 18M18 6L6 18" fill="none" stroke="#C62828" stroke-width="3" stroke-linecap="round"/></svg>') };
const cameraIcon = { uri: 'data:image/svg+xml;utf8,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path d="M3 7H7L9 4H15L17 7H21V20H3Z" fill="none" stroke="#315E78" stroke-width="2" stroke-linejoin="round"/><circle cx="12" cy="13" r="4" fill="none" stroke="#315E78" stroke-width="2"/></svg>') };

/** Controles sobre la foto: una captura cancelada o fallida conserva el original. */
export default function PhotoActions({ photo, disabled, onDelete, onReplace, onBusy }: {
  photo: ReportPhoto; disabled: boolean; onDelete: () => void; onReplace: (photo: ReportPhoto) => void; onBusy: (busy: boolean) => void;
}) {
  const { t, colors } = usePreferences();
  const active = useRef(false);
  const [retaking, setRetaking] = useState(false);
  const [error, setError] = useState<LocalizedError | null>(null);
  /** Reutiliza la misma cámara y preparación JPEG que la captura inicial. */
  const retake = async () => {
    if (disabled || active.current) return;
    active.current = true; setRetaking(true); setError(null); onBusy(true);
    try {
      const [replacement] = await acquirePhotos('camera', 1, photo.category, t);
      if (replacement) onReplace(replacement);
    } catch (error) {
      setError(error instanceof LocalizedError ? error : new LocalizedError('No se pudo abrir la imagen.'));
    } finally { active.current = false; setRetaking(false); onBusy(false); }
  };
  return <>
    <View pointerEvents="box-none" style={styles.actions}>
      <TouchableOpacity accessibilityRole="button" accessibilityLabel={t('Eliminar foto {n}', { n: photo.number })} disabled={disabled} onPress={onDelete} style={[styles.button, disabled && styles.disabled]}><Image source={removeIcon} style={styles.icon} contentFit="contain" accessible={false} /></TouchableOpacity>
      <TouchableOpacity accessibilityRole="button" accessibilityLabel={t('Retomar foto {n}', { n: photo.number })} accessibilityState={{ busy: retaking }} disabled={disabled} onPress={retake} style={[styles.button, disabled && styles.disabled]}>{retaking ? <ActivityIndicator size="small" color="#315E78" /> : <Image source={cameraIcon} style={styles.icon} contentFit="contain" accessible={false} />}</TouchableOpacity>
    </View>
    {error && <Text accessibilityRole="alert" style={{ color: colors.danger, padding: 8 }}>{error.localize(t)}</Text>}
  </>;
}

/** Áreas táctiles de 44 px, con fondo blanco para distinguir los iconos sobre cualquier foto. */
const styles = StyleSheet.create({
  actions: { position: 'absolute', top: 4, left: 4, right: 4, flexDirection: 'row', justifyContent: 'space-between', zIndex: 2 },
  button: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center', elevation: 2 },
  icon: { width: 24, height: 24 },
  disabled: { opacity: 0.5 },
});
