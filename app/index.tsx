import Header from '@/components/Header';
import { reportStyles as s } from '@/components/report-styles';
import { useReport } from '@/contexts/report';
import { categoryTitle, createReport, deviceDate, PHOTO_CATEGORIES, updateModelPhotos, type PhotoCategory, type ReportPhoto } from '@/utils/report-photos';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { useRef, useState } from 'react';
import { Alert, Image, KeyboardAvoidingView, Platform, SafeAreaView, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';

/** Los pasos siguen el registro del script: datos, etiquetas, fotos y otro lote. */
type Step = 'principal' | 'lot' | 'model' | 'box' | 'mattress' | 'counts' | 'appearance' | 'measures' | 'another' | 'finished';

/** Captura un reporte con varios lotes conservando los componentes y estilos existentes. */
export default function HomeScreen() {
  const router = useRouter();
  const { report, setReport } = useReport();
  const [storedStep, setStep] = useState<Step>('principal');
  // Sin reporte se muestra el primer paso, incluso al volver de una cancelación.
  const step = report ? storedStep : 'principal';
  const [text, setText] = useState('');
  const [lot, setLot] = useState('');
  const [modelId, setModelId] = useState('');
  const [appearanceCount, setAppearanceCount] = useState(3);
  const [measuresCount, setMeasuresCount] = useState(6);
  const [busy, setBusy] = useState(false);
  const picking = useRef(false);
  const model = report?.models.find(item => item.id === modelId);
  const category = ['box', 'mattress', 'appearance', 'measures'].includes(step) ? step as PhotoCategory : null;
  const group = model?.photos.filter(photo => photo.category === category) ?? [];
  const target = category === 'appearance' ? appearanceCount : category === 'measures' ? measuresCount : 1;

  /** Valida el dato actual antes de crear el reporte o agregar un nuevo modelo. */
  const saveText = () => {
    const value = text.trim().toUpperCase();
    if (!value) { Alert.alert('Dato requerido', 'Completa este dato para continuar.'); return; }
    if (step === 'principal') {
      setReport(createReport(value));
      setLot(value);
      setStep('model');
    } else if (step === 'lot') {
      setLot(value);
      setStep('model');
    } else if (step === 'model' && report) {
      const id = `${Date.now()}-${report.models.length + 1}`;
      setReport(current => current ? { ...current, models: [...current.models, { id, name: value, lot, photos: [] }] } : current);
      setModelId(id);
      setAppearanceCount(3);
      setMeasuresCount(6);
      setStep('box');
    }
    setText('');
  };

  /** Solicita solo imágenes de la categoría actual; las dos etiquetas se capturan por separado. */
  const acquire = async (source: 'camera' | 'gallery') => {
    if (picking.current || !model || !category || group.length >= target) return;
    picking.current = true;
    setBusy(true);
    try {
      if (source === 'camera') {
        const permission = await ImagePicker.requestCameraPermissionsAsync();
        if (!permission.granted) { Alert.alert('Permiso requerido', 'Permite el acceso a la cámara desde los ajustes del teléfono.'); return; }
      }
      const remaining = target - group.length;
      const result = source === 'camera'
        ? await ImagePicker.launchCameraAsync({ mediaTypes: ['images'], quality: 0.8, base64: true })
        : await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], allowsMultipleSelection: remaining > 1, orderedSelection: true, selectionLimit: remaining, quality: 0.8, base64: true });
      if (result.canceled) return;
      // La numeración es estable dentro de cada modelo y no se reutiliza tras eliminar fotos.
      const next = Math.max(0, ...model.photos.map(photo => photo.number)) + 1;
      const added: ReportPhoto[] = result.assets.slice(0, remaining).map((asset, index) => ({
        id: `${model.id}-${Date.now()}-${next + index}`, uri: asset.uri, base64: asset.base64, number: next + index, category,
      }));
      setReport(current => {
        const currentModel = current?.models.find(item => item.id === model.id);
        return current && currentModel ? updateModelPhotos(current, model.id, [...currentModel.photos, ...added]) : current;
      });
      // Se pide primero la etiqueta de caja y después la del colchón, sin selección conjunta.
      if (added.length && category === 'box') setStep('mattress');
      if (added.length && category === 'mattress') setStep('counts');
    } catch {
      Alert.alert('No se pudo cargar la foto', 'Intenta nuevamente. Tus fotografías anteriores se conservaron.');
    } finally { picking.current = false; setBusy(false); }
  };

  /** Termina la captura y abre la misma pantalla de informe y edición. */
  const finish = () => { setStep('finished'); router.push('/report'); };

  return <SafeAreaView style={s.screen}>
    <Header />
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={s.content} keyboardShouldPersistTaps="handled">
        <Text style={s.title}>Nuevo reporte de producción</Text>
        <Text style={s.text}>Fecha del reporte: {report?.date ?? deviceDate()}</Text>
        {report && <Text style={s.category}>Lote principal: {report.principalLot}</Text>}
        {model && step !== 'principal' && <Text style={s.text}>Modelo: {model.name} · Lote: {model.lot}</Text>}

        {/* Se reutiliza la tarjeta existente para pedir los datos, sin solicitar fecha. */}
        {['principal', 'lot', 'model'].includes(step) && <View style={s.card}>
          <Text style={s.category}>{step === 'principal' ? 'Lote principal del reporte' : step === 'lot' ? 'Lote al que pertenece' : 'Modelo del colchón'}</Text>
          {step === 'model' && <Text style={s.text}>Este modelo pertenecerá a {lot}.</Text>}
          <TextInput accessibilityLabel={step === 'model' ? 'Modelo del colchón' : step === 'lot' ? 'Lote al que pertenece' : 'Lote principal del reporte'} value={text} onChangeText={setText} autoCapitalize="characters" placeholder={step === 'model' ? 'MODELO 1' : 'LOTE 1'} style={[s.text, { padding: 12, borderWidth: 1, borderColor: '#DDE5E9', borderRadius: 8 }]} onSubmitEditing={saveText} returnKeyType="next" />
          <TouchableOpacity style={s.button} onPress={saveText}><Text style={s.buttonText}>Continuar</Text></TouchableOpacity>
        </View>}

        {/* Dos etiquetas y nueve fotos por defecto; solo se agregan extras por categoría. */}
        {step === 'counts' && <View style={s.card}>
          <Text style={s.category}>Fotografías de apariencia y medidas</Text>
          <Text style={s.text}>Normalmente son 9: 3 de Overall Appearance y 6 de Measures. Puedes agregar más en cada categoría.</Text>
          {([{ title: 'OVERALL APPEARANCE', count: appearanceCount, minimum: 3, change: setAppearanceCount }, { title: 'MEASURES', count: measuresCount, minimum: 6, change: setMeasuresCount }]).map(item => <View key={item.title} style={{ gap: 8 }}>
            <Text style={s.category}>{item.title}</Text>
            <View style={s.row}>
              <TouchableOpacity accessibilityLabel={`Reducir ${item.title}`} disabled={item.count <= item.minimum} style={[s.button, item.count <= item.minimum && s.disabled]} onPress={() => item.change(count => Math.max(item.minimum, count - 1))}><Text style={s.buttonText}>−</Text></TouchableOpacity>
              <Text style={s.title}>{item.count}</Text>
              <TouchableOpacity accessibilityLabel={`Aumentar ${item.title}`} style={s.button} onPress={() => item.change(count => count + 1)}><Text style={s.buttonText}>+</Text></TouchableOpacity>
            </View>
          </View>)}
          <Text style={s.text}>Total: {appearanceCount + measuresCount} fotos, más las 2 etiquetas.</Text>
          <TouchableOpacity style={s.button} onPress={() => setStep('appearance')}><Text style={s.buttonText}>Continuar</Text></TouchableOpacity>
        </View>}

        {/* La categoría permanece visible antes de abrir la cámara o la galería. */}
        {category && <View style={s.card}>
          <Text style={s.category}>{categoryTitle(category)}</Text>
          <Text style={s.text}>{group.length}/{target} fotografías{group.length < target ? ` · Siguiente: ${group.length + 1}` : ' · Completado'}</Text>
          {group.length < target && <View style={s.row}>
            <TouchableOpacity disabled={busy} style={[s.button, { flex: 1 }, busy && s.disabled]} onPress={() => acquire('gallery')}><Ionicons name="images-outline" size={22} color="white" /><Text style={s.buttonText}>Galería</Text></TouchableOpacity>
            <TouchableOpacity disabled={busy} style={[s.button, { flex: 1 }, busy && s.disabled]} onPress={() => acquire('camera')}><Ionicons name="camera-outline" size={22} color="white" /><Text style={s.buttonText}>Cámara</Text></TouchableOpacity>
          </View>}
          {group.length >= target && (category === 'appearance' || category === 'measures') && <TouchableOpacity style={s.button} onPress={() => setStep(category === 'appearance' ? 'measures' : 'another')}><Text style={s.buttonText}>Continuar</Text></TouchableOpacity>}
          <View style={s.grid}>{group.map(photo => <View key={photo.id} style={s.photoCard}><Image source={{ uri: photo.uri }} style={s.photo} resizeMode="contain" /><Text style={s.caption}>Foto {photo.number}</Text></View>)}</View>
        </View>}

        {/* Cada lote nuevo repite modelo, etiquetas y fotos; el lote principal se conserva. */}
        {step === 'another' && <View style={s.card}>
          <Text style={s.category}>Modelo registrado correctamente</Text>
          <Text style={s.text}>Total de modelos agregados: {report?.models.length}</Text>
          <Text style={s.title}>¿Deseas agregar otro lote?</Text>
          <TouchableOpacity style={s.button} onPress={() => { setText(''); setModelId(''); setStep('lot'); }}><Text style={s.buttonText}>Sí, agregar otro lote</Text></TouchableOpacity>
          <TouchableOpacity style={[s.button, s.secondary]} onPress={finish}><Text style={s.buttonText}>No, terminar reporte</Text></TouchableOpacity>
        </View>}
        {step === 'finished' && <TouchableOpacity style={s.button} onPress={() => router.push('/report')}><Text style={s.buttonText}>Ver informe</Text></TouchableOpacity>}

        {/* El resumen permite comprobar los lotes ya registrados sin cambiar el diseño. */}
        {!!report?.models.length && <View style={s.card}><Text style={s.category}>RESUMEN DE MODELOS</Text>{report.models.map((item, index) => <Text key={item.id} style={s.text}>{index + 1}. {item.name} · {item.lot} · {item.photos.length} fotos</Text>)}</View>}
        {model && step === 'counts' && PHOTO_CATEGORIES.slice(0, 2).map(item => <View key={item.id} style={s.card}><Text style={s.category}>{item.title}</Text><View style={s.grid}>{model.photos.filter(photo => photo.category === item.id).map(photo => <View key={photo.id} style={s.photoCard}><Image source={{ uri: photo.uri }} style={s.photo} resizeMode="contain" /></View>)}</View></View>)}
      </ScrollView>
    </KeyboardAvoidingView>
  </SafeAreaView>;
}
