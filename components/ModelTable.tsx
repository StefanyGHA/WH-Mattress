import { usePreferences } from '@/contexts/preferences';
import { useState } from 'react';
import { Text, TextInput, TouchableOpacity, View } from 'react-native';
import { emptyModel, modelSampleCount, type ProductionReport } from '@/utils/report-photos';
import { useReportStyles } from './report-styles';
import ConfirmDialog from './ConfirmDialog';

/** Cuadro editable de modelos y cantidades compartido por inicio y edición. */
export default function ModelTable({ report, onChange, disabled = false }: {
  report: ProductionReport; onChange: (report: ProductionReport) => void; disabled?: boolean;
}) {
  const { t, colors, theme } = usePreferences();
  const s = useReportStyles();
  const [removing, setRemoving] = useState<string | null>(null);
  const total = report.models.reduce((sum, model) => sum + (model.quantity ?? 0), 0);
  const remove = (id: string) => onChange({ ...report, models: report.models.filter(model => model.id !== id) });
  return <View style={s.card}>
    <Text style={s.category}>{t('Cuadro de modelos y cantidades')}</Text>
    <View style={[s.row, { backgroundColor: colors.primary, padding: 10 }]}><Text style={[s.buttonText, { flex: 1 }]}>{t('MODELS')}</Text><Text style={[s.buttonText, { flex: 1 }]}>{t('QUANTITIES')}</Text></View>
    {report.models.map((model, index) => <View key={model.id} style={{ gap: 6 }}>
      <View style={s.row}>
        <TextInput keyboardAppearance={theme} editable={!disabled} accessibilityLabel={t('Modelo fila {n}', { n: index + 1 })} placeholder="SD14Q" value={model.name} autoCapitalize="characters" placeholderTextColor={colors.muted} style={[s.text, s.input, { flex: 1, padding: 10, borderWidth: 1, borderRadius: 6, borderColor: colors.border }]} onChangeText={name => onChange({ ...report, models: report.models.map(item => item.id === model.id ? { ...item, name } : item) })} />
        <TextInput keyboardAppearance={theme} editable={!disabled} accessibilityLabel={t('Cantidad fila {n}', { n: index + 1 })} placeholder="100" keyboardType="number-pad" value={model.quantity ? String(model.quantity) : ''} placeholderTextColor={colors.muted} style={[s.text, s.input, { width: 85, padding: 10, borderWidth: 1, borderRadius: 6, borderColor: colors.border }]} onChangeText={value => { if (/^\d*$/.test(value) && Number.isSafeInteger(Number(value))) onChange({ ...report, models: report.models.map(item => item.id === model.id ? { ...item, quantity: Number(value) } : item) }); }} />
        <TouchableOpacity disabled={disabled} accessibilityLabel={t('Eliminar fila {n}', { n: index + 1 })} onPress={() => model.photos.length ? setRemoving(model.id) : remove(model.id)}><Text style={{ color: colors.danger, fontSize: 24 }}>×</Text></TouchableOpacity>
      </View>
      <Text style={s.text}>{t('Muestra 5 %: {count} colchones · {photos} fotos + 2 etiquetas', { count: modelSampleCount(model), photos: modelSampleCount(model) * 9 })}</Text>
    </View>)}
    <View style={[s.row, { justifyContent: 'space-between' }]}><Text style={s.category}>{t('TOTAL GENERAL')}</Text><Text style={s.category}>{total}</Text></View>
    <View style={s.row}>
      <TouchableOpacity disabled={disabled} style={[s.button, { flex: 1 }]} onPress={() => onChange({ ...report, models: [...report.models, emptyModel()] })}><Text style={[s.buttonText, { fontSize: 14 }]}>{t('Agregar fila')}</Text></TouchableOpacity>
      <TouchableOpacity disabled={disabled || !report.models.length} style={[s.button, s.secondary, { flex: 1 }, !report.models.length && s.disabled]} onPress={() => {
        const last = report.models.at(-1);
        if (last) { if (last.photos.length) setRemoving(last.id); else remove(last.id); }
      }}><Text style={[s.buttonText, { fontSize: 14 }]}>{t('Eliminar fila')}</Text></TouchableOpacity>
    </View>
    <ConfirmDialog visible={!!removing} title={t('Eliminar fila')} message={t('También se eliminarán las fotografías de este modelo. ¿Deseas continuar?')} onCancel={() => setRemoving(null)} onConfirm={() => { if (removing) remove(removing); setRemoving(null); }} />
  </View>;
}
