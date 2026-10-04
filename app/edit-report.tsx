import Header from '@/components/Header';
import { reportStyles as s } from '@/components/report-styles';
import { useReport } from '@/contexts/report';
import { categoryTitle, movePhoto, PHOTO_CATEGORIES, type PhotoCategory, type ReportPhoto } from '@/utils/report-photos';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useRef, useState } from 'react';
import { Alert, Animated, Image, Modal, PanResponder, SafeAreaView, ScrollView, Text, TouchableOpacity, View } from 'react-native';

type Point = { x: number; y: number };
function DragHandle({ photo, start, move, end }: { photo: ReportPhoto; start: (photo: ReportPhoto, point: Point) => void; move: (point: Point) => void; end: (point?: Point) => void }) {
  const callbacks = useRef({ start, move, end, photo });
  callbacks.current = { start, move, end, photo };
  const responder = useRef(PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onPanResponderGrant: event => callbacks.current.start(callbacks.current.photo, { x: event.nativeEvent.pageX, y: event.nativeEvent.pageY }),
    onPanResponderMove: (_, gesture) => callbacks.current.move({ x: gesture.moveX, y: gesture.moveY }),
    onPanResponderRelease: event => callbacks.current.end({ x: event.nativeEvent.pageX, y: event.nativeEvent.pageY }),
    onPanResponderTerminate: () => callbacks.current.end(),
    onPanResponderTerminationRequest: () => false,
  })).current;
  return <View {...responder.panHandlers} accessibilityLabel={`Arrastrar foto ${photo.number}`} style={{ padding: 12, backgroundColor: '#E5F6F5', alignItems: 'center' }}><Ionicons name="move-outline" size={22} color="#315E78" /><Text style={s.caption}>Arrastrar</Text></View>;
}
export default function EditReportScreen() {
  const router = useRouter();
  const { photos, setPhotos } = useReport();
  const [draft, setDraft] = useState(photos);
  const [dragging, setDragging] = useState<ReportPhoto | null>(null);
  const dragRef = useRef<ReportPhoto | null>(null);
  const [movingPhoto, setMovingPhoto] = useState<ReportPhoto | null>(null);
  const [hovered, setHovered] = useState<PhotoCategory | null>(null);
  const targets = useRef<Partial<Record<PhotoCategory, View | null>>>({});
  const bounds = useRef<Partial<Record<PhotoCategory, { x: number; y: number; width: number; height: number }>>>({});
  const root = useRef<View>(null);
  const origin = useRef({ x: 0, y: 0 });
  const position = useRef(new Animated.ValueXY()).current;
  const destination = (point: Point) => PHOTO_CATEGORIES.find(({ id }) => {
    const rect = bounds.current[id];
    return rect && point.x >= rect.x && point.x <= rect.x + rect.width && point.y >= rect.y && point.y <= rect.y + rect.height;
  })?.id;
  const move = (point: Point) => {
    position.setValue({ x: point.x - origin.current.x - 45, y: point.y - origin.current.y - 55 });
    setHovered(destination(point) ?? null);
  };
  const start = (photo: ReportPhoto, point: Point) => {
    bounds.current = {};
    root.current?.measureInWindow((x, y) => { origin.current = { x, y }; move(point); });
    PHOTO_CATEGORIES.forEach(({ id }) => targets.current[id]?.measureInWindow((x, y, width, height) => { bounds.current[id] = { x, y, width, height }; }));
    dragRef.current = photo;
    setDragging(photo);
    move(point);
  };
  const end = (point?: Point) => {
    const category = point && destination(point);
    const photo = dragRef.current;
    if (photo && category) setDraft(current => movePhoto(current, photo.id, category));
    dragRef.current = null;
    setDragging(null);
    setHovered(null);
  };
  const chooseCategory = (photo: ReportPhoto) => setMovingPhoto(photo);
  const remove = (photo: ReportPhoto) => Alert.alert('Eliminar fotografía', `¿Eliminar foto ${photo.number}?`, [
    { text: 'Cancelar', style: 'cancel' },
    { text: 'Eliminar', style: 'destructive', onPress: () => setDraft(current => current.filter(item => item.id !== photo.id)) },
  ]);
  return <SafeAreaView style={s.screen}><View ref={root} collapsable={false} style={{ flex: 1 }}>
    <Header showBackButton />
    <View style={{ padding: 16, gap: 8 }}>
      <Text style={s.title}>Organizar fotografías</Text>
      <Text style={s.text}>Arrastra desde el control de la foto hasta una categoría de destino. También puedes tocar “Mover a”.</Text>
      <View style={s.grid}>{PHOTO_CATEGORIES.map(category => <View key={category.id} ref={view => { targets.current[category.id] = view; }} collapsable={false} style={{ width: '48%', minHeight: 56, padding: 10, borderRadius: 10, borderWidth: 2, borderColor: hovered === category.id ? '#20B3AD' : '#DDE5E9', backgroundColor: hovered === category.id ? '#CFF4EF' : '#FFFFFF' }}><Text style={s.category}>{category.short}</Text><Text style={s.text}>{draft.filter(photo => photo.category === category.id).length} fotos{hovered === category.id ? ' · Soltar aquí' : ''}</Text></View>)}</View>
    </View>
    <ScrollView scrollEnabled={!dragging} contentContainerStyle={s.content}>
      {PHOTO_CATEGORIES.map(category => <View key={category.id} style={s.card}><Text style={s.category}>{category.title}</Text>
        <View style={s.grid}>{draft.filter(photo => photo.category === category.id).map(photo => <View key={photo.id} style={[s.photoCard, dragging?.id === photo.id && { opacity: 0.35 }]}>
          <Image source={{ uri: photo.uri }} style={s.photo} resizeMode="contain" /><Text style={s.caption}>Foto {photo.number}</Text>
          <DragHandle photo={photo} start={start} move={move} end={end} />
          <View style={[s.row, { justifyContent: 'space-between', padding: 8 }]}><TouchableOpacity accessibilityLabel={`Cambiar categoría de foto ${photo.number}`} onPress={() => chooseCategory(photo)}><Text style={s.caption}>Mover a</Text></TouchableOpacity><TouchableOpacity accessibilityLabel={`Eliminar foto ${photo.number}`} onPress={() => remove(photo)}><Ionicons name="trash-outline" size={22} color="#DC2626" /></TouchableOpacity></View>
        </View>)}</View>
        {!draft.some(photo => photo.category === category.id) && <Text style={s.text}>Sin fotos. Arrastra una a esta categoría.</Text>}
      </View>)}
    </ScrollView>
    <View style={{ padding: 12 }}><TouchableOpacity disabled={!!dragging} style={s.button} onPress={() => { setPhotos(draft); router.back(); }}><Text style={s.buttonText}>Guardar cambios</Text></TouchableOpacity></View>
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
