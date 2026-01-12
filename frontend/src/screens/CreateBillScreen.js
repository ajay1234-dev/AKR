import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  SafeAreaView,
  ActivityIndicator,
  Modal,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  Pressable,
} from "react-native";

// Import Voice conditionally to handle web compatibility
let Voice;
let isWeb = false;

// Check if we're running in a web environment
if (typeof window !== "undefined") {
  isWeb = true;
  // Mock Voice object for web
  Voice = {
    onSpeechStart: null,
    onSpeechRecognized: null,
    onSpeechEnd: null,
    onSpeechError: null,
    onSpeechResults: null,
    start: (language) => {
      // Web implementation would use browser's speech recognition API
      console.log("Web speech recognition not implemented");
      return Promise.resolve();
    },
    stop: () => Promise.resolve(),
    destroy: () => Promise.resolve(),
    removeAllListeners: () => {},
  };
} else {
  // Native mobile environment
  try {
    Voice = require("@react-native-voice/voice").default;
  } catch (error) {
    console.warn("@react-native-voice/voice not available:", error);
    // Mock Voice for fallback
    Voice = {
      onSpeechStart: null,
      onSpeechRecognized: null,
      onSpeechEnd: null,
      onSpeechError: null,
      onSpeechResults: null,
      start: (language) => Promise.resolve(),
      stop: () => Promise.resolve(),
      destroy: () => Promise.resolve(),
      removeAllListeners: () => {},
    };
  }
}

import { Ionicons } from "@expo/vector-icons";
import { billAPI } from "../utils/api";
import { speakText } from "../utils/tts/textToSpeech";
import {
  LANGUAGES,
  getVoiceLanguageCode,
  getSelectedLanguage,
  setSelectedLanguage,
} from "../utils/languageSelector";
import {
  saveOfflineBill,
  syncOfflineBills,
} from "../utils/offline/offlineStorage";

const { width } = Dimensions.get("window");

