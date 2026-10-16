import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import { preparePrintPhoto } from './prepare-report-images';
import type { PhotoCategory, ReportPhoto } from './report-photos';

/** Las tres entradas comparten conversión y copia recuperable, sin depender de rutas temporales. */
export type PhotoSource = 'camera' | 'gallery' | 'files';
export async function acquirePhotos(source: PhotoSource, remaining: number, category: PhotoCategory): Promise<ReportPhoto[]> {
  let assets: { uri: string; base64?: string | null }[];
  if (source === 'files') {
    const result = await DocumentPicker.getDocumentAsync({ type: 'image/*', multiple: remaining > 1, copyToCacheDirectory: true });
    if (result.canceled) return [];
    assets = result.assets;
  } else {
    if (source === 'camera' && !(await ImagePicker.requestCameraPermissionsAsync()).granted) throw new Error('Permite el acceso a la cámara desde los ajustes del teléfono.');
    const result = source === 'camera'
      ? await ImagePicker.launchCameraAsync({ mediaTypes: ['images'], quality: 0.8, base64: true })
      : await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], allowsMultipleSelection: remaining > 1, orderedSelection: true, selectionLimit: remaining, quality: 0.8, base64: true });
    if (result.canceled) return [];
    assets = result.assets;
  }
  // Documentos puede devolver más archivos que el mínimo solicitado: se conservan todos.
  const photos: ReportPhoto[] = [];
  for (const [index, asset] of assets.entries()) {
    // Solo se agrega una imagen después de leerla y guardar su contenido JPEG completo.
    const photo: ReportPhoto = { id: `${Date.now()}-${Math.random().toString(36).slice(2)}`, uri: asset.uri, base64: asset.base64, number: index + 1, category };
    try { photos.push({ ...photo, base64: await preparePrintPhoto(photo) }); }
    catch { throw new Error(`No se pudo leer la imagen ${index + 1} seleccionada. Verifica que el archivo esté descargado y vuelve a intentarlo.`); }
  }
  return photos;
}
