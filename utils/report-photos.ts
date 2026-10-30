/** Categorías compartidas por la captura guiada, el editor y las páginas del PDF. */
export const PHOTO_CATEGORIES = [
  { id: 'box', title: 'FOTO DE LA ETIQUETA DE LA CAJA', short: 'Etiqueta de caja' },
  { id: 'mattress', title: 'FOTO DE LA ETIQUETA DEL COLCHÓN', short: 'Etiqueta de colchón' },
  { id: 'appearance', title: 'OVERALL APPEARANCE', short: 'Overall appearance' },
  { id: 'measures', title: 'MEASURES', short: 'Measures' },
] as const;

/** Cada foto conserva su identidad y número aunque cambie de categoría. */
export type PhotoCategory = typeof PHOTO_CATEGORIES[number]['id'];
export type ReportPhoto = { id: string; uri: string; number: number; category: PhotoCategory; base64?: string | null; width?: number; height?: number; sampleNumber?: number };

/** Un modelo pertenece a un lote y tiene sus propias etiquetas y fotografías. */
export type MattressModel = { id: string; name: string; lot: string; quantity?: number; photos: ReportPhoto[] };

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
export function movePhoto(photos: ReportPhoto[], id: string, category: PhotoCategory, sampleNumber?: number) {
  // Las etiquetas son globales del modelo; al moverlas a una muestra se asigna su destino.
  return photos.map(photo => photo.id === id ? { ...photo, category, ...(sampleNumber && (category === 'appearance' || category === 'measures') ? { sampleNumber } : {}) } : photo);
}

/** Actualiza únicamente las fotos del modelo seleccionado, manteniendo los demás lotes. */
export function updateModelPhotos(report: ProductionReport, modelId: string, photos: ReportPhoto[]): ProductionReport {
  return { ...report, models: report.models.map(model => model.id === modelId ? { ...model, photos } : model) };
}

/** Devuelve el texto que se presenta antes de capturar cada fotografía. */
export function categoryTitle(category: PhotoCategory) {
  return PHOTO_CATEGORIES.find(item => item.id === category)!.title;
}

/** Redondea la inspección del 5 % hacia arriba: nunca se inspecciona menos de lo pedido. */
export function sampleCount(quantity: number) {
  return Number.isSafeInteger(quantity) && quantity > 0 ? Math.ceil(quantity / 20) : 0;
}

/** Los reportes anteriores sin cantidad conservan una muestra de nueve fotografías. */
export function modelSampleCount(model: MattressModel) {
  return model.quantity === undefined ? 1 : sampleCount(model.quantity);
}

/** Crea una fila vacía con identidad estable para conservar sus fotos al editar la tabla. */
export function emptyModel(): MattressModel {
  return { id: `${Date.now()}-${Math.random().toString(36).slice(2)}`, name: '', lot: '', quantity: 0, photos: [] };
}

/** Una sola validación se comparte entre la creación y la edición del cuadro inicial. */
export function validateReportTable(report: ProductionReport): string | null {
  if (!report.principalLot.trim()) return 'Ingresa el lote principal del reporte.';
  if (!report.models.length) return 'Agrega por lo menos una fila de modelo.';
  for (const [index, model] of report.models.entries()) {
    if (!model.name.trim()) return `Ingresa el modelo de la fila ${index + 1}.`;
    if (!modelSampleCount(model)) return `La cantidad de la fila ${index + 1} debe ser un entero positivo.`;
  }
  return null;
}

/** Copia los datos de la tabla normalizados sin eliminar fotografías existentes. */
export function normalizeReportTable(report: ProductionReport): ProductionReport {
  const principalLot = report.principalLot.trim().toUpperCase();
  return { ...report, principalLot, models: report.models.map(model => ({ ...model, name: model.name.trim().toUpperCase(), lot: principalLot })) };
}

/** Fuente recuperable: la copia en memoria tiene prioridad sobre archivos temporales. */
export function photoSourceUri(photo: ReportPhoto): string {
  if (!photo.base64) return photo.uri;
  if (photo.base64.startsWith('data:')) return photo.base64;
  const mime = photo.base64.startsWith('iVBOR') ? 'image/png' : photo.base64.startsWith('UklGR') ? 'image/webp' : photo.base64.startsWith('R0lG') ? 'image/gif' : 'image/jpeg';
  return `data:${mime};base64,${photo.base64}`;
}

/** Explica el primer faltante para impedir exportaciones parciales de la muestra. */
export function missingReportPhotos(report: ProductionReport): string | null {
  for (const model of report.models) {
    for (const category of ['box', 'mattress'] as const) {
      if (!model.photos.some(photo => photo.category === category)) return `${model.name}: falta ${categoryTitle(category).toLowerCase()}.`;
    }
    for (let sample = 1; sample <= modelSampleCount(model); sample++) {
      // El editor puede reclasificar fotos; se exige la cantidad total sin deshacer esa decisión.
      const count = model.photos.filter(photo => (photo.category === 'appearance' || photo.category === 'measures') && (photo.sampleNumber ?? 1) === sample).length;
      if (count < 9) return `${model.name}, muestra ${sample}: faltan ${9 - count} fotografías de apariencia o medidas.`;
    }
  }
  return null;
}
