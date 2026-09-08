import Header from "@/components/Header";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import { useState } from "react";
import { Alert, Modal, SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from "react-native";

export default function HomeScreen() {
 const router = useRouter();
 const [photos, setPhotos] = useState<string[]>([]); //guarda el orden de las fotos
 const [photoLimit, setPhotoLimit] = useState(9);
 const [showPhotoModal, setShowPhotoModal] = useState(false);
 const [photoMode, setPhotoMode] = useState<"camera" | "gallery" | null>(null);
 
 const openPhotoSelector = (mode: "camera" | "gallery") => {
  setPhotoMode(mode);
  setShowPhotoModal(true);
};

 const pickImage = async () => {
 const permission =
    await ImagePicker.requestMediaLibraryPermissionsAsync();

  if (!permission.granted) {
    alert("Necesitas permitir acceso a la galería.");
    return;
  }

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ["images"],
    allowsMultipleSelection: true,
    quality: 1,
  });

  if (!result.canceled) {
    console.log("IMÁGENES SELECCIONADAS:");
    console.log(result.assets);

    router.push("/report");
  }
};

const takePhoto = async () => {
  //Evitar tomar mas fotos de las selecionadas
  if (photos.length >= photoLimit){
    Alert.alert(
      "Fotografías completas",
       `Ya tomó las ${photoLimit} fotografías seleccionadas.`
    );
    return;
  }

  //Pedir permisos de camara 
  const permission =
    await ImagePicker.requestCameraPermissionsAsync();

  if (!permission.granted) {
    Alert.alert(
      "Permiso requerido",
      "Necesitas permitir acceso a la cámara."
    );
    return;
  }

  //Abrir la camara
  const result = await ImagePicker.launchCameraAsync({
    mediaTypes: ["images"],
    quality: 1,
  });

  //Guardar fotos
  if (!result.canceled) {
    const photoUri = result.assets[0].uri;

    const updatePhotos = [...photos, photoUri];

    setPhotos(updatePhotos);

    if (updatePhotos.length === photoLimit) {
        console.log(
          `Ya se completaron las ${photoLimit} fotografías!`
        );
    }
  }
};

  return (
    <SafeAreaView style={styles.container}>

      {/* Header */}
     <Header />

      {/* Texto principal */}
      <View style={styles.content}>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Crea tu informe en PDF</Text>

          <Text style={styles.description}>
            Convierte tus fotografías en PDF al cargarlas o tomarlas de manera
            instantánea. Tú eliges la cantidad de imágenes y el orden de las
            páginas.
          </Text>

          <View style={styles.iconsContainer}>
            <View style={styles.iconBox}>
              <Ionicons name="images-outline" size={48} color="#FFFFFF" />
            </View>

            <View style={styles.iconBox}>
              <Ionicons name="camera-outline" size={48} color="#FFFFFF" />
            </View>
          </View>
        </View>

    {/* Botones */}
<View style={styles.buttonsContainer}>
  <TouchableOpacity
    style={styles.button}
    onPress={() => openPhotoSelector("gallery")} //para cargar la foto
  >
    <Ionicons
      name="images-outline"
      size={22}
      color="#FFFFFF"
    />

    <Text style={styles.buttonText}>
      Cargar foto
    </Text>
    
  </TouchableOpacity>

  <TouchableOpacity
    style={styles.button}
    onPress={() => openPhotoSelector("camera")} //para tomar la foto
  >
    <Ionicons
      name="camera-outline"
      size={22}
      color="#FFFFFF"
    />

    <Text style={styles.buttonText}>
      Tomar foto
    </Text>
  </TouchableOpacity>
</View>
      </View>
      <Text style={styles.photoCounter}>
  Fotografías: {photos.length}/{photoLimit}
</Text>

{photos.length === photoLimit && (
  <TouchableOpacity
    style={styles.continueButton}
    onPress={() =>
      router.push({
        pathname: "/report",
        params: {
          photos: JSON.stringify(photos),
        },
      })
    }
  >
    <Text style={styles.continueButtonText}>Continuar</Text>
    <Ionicons name="arrow-forward" size={22} color="#FFFFFF" />
  </TouchableOpacity>
)}

<Modal
  visible={showPhotoModal}
  transparent
  animationType="fade"
  onRequestClose={() => setShowPhotoModal(false)}
>
  <View style={styles.modalOverlay}>
    <View style={styles.modalContainer}>

      <Text style={styles.modalTitle}>
        ¿Cuántas fotografías desea usar?
      </Text>

      <Text style={styles.modalDescription}>
        Seleccione la cantidad de fotografías que tendrá el informe.
      </Text>

      <View style={styles.counterContainer}>
        <TouchableOpacity
          style={styles.counterButton}
          onPress={() =>
            setPhotoLimit((current) =>
              current > 1 ? current - 1 : current
            )
          }
        >
          <Ionicons name="remove" size={26} color="#FFFFFF" />
        </TouchableOpacity>

        <Text style={styles.counterNumber}>
          {photoLimit}
        </Text>

        <TouchableOpacity
          style={styles.counterButton}
          onPress={() =>
            setPhotoLimit((current) => current + 1)
          }
        >
          <Ionicons name="add" size={26} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        style={styles.modalContinueButton}
        onPress={() => {
          setShowPhotoModal(false);

          if (photoMode === "camera") {
            takePhoto();
          }

          if (photoMode === "gallery") {
            pickImage();
          }
        }}
      >
        <Text style={styles.modalContinueText}>
          Continuar
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        onPress={() => setShowPhotoModal(false)}
      >
        <Text style={styles.cancelText}>
          Cancelar
        </Text>
      </TouchableOpacity>

    </View>
  </View>
</Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F7F8FA",
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 35,
    justifyContent: "space-between",
    paddingBottom: 45,
  },

  card: {
    backgroundColor: "#20B3AD",
    borderRadius: 18,
    paddingHorizontal: 24,
    paddingVertical: 30,
    minHeight: 330,
    justifyContent: "space-between",

    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 3,
    },

    shadowOpacity: 0.15,
    shadowRadius: 5,
    elevation: 5,
  },

  cardTitle: {
    color: "#FFFFFF",
    fontSize: 22,
    fontWeight: "700",
    marginBottom: 15,
  },

  description: {
    color: "#FFFFFF",
    fontSize: 15,
    lineHeight: 23,
  },

  iconsContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginTop: 30,
  },

  iconBox: {
    width: 85,
    height: 85,
    borderRadius: 42.5,
    backgroundColor: "rgba(255,255,255,0.15)",
    justifyContent: "center",
    alignItems: "center",
  },

  buttonsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 15,
  },

  button: {
    flex: 1,
    height: 58,
    borderRadius: 30,
    backgroundColor: "#20B3AD",
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,

    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 3,
    },

    shadowOpacity: 0.18,
    shadowRadius: 4,
    elevation: 4,
  },

  buttonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "600",
  },

  photoCounter: {
  textAlign: "center",
  marginTop: 12,
  fontSize: 15,
  fontWeight: "600",
  color: "#555555",
},

