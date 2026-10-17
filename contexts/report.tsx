import { createContext, useContext, useState, type Dispatch, type ReactNode, type SetStateAction } from 'react';
import type { ProductionReport } from '@/utils/report-photos';

/** Comparte todos los modelos y lotes sin enviar imágenes Base64 por la navegación. */
const ReportContext = createContext<{
  report: ProductionReport | null;
  setReport: Dispatch<SetStateAction<ProductionReport | null>>;
} | null>(null);

/** Mantiene el reporte actual en memoria durante la sesión de la aplicación. */
export function ReportProvider({ children }: { children: ReactNode }) {
  const [report, setReport] = useState<ProductionReport | null>(null);
  return <ReportContext.Provider value={{ report, setReport }}>{children}</ReportContext.Provider>;
}

/** Permite consultar y actualizar el mismo reporte desde creación, edición y vista previa. */
export function useReport() {
  const report = useContext(ReportContext);
  if (!report) throw new Error('ReportProvider is required');
  return report;
}
