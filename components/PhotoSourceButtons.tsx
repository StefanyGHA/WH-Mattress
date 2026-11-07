import { LocalizedError } from '@/utils/i18n';
import { usePreferences } from '@/contexts/preferences';
import { useRef, useState } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { acquirePhotos, type PhotoSource } from '@/utils/acquire-photos';
import type { PhotoCategory, ReportPhoto } from '@/utils/report-photos';
import { useReportStyles } from './report-styles';

/** Controles iguales para tomar, importar, agregar o reemplazar fotos desde cualquier pantalla. */
export default function PhotoSourceButtons({ category, remaining, onPhotos, onBusy, disabled = false }: {
  disabled?: boolean; category: PhotoCategory; remaining: number; onPhotos: (photos: ReportPhoto[]) => void; onBusy?: (busy: boolean) => void;
}) {
  const { t, colors } = usePreferences();
  const s = useReportStyles();
  const active = useRef(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<LocalizedError | null>(null);
  const pick = async (source: PhotoSource) => {
    if (active.current || disabled || remaining < 1) return;
    active.current = true; setBusy(true); onBusy?.(true); setError(null);
    try { const photos = await acquirePhotos(source, remaining, category, t); if (photos.length) onPhotos(photos); }
    catch (error) { setError(error instanceof LocalizedError ? error : new LocalizedError('No se pudo abrir la imagen.')); }
    finally { active.current = false; setBusy(false); onBusy?.(false); }
  };
  return <View style={{ gap: 8 }}>
    <View style={[s.row, { flexWrap: 'wrap' }]}>{([{ source: 'camera', title: 'Cámara' }, { source: 'gallery', title: 'Galería' }, { source: 'files', title: 'Archivos' }] as const).map(item => <TouchableOpacity key={item.source} disabled={busy || disabled} style={[s.button, { flex: 1, minWidth: 80 }, (busy || disabled) && s.disabled]} onPress={() => pick(item.source)}><Text style={[s.buttonText, { fontSize: 14 }]}>{t(item.title)}</Text></TouchableOpacity>)}</View>
    {busy && <Text style={s.text}>{t('Leyendo y preparando imágenes…')}</Text>}
    {!!error && <Text accessibilityRole="alert" style={{ color: colors.danger }}>{error.localize(t)}</Text>}
  </View>;
}
