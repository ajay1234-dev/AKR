import React, { useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Image,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { speakText } from "../utils/tts/textToSpeech";

export default function HomeScreen({ navigation }) {
  useEffect(() => {
    // Give welcome instructions when the screen loads
    setTimeout(() => {
      speakText(
        "Welcome to AKR WORKSHOP app. Press Create New Bill to start a new bill, or View Previous Bills to see old bills."
      );
    }, 1000);
  }, []);

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <SafeAreaView style={styles.container}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.header}>
            <Ionicons name="construct-outline" size={60} color="#2196F3" />
            <Text style={styles.title}>🔧 AKR WORKSHOP</Text>
            <Text style={styles.subtitle}>Professional Billing System</Text>
          </View>

          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={styles.button}
              onPress={() => {
                speakText(
                  "Creating a new bill. Press here to add customer details"
                );
                navigation.navigate("CreateBill");
              }}
            >
              <Ionicons name="document-outline" size={40} color="white" />
              <Text style={styles.buttonText}>CREATE NEW BILL</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.button}
              onPress={() => {
                speakText(
                  "Viewing previous bills. Press here to see past bills"
                );
                navigation.navigate("BillList");
              }}
            >
              <Ionicons name="list-outline" size={40} color="white" />
              <Text style={styles.buttonText}>VIEW PREVIOUS BILLS</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.infoContainer}>
            <View style={styles.featureCard}>
              <Ionicons name="mic-outline" size={24} color="#2196F3" />
              <Text style={styles.infoText}>🎤 Speak to enter details</Text>
            </View>
            <View style={styles.featureCard}>
              <Ionicons name="resize-outline" size={24} color="#2196F3" />
              <Text style={styles.infoText}>👆 Large buttons for easy use</Text>
            </View>
            <View style={styles.featureCard}>
              <Ionicons name="create-outline" size={24} color="#2196F3" />
              <Text style={styles.infoText}>✍️ Minimal typing required</Text>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  scrollContent: {
    flexGrow: 1,
    padding: 20,
    paddingBottom: 50,
  },
  header: {
    alignItems: "center",
    marginBottom: 50,
    marginTop: 50,
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#2196F3",
    textAlign: "center",
    marginTop: 10,
  },
  subtitle: {
    fontSize: 18,
    color: "#666",
    marginTop: 10,
    textAlign: "center",
  },
  buttonContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  button: {
    backgroundColor: "#2196F3",
    paddingVertical: 30,
    paddingHorizontal: 40,
    borderRadius: 15,
    marginVertical: 20,
    width: "90%",
    alignItems: "center",
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
  },
  buttonText: {
    color: "white",
    fontSize: 22,
    fontWeight: "bold",
    textAlign: "center",
    marginTop: 10,
  },
  infoContainer: {
    alignItems: "center",
    marginBottom: 50,
  },
  featureCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "white",
    padding: 15,
    borderRadius: 12,
    marginVertical: 8,
    width: "90%",
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  infoText: {
    fontSize: 18,
    color: "#666",
    marginLeft: 10,
  },
});
