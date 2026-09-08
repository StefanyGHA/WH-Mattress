import Header from "@/components/Header";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Image} from "react-native";
import { useLocalSearchParams } from "expo-router";
import { SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";

export default function ReportScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();

const photos: string[] = params.photos
  ? JSON.parse(params.photos as string)
  : [];

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <Header showBackButton />

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Boton editar */}
        <TouchableOpacity style={styles.editButton}>
          <Ionicons name="create-outline" size={24} color="#FFFFFF" />

          <View>
            <Text style={styles.editTitle}>Editar informe</Text>
            <Text style={styles.editSubtitle}>
              Organiza las fotografías antes del PDF
            </Text>
          </View>

          <Ionicons
            name="chevron-forward"
            size={24}
            color="#FFFFFF"
            style={styles.chevron}
          />
        </TouchableOpacity>

        <Text style={styles.previewTitle}>Vista previa del informe</Text>

        {/* Simulando el pdf */}
        <View style={styles.pdfPreview}>

          <View style={styles.pdfHeader}>
            <View style={styles.logoBox}>
              <Text style={styles.logoText}>WH</Text>
            </View>

            <View style={styles.pdfHeaderText}>
              <Text style={styles.pdfTitle}>
                PRODUCTION REPORT WH MATTRESS PANAMA
              </Text>
              <Text style={styles.pdfSubtitle}>
                RESUMEN GENERAL
              </Text>
            </View>
          </View>

          <View style={styles.reportInformation}>
            <Text style={styles.date}>2026-07-15</Text>
            <Text style={styles.smallText}>FECHA DEL REPORTE</Text>

            <Text style={styles.lot}>LOTE 1</Text>
            <Text style={styles.smallText}>LOTE PRINCIPAL</Text>
          </View>

          {/**FOTOGRAFIAS */}
        <View style={styles.photoPage}>
   
        {/* IZQUIERDA - PRIMERAS 3 FOTOS */}
        <View style={styles.leftColumn}>
        {photos.slice(0, 3).map((photo, index) => (
        <View key={index} style={styles.leftPhotoContainer}>
          <Image
          source={{ uri: photo }}
          style={styles.leftPhoto}
          resizeMode="contain"
        />
         </View>
      ))}
  </View>

  {/* DERECHA - ÚLTIMAS 6 FOTOS */}
  <View style={styles.rightGrid}>

    {photos.slice(3, 9).map((photo, index) => (
      <View key={index} style={styles.rightPhotoContainer}>
        <Image
          source={{ uri: photo }}
          style={styles.rightPhoto}
          resizeMode="contain"
        />
      </View>
    ))}
  </View>
</View>
      <View style={styles.pageFooter}>
        <Text style={styles.pageFooterText}>Página 1</Text>
      </View>
    </View>

        {/* Boton generar pdf */}
        <TouchableOpacity style={styles.generateButton}>
          <Ionicons name="document-text-outline" size={22} color="#FFFFFF" />
          <Text style={styles.generateButtonText}>Generar PDF</Text>
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

  header: {
    height: 125,
    backgroundColor: "#28C9C2",
    justifyContent: "center",
    alignItems: "center",
  },

  backButton: {
    position: "absolute",
    left: 22,
    bottom: 45,
  },

  logoContainer: {
  flexDirection: "row",
  alignItems: "center",
  justifyContent: "center",
  gap: 10,
},

logoImage: {
  width: 50,
  height: 50,
  backgroundColor: "red"
},

  logo: {
    color: "#FFFFFF",
    fontSize: 28,
    fontWeight: "600",
  },


  content: {
    padding: 22,
    paddingBottom: 40,
  },

  editButton: {
    backgroundColor: "#20B3AD",
    minHeight: 85,
    borderRadius: 16,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 18,
    gap: 15,

    elevation: 4,

    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.15,
    shadowRadius: 5,
  },

  editTitle: {
    color: "#FFFFFF",
    fontSize: 17,
    fontWeight: "700",
  },

  editSubtitle: {
    color: "#E8FFFF",
    fontSize: 12,
    marginTop: 4,
  },

  chevron: {
    marginLeft: "auto",
  },

  previewTitle: {
    fontSize: 19,
    fontWeight: "700",
    color: "#202124",
    marginTop: 30,
    marginBottom: 15,
  },

  pdfPreview: {
    backgroundColor: "#FFFFFF",
    minHeight: 420,
    borderRadius: 8,
    padding: 16,
    borderWidth: 1,
    borderColor: "#DADCE0",

    elevation: 3,

    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },

  pdfHeader: {
    flexDirection: "row",
    alignItems: "center",
  },

  logoBox: {
    width: 32,
    height: 32,
    borderWidth: 1,
    borderColor: "#286078",
    justifyContent: "center",
    alignItems: "center",
  },

  logoText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#286078",
  },

  pdfHeaderText: {
    flex: 1,
    alignItems: "center",
    marginRight: 32,
  },

  pdfTitle: {
    fontSize: 10,
    fontWeight: "700",
    color: "#202124",
    textAlign: "center",
  },

  pdfSubtitle: {
    fontSize: 7,
    color: "#6B7280",
    marginTop: 2,
  },

  reportInformation: {
    alignItems: "center",
    marginTop: 28,
  },

  date: {
    fontSize: 13,
    fontWeight: "700",
  },

  lot: {
    fontSize: 13,
    fontWeight: "700",
    marginTop: 12,
  },

  smallText: {
    fontSize: 6,
    color: "#777777",
    marginTop: 2,
  },

  table: {
    marginTop: 30,
    borderWidth: 1,
    borderColor: "#D0D7DE",
  },

  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#315F73",
    paddingVertical: 7,
  },

  tableHeaderText: {
    color: "#FFFFFF",
    fontSize: 7,
    width: 30,
    textAlign: "center",
    fontWeight: "700",
  },

  modelColumn: {
    flex: 1,
  },

  tableRow: {
    flexDirection: "row",
    paddingVertical: 7,
    borderTopWidth: 1,
    borderColor: "#D0D7DE",
  },

  tableCell: {
    fontSize: 7,
    width: 30,
    textAlign: "center",
  },

  pageFooter: {
    flex: 1,
    justifyContent: "flex-end",
    alignItems: "flex-end",
  },

  pageFooterText: {
    fontSize: 7,
    color: "#888888",
  },

  generateButton: {
    height: 58,
    borderRadius: 30,
    backgroundColor: "#20B3AD",
    marginTop: 25,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 9,

    elevation: 4,

    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.15,
    shadowRadius: 5,
  },

  generateButtonText: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 16,
  },

  photoPage: {
  width: "100%",
  height: 430,
  flexDirection: "row",
  marginTop: 20,
  gap: 6,
},

leftColumn: {
  width: "38%",
  gap: 6,
},

leftPhotoContainer: {
  flex: 1,
  backgroundColor: "#F3F4F6",
  borderRadius: 4,
  overflow: "hidden",
  borderWidth: 1,
  borderColor: "#E5E7EB",
},

leftPhoto: {
  width: "100%",
  height: "100%",
},

rightGrid: {
  flex: 1,
  flexDirection: "row",
  flexWrap: "wrap",
  gap: 6,
},

rightPhotoContainer: {
  width: "48%",
  height: "32%",
  backgroundColor: "#F3F4F6",
  borderRadius: 4,
  overflow: "hidden",
  borderWidth: 1,
  borderColor: "#E5E7EB",
},

rightPhoto: {
  width: "100%",
  height: "100%",
},
});