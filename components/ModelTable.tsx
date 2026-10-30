import { useState } from 'react';
import { Text, TextInput, TouchableOpacity, View } from 'react-native';
import { emptyModel, modelSampleCount, type ProductionReport } from '@/utils/report-photos';
import { reportStyles as s } from './report-styles';
import ConfirmDialog from './ConfirmDialog';

/** Cuadro editable de modelos y cantidades compartido por inicio y edición. */
export default function ModelTable({ report, onChange, disabled = false }: {
  report: ProductionReport; onChange: (report: ProductionReport) => void; disabled?: boolean;
}) {
  const [removing, setRemoving] = useState<string | null>(null);
  const total = report.models.reduce((sum, model) => sum + (model.quantity ?? 0), 0);
  const remove = (id: string) => onChange({ ...report, models: report.models.filter(model => model.id !== id) });
  return <View style={s.card}>
    <Text style={s.category}>Cuadro de modelos y cantidades</Text>
    <View style={[s.row, { backgroundColor: '#20B3AD', padding: 10 }]}><Text style={[s.buttonText, { flex: 1 }]}>MODELS</Text><Text style={[s.buttonText, { flex: 1 }]}>QUANTITIES</Text></View>
    {report.models.map((model, index) => <View key={model.id} style={{ gap: 6 }}>
      <View style={s.row}>
        <TextInput editable={!disabled} accessibilityLabel={`Modelo fila ${index + 1}`} placeholder="SD14Q" value={model.name} autoCapitalize="characters" style={[s.text, { flex: 1, padding: 10, borderWidth: 1, borderRadius: 6, borderColor: '#DDE5E9' }]} onChangeText={name => onChange({ ...report, models: report.models.map(item => item.id === model.id ? { ...item, name } : item) })} />
        <TextInput editable={!disabled} accessibilityLabel={`Cantidad fila ${index + 1}`} placeholder="100" keyboardType="number-pad" value={model.quantity ? String(model.quantity) : ''} style={[s.text, { width: 85, padding: 10, borderWidth: 1, borderRadius: 6, borderColor: '#DDE5E9' }]} onChangeText={value => { if (/^\d*$/.test(value) && Number.isSafeInteger(Number(value))) onChange({ ...report, models: report.models.map(item => item.id === model.id ? { ...item, quantity: Number(value) } : item) }); }} />
        <TouchableOpacity disabled={disabled} accessibilityLabel={`Eliminar fila ${index + 1}`} onPress={() => model.photos.length ? setRemoving(model.id) : remove(model.id)}><Text style={{ color: '#DC2626', fontSize: 24 }}>×</Text></TouchableOpacity>
      </View>
      <Text style={s.text}>Muestra 5 %: {modelSampleCount(model)} colchones · {modelSampleCount(model) * 9} fotos + 2 etiquetas</Text>
    </View>)}
    <View style={[s.row, { justifyContent: 'space-between' }]}><Text style={s.category}>TOTAL GENERAL</Text><Text style={s.category}>{total}</Text></View>
    <View style={s.row}>
      <TouchableOpacity disabled={disabled} style={[s.button, { flex: 1 }]} onPress={() => onChange({ ...report, models: [...report.models, emptyModel()] })}><Text style={[s.buttonText, { fontSize: 14 }]}>Agregar fila</Text></TouchableOpacity>
      <TouchableOpacity disabled={disabled || !report.models.length} style={[s.button, s.secondary, { flex: 1 }, !report.models.length && s.disabled]} onPress={() => {
        const last = report.models.at(-1);
        if (last) { if (last.photos.length) setRemoving(last.id); else remove(last.id); }
      }}><Text style={[s.buttonText, { fontSize: 14 }]}>Eliminar fila</Text></TouchableOpacity>
    </View>
    <ConfirmDialog visible={!!removing} title="Eliminar fila" message="También se eliminarán las fotografías de este modelo. ¿Deseas continuar?" onCancel={() => setRemoving(null)} onConfirm={() => { if (removing) remove(removing); setRemoving(null); }} />
  </View>;
}
