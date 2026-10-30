import Header from '@/components/Header';
import ModelTable from '@/components/ModelTable';
import CancelReportButton from '@/components/CancelReportButton';
import PhotoSourceButtons from '@/components/PhotoSourceButtons';
import { reportStyles as s } from '@/components/report-styles';
import { useReport } from '@/contexts/report';
import { adjacentCaptureStep } from '@/utils/capture-flow';
import { categoryTitle, createReport, emptyModel, modelSampleCount, normalizeReportTable, photoSourceUri, updateModelPhotos, validateReportTable, type ReportPhoto } from '@/utils/report-photos';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { BackHandler, Image, KeyboardAvoidingView, Platform, SafeAreaView, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';

/** Cuadro inicial editable y captura de nueve imágenes por cada unidad de la muestra. */
export default function HomeScreen() {
  const router = useRouter();
  const { report, setReport, position, setPosition } = useReport();
  const [initial] = useState(() => ({ ...createReport(''), models: [emptyModel()] }));
  const current = report ?? initial;
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const model = current.models.find(item => item.id === position?.modelId);
  // Si se elimina un modelo desde el editor, vuelve al cuadro sin reutilizar otra fila.
  const active = model && position ? position : null;
  const category = active?.category;
  const group = model?.photos.filter(photo => photo.category === category && (category === 'box' || category === 'mattress' || (photo.sampleNumber ?? 1) === active?.sample)) ?? [];
  const target = category === 'appearance' ? 3 : category === 'measures' ? 6 : 1;

  /** La flecha y el botón físico de Android comparten la misma transición reversible. */
  const back = () => { if (!busy && active) setPosition(adjacentCaptureStep(current, active, -1)); };
  useFocusEffect(useCallback(() => {
    if (!active) return;
    // Una pantalla del asistente oculta no debe interceptar el retroceso del editor.
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      if (!busy) setPosition(adjacentCaptureStep(current, active, -1));
      return true;
    });
    return () => subscription.remove();
  }, [active, busy, current, setPosition]));

  /** Congela los datos normalizados de la tabla antes de comenzar la primera muestra. */
  const begin = () => {
    const message = validateReportTable(current);
    if (message) { setError(message); return; }
    const normalized = normalizeReportTable(current);
    setReport(normalized); setPosition({ modelId: normalized.models[0].id, sample: 1, category: 'box' }); setError('');
  };

  /** Guarda la copia JPEG por modelo y muestra sin alterar las fotografías anteriores. */
  const addPhotos = (photos: ReportPhoto[]) => {
    if (!active || !model) return;
    setReport(value => {
      const latest = value?.models.find(item => item.id === model.id);
      if (!value || !latest) return value;
      const next = Math.max(0, ...latest.photos.map(photo => photo.number)) + 1;
      const added = photos.map((photo, index) => ({ ...photo, number: next + index, sampleNumber: active.sample }));
      return updateModelPhotos(value, model.id, [...latest.photos, ...added]);
    });
  };

  /** Avanza entre etiquetas, categorías, muestras y modelos; el último paso abre el informe. */
  const next = () => {
    if (!active) return;
    const following = adjacentCaptureStep(current, active, 1);
    if (following) setPosition(following);
    else router.push('/report');
  };

  return <SafeAreaView style={s.screen}>
    <Header showBackButton={!!active} onBack={back} backDisabled={busy} />
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={s.content} keyboardShouldPersistTaps="handled">
        <Text style={s.title}>Nuevo reporte de producción</Text>
        <Text style={s.text}>Fecha del reporte: {current.date}</Text>
        {!active ? <>
          {/* El lote se solicita solo una vez; todas las filas pertenecen a ese reporte. */}
          <View style={s.card}><Text style={s.category}>Lote principal del reporte</Text><TextInput accessibilityLabel="Lote principal del reporte" value={current.principalLot} onChangeText={principalLot => setReport({ ...current, principalLot })} autoCapitalize="characters" placeholder="6LC0100" style={[s.text, { padding: 12, borderWidth: 1, borderColor: '#DDE5E9', borderRadius: 8 }]} /></View>
          <ModelTable report={current} onChange={setReport} />
          <Text style={s.text}>Se inspecciona el 5 % de cada modelo, redondeando hacia arriba. Cada colchón de la muestra requiere 3 fotos de apariencia y 6 de medidas; las 2 etiquetas se toman una vez por modelo.</Text>
          {!!error && <Text accessibilityRole="alert" style={{ color: '#DC2626' }}>{error}</Text>}
          <TouchableOpacity style={s.button} onPress={begin}><Text style={s.buttonText}>Continuar</Text></TouchableOpacity>
        </> : <>
          <Text style={s.category}>Modelo: {model!.name}</Text>
          <Text style={s.text}>Cantidad: {model!.quantity ?? 20} · Muestra 5 %: {modelSampleCount(model!)} colchones</Text>
          {(category === 'appearance' || category === 'measures') && <Text style={s.category}>Colchón de muestra {active.sample} de {modelSampleCount(model!)}</Text>}
          <View style={s.card}>
            <Text style={s.category}>{categoryTitle(category!)}</Text><Text style={s.text}>{group.length}/{target} fotografías</Text>
            <PhotoSourceButtons key={`${model!.id}-${category}-${active.sample}`} category={category!} remaining={Math.max(1, target - group.length)} onPhotos={addPhotos} onBusy={setBusy} />
            {group.length >= target && <Text style={s.text}>Completado. Puedes continuar o agregar fotografías adicionales.</Text>}
            <View style={s.grid}>{group.map(photo => <View key={photo.id} style={s.photoCard}><Image source={{ uri: photoSourceUri(photo) }} style={s.photo} resizeMode="contain" /><Text style={s.caption}>Foto {photo.number}</Text></View>)}</View>
          </View>
          <TouchableOpacity disabled={busy || group.length < target} style={[s.button, (busy || group.length < target) && s.disabled]} onPress={next}><Text style={s.buttonText}>Continuar</Text></TouchableOpacity>
          <TouchableOpacity disabled={busy} style={[s.button, s.secondary]} onPress={back}><Text style={s.buttonText}>Retroceder</Text></TouchableOpacity>
          <TouchableOpacity disabled={busy} onPress={() => { setPosition(null); setError(''); }}><Text style={[s.text, { textAlign: 'center' }]}>Editar cuadro inicial</Text></TouchableOpacity>
        </>}
        {!!report && <CancelReportButton disabled={busy} />}
      </ScrollView>
    </KeyboardAvoidingView>
  </SafeAreaView>;
}
