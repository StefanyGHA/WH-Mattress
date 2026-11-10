import { modelSampleCount, type ProductionReport, type ReportPhoto, type PhotoCategory } from './report-photos';

/** Cada modelo tiene una vista de etiquetas y otra por colchón de la muestra. */
export type CapturePosition = { modelId: string; sample: number; stage: 'labels' | 'photos' };

/** Calcula solo el paso vecino, conservando el retroceso entre muestras y modelos. */
export function adjacentCaptureStep(report: ProductionReport, position: CapturePosition, direction: -1 | 1): CapturePosition | null {
  const index = report.models.findIndex(model => model.id === position.modelId);
  if (index < 0) return null;
  if (direction === 1) {
    if (position.stage === 'labels') return { ...position, sample: 1, stage: 'photos' };
    if (position.sample < modelSampleCount(report.models[index])) return { ...position, sample: position.sample + 1 };
    const next = report.models[index + 1];
    return next ? { modelId: next.id, sample: 1, stage: 'labels' } : null;
  }
  if (position.stage === 'photos') return position.sample > 1 ? { ...position, sample: position.sample - 1 } : { ...position, sample: 1, stage: 'labels' };
  const previous = report.models[index - 1];
  return previous ? { modelId: previous.id, sample: modelSampleCount(previous), stage: 'photos' } : null;
}

/** Selecciona las dos etiquetas del modelo o las fotos de una sola muestra. */
export function captureGroup(photos: ReportPhoto[], position: CapturePosition) {
  return photos.filter(photo => position.stage === 'labels'
    ? photo.category === 'box' || photo.category === 'mattress'
    : (photo.category === 'appearance' || photo.category === 'measures') && (photo.sampleNumber ?? 1) === position.sample);
}

/** Clasifica por orden de incorporación, incluso al completar una captura parcial o borrar fotos. */
export function appendCaptureBatch(photos: ReportPhoto[], added: ReportPhoto[], position: CapturePosition): ReportPhoto[] {
  const group = captureGroup(photos, position);
  let box = group.filter(photo => photo.category === 'box').length;
  let mattress = group.filter(photo => photo.category === 'mattress').length;
  let appearance = group.filter(photo => photo.category === 'appearance').length;
  const next = Math.max(0, ...photos.map(photo => photo.number)) + 1;
  const classified = added.map((photo, index) => {
    let category: PhotoCategory;
    if (position.stage === 'labels') {
      category = !box ? 'box' : !mattress ? 'mattress' : (box <= mattress ? 'box' : 'mattress');
      if (category === 'box') box++; else mattress++;
    } else {
      category = appearance < 3 ? 'appearance' : 'measures';
      if (category === 'appearance') appearance++;
    }
    return { ...photo, category, number: next + index, sampleNumber: position.sample };
  });
  return [...photos, ...classified];
}

/** Aplica únicamente una permutación completa del grupo, conservando los espacios de exportación. */
export function reorderCapturePhotos(photos: ReportPhoto[], ids: string[], position: CapturePosition): ReportPhoto[] {
  const group = captureGroup(photos, position);
  const byId = new Map(group.map(photo => [photo.id, photo]));
  if (ids.length !== group.length || new Set(ids).size !== group.length || ids.some(id => !byId.has(id))) return photos;
  const replacements = new Map(group.map((slot, index) => [slot.id, { ...byId.get(ids[index])!, id: slot.id, number: slot.number, category: slot.category, sampleNumber: slot.sampleNumber }]));
  return photos.map(photo => replacements.get(photo.id) ?? photo);
}
