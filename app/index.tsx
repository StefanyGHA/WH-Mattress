import * as ImagePicker from "expo-image-picker";
import { useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import { Alert, Modal, SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useRouter } from "expo-router";
import Header from "@/components/Header";

export default function HomeScreen() {
 const router = useRouter();
 const [photos, setPhotos] = useState<string[]>([]); //guarda el orden de las fotos
 

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
  const permission =
    await ImagePicker.requestCameraPermissionsAsync();

  if (!permission.granted) {
    alert("Necesitas permitir acceso a la cámara.");
    return;
  }

  const result = await ImagePicker.launchCameraAsync({
    mediaTypes: ["images"],
    quality: 1,
  });

  if (!result.canceled) {
    const photoUri = result.assets[0].uri;

    const updatePhotos = [...photos, photoUri];

    setPhotos(updatePhotos);

    if (updatePhotos.length === 9) {
        console.log("Ya se completaron las 9 fotografías!");
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
    onPress={pickImage}
  >
    <Ionicons
      name="images-outline"
      size={22}
      color="#FFFFFF"
    />

    <Text style={styles.buttonText}>
      Cargar foto
    </Text>
    <Text style={styles.photoCounter}>
  Fotografías: {photos.length}/9
</Text>
  </TouchableOpacity>

  <TouchableOpacity
    style={styles.button}
    onPress={takePhoto}
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
  Fotografías: {photos.length}/9
</Text>

{photos.length === 9 && (
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
});