export default function CreateBillScreen({ navigation }) {
  const [customerName, setCustomerName] = useState("");
  const [vehicleNumber, setVehicleNumber] = useState("");
  const [works, setWorks] = useState([{ description: "", amount: "" }]);
  const [spareParts, setSpareParts] = useState([
    { description: "", amount: "" },
  ]);
  const [advanceAmount, setAdvanceAmount] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [currentField, setCurrentField] = useState("");
  const [selectedLanguage, setSelectedLanguageState] = useState("en");
  const [showLanguageModal, setShowLanguageModal] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    initializeVoiceAndLanguage();

    // Cleanup voice listeners on unmount
    return () => {
      if (!isWeb && Voice) {
        Voice.destroy().then(Voice.removeAllListeners);
      }
    };
  }, []);

  const initializeVoiceAndLanguage = async () => {
    try {
      if (!isWeb) {
        // Initialize voice recognition
        Voice.onSpeechStart = onSpeechStart;
        Voice.onSpeechRecognized = onSpeechRecognized;
        Voice.onSpeechEnd = onSpeechEnd;
        Voice.onSpeechError = onSpeechError;
        Voice.onSpeechResults = onSpeechResults;
      }

      // Load selected language
      const savedLanguage = await getSelectedLanguage();
      setSelectedLanguageState(savedLanguage);

      // Give initial instructions
      setTimeout(() => {
        speakText(
          "Welcome to bill creation. Press the voice button to speak customer details."
        );
      }, 1000);
    } catch (error) {
      console.error("Error initializing voice and language:", error);
    }
  };

  const onSpeechStart = (e) => {
    console.log("Speech started");
    speakText("Recording started, please speak now");
  };

  const onSpeechRecognized = (e) => {
    console.log("Speech recognized");
  };

  const onSpeechEnd = (e) => {
    setIsListening(false);
    speakText("Recording stopped");
  };

  const onSpeechError = (e) => {
    console.error("Speech error:", e);
    setIsListening(false);
    speakText("Failed to recognize speech. Please try again.");
    Alert.alert("Error", "Failed to recognize speech. Please try again.");
  };

  const onSpeechResults = (e) => {
    const text = e.value[0];
    if (currentField === "customerName") {
      setCustomerName(text);
    } else if (currentField === "vehicleNumber") {
      setVehicleNumber(text);
    } else if (currentField.startsWith("work_")) {
      const index = parseInt(currentField.split("_")[1]);
      const newWorks = [...works];
      newWorks[index].description = text;
      setWorks(newWorks);
    } else if (currentField.startsWith("sparePart_")) {
      const index = parseInt(currentField.split("_")[1]);
      const newSpareParts = [...spareParts];
      newSpareParts[index].description = text;
      setSpareParts(newSpareParts);
    }
  };

  const startVoiceRecognition = (field) => {
    if (isListening) {
      stopVoiceRecognition();
      return;
    }

    if (isWeb) {
      // On web, we can't use native voice recognition, so show an alert
      Alert.alert(
        "Feature not available",
        "Voice input is not available in web browser. Please type manually."
      );
      return;
    }

    setCurrentField(field);
    setIsListening(true);

    // Get the appropriate language code for voice recognition
    const voiceLanguageCode = getVoiceLanguageCode(selectedLanguage);

    Voice.start(voiceLanguageCode).catch((error) => {
      console.error("Voice recognition error:", error);
      setIsListening(false);
      speakText("Failed to start voice recognition. Please check permissions.");
      Alert.alert(
        "Error",
        "Failed to start voice recognition. Please check permissions."
      );
    });
  };

  const stopVoiceRecognition = async () => {
    if (isWeb) {
      // Web doesn't support voice recognition
      setIsListening(false);
      return;
    }

    try {
      await Voice.stop();
      setIsListening(false);
    } catch (error) {
      console.error("Error stopping voice recognition:", error);
      setIsListening(false);
    }
  };

  const addWork = () => {
    setWorks([...works, { description: "", amount: "" }]);
    speakText(
      "Added a new work item. Press voice button to speak work description"
    );
  };

  const addSparePart = () => {
    setSpareParts([...spareParts, { description: "", amount: "" }]);
    speakText(
      "Added a new spare part item. Press voice button to speak spare part description"
    );
  };

  const removeWork = (index) => {
    if (works.length > 1) {
      const newWorks = [...works];
      newWorks.splice(index, 1);
      setWorks(newWorks);
    }
  };

  const removeSparePart = (index) => {
    if (spareParts.length > 1) {
      const newSpareParts = [...spareParts];
      newSpareParts.splice(index, 1);
      setSpareParts(newSpareParts);
    }
  };

  const updateWork = (index, field, value) => {
    const newWorks = [...works];
    newWorks[index][field] = value;
    setWorks(newWorks);
  };

  const updateSparePart = (index, field, value) => {
    const newSpareParts = [...spareParts];
    newSpareParts[index][field] = value;
    setSpareParts(newSpareParts);
  };

  const calculateTotals = () => {
    const workTotal = works.reduce(
      (sum, work) => sum + (parseFloat(work.amount) || 0),
      0
    );
    const sparePartTotal = spareParts.reduce(
      (sum, part) => sum + (parseFloat(part.amount) || 0),
      0
    );
    const total = workTotal + sparePartTotal;
    const advance = parseFloat(advanceAmount) || 0;
    const balance = total - advance;

    return { total, balance };
  };

  const handleCreateBill = async () => {
    if (!customerName.trim() || !vehicleNumber.trim()) {
      speakText("Please fill in customer name and vehicle number");
      Alert.alert("Error", "Please provide customer name and vehicle number");
      return;
    }

    // Validate that at least one work or spare part is provided
    const hasValidWork = works.some(
      (work) => work.description.trim() && work.amount.trim()
    );
    const hasValidSparePart = spareParts.some(
      (part) => part.description.trim() && part.amount.trim()
    );

    if (!hasValidWork && !hasValidSparePart) {
      speakText("Please add at least one work or spare part with amount");
      Alert.alert(
        "Error",
        "Please add at least one work or spare part with amount"
      );
      return;
    }

    // Validate amounts
    const invalidWorkAmount = works.some(
      (work) => work.description.trim() && !work.amount.trim()
    );
    const invalidSparePartAmount = spareParts.some(
      (part) => part.description.trim() && !part.amount.trim()
    );

    if (invalidWorkAmount || invalidSparePartAmount) {
      speakText("Please provide amounts for all works and spare parts");
      Alert.alert(
        "Error",
        "Please provide amounts for all works and spare parts"
      );
      return;
    }

    setIsSaving(true);

    try {
      const billData = {
        customerName,
        vehicleNumber,
        works: works.filter(
          (work) => work.description.trim() && work.amount.trim()
        ),
        spareParts: spareParts.filter(
          (part) => part.description.trim() && part.amount.trim()
        ),
        advanceAmount: parseFloat(advanceAmount) || 0,
      };

      // Try to create bill online
      try {
        const response = await billAPI.createBill(billData);
        speakText("Bill created successfully");
        Alert.alert("Success", "Bill created successfully!", [
          { text: "OK", onPress: () => navigation.goBack() },
        ]);
      } catch (onlineError) {
        // If online creation fails, save offline
        console.log("Online creation failed, saving offline:", onlineError);
        await saveOfflineBill(billData);
        speakText("Bill saved offline. Will sync when internet is available");
        Alert.alert(
          "Saved Offline",
          "Bill saved offline. Will sync when internet is available.",
          [{ text: "OK", onPress: () => navigation.goBack() }]
        );
      }
    } catch (error) {
      console.error("Error creating bill:", error);
      speakText("Failed to create bill. Please try again.");
      Alert.alert("Error", "Failed to create bill. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const changeLanguage = async (languageCode) => {
    setSelectedLanguageState(languageCode);
    await setSelectedLanguage(languageCode);
    setShowLanguageModal(false);
    speakText(`Language changed to ${LANGUAGES[languageCode].name}`);
  };

  const { total, balance } = calculateTotals();

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <SafeAreaView style={styles.container}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={true}
          bounces={true}
          scrollEventThrottle={16}
        >
          {/* Header */}
          <View style={styles.header}>
            <Ionicons name="document-text-outline" size={30} color="#2196F3" />
            <Text style={styles.headerTitle}>CREATE BILL</Text>
          </View>

          {/* Language Selector */}
          <View style={styles.languageHeader}>
            <TouchableOpacity
              style={styles.languageButton}
              onPress={() => setShowLanguageModal(true)}
            >
              <Ionicons name="language-outline" size={20} color="white" />
              <Text style={styles.languageButtonText}>
                {LANGUAGES[selectedLanguage].name}
              </Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.sectionTitle}>Customer Details</Text>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Customer Name</Text>
            <View style={styles.voiceInputContainer}>
              <TextInput
                style={styles.textInput}
                value={customerName}
                onChangeText={setCustomerName}
                placeholder="Enter customer name"
                placeholderTextColor="#999"
              />
              <TouchableOpacity
                style={[
                  styles.voiceButton,
                  isListening &&
                    currentField === "customerName" &&
                    styles.listeningButton,
                ]}
                onPress={() => startVoiceRecognition("customerName")}
              >
                <Ionicons
                  name={
                    isListening && currentField === "customerName"
                      ? "stop-circle"
                      : "mic"
                  }
                  size={20}
                  color="white"
                />
                <Text style={styles.voiceButtonText}>
                  {isListening && currentField === "customerName"
                    ? "STOP"
                    : "VOICE"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Vehicle Number</Text>
            <View style={styles.voiceInputContainer}>
              <TextInput
                style={styles.textInput}
                value={vehicleNumber}
                onChangeText={setVehicleNumber}
                placeholder="Enter vehicle number"
                placeholderTextColor="#999"
              />
              <TouchableOpacity
                style={[
                  styles.voiceButton,
                  isListening &&
                    currentField === "vehicleNumber" &&
                    styles.listeningButton,
                ]}
                onPress={() => startVoiceRecognition("vehicleNumber")}
              >
                <Ionicons
                  name={
                    isListening && currentField === "vehicleNumber"
                      ? "stop-circle"
                      : "mic"
                  }
                  size={20}
                  color="white"
                />
                <Text style={styles.voiceButtonText}>
                  {isListening && currentField === "vehicleNumber"
                    ? "STOP"
                    : "VOICE"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          <Text style={styles.sectionTitle}>Works</Text>
          {works.map((work, index) => (
            <View key={index} style={styles.itemContainer}>
              <View style={styles.voiceInputContainer}>
                <TextInput
                  style={[styles.textInput, styles.descriptionInput]}
                  value={work.description}
                  onChangeText={(text) =>
                    updateWork(index, "description", text)
                  }
                  placeholder="Describe the work done"
                  placeholderTextColor="#999"
                />
                <TouchableOpacity
                  style={[
                    styles.voiceButton,
                    isListening &&
                      currentField === `work_${index}` &&
                      styles.listeningButton,
                  ]}
                  onPress={() => startVoiceRecognition(`work_${index}`)}
                >
                  <Ionicons
                    name={
                      isListening && currentField === `work_${index}`
                        ? "stop-circle"
                        : "mic"
                    }
                    size={20}
                    color="white"
                  />
                  <Text style={styles.voiceButtonText}>
                    {isListening && currentField === `work_${index}`
                      ? "STOP"
                      : "VOICE"}
                  </Text>
                </TouchableOpacity>
              </View>
              <View style={styles.amountContainer}>
                <Text style={styles.label}>Amount (₹)</Text>
                <TextInput
                  style={styles.amountInput}
                  value={work.amount}
                  onChangeText={(text) =>
                    updateWork(index, "amount", text.replace(/[^0-9.]/g, ""))
                  }
                  placeholder="0.00"
                  placeholderTextColor="#999"
                  keyboardType="numeric"
                />
              </View>
              {works.length > 1 && (
                <TouchableOpacity
                  style={styles.removeButton}
                  onPress={() => removeWork(index)}
                >
                  <Ionicons name="close" size={20} color="white" />
                  <Text style={styles.removeButtonText}>REMOVE</Text>
                </TouchableOpacity>
              )}
            </View>
          ))}
          <TouchableOpacity style={styles.addButton} onPress={addWork}>
            <Ionicons name="add-circle-outline" size={20} color="white" />
            <Text style={styles.addButtonText}>ADD WORK</Text>
          </TouchableOpacity>

          <Text style={styles.sectionTitle}>Spare Parts</Text>
          {spareParts.map((part, index) => (
            <View key={index} style={styles.itemContainer}>
              <View style={styles.voiceInputContainer}>
                <TextInput
                  style={[styles.textInput, styles.descriptionInput]}
                  value={part.description}
                  onChangeText={(text) =>
                    updateSparePart(index, "description", text)
                  }
                  placeholder="Describe the spare part"
                  placeholderTextColor="#999"
                />
                <TouchableOpacity
                  style={[
                    styles.voiceButton,
                    isListening &&
                      currentField === `sparePart_${index}` &&
                      styles.listeningButton,
                  ]}
                  onPress={() => startVoiceRecognition(`sparePart_${index}`)}
                >
                  <Ionicons
                    name={
                      isListening && currentField === `sparePart_${index}`
                        ? "stop-circle"
                        : "mic"
                    }
                    size={20}
                    color="white"
                  />
                  <Text style={styles.voiceButtonText}>
                    {isListening && currentField === `sparePart_${index}`
                      ? "STOP"
                      : "VOICE"}
                  </Text>
                </TouchableOpacity>
              </View>
              <View style={styles.amountContainer}>
                <Text style={styles.label}>Amount (₹)</Text>
                <TextInput
                  style={styles.amountInput}
                  value={part.amount}
                  onChangeText={(text) =>
                    updateSparePart(
                      index,
                      "amount",
                      text.replace(/[^0-9.]/g, "")
                    )
                  }
                  placeholder="0.00"
                  placeholderTextColor="#999"
                  keyboardType="numeric"
                />
              </View>
              {spareParts.length > 1 && (
                <TouchableOpacity
                  style={styles.removeButton}
                  onPress={() => removeSparePart(index)}
                >
                  <Ionicons name="close" size={20} color="white" />
                  <Text style={styles.removeButtonText}>REMOVE</Text>
                </TouchableOpacity>
              )}
            </View>
          ))}
          <TouchableOpacity style={styles.addButton} onPress={addSparePart}>
            <Ionicons name="add-circle-outline" size={20} color="white" />
            <Text style={styles.addButtonText}>ADD SPARE PART</Text>
          </TouchableOpacity>

          <View style={styles.totalsContainer}>
            <Text style={styles.totalText}>
              Total Amount: ₹{total.toFixed(2)}
            </Text>
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Advance Amount (₹)</Text>
              <TextInput
                style={styles.textInput}
                value={advanceAmount}
                onChangeText={(text) =>
                  setAdvanceAmount(text.replace(/[^0-9.]/g, ""))
                }
                placeholder="0.00"
                placeholderTextColor="#999"
                keyboardType="numeric"
              />
            </View>
            <Text style={styles.totalText}>
              Balance Amount: ₹{balance.toFixed(2)}
            </Text>
          </View>

          <TouchableOpacity
            style={styles.createButton}
            onPress={handleCreateBill}
            disabled={isSaving}
          >
            {isSaving ? (
              <ActivityIndicator size="small" color="#ffffff" />
            ) : (
              <>
                <Ionicons
                  name="checkmark-done-outline"
                  size={20}
                  color="white"
                />
                <Text style={styles.createButtonText}>CREATE BILL</Text>
              </>
            )}
          </TouchableOpacity>
        </ScrollView>

        {/* Language Selection Modal */}
        <Modal
          animationType="slide"
          transparent={true}
          visible={showLanguageModal}
          onRequestClose={() => setShowLanguageModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Select Language</Text>
              {Object.entries(LANGUAGES).map(([code, lang]) => (
                <TouchableOpacity
                  key={code}
                  style={[
                    styles.languageOption,
                    selectedLanguage === code && styles.selectedLanguageOption,
                  ]}
                  onPress={() => changeLanguage(code)}
                >
                  <Text style={styles.languageOptionText}>{lang.name}</Text>
                </TouchableOpacity>
              ))}
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setShowLanguageModal(false)}
              >
                <Text style={styles.closeButtonText}>CLOSE</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
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
    padding: 20,
    paddingBottom: 100, // Increased padding to ensure bottom content is accessible
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
    paddingTop: 10,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#2196F3",
    marginLeft: 10,
  },
  languageHeader: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginBottom: 10,
  },
  languageButton: {
    backgroundColor: "#2196F3",
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    flexDirection: "row",
    alignItems: "center",
  },
  languageButtonText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 14,
    marginLeft: 5,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#2196F3",
    marginVertical: 15,
    alignSelf: "flex-start",
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 5,
  },
  voiceInputContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  textInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 10,
    padding: 15,
    fontSize: 16,
    backgroundColor: "white",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    // Web-compatible box shadow
    boxShadow: "0px 1px 2px rgba(0, 0, 0, 0.1)",
  },
  descriptionInput: {
    marginRight: 10,
  },
  voiceButton: {
    backgroundColor: "#4CAF50",
    paddingHorizontal: 15,
    paddingVertical: 15,
    borderRadius: 10,
    marginLeft: 10,
    flexDirection: "row",
    alignItems: "center",
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    // Web-compatible box shadow
    boxShadow: "0px 2px 3px rgba(0, 0, 0, 0.2)",
  },
  listeningButton: {
    backgroundColor: "#FF5722",
  },
  voiceButtonText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 12,
    marginLeft: 5,
  },
  itemContainer: {
    marginBottom: 20,
    padding: 15,
    backgroundColor: "white",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#eee",
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    // Web-compatible box shadow
    boxShadow: "0px 2px 4px rgba(0, 0, 0, 0.1)",
  },
  amountContainer: {
    marginTop: 10,
  },
  amountInput: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 10,
    padding: 15,
    fontSize: 16,
    backgroundColor: "white",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    // Web-compatible box shadow
    boxShadow: "0px 1px 2px rgba(0, 0, 0, 0.1)",
  },
  removeButton: {
    backgroundColor: "#f44336",
    padding: 10,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 10,
    flexDirection: "row",
    justifyContent: "center",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    // Web-compatible box shadow
    boxShadow: "0px 1px 2px rgba(0, 0, 0, 0.1)",
  },
  removeButtonText: {
    color: "white",
    fontWeight: "bold",
    marginLeft: 5,
  },
  addButton: {
    backgroundColor: "#FF9800",
    padding: 15,
    borderRadius: 12,
    alignItems: "center",
    marginBottom: 20,
    flexDirection: "row",
    justifyContent: "center",
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    // Web-compatible box shadow
    boxShadow: "0px 2px 3px rgba(0, 0, 0, 0.2)",
  },
  addButtonText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 16,
    marginLeft: 5,
  },
  totalsContainer: {
    backgroundColor: "white",
    padding: 20,
    borderRadius: 12,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#eee",
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    // Web-compatible box shadow
    boxShadow: "0px 2px 4px rgba(0, 0, 0, 0.1)",
  },
  totalText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 10,
    textAlign: "center",
  },
  createButton: {
    backgroundColor: "#2196F3",
    padding: 20,
    borderRadius: 12,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    // Web-compatible box shadow
    boxShadow: "0px 3px 4px rgba(0, 0, 0, 0.2)",
  },
  createButtonText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 18,
    marginLeft: 10,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: "white",
    width: width * 0.8,
    borderRadius: 15,
    padding: 20,
    alignItems: "center",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 20,
  },
  languageOption: {
    width: "100%",
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  selectedLanguageOption: {
    backgroundColor: "#E3F2FD",
  },
  languageOptionText: {
    fontSize: 16,
    textAlign: "center",
  },
  closeButton: {
    marginTop: 20,
    backgroundColor: "#2196F3",
    padding: 10,
    borderRadius: 8,
    width: "100%",
  },
  closeButtonText: {
    color: "white",
    fontWeight: "bold",
    textAlign: "center",
  },
});
