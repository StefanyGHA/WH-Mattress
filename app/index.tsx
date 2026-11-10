import PhotoOrderDialog from '@/components/PhotoOrderDialog';
import PhotoActions from '@/components/PhotoActions';
import { usePreferences } from '@/contexts/preferences';
import Header from '@/components/Header';
import ModelTable from '@/components/ModelTable';
import CancelReportButton from '@/components/CancelReportButton';
import PhotoSourceButtons from '@/components/PhotoSourceButtons';
import { useReportStyles } from '@/components/report-styles';
import { useReport } from '@/contexts/report';
import { adjacentCaptureStep, appendCaptureBatch, captureGroup, reorderCapturePhotos } from '@/utils/capture-flow';
import { replaceCapturedPhoto, categoryTitle, createReport, emptyModel, modelSampleCount, normalizeReportTable, photoSourceUri, updateModelPhotos, validateReportTable, type ReportPhoto } from '@/utils/report-photos';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { BackHandler, Image, KeyboardAvoidingView, Platform, SafeAreaView, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';

/** Cuadro inicial editable y captura de nueve imágenes por cada unidad de la muestra. */
export default function HomeScreen() {
  const { t, colors, theme } = usePreferences();
  const s = useReportStyles();
  const router = useRouter();
  const { report, setReport, position, setPosition } = useReport();
  const [initial] = useState(() => ({ ...createReport(''), models: [emptyModel()] }));
  const current = report ?? initial;
  const [showValidation, setShowValidation] = useState(false);
  const [busy, setBusy] = useState(false);
  const [ordering, setOrdering] = useState<{ key: string } | null>(null);
  const model = current.models.find(item => item.id === position?.modelId);
  const error = showValidation && current ? validateReportTable(current, t) : null;
  // Si se elimina un modelo desde el editor, vuelve al cuadro sin reutilizar otra fila.
  const active = model && position ? position : null;
  const labels = active?.stage === 'labels';
  const group = model && active ? captureGroup(model.photos, active) : [];
  const target = labels ? 2 : 9;
  const complete = group.length >= target && (!labels || ['box', 'mattress'].every(category => group.some(photo => photo.category === category)));

  const orderKey = active ? `${active.modelId}-${active.stage}-${active.sample}` : '';
  const reordering = ordering?.key === orderKey && !!active;
  /** Confirma la numeración completa del cuadro; cancelar conserva el reporte original. */
  const applyOrder = (ids: string[]) => {
    if (!model || !active) return;
    setReport(value => {
      const latest = value?.models.find(item => item.id === model.id);
      return value && latest ? updateModelPhotos(value, model.id, reorderCapturePhotos(latest.photos, ids, active)) : value;
    });
    setOrdering(null);
  };

  /** La flecha y el botón físico de Android comparten la misma transición reversible. */
  const back = () => { if (!busy && active) { setOrdering(null); setPosition(adjacentCaptureStep(current, active, -1)); } };
  useFocusEffect(useCallback(() => {
    if (!active) return;
    // Una pantalla del asistente oculta no debe interceptar el retroceso del editor.
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      if (!busy) { setOrdering(null); setPosition(adjacentCaptureStep(current, active, -1)); }
      return true;
    });
    return () => subscription.remove();
  }, [active, busy, current, setPosition]));

  /** Congela los datos normalizados de la tabla antes de comenzar la primera muestra. */
  const begin = () => {
    const message = validateReportTable(current, t);
    if (message) { setShowValidation(true); return; }
    const normalized = normalizeReportTable(current);
    setReport(normalized); setPosition({ modelId: normalized.models[0].id, sample: 1, stage: 'labels' }); setShowValidation(false);
  };

  /** Guarda la copia JPEG por modelo y muestra sin alterar las fotografías anteriores. */
  const addPhotos = (photos: ReportPhoto[]) => {
    if (!active || !model) return;
    setReport(value => {
      const latest = value?.models.find(item => item.id === model.id);
      if (!value || !latest) return value;
      return updateModelPhotos(value, model.id, appendCaptureBatch(latest.photos, photos, active));
    });
  };

  /** Aplica eliminar o retomar al modelo actual sin alterar otras muestras o categorías. */
  const editPhoto = (id: string, replacement?: ReportPhoto) => {
    if (!model) return;
    setReport(value => {
      const latest = value?.models.find(item => item.id === model.id);
      if (!value || !latest) return value;
      const photos = replacement ? replaceCapturedPhoto(latest.photos, id, replacement) : latest.photos.filter(photo => photo.id !== id);
      return updateModelPhotos(value, model.id, photos);
    });
  };

  /** Avanza entre etiquetas, categorías, muestras y modelos; el último paso abre el informe. */
  const next = () => {
    if (!active) return;
    setOrdering(null);
    const following = adjacentCaptureStep(current, active, 1);
    if (following) setPosition(following);
    else router.push('/report');
  };

  return <SafeAreaView style={s.screen}>
    <Header showBackButton={!!active} onBack={back} backDisabled={busy} />
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={s.content} keyboardShouldPersistTaps="handled">
        <Text style={s.title}>{t('Nuevo reporte de producción')}</Text>
        <Text style={s.text}>{t('Fecha del reporte: {date}', { date: current.date })}</Text>
        {!active ? <>
          {/* El lote se solicita solo una vez; todas las filas pertenecen a ese reporte. */}
          <View style={s.card}><Text style={s.category}>{t('Lote principal del reporte')}</Text><TextInput keyboardAppearance={theme} accessibilityLabel={t('Lote principal del reporte')} value={current.principalLot} onChangeText={principalLot => setReport({ ...current, principalLot })} autoCapitalize="characters" placeholder="6LC0100" placeholderTextColor={colors.muted} style={[s.text, s.input, { padding: 12, borderWidth: 1, borderColor: colors.border, borderRadius: 8 }]} /></View>
          <ModelTable report={current} onChange={setReport} />
          <Text style={s.text}>{t('Se inspecciona el 5 % de cada modelo, redondeando hacia arriba. Cada colchón de la muestra requiere 3 fotos de apariencia y 6 de medidas; las 2 etiquetas se toman una vez por modelo.')}</Text>
          {!!error && <Text accessibilityRole="alert" style={{ color: colors.danger }}>{error}</Text>}
          <TouchableOpacity style={s.button} onPress={begin}><Text style={s.buttonText}>{t('Continuar')}</Text></TouchableOpacity>
        </> : <>
          <Text style={s.category}>{t('Modelo: {name}', { name: model!.name })}</Text>
          <Text style={s.text}>{t('Cantidad: {quantity} · Muestra 5 %: {count} colchones', { quantity: model!.quantity ?? 20, count: modelSampleCount(model!) })}</Text>
          {!labels && <Text style={s.category}>{t('Colchón de muestra {sample} de {total}', { sample: active.sample, total: modelSampleCount(model!) })}</Text>}
          <View style={s.card}>
            <Text style={s.text}>{t(labels ? 'Orden: 1 etiqueta de caja, 2 etiqueta del colchón.' : 'Orden: las primeras 3 fotos son de apariencia y las siguientes 6 de medidas.')}</Text>
            <Text style={s.category}>{t(labels ? 'Etiquetas del modelo' : 'Apariencia y medidas')}</Text><Text style={s.text}>{t('{count}/{target} fotografías', { count: group.length, target })}</Text>
            <PhotoSourceButtons key={`${model!.id}-${active.stage}-${active.sample}`} cameraBatch disabled={busy} category={labels ? 'box' : 'appearance'} remaining={Math.max(1, target - group.length)} onPhotos={addPhotos} onBusy={setBusy} />
            {complete && <Text style={s.text}>{t('Completado. Puedes continuar o agregar fotografías adicionales.')}</Text>}
            {group.length > 1 && <TouchableOpacity accessibilityRole="button" disabled={busy} style={[s.button, s.secondary]} onPress={() => setOrdering({ key: orderKey })}><Text style={[s.buttonText, s.secondaryText]}>{t('Cambiar orden')}</Text></TouchableOpacity>}
            {reordering && <PhotoOrderDialog photos={group} onConfirm={applyOrder} onCancel={() => setOrdering(null)} />}
            <View style={s.grid}>{group.map((photo, index) => <View key={photo.id} style={s.photoCard}>
              <Image source={{ uri: photoSourceUri(photo) }} style={s.photo} resizeMode="contain" />
              <PhotoActions photo={photo} disabled={busy} onBusy={setBusy} onDelete={() => editPhoto(photo.id)} onReplace={replacement => editPhoto(photo.id, replacement)} />
              <Text style={s.caption}>{t('Foto {n}', { n: index + 1 })} · {t(categoryTitle(photo.category))}</Text>
            </View>)}</View>
          </View>
          <TouchableOpacity disabled={busy || !complete} style={[s.button, (busy || !complete) && s.disabled]} onPress={next}><Text style={s.buttonText}>{t('Continuar')}</Text></TouchableOpacity>
          <TouchableOpacity disabled={busy} style={[s.button, s.secondary]} onPress={back}><Text style={s.buttonText}>{t('Retroceder')}</Text></TouchableOpacity>
          <TouchableOpacity disabled={busy} onPress={() => { setOrdering(null); setPosition(null); setShowValidation(false); }}><Text style={[s.text, { textAlign: 'center' }]}>{t('Editar cuadro inicial')}</Text></TouchableOpacity>
        </>}
        {!!report && <CancelReportButton disabled={busy} />}
      </ScrollView>
    </KeyboardAvoidingView>
  </SafeAreaView>;
}