continueButton: {
  marginTop: 15,
  height: 55,
  backgroundColor: "#20B3AD",
  borderRadius: 28,
  flexDirection: "row",
  alignItems: "center",
  justifyContent: "center",
  gap: 8,
},

continueButtonText: {
  color: "#FFFFFF",
  fontSize: 16,
  fontWeight: "700",
},
modalOverlay: {
  flex: 1,
  backgroundColor: "rgba(0,0,0,0.45)",
  justifyContent: "center",
  alignItems: "center",
  padding: 24,
},

modalContainer: {
  width: "100%",
  backgroundColor: "#FFFFFF",
  borderRadius: 20,
  padding: 24,
  alignItems: "center",
},

modalTitle: {
  fontSize: 20,
  fontWeight: "700",
  color: "#202124",
  textAlign: "center",
},

modalDescription: {
  fontSize: 14,
  color: "#6B7280",
  textAlign: "center",
  marginTop: 8,
},

counterContainer: {
  flexDirection: "row",
  alignItems: "center",
  gap: 25,
  marginVertical: 30,
},

counterButton: {
  width: 48,
  height: 48,
  borderRadius: 24,
  backgroundColor: "#20B3AD",
  justifyContent: "center",
  alignItems: "center",
},

counterNumber: {
  fontSize: 34,
  fontWeight: "700",
  minWidth: 50,
  textAlign: "center",
},

modalContinueButton: {
  width: "100%",
  height: 52,
  borderRadius: 26,
  backgroundColor: "#20B3AD",
  justifyContent: "center",
  alignItems: "center",
},

modalContinueText: {
  color: "#FFFFFF",
  fontSize: 16,
  fontWeight: "700",
},

cancelText: {
  color: "#6B7280",
  marginTop: 18,
  fontSize: 14,
},
});