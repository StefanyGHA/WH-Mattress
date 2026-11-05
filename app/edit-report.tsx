import { usePreferences } from '@/contexts/preferences';
import Header from '@/components/Header';
import ModelTable from '@/components/ModelTable';
import PhotoSourceButtons from '@/components/PhotoSourceButtons';
import ConfirmDialog from '@/components/ConfirmDialog';
import { useReportStyles } from '@/components/report-styles';
import { useReport } from '@/contexts/report';
import { categoryTitle, movePhoto, PHOTO_CATEGORIES, updateModelPhotos, modelSampleCount, normalizeReportTable, photoSourceUri, validateReportTable, type PhotoCategory, type ReportPhoto } from '@/utils/report-photos';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Animated, Image, Modal, PanResponder, SafeAreaView, ScrollView, Text, TextInput, TouchableOpacity, View, type ViewInstance } from 'react-native';

/** Coordenadas de pantalla usadas para detectar el destino del arrastre. */
type Point = { x: number; y: number };
/** Mantiene el control de arrastre original y las referencias actualizadas del gesto. */
function DragHandle({ photo, start, move, end }: { photo: ReportPhoto; start: (photo: ReportPhoto, point: Point) => void; move: (point: Point) => void; end: (point?: Point) => void }) {
  const { t, colors } = usePreferences();
  const s = useReportStyles();
  // El controlador estable evita reiniciar un gesto al cambiar el estado de la pantalla.
  const [controller] = useState(() => ({ start, move, end, photo }));
  useEffect(() => { Object.assign(controller, { start, move, end, photo }); }, [controller, start, move, end, photo]);
  const [responder] = useState(() => PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onPanResponderGrant: event => controller.start(controller.photo, { x: event.nativeEvent.pageX, y: event.nativeEvent.pageY }),
    onPanResponderMove: (_, gesture) => controller.move({ x: gesture.moveX, y: gesture.moveY }),
    onPanResponderRelease: event => controller.end({ x: event.nativeEvent.pageX, y: event.nativeEvent.pageY }),
    onPanResponderTerminate: () => controller.end(),
    onPanResponderTerminationRequest: () => false,
  }));
  return <View {...responder.panHandlers} accessibilityLabel={t('Arrastrar foto {n}', { n: photo.number })} style={{ padding: 12, backgroundColor: colors.selected, alignItems: 'center' }}><Ionicons name="move-outline" size={22} color={colors.accent} /><Text style={s.caption}>{t('Arrastrar')}</Text></View>;
}
/** Edita cada modelo sin mover sus fotos a otro lote ni perder los cambios de los demás. */
export default function EditReportScreen() {
  const { t, colors, theme } = usePreferences();
  const s = useReportStyles();
  const router = useRouter();
  const { report, setReport } = useReport();
  // El reporte se edita como borrador; salir sin guardar conserva la versión anterior.
  const [draftReport, setDraftReport] = useState(report);
  const [selectedId, setModelId] = useState(report?.models[0]?.id ?? '');
  const selectedModel = draftReport?.models.find(model => model.id === selectedId) ?? draftReport?.models[0];
  const modelId = selectedModel?.id ?? '';
  const [sample, setSample] = useState(1);
  const totalSamples = selectedModel ? Math.max(modelSampleCount(selectedModel), 1, ...selectedModel.photos.map(photo => photo.sampleNumber ?? 1)) : 1;
  const [busy, setBusy] = useState(false);
  const [replacing, setReplacing] = useState<ReportPhoto | null>(null);
  const [removing, setRemoving] = useState<ReportPhoto | null>(null);
  const [showValidation, setShowValidation] = useState(false);
  const error = showValidation && draftReport ? validateReportTable(draftReport, t) : null;
  // El arrastre y la edición operan solo sobre el colchón de muestra seleccionado.
  const belongs = (photo: ReportPhoto) => photo.category === 'box' || photo.category === 'mattress' || (photo.sampleNumber ?? 1) === sample;
  const draft = selectedModel?.photos.filter(belongs) ?? [];
  // Las operaciones anteriores de arrastrar y eliminar solo afectan al modelo seleccionado.
  const setDraft = (update: (photos: ReportPhoto[]) => ReportPhoto[]) => {
    setDraftReport(current => {
      const model = current?.models.find(item => item.id === modelId);
      return current && model ? updateModelPhotos(current, modelId, [...model.photos.filter(photo => !belongs(photo)), ...update(model.photos.filter(belongs))]) : current;
    });
  };
  const [dragging, setDragging] = useState<ReportPhoto | null>(null);
  const dragRef = useRef<ReportPhoto | null>(null);
  const [movingPhoto, setMovingPhoto] = useState<ReportPhoto | null>(null);
  const [hovered, setHovered] = useState<PhotoCategory | null>(null);
  // React Native 0.88 utiliza tipos de instancia para las referencias nativas.
  const targets = useRef<Partial<Record<PhotoCategory, ViewInstance | null>>>({});
  const bounds = useRef<Partial<Record<PhotoCategory, { x: number; y: number; width: number; height: number }>>>({});
  const root = useRef<ViewInstance>(null);
  const origin = useRef({ x: 0, y: 0 });
  // El valor animado se crea una sola vez, sin leer referencias durante el render.
  const [position] = useState(() => new Animated.ValueXY());
  /** Detecta la categoría fija que está debajo del dedo. */
  const destination = (point: Point) => PHOTO_CATEGORIES.find(({ id }) => {
    const rect = bounds.current[id];
    return rect && point.x >= rect.x && point.x <= rect.x + rect.width && point.y >= rect.y && point.y <= rect.y + rect.height;
  })?.id;
  /** Mueve la miniatura flotante y resalta el destino actual. */
  const move = (point: Point) => {
    position.setValue({ x: point.x - origin.current.x - 45, y: point.y - origin.current.y - 55 });
    setHovered(destination(point) ?? null);
  };
  /** Mide los destinos al iniciar para respetar desplazamientos y áreas seguras. */
  const start = (photo: ReportPhoto, point: Point) => {
    bounds.current = {};
    root.current?.measureInWindow((x, y) => { origin.current = { x, y }; move(point); });
    PHOTO_CATEGORIES.forEach(({ id }) => targets.current[id]?.measureInWindow((x, y, width, height) => { bounds.current[id] = { x, y, width, height }; }));
    dragRef.current = photo;
    setDragging(photo);
    move(point);
  };
  /** Aplica el cambio de categoría únicamente al soltar sobre un destino válido. */
  const end = (point?: Point) => {
    const category = point && destination(point);
    const photo = dragRef.current;
    if (photo && category) setDraft(current => movePhoto(current, photo.id, category, sample));
    dragRef.current = null;
    setDragging(null);
    setHovered(null);
  };
  /** Conserva la alternativa accesible al gesto de arrastrar. */
  const chooseCategory = (photo: ReportPhoto) => setMovingPhoto(photo);
  /** Las confirmaciones también funcionan en navegador mediante un diálogo propio. */
  const remove = (photo: ReportPhoto) => setRemoving(photo);
  const saveChanges = () => {
    if (!draftReport) return;
    const message = validateReportTable(draftReport, t);
    if (message) { setShowValidation(true); return; }
    setReport(normalizeReportTable(draftReport));
    if (router.canGoBack()) router.back(); else router.replace('/report');
  };

  /** Se conservan la identidad, la muestra y el número al reemplazar una foto ilegible. */
  const replacePhoto = (photos: ReportPhoto[]) => {
    if (!replacing || !photos[0]) return;
    setDraft(current => current.map(photo => photo.id === replacing.id ? { ...photos[0], id: photo.id, number: photo.number, sampleNumber: photo.sampleNumber } : photo));
    setReplacing(null);
  };
  return <SafeAreaView style={s.screen}><View ref={root} collapsable={false} style={{ flex: 1 }}>
    <Header showBackButton backDisabled={busy || !!dragging} />
    <View style={{ padding: 16, gap: 8 }}>
      <Text style={s.title}>{t('Organizar fotografías')}</Text>
      <Text style={s.text}>{t('Arrastra desde el control de la foto hasta una categoría de destino. También puedes tocar “Mover a”.')}</Text>
      <View style={s.grid}>{PHOTO_CATEGORIES.map(category => <View key={category.id} ref={view => { targets.current[category.id] = view; }} collapsable={false} style={{ width: '48%', minHeight: 56, padding: 10, borderRadius: 10, borderWidth: 2, borderColor: hovered === category.id ? colors.primary : colors.border, backgroundColor: hovered === category.id ? colors.selected : colors.surface }}><Text style={s.category}>{t(category.short)}</Text><Text style={s.text}>{t('{count} fotos', { count: draft.filter(photo => photo.category === category.id).length })}{hovered === category.id ? t(' · Soltar aquí') : ''}</Text></View>)}</View>
    </View>
    <ScrollView scrollEnabled={!dragging} contentContainerStyle={s.content} keyboardShouldPersistTaps="handled">
      {/* Los nuevos campos usan la misma tarjeta, tipografía y colores del editor. */}
      <View style={s.card}>
        <Text style={s.category}>{t('Lote principal del reporte')}</Text>
        <TextInput keyboardAppearance={theme} accessibilityLabel={t('Editar lote principal')} value={draftReport?.principalLot ?? ''} autoCapitalize="characters" placeholderTextColor={colors.muted} style={[s.text, s.input]} onChangeText={value => setDraftReport(current => current ? { ...current, principalLot: value } : current)} />
        <Text style={s.text}>{t('Fecha del reporte: {date}', { date: draftReport?.date })}</Text>
      </View>
      {draftReport && <ModelTable report={draftReport} onChange={setDraftReport} disabled={busy || !!dragging} />}
      {draftReport?.models.map(model => <TouchableOpacity key={model.id} disabled={busy || !!dragging} style={[s.button, model.id !== modelId && s.secondary]} onPress={() => { setModelId(model.id); setSample(1); }}><Text style={s.buttonText}>{model.name || t('Modelo sin nombre')}</Text></TouchableOpacity>)}
      {selectedModel && <View style={s.card}><Text style={s.category}>{selectedModel.name} · {t('Colchón de muestra {n}', { n: sample })}</Text><View style={s.row}>
        <TouchableOpacity disabled={busy || !!dragging || sample <= 1} style={[s.button, sample <= 1 && s.disabled]} onPress={() => setSample(value => value - 1)}><Text style={s.buttonText}>{t('Anterior')}</Text></TouchableOpacity>
        <Text style={s.text}>{sample}/{totalSamples}</Text>
        <TouchableOpacity disabled={busy || !!dragging || sample >= totalSamples} style={[s.button, sample >= totalSamples && s.disabled]} onPress={() => setSample(value => value + 1)}><Text style={s.buttonText}>{t('Siguiente')}</Text></TouchableOpacity>
      </View></View>}
      {!!error && <Text accessibilityRole="alert" style={{ color: colors.danger }}>{error}</Text>}
      {PHOTO_CATEGORIES.map(category => <View key={category.id} style={s.card}><Text style={s.category}>{t(category.title)}</Text>
        <View style={s.grid}>{draft.filter(photo => photo.category === category.id).map(photo => <View key={photo.id} style={[s.photoCard, dragging?.id === photo.id && { opacity: 0.35 }]}>
          <Image source={{ uri: photoSourceUri(photo) }} style={s.photo} resizeMode="contain" /><Text style={s.caption}>{t('Foto {n}', { n: photo.number })}</Text><TouchableOpacity disabled={busy} accessibilityLabel={t('Reemplazar foto {n}', { n: photo.number })} onPress={() => setReplacing(photo)}><Text style={s.caption}>{t('Reemplazar')}</Text></TouchableOpacity>
          <DragHandle photo={photo} start={(item, point) => { if (!busy) start(item, point); }} move={move} end={end} />
          <View style={[s.row, { justifyContent: 'space-between', padding: 8 }]}><TouchableOpacity accessibilityLabel={t('Cambiar categoría de foto {n}', { n: photo.number })} onPress={() => chooseCategory(photo)}><Text style={s.caption}>{t('Mover a')}</Text></TouchableOpacity><TouchableOpacity accessibilityLabel={t('Eliminar foto {n}', { n: photo.number })} onPress={() => remove(photo)}><Ionicons name="trash-outline" size={22} color={colors.danger} /></TouchableOpacity></View>
        </View>)}</View>
        {!!selectedModel && <PhotoSourceButtons category={category.id} remaining={1} onBusy={setBusy} onPhotos={photos => setDraft(current => {
          const number = Math.max(0, ...selectedModel.photos.map(photo => photo.number)) + 1;
          return [...current, ...photos.map((photo, index) => ({ ...photo, number: number + index, sampleNumber: sample }))];
        })} />}
        {!draft.some(photo => photo.category === category.id) && <Text style={s.text}>{t('Sin fotos. Arrastra una a esta categoría.')}</Text>}
      </View>)}
    </ScrollView>
    <View style={{ padding: 12 }}><TouchableOpacity disabled={busy || !!dragging} style={s.button} onPress={saveChanges}><Text style={s.buttonText}>{t('Guardar cambios')}</Text></TouchableOpacity></View>
    {dragging && <Animated.View pointerEvents="none" style={{ position: 'absolute', top: 0, left: 0, width: 90, zIndex: 100, elevation: 12, backgroundColor: colors.elevated, borderWidth: 2, borderColor: colors.primary, borderRadius: 8, transform: position.getTranslateTransform() }}><Image source={{ uri: photoSourceUri(dragging) }} style={{ width: 86, height: 80 }} /><Text style={s.caption}>{t('Foto {n}', { n: dragging.number })}</Text><Text style={{ fontSize: 9, padding: 4, color: colors.text }}>{hovered ? t(categoryTitle(hovered)) : t('Suelta en una categoría')}</Text></Animated.View>}
    <ConfirmDialog visible={!!removing} title={t('Eliminar fotografía')} message={t('¿Eliminar la foto {n}?', { n: removing?.number })} onCancel={() => setRemoving(null)} onConfirm={() => { if (removing) setDraft(current => current.filter(photo => photo.id !== removing.id)); setRemoving(null); }} />
    <Modal visible={!!replacing} transparent animationType="fade" onRequestClose={() => { if (!busy) setReplacing(null); }}>
      <View style={{ flex: 1, justifyContent: 'center', padding: 24, backgroundColor: colors.overlay }}><View style={[s.card, { backgroundColor: colors.elevated }]}>
        <Text style={s.title}>{t('Reemplazar foto {n}', { n: replacing?.number })}</Text>
        {replacing && <PhotoSourceButtons category={replacing.category} remaining={1} onPhotos={replacePhoto} onBusy={setBusy} />}
        <TouchableOpacity disabled={busy} onPress={() => setReplacing(null)}><Text style={s.text}>{t('Volver')}</Text></TouchableOpacity>
      </View></View>
    </Modal>
    <Modal visible={!!movingPhoto} transparent animationType="fade" onRequestClose={() => setMovingPhoto(null)}>
      <View style={{ flex: 1, justifyContent: 'center', backgroundColor: colors.overlay, padding: 24 }}><View style={[s.card, { backgroundColor: colors.elevated }]}>
        <Text style={s.title}>{t('Mover foto {n}', { n: movingPhoto?.number })}</Text>
        {PHOTO_CATEGORIES.map(category => <TouchableOpacity key={category.id} style={[s.button, s.secondary]} onPress={() => { if (movingPhoto) setDraft(current => movePhoto(current, movingPhoto.id, category.id, sample)); setMovingPhoto(null); }}><Text style={s.buttonText}>{t(category.short)}</Text></TouchableOpacity>)}
        <TouchableOpacity onPress={() => setMovingPhoto(null)}><Text style={[s.text, { textAlign: 'center' }]}>{t('Cancelar')}</Text></TouchableOpacity>
      </View></View>
    </Modal>
  </View></SafeAreaView>;
}
