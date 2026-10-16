import { Image } from 'react-native';
import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
import { photoSourceUri, type ReportPhoto } from './report-photos';

/** Lee la copia en memoria antes que la ruta temporal que Android puede eliminar. */
export async function preparePrintPhoto(photo: ReportPhoto): Promise<string> {
  const source = photoSourceUri(photo);
  // Consultar el contenido real evita dimensiones antiguas o imágenes todavía no legibles.
  const dimensions = await new Promise<{ width: number; height: number }>((resolve, reject) => Image.getSize(source, (width, height) => resolve({ width, height }), reject));
  const raw = photo.base64?.replace(/^data:[^,]*,/, '');
  const jpeg = raw?.startsWith('/9j/') ? raw : null;
  const longest = photo.category === 'measures' ? 1000 : 1600;
  const scale = Math.min(1, longest / Math.max(dimensions.width, dimensions.height));
  // Un JPEG ya preparado no necesita volver a pasar por el módulo nativo al exportar.
  if (jpeg && scale === 1) return jpeg;
  const context = ImageManipulator.manipulate(source);
  try {
    context.resize({ width: Math.max(1, Math.round(dimensions.width * scale)), height: Math.max(1, Math.round(dimensions.height * scale)) });
    const image = await context.renderAsync();
    try {
      const result = await image.saveAsync({ format: SaveFormat.JPEG, compress: 0.9, base64: true });
      if (!result.base64) throw new Error('Image encoding failed');
      return result.base64;
    } finally { image.release(); }
  } finally { context.release(); }
}
