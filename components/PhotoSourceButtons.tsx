import { useRef, useState } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { acquirePhotos, type PhotoSource } from '@/utils/acquire-photos';
import type { PhotoCategory, ReportPhoto } from '@/utils/report-photos';
import { reportStyles as s } from './report-styles';

/** Controles iguales para tomar, importar, agregar o reemplazar fotos desde cualquier pantalla. */
export default function PhotoSourceButtons({ category, remaining, onPhotos, onBusy }: {
  category: PhotoCategory; remaining: number; onPhotos: (photos: ReportPhoto[]) => void; onBusy?: (busy: boolean) => void;
}) {
  const active = useRef(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const pick = async (source: PhotoSource) => {
    if (active.current || remaining < 1) return;
    active.current = true; setBusy(true); onBusy?.(true); setError('');
    try { const photos = await acquirePhotos(source, remaining, category); if (photos.length) onPhotos(photos); }
    catch (error) { setError(error instanceof Error ? error.message : 'No se pudo abrir la imagen.'); }
    finally { active.current = false; setBusy(false); onBusy?.(false); }
  };
  return <View style={{ gap: 8 }}>
    <View style={[s.row, { flexWrap: 'wrap' }]}>{([{ source: 'camera', title: 'Cámara' }, { source: 'gallery', title: 'Galería' }, { source: 'files', title: 'Archivos' }] as const).map(item => <TouchableOpacity key={item.source} disabled={busy} style={[s.button, { flex: 1, minWidth: 80 }, busy && s.disabled]} onPress={() => pick(item.source)}><Text style={[s.buttonText, { fontSize: 14 }]}>{item.title}</Text></TouchableOpacity>)}</View>
    {busy && <Text style={s.text}>Leyendo y preparando imágenes…</Text>}
    {!!error && <Text accessibilityRole="alert" style={{ color: '#DC2626' }}>{error}</Text>}
  </View>;
}
