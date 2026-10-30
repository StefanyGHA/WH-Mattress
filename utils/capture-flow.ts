import { modelSampleCount, type ProductionReport } from './report-photos';

/** Posición del asistente, compartida para volver desde el informe sin perder el avance. */
export type CapturePosition = { modelId: string; sample: number; category: 'box' | 'mattress' | 'appearance' | 'measures' };

/** Calcula solo el paso vecino: no crea miles de pestañas al registrar cantidades grandes. */
export function adjacentCaptureStep(report: ProductionReport, position: CapturePosition, direction: -1 | 1): CapturePosition | null {
  const index = report.models.findIndex(model => model.id === position.modelId);
  if (index < 0) return null;
  const step = (category: CapturePosition['category'], sample = position.sample): CapturePosition => ({ modelId: position.modelId, sample, category });
  if (direction === 1) {
    if (position.category === 'box') return step('mattress', 1);
    if (position.category === 'mattress') return step('appearance', 1);
    if (position.category === 'appearance') return step('measures');
    if (position.sample < modelSampleCount(report.models[index])) return step('appearance', position.sample + 1);
    const next = report.models[index + 1];
    return next ? { modelId: next.id, sample: 1, category: 'box' } : null;
  }
  if (position.category === 'measures') return step('appearance');
  if (position.category === 'appearance') return position.sample > 1 ? step('measures', position.sample - 1) : step('mattress', 1);
  if (position.category === 'mattress') return step('box', 1);
  const previous = report.models[index - 1];
  return previous ? { modelId: previous.id, sample: modelSampleCount(previous), category: 'measures' } : null;
}
