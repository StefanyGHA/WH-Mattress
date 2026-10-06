import Header from '@/components/Header';
import { reportStyles as s } from '@/components/report-styles';
import { useReport } from '@/contexts/report';
import { categoryTitle, movePhoto, PHOTO_CATEGORIES, updateModelPhotos, type PhotoCategory, type ReportPhoto } from '@/utils/report-photos';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Alert, Animated, Image, Modal, PanResponder, SafeAreaView, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';

/** Coordenadas de pantalla usadas para detectar el destino del arrastre. */
type Point = { x: number; y: number };
/** Mantiene el control de arrastre original y las referencias actualizadas del gesto. */
function DragHandle({ photo, start, move, end }: { photo: ReportPhoto; start: (photo: ReportPhoto, point: Point) => void; move: (point: Point) => void; end: (point?: Point) => void }) {
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
  return <View {...responder.panHandlers} accessibilityLabel={`Arrastrar foto ${photo.number}`} style={{ padding: 12, backgroundColor: '#E5F6F5', alignItems: 'center' }}><Ionicons name="move-outline" size={22} color="#315E78" /><Text style={s.caption}>Arrastrar</Text></View>;
}
/** Edita cada modelo sin mover sus fotos a otro lote ni perder los cambios de los demás. */
export default function EditReportScreen() {
  const router = useRouter();
  const { report, setReport } = useReport();
  // El reporte se edita como borrador; salir sin guardar conserva la versión anterior.
  const [draftReport, setDraftReport] = useState(report);
  const [modelId, setModelId] = useState(report?.models[0]?.id ?? '');
  const selectedModel = draftReport?.models.find(model => model.id === modelId);
  const draft = selectedModel?.photos ?? [];
  // Las operaciones anteriores de arrastrar y eliminar solo afectan al modelo seleccionado.
  const setDraft = (update: (photos: ReportPhoto[]) => ReportPhoto[]) => {
    setDraftReport(current => {
      const model = current?.models.find(item => item.id === modelId);
      return current && model ? updateModelPhotos(current, modelId, update(model.photos)) : current;
    });
  };
  const [dragging, setDragging] = useState<ReportPhoto | null>(null);
  const dragRef = useRef<ReportPhoto | null>(null);
  const [movingPhoto, setMovingPhoto] = useState<ReportPhoto | null>(null);
  const [hovered, setHovered] = useState<PhotoCategory | null>(null);
  const targets = useRef<Partial<Record<PhotoCategory, View | null>>>({});
  const bounds = useRef<Partial<Record<PhotoCategory, { x: number; y: number; width: number; height: number }>>>({});
  const root = useRef<View>(null);
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
    if (photo && category) setDraft(current => movePhoto(current, photo.id, category));
    dragRef.current = null;
    setDragging(null);
    setHovered(null);
  };
  /** Conserva la alternativa accesible al gesto de arrastrar. */
  const chooseCategory = (photo: ReportPhoto) => setMovingPhoto(photo);
  /** Conserva la confirmación antes de eliminar una fotografía del borrador. */
  const remove = (photo: ReportPhoto) => Alert.alert('Eliminar fotografía', `¿Eliminar foto ${photo.number}?`, [
    { text: 'Cancelar', style: 'cancel' },
    { text: 'Eliminar', style: 'destructive', onPress: () => setDraft(current => current.filter(item => item.id !== photo.id)) },
  ]);
  /** Valida los datos de todos los lotes antes de confirmar el borrador completo. */
  const saveChanges = () => {
    if (!draftReport?.principalLot.trim() || draftReport.models.some(model => !model.name.trim() || !model.lot.trim())) {
      Alert.alert('Datos requeridos', 'Completa el lote principal, el modelo y el lote de cada registro.');
      return;
    }
    setReport({ ...draftReport, principalLot: draftReport.principalLot.trim().toUpperCase(), models: draftReport.models.map(model => ({ ...model, name: model.name.trim().toUpperCase(), lot: model.lot.trim().toUpperCase() })) });
    router.back();
  };
  return <SafeAreaView style={s.screen}><View ref={root} collapsable={false} style={{ flex: 1 }}>
    <Header showBackButton />
    <View style={{ padding: 16, gap: 8 }}>
      <Text style={s.title}>Organizar fotografías</Text>
      <Text style={s.text}>Arrastra desde el control de la foto hasta una categoría de destino. También puedes tocar “Mover a”.</Text>
      <View style={s.grid}>{PHOTO_CATEGORIES.map(category => <View key={category.id} ref={view => { targets.current[category.id] = view; }} collapsable={false} style={{ width: '48%', minHeight: 56, padding: 10, borderRadius: 10, borderWidth: 2, borderColor: hovered === category.id ? '#20B3AD' : '#DDE5E9', backgroundColor: hovered === category.id ? '#CFF4EF' : '#FFFFFF' }}><Text style={s.category}>{category.short}</Text><Text style={s.text}>{draft.filter(photo => photo.category === category.id).length} fotos{hovered === category.id ? ' · Soltar aquí' : ''}</Text></View>)}</View>
    </View>
    <ScrollView scrollEnabled={!dragging} contentContainerStyle={s.content} keyboardShouldPersistTaps="handled">
      {/* Los nuevos campos usan la misma tarjeta, tipografía y colores del editor. */}
      <View style={s.card}>
        <Text style={s.category}>Lote principal del reporte</Text>
        <TextInput accessibilityLabel="Editar lote principal" value={draftReport?.principalLot ?? ''} autoCapitalize="characters" style={s.text} onChangeText={value => setDraftReport(current => current ? { ...current, principalLot: value } : current)} />
        <Text style={s.text}>Fecha del reporte: {draftReport?.date}</Text>
        {draftReport?.models.map(model => <TouchableOpacity key={model.id} disabled={!!dragging} style={[s.button, model.id !== modelId && s.secondary]} onPress={() => setModelId(model.id)}><Text style={s.buttonText}>{model.name} · {model.lot}</Text></TouchableOpacity>)}
        <Text style={s.category}>Modelo del colchón</Text>
        <TextInput accessibilityLabel="Editar modelo del colchón" value={selectedModel?.name ?? ''} autoCapitalize="characters" style={s.text} onChangeText={value => setDraftReport(current => current ? { ...current, models: current.models.map(model => model.id === modelId ? { ...model, name: value } : model) } : current)} />
        <Text style={s.category}>Lote al que pertenece</Text>
        <TextInput accessibilityLabel="Editar lote del modelo" value={selectedModel?.lot ?? ''} autoCapitalize="characters" style={s.text} onChangeText={value => setDraftReport(current => current ? { ...current, models: current.models.map(model => model.id === modelId ? { ...model, lot: value } : model) } : current)} />
      </View>
      {PHOTO_CATEGORIES.map(category => <View key={category.id} style={s.card}><Text style={s.category}>{category.title}</Text>
        <View style={s.grid}>{draft.filter(photo => photo.category === category.id).map(photo => <View key={photo.id} style={[s.photoCard, dragging?.id === photo.id && { opacity: 0.35 }]}>
          <Image source={{ uri: photo.uri }} style={s.photo} resizeMode="contain" /><Text style={s.caption}>Foto {photo.number}</Text>
          <DragHandle photo={photo} start={start} move={move} end={end} />
          <View style={[s.row, { justifyContent: 'space-between', padding: 8 }]}><TouchableOpacity accessibilityLabel={`Cambiar categoría de foto ${photo.number}`} onPress={() => chooseCategory(photo)}><Text style={s.caption}>Mover a</Text></TouchableOpacity><TouchableOpacity accessibilityLabel={`Eliminar foto ${photo.number}`} onPress={() => remove(photo)}><Ionicons name="trash-outline" size={22} color="#DC2626" /></TouchableOpacity></View>
        </View>)}</View>
        {!draft.some(photo => photo.category === category.id) && <Text style={s.text}>Sin fotos. Arrastra una a esta categoría.</Text>}
      </View>)}
    </ScrollView>
    <View style={{ padding: 12 }}><TouchableOpacity disabled={!!dragging} style={s.button} onPress={saveChanges}><Text style={s.buttonText}>Guardar cambios</Text></TouchableOpacity></View>
    {dragging && <Animated.View pointerEvents="none" style={{ position: 'absolute', top: 0, left: 0, width: 90, zIndex: 100, elevation: 12, backgroundColor: '#FFFFFF', borderWidth: 2, borderColor: '#20B3AD', borderRadius: 8, transform: position.getTranslateTransform() }}><Image source={{ uri: dragging.uri }} style={{ width: 86, height: 80 }} /><Text style={s.caption}>Foto {dragging.number}</Text><Text style={{ fontSize: 9, padding: 4 }}>{hovered ? categoryTitle(hovered) : 'Suelta en una categoría'}</Text></Animated.View>}
    <Modal visible={!!movingPhoto} transparent animationType="fade" onRequestClose={() => setMovingPhoto(null)}>
      <View style={{ flex: 1, justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.45)', padding: 24 }}><View style={s.card}>
        <Text style={s.title}>Mover foto {movingPhoto?.number}</Text>
        {PHOTO_CATEGORIES.map(category => <TouchableOpacity key={category.id} style={[s.button, s.secondary]} onPress={() => { if (movingPhoto) setDraft(current => movePhoto(current, movingPhoto.id, category.id)); setMovingPhoto(null); }}><Text style={s.buttonText}>{category.short}</Text></TouchableOpacity>)}
        <TouchableOpacity onPress={() => setMovingPhoto(null)}><Text style={[s.text, { textAlign: 'center' }]}>Cancelar</Text></TouchableOpacity>
      </View></View>
    </Modal>
  </View></SafeAreaView>;
}
