import { usePreferences } from '@/contexts/preferences';
import { Text, View } from 'react-native';
import type { ProductionReport } from '@/utils/report-photos';
import { useReportStyles } from './report-styles';

/** Vista del mismo cuadro inicial, con cantidades y total general, antes de exportar. */
export default function ReportSummaryTable({ report }: { report: ProductionReport }) {
  const { t, colors } = usePreferences();
  const s = useReportStyles();
  return <View style={{ gap: 1 }}>
    <View style={[s.row, { backgroundColor: colors.primary, padding: 10 }]}><Text style={[s.buttonText, { flex: 1 }]}>{t('MODELS')}</Text><Text style={[s.buttonText, { flex: 1, textAlign: 'right' }]}>{t('QUANTITIES')}</Text></View>
    {report.models.map(model => <View key={model.id} style={[s.row, { padding: 10, backgroundColor: colors.inset }]}><Text style={[s.text, { flex: 1 }]}>{model.name}</Text><Text style={s.text}>{model.quantity ?? 0}</Text></View>)}
    <View style={[s.row, { padding: 10, justifyContent: 'space-between' }]}><Text style={s.category}>{t('TOTAL GENERAL')}</Text><Text style={s.category}>{report.models.reduce((sum, model) => sum + (model.quantity ?? 0), 0)}</Text></View>
  </View>;
}
