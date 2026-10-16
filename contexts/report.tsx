import { createContext, useContext, useState, type Dispatch, type ReactNode, type SetStateAction } from 'react';
import type { ProductionReport } from '@/utils/report-photos';
import type { CapturePosition } from '@/utils/capture-flow';

/** Conserva el reporte y la pestaña del asistente al navegar entre edición y vista previa. */
const ReportContext = createContext<{
  report: ProductionReport | null;
  setReport: Dispatch<SetStateAction<ProductionReport | null>>;
  position: CapturePosition | null;
  setPosition: Dispatch<SetStateAction<CapturePosition | null>>;
  resetReport: () => void;
} | null>(null);

/** Reinicia conjuntamente todos los datos cuando el usuario confirma cancelar. */
export function ReportProvider({ children }: { children: ReactNode }) {
  const [report, setReport] = useState<ProductionReport | null>(null);
  const [position, setPosition] = useState<CapturePosition | null>(null);
  const resetReport = () => { setReport(null); setPosition(null); };
  return <ReportContext.Provider value={{ report, setReport, position, setPosition, resetReport }}>{children}</ReportContext.Provider>;
}

/** Acceso al mismo estado durante toda la sesión del reporte. */
export function useReport() {
  const report = useContext(ReportContext);
  if (!report) throw new Error('ReportProvider is required');
  return report;
}
