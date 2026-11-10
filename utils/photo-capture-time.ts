import type { DocumentPickerAsset } from 'expo-document-picker';
import { File } from 'expo-file-system';

type CaptureTime = { clock: number; offsetMinutes: number | null };
type FileOrder = { assets: DocumentPickerAsset[]; uncertain: boolean };

/** Valida la fecha EXIF y conserva la fracción de segundo si la cámara la guardó. */
function parseCaptureTime(date: unknown, subsecond: unknown, offset: unknown): CaptureTime | null {
  if (typeof date !== 'string') return null;
  const match = date.trim().match(/^(\d{4}):(\d{2}):(\d{2}) (\d{2}):(\d{2}):(\d{2})$/);
  if (!match) return null;

  const [, year, month, day, hour, minute, second] = match;
  const clockText = `${year}-${month}-${day}T${hour}:${minute}:${second}`;
  const clock = Date.parse(`${clockText}Z`);
  if (!Number.isFinite(clock) || !new Date(clock).toISOString().startsWith(clockText)) return null;

  const fraction = typeof subsecond === 'string' && /^\d+$/.test(subsecond.trim()) ? Number(`0.${subsecond.trim()}`) * 1000 : 0;
  const zone = typeof offset === 'string' ? offset.trim().match(/^([+-])(\d{2}):(\d{2})$/) : null;
  let offsetMinutes: number | null = null;
  if (zone && Number(zone[2]) <= 14 && Number(zone[3]) < 60) {
    offsetMinutes = (Number(zone[2]) * 60 + Number(zone[3])) * (zone[1] === '-' ? -1 : 1);
  }
  return { clock: clock + fraction, offsetMinutes };
}

/** Lee el original desde Archivos antes de la conversión que puede quitar los metadatos. */
async function readCaptureTime(asset: DocumentPickerAsset): Promise<CaptureTime | null> {
  try {
    const bytes = asset.file ? new Uint8Array(await asset.file.arrayBuffer()) : await new File(asset.uri).bytes();
    // Se carga al importar archivos. La entrada de código fuente permite empaquetarlo en Expo.
    const { load } = await import('exifreader/src/exif-reader');
    const { exif } = load(bytes, {
      expanded: true,
      includeTags: {
        exif: ['DateTimeOriginal', 'SubSecTimeOriginal', 'OffsetTimeOriginal', 'DateTimeDigitized', 'SubSecTimeDigitized', 'OffsetTimeDigitized'],
      },
    });
    if (!exif) return null;
    return parseCaptureTime(exif.DateTimeOriginal?.description, exif.SubSecTimeOriginal?.description, exif.OffsetTimeOriginal?.description)
      ?? parseCaptureTime(exif.DateTimeDigitized?.description, exif.SubSecTimeDigitized?.description, exif.OffsetTimeDigitized?.description);
  } catch {
    // Un archivo sin EXIF válido todavía puede contener una imagen utilizable.
    return null;
  }
}

/** Recupera la fecha de nombres como LOTE_MODELO_2026-10-31_09-47-22.jpg o IMG_20261031_094722.jpg. */
function readFilenameTime(name: string): CaptureTime | null {
  const match = name.match(/(?:^|\D)((?:19|20)\d{2})[-_.]?(\d{2})[-_.]?(\d{2})[T _.-]*(\d{2})[:._-]?(\d{2})[:._-]?(\d{2})(?!\d)/i);
  if (!match) return null;
  const [, year, month, day, hour, minute, second] = match;
  return parseCaptureTime(`${year}:${month}:${day} ${hour}:${minute}:${second}`, null, null);
}

/** El selector puede devolver la hora de importación cuando desconoce la fecha original. */
function readModificationTime(asset: DocumentPickerAsset, pickerOpenedAt: number): CaptureTime | null {
  const clock = asset.lastModified;
  return clock > 0 && clock < pickerOpenedAt ? { clock, offsetMinutes: 0 } : null;
}

/** Compara solo grupos completos y conserva el orden relativo en los empates. */
function sortFiles(assets: DocumentPickerAsset[], times: (CaptureTime | null)[]): FileOrder | null {
  if (!times.every(time => time !== null)) return null;
  // Sin zona en alguna foto, se comparan las horas registradas usando el mismo reloj para todo el lote.
  const useOffsets = times.every(time => time.offsetMinutes !== null);
  const sortable = times.map((time, index) => ({
    asset: assets[index],
    timestamp: time.clock - (useOffsets ? (time.offsetMinutes ?? 0) * 60_000 : 0),
  }));
  sortable.sort((a, b) => a.timestamp - b.timestamp);
  return {
    assets: sortable.map(({ asset }) => asset),
    uncertain: sortable.some((entry, index) => index > 0 && entry.timestamp === sortable[index - 1].timestamp),
  };
}

/** Ordena antes de asignar posiciones. Prefiere la fecha de captura y usa fechas del archivo como respaldo. */
export async function orderFilesByCaptureTime(assets: DocumentPickerAsset[], pickerOpenedAt: number): Promise<FileOrder> {
  if (assets.length < 2) return { assets, uncertain: false };

  // Lee una imagen a la vez para limitar la memoria usada por las fotos originales.
  const captureTimes: (CaptureTime | null)[] = [];
  for (const asset of assets) captureTimes.push(await readCaptureTime(asset));
  const captureOrder = sortFiles(assets, captureTimes);
  if (captureOrder && !captureOrder.uncertain) return captureOrder;

  const filenameTimes = assets.map(asset => readFilenameTime(asset.name));
  const fallbackOrders = [
    sortFiles(assets, filenameTimes),
    sortFiles(assets, captureTimes.map((time, index) => time ?? filenameTimes[index])),
    sortFiles(assets, assets.map(asset => readModificationTime(asset, pickerOpenedAt))),
  ];
  return fallbackOrders.find(order => order && !order.uncertain)
    ?? captureOrder ?? fallbackOrders.find(order => order !== null) ?? { assets, uncertain: true };
}
