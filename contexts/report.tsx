import { createContext, useContext, useState, type ReactNode } from 'react';
import type { ReportPhoto } from '@/utils/report-photos';
const ReportContext = createContext<{ photos: ReportPhoto[]; setPhotos: (photos: ReportPhoto[]) => void } | null>(null);
export function ReportProvider({ children }: { children: ReactNode }) {
  const [photos, setPhotos] = useState<ReportPhoto[]>([]);
  return <ReportContext.Provider value={{ photos, setPhotos }}>{children}</ReportContext.Provider>;
}
export function useReport() {
  const report = useContext(ReportContext);
  if (!report) throw new Error('ReportProvider is required');
  return report;
}
