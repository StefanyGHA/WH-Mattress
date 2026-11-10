import { LocalizedError } from '@/utils/i18n';
import { usePreferences } from '@/contexts/preferences';
import { useRef, useState } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { acquirePhotos, type PhotoSource } from '@/utils/acquire-photos';
import type { PhotoCategory, ReportPhoto } from '@/utils/report-photos';
import { useReportStyles } from './report-styles';

/** Controles iguales para tomar, importar, agregar o reemplazar fotos desde cualquier pantalla. */
export default function PhotoSourceButtons({ category, remaining, onPhotos, onBusy, disabled = false, cameraBatch = false }: {
  cameraBatch?: boolean; disabled?: boolean; category: PhotoCategory; remaining: number; onPhotos: (photos: ReportPhoto[]) => void; onBusy?: (busy: boolean) => void;
}) {
  const { t, colors } = usePreferences();
  const s = useReportStyles();
  const active = useRef(false);
  const [busy, setBusy] = useState(false);
  const [uncertainOrder, setUncertainOrder] = useState(false);
  const [error, setError] = useState<LocalizedError | null>(null);
  const pick = async (source: PhotoSource) => {
    if (active.current || disabled || remaining < 1) return;
    active.current = true; setBusy(true); onBusy?.(true); setError(null); setUncertainOrder(false);
    try {
      // La cámara del sistema captura una imagen por apertura: encadena las tomas del grupo.
      // Cada toma aceptada se guarda inmediatamente; cancelar conserva el avance conseguido.
      if (source === 'camera' && cameraBatch) {
        const count = remaining;
        for (let index = 0; index < count; index++) {
          const photos = await acquirePhotos(source, 1, category, t);
          if (!photos.length) break;
          onPhotos(photos);
        }
      } else {
        // La importación desde Archivos avisa cuando las fechas no determinan toda la secuencia.
        const photos = await acquirePhotos(source, remaining, category, t, () => setUncertainOrder(true));
        if (photos.length) onPhotos(photos);
      }
    }
    catch (error) { setError(error instanceof LocalizedError ? error : new LocalizedError('No se pudo abrir la imagen.')); }
    finally { active.current = false; setBusy(false); onBusy?.(false); }
  };
  return <View style={{ gap: 8 }}>
    <View style={[s.row, { flexWrap: 'wrap' }]}>{([{ source: 'camera', title: 'Cámara' }, { source: 'gallery', title: 'Galería' }, { source: 'files', title: 'Archivos' }] as const).map(item => <TouchableOpacity key={item.source} disabled={busy || disabled} style={[s.button, { flex: 1, minWidth: 80 }, (busy || disabled) && s.disabled]} onPress={() => pick(item.source)}><Text style={[s.buttonText, { fontSize: 14 }]}>{t(item.title)}</Text></TouchableOpacity>)}</View>
    {busy && <Text style={s.text}>{t('Leyendo y preparando imágenes…')}</Text>}
    {uncertainOrder && <Text accessibilityLiveRegion="polite" style={s.text}>{t('No se pudo determinar el orden de todas las fotos por fecha. Revisa las posiciones y usa Cambiar orden si hace falta.')}</Text>}
    {!!error && <Text accessibilityRole="alert" style={{ color: colors.danger }}>{error.localize(t)}</Text>}
  </View>;
}
