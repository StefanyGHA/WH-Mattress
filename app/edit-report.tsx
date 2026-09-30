import Header from "@/components/Header";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
  Alert,
  Image,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export default function EditReportScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();

  const photos: string[] = params.photos
    ? JSON.parse(params.photos as string)
    : [];

  const deletePhoto = (index: number) => {
    Alert.alert(
      "Eliminar fotografía",
      `¿Desea eliminar la fotografía ${index + 1}?`,
      [
        {
          text: "Cancelar",
          style: "cancel",
        },
        {
          text: "Eliminar",
          style: "destructive",
          onPress: () => {
            const updatedPhotos = photos.filter(
              (_, photoIndex) => photoIndex !== index
            );

            router.replace({
              pathname: "/edit-report",
              params: {
                photos: JSON.stringify(updatedPhotos),
              },
            });
          },
        },
      ]
    );
  };

  const saveChanges = () => {
    router.replace({
      pathname: "/report",
      params: {
        photos: JSON.stringify(photos),
      },
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <Header showBackButton />

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>Editar informe</Text>

        <Text style={styles.description}>
          Revisa las fotografías seleccionadas antes de generar el PDF.
        </Text>

        <Text style={styles.counter}>
          {photos.length} fotografías
        </Text>

        <View style={styles.photoGrid}>
          {photos.map((photo, index) => (
            <View key={`${photo}-${index}`} style={styles.photoContainer}>
              <Image
                source={{ uri: photo }}
                style={styles.photo}
                resizeMode="cover"
              />

              <View style={styles.photoNumber}>
                <Text style={styles.photoNumberText}>
                  {index + 1}
                </Text>
              </View>

              <TouchableOpacity
                style={styles.deleteButton}
                onPress={() => deletePhoto(index)}
              >
                <Ionicons
                  name="trash-outline"
                  size={20}
                  color="#FFFFFF"
                />
              </TouchableOpacity>
            </View>
          ))}
        </View>

        <TouchableOpacity
          style={styles.saveButton}
          onPress={saveChanges}
        >
          <Ionicons
            name="checkmark-circle-outline"
            size={23}
            color="#FFFFFF"
          />

          <Text style={styles.saveButtonText}>
            Guardar cambios
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F7F8FA",
  },

  content: {
    padding: 20,
    paddingBottom: 40,
  },

  title: {
    fontSize: 24,
    fontWeight: "700",
    color: "#202124",
  },

  description: {
    fontSize: 14,
    color: "#6B7280",
    marginTop: 6,
    lineHeight: 20,
  },

  counter: {
    fontSize: 14,
    fontWeight: "600",
    color: "#20B3AD",
    marginTop: 15,
    marginBottom: 15,
  },

  photoGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: 12,
  },

  photoContainer: {
    width: "48%",
    height: 190,
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    overflow: "hidden",
    position: "relative",
    elevation: 3,
  },

  photo: {
    width: "100%",
    height: "100%",
  },

  photoNumber: {
    position: "absolute",
    left: 8,
    top: 8,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "#20B3AD",
    justifyContent: "center",
    alignItems: "center",
  },

  photoNumberText: {
    color: "#FFFFFF",
    fontWeight: "700",
  },

  deleteButton: {
    position: "absolute",
    right: 8,
    top: 8,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(220, 38, 38, 0.9)",
    justifyContent: "center",
    alignItems: "center",
  },

  saveButton: {
    height: 58,
    backgroundColor: "#20B3AD",
    borderRadius: 30,
    marginTop: 30,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 9,
    elevation: 4,
  },

  saveButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
});