import Header from '@/components/Header';
import { reportStyles as s } from '@/components/report-styles';
import { useReport } from '@/contexts/report';
import { categoryForNumber, categoryTitle, PHOTO_CATEGORIES, type ReportPhoto } from '@/utils/report-photos';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, Image, Modal, SafeAreaView, ScrollView, Text, TouchableOpacity, View } from 'react-native';

export default function HomeScreen() {
  const router = useRouter();
  const { photos, setPhotos } = useReport();
  const [limit, setLimit] = useState(9);
  const [draftLimit, setDraftLimit] = useState(9);
  const [mode, setMode] = useState<'camera' | 'gallery'>('camera');
  const [showModal, setShowModal] = useState(false);
  const [started, setStarted] = useState(false);
  const [busy, setBusy] = useState(false);
  const next = Math.max(0, ...photos.map(photo => photo.number)) + 1;
  const complete = photos.length >= limit;

  const acquire = async (source: 'camera' | 'gallery', count = limit, existing = photos) => {
    if (busy || existing.length >= count) return;
    setBusy(true);
    try {
      if (source === 'camera') {
        const permission = await ImagePicker.requestCameraPermissionsAsync();
        if (!permission.granted) {
          Alert.alert('Permiso requerido', 'Permite el acceso a la cámara desde los ajustes del teléfono.');
          return;
        }
      }
      const result = source === 'camera'
        ? await ImagePicker.launchCameraAsync({ mediaTypes: ['images'], quality: 0.8, base64: true })
        : await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], allowsMultipleSelection: true, orderedSelection: true, selectionLimit: count - existing.length, quality: 0.8, base64: true });
      if (!result.canceled) {
        const added: ReportPhoto[] = result.assets.slice(0, count - existing.length).map((asset, index) => {
          const number = Math.max(0, ...existing.map(photo => photo.number)) + index + 1;
          return { id: `${Date.now()}-${number}`, uri: asset.uri, base64: asset.base64, number, category: categoryForNumber(number) };
        });
        setPhotos([...existing, ...added]);
      }
    } catch {
      Alert.alert('No se pudo cargar la foto', 'Intenta nuevamente. Tus fotos anteriores se conservaron.');
    } finally { setBusy(false); }
  };

  const selectMode = (source: 'camera' | 'gallery') => {
    setMode(source);
    if (photos.length > 0 && !complete) { setStarted(true); return; }
    setDraftLimit(limit);
    setShowModal(true);
  };

  return <SafeAreaView style={s.screen}>
    <Header />
    <ScrollView contentContainerStyle={s.content}>
      <Text style={s.title}>Fotografías del informe</Text>
      <Text style={s.text}>Elige la cantidad y captura cada foto con su categoría. Después puedes moverlas en Editar informe.</Text>
      <View style={s.row}>
        <TouchableOpacity disabled={busy} style={[s.button, { flex: 1 }]} onPress={() => selectMode('gallery')}><Ionicons name="images-outline" size={22} color="white" /><Text style={s.buttonText}>Galería</Text></TouchableOpacity>
        <TouchableOpacity disabled={busy} style={[s.button, { flex: 1 }]} onPress={() => selectMode('camera')}><Ionicons name="camera-outline" size={22} color="white" /><Text style={s.buttonText}>Cámara</Text></TouchableOpacity>
      </View>
      <Text style={s.category}>Fotografías: {photos.length}/{limit}</Text>
      {started && !complete && <View style={s.card}>
        <Text style={s.text}>Siguiente: foto {next} de {limit}</Text>
        <Text style={s.category}>{categoryTitle(categoryForNumber(next))}</Text>
        <Text style={s.text}>{mode === 'camera' ? 'Toma esta fotografía y vuelve aquí para ver la siguiente categoría.' : 'Selecciona las fotos en orden: caja, colchón, apariencia y medidas.'}</Text>
        <TouchableOpacity disabled={busy} style={[s.button, busy && s.disabled]} onPress={() => acquire(mode)}><Text style={s.buttonText}>{busy ? 'Cargando…' : mode === 'camera' ? `Tomar foto ${next}` : 'Seleccionar fotos'}</Text></TouchableOpacity>
      </View>}
      {PHOTO_CATEGORIES.map(category => {
        const group = photos.filter(photo => photo.category === category.id);
        return <View key={category.id} style={s.card}><Text style={s.category}>{category.title}</Text>
          {group.length === 0 ? <Text style={s.text}>Sin fotografías</Text> : <View style={s.grid}>{group.map(photo => <View key={photo.id} style={s.photoCard}><Image source={{ uri: photo.uri }} style={s.photo} resizeMode="contain" /><Text style={s.caption}>Foto {photo.number}</Text></View>)}</View>}
        </View>;
      })}
      {photos.length > 0 && <TouchableOpacity disabled={busy} style={[s.button, s.secondary]} onPress={() => router.push('/report')}><Text style={s.buttonText}>{complete ? 'Continuar al informe' : 'Revisar informe parcial'}</Text></TouchableOpacity>}
    </ScrollView>
    <Modal visible={showModal} transparent animationType="fade" onRequestClose={() => setShowModal(false)}>
      <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'center', padding: 24 }}><View style={s.card}>
        <Text style={s.title}>¿Cuántas fotografías?</Text>
        <Text style={s.text}>1: caja · 2: colchón · 3–5: apariencia · 6 en adelante: medidas. Podrás cambiar las categorías.</Text>
        {photos.length > 0 && <Text style={s.text}>Al iniciar un nuevo informe se reemplazarán las fotos actuales.</Text>}
        <View style={[s.row, { justifyContent: 'center' }]}>
          <TouchableOpacity accessibilityLabel="Reducir cantidad" style={s.button} onPress={() => setDraftLimit(n => Math.max(1, n - 1))}><Text style={s.buttonText}>−</Text></TouchableOpacity>
          <Text style={s.title}>{draftLimit}</Text>
          <TouchableOpacity accessibilityLabel="Aumentar cantidad" style={s.button} onPress={() => setDraftLimit(n => Math.min(50, n + 1))}><Text style={s.buttonText}>+</Text></TouchableOpacity>
        </View>
        <TouchableOpacity style={s.button} onPress={() => { setLimit(draftLimit); setPhotos([]); setStarted(true); setShowModal(false); }}><Text style={s.buttonText}>Iniciar informe</Text></TouchableOpacity>
        <TouchableOpacity onPress={() => setShowModal(false)}><Text style={[s.text, { textAlign: 'center' }]}>Cancelar</Text></TouchableOpacity>
      </View></View>
    </Modal>
  </SafeAreaView>;
}
