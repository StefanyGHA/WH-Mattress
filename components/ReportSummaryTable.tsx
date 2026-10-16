import { Text, View } from 'react-native';
import type { ProductionReport } from '@/utils/report-photos';
import { reportStyles as s } from './report-styles';

/** Vista del mismo cuadro inicial, con cantidades y total general, antes de exportar. */
export default function ReportSummaryTable({ report }: { report: ProductionReport }) {
  return <View style={{ gap: 1 }}>
    <View style={[s.row, { backgroundColor: '#20B3AD', padding: 10 }]}><Text style={[s.buttonText, { flex: 1 }]}>MODELS</Text><Text style={[s.buttonText, { flex: 1, textAlign: 'right' }]}>QUANTITIES</Text></View>
    {report.models.map(model => <View key={model.id} style={[s.row, { padding: 10, backgroundColor: '#F1F5F7' }]}><Text style={[s.text, { flex: 1 }]}>{model.name}</Text><Text style={s.text}>{model.quantity ?? 0}</Text></View>)}
    <View style={[s.row, { padding: 10, justifyContent: 'space-between' }]}><Text style={s.category}>TOTAL GENERAL</Text><Text style={s.category}>{report.models.reduce((sum, model) => sum + (model.quantity ?? 0), 0)}</Text></View>
  </View>;
}
