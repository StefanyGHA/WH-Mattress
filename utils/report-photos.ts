/** Categorías compartidas por la captura guiada, el editor y las páginas del PDF. */
export const PHOTO_CATEGORIES = [
  { id: 'box', title: 'FOTO DE LA ETIQUETA DE LA CAJA', short: 'Etiqueta de caja' },
  { id: 'mattress', title: 'FOTO DE LA ETIQUETA DEL COLCHÓN', short: 'Etiqueta de colchón' },
  { id: 'appearance', title: 'OVERALL APPEARANCE', short: 'Overall appearance' },
  { id: 'measures', title: 'MEASURES', short: 'Measures' },
] as const;

/** Cada foto conserva su identidad y número aunque cambie de categoría. */
export type PhotoCategory = typeof PHOTO_CATEGORIES[number]['id'];
export type ReportPhoto = { id: string; uri: string; number: number; category: PhotoCategory; base64?: string | null; width?: number; height?: number };

/** Un modelo pertenece a un lote y tiene sus propias etiquetas y fotografías. */
export type MattressModel = { id: string; name: string; lot: string; photos: ReportPhoto[] };

/** La fecha y el código se fijan al crear el reporte, no al exportar el PDF. */
export type ProductionReport = { code: string; date: string; principalLot: string; models: MattressModel[] };

/** Usa los componentes locales para respetar la fecha del dispositivo sin convertir a UTC. */
export function deviceDate(now = new Date()) {
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}

/** Reproduce el identificador del script Python usando la hora local de creación. */
export function createReport(principalLot: string, now = new Date()): ProductionReport {
  const time = [now.getHours(), now.getMinutes(), now.getSeconds()].map(value => String(value).padStart(2, '0')).join('');
  const date = deviceDate(now);
  return { code: `WH-${date.replaceAll('-', '')}-${time}`, date, principalLot: principalLot.trim().toUpperCase(), models: [] };
}

/** Clasifica los once registros iniciales: dos etiquetas, tres apariencias y seis medidas. */
export function categoryForNumber(number: number): PhotoCategory {
  return number === 1 ? 'box' : number === 2 ? 'mattress' : number <= 5 ? 'appearance' : 'measures';
}

/** Cambia solo la categoría y conserva la numeración y los datos de la imagen. */
export function movePhoto(photos: ReportPhoto[], id: string, category: PhotoCategory) {
  return photos.map(photo => photo.id === id ? { ...photo, category } : photo);
}

/** Actualiza únicamente las fotos del modelo seleccionado, manteniendo los demás lotes. */
export function updateModelPhotos(report: ProductionReport, modelId: string, photos: ReportPhoto[]): ProductionReport {
  return { ...report, models: report.models.map(model => model.id === modelId ? { ...model, photos } : model) };
}

/** Devuelve el texto que se presenta antes de capturar cada fotografía. */
export function categoryTitle(category: PhotoCategory) {
  return PHOTO_CATEGORIES.find(item => item.id === category)!.title;
}
