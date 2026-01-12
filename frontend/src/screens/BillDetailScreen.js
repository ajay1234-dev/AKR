import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  Alert,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { billAPI } from "../utils/api";
import { speakText } from "../utils/tts/textToSpeech";
import { shareBillOnWhatsApp } from "../utils/pdf/invoiceGenerator";

export default function BillDetailScreen({ route, navigation }) {
  const { billId } = route.params;
  const [bill, setBill] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBillDetails();
  }, []);

  const fetchBillDetails = async () => {
    try {
      const response = await billAPI.getBillById(billId);
      setBill(response.data);
      speakText(
        `Showing bill ${response.data.billNumber} for ${response.data.customer.name}`
      );
    } catch (error) {
      console.error("Error fetching bill details:", error);
      speakText("Failed to load bill details. Please try again.");
      Alert.alert("Error", "Failed to load bill details. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleShareOnWhatsApp = () => {
    if (bill) {
      shareBillOnWhatsApp(bill);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading) {
    speakText("Loading bill details...");
    return (
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <SafeAreaView style={styles.container}>
          <ScrollView contentContainerStyle={styles.scrollContent}>
            <View style={styles.header}>
              <Ionicons
                name="document-text-outline"
                size={30}
                color="#2196F3"
              />
              <Text style={styles.headerText}>BILL DETAILS</Text>
            </View>
            <Text style={styles.loadingText}>Loading bill details...</Text>
          </ScrollView>
        </SafeAreaView>
      </KeyboardAvoidingView>
    );
  }

  if (!bill) {
    speakText("Bill not found");
    return (
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <SafeAreaView style={styles.container}>
          <ScrollView contentContainerStyle={styles.scrollContent}>
            <View style={styles.header}>
              <Ionicons
                name="document-text-outline"
                size={30}
                color="#2196F3"
              />
              <Text style={styles.headerText}>BILL DETAILS</Text>
            </View>
            <Text style={styles.errorText}>Bill not found</Text>
          </ScrollView>
        </SafeAreaView>
      </KeyboardAvoidingView>
    );
  }

  const works = bill.billItems.filter((item) => item.itemType === "work");
  const spareParts = bill.billItems.filter(
    (item) => item.itemType === "sparePart"
  );

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
          <View style={styles.header}>
            <Ionicons name="document-text-outline" size={30} color="#2196F3" />
            <Text style={styles.headerText}>{bill.billNumber}</Text>
          </View>

          <View style={styles.infoCard}>
            <Text style={styles.dateText}>{formatDate(bill.createdAt)}</Text>

            <View style={styles.customerInfo}>
              <Text style={styles.label}>Customer Name:</Text>
              <Text style={styles.value}>{bill.customer.name}</Text>
            </View>

            <View style={styles.customerInfo}>
              <Text style={styles.label}>Vehicle Number:</Text>
              <Text style={styles.value}>{bill.customer.vehicleNumber}</Text>
            </View>
          </View>

          {works.length > 0 && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Ionicons name="construct-outline" size={20} color="#2196F3" />
                <Text style={styles.sectionTitle}>Works Done</Text>
              </View>
              {works.map((work, index) => (
                <View key={`work-${index}`} style={styles.itemRow}>
                  <Text style={styles.itemDescription}>{work.description}</Text>
                  <Text style={styles.itemAmount}>
                    ₹{work.amount.toFixed(2)}
                  </Text>
                </View>
              ))}
            </View>
          )}

          {spareParts.length > 0 && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Ionicons name="build-outline" size={20} color="#2196F3" />
                <Text style={styles.sectionTitle}>Spare Parts</Text>
              </View>
              {spareParts.map((part, index) => (
                <View key={`part-${index}`} style={styles.itemRow}>
                  <Text style={styles.itemDescription}>{part.description}</Text>
                  <Text style={styles.itemAmount}>
                    ₹{part.amount.toFixed(2)}
                  </Text>
                </View>
              ))}
            </View>
          )}

          <View style={styles.totalsSection}>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Total Amount:</Text>
              <Text style={styles.totalValue}>
                ₹{bill.totalAmount.toFixed(2)}
              </Text>
            </View>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Advance Amount:</Text>
              <Text style={styles.totalValue}>
                ₹{bill.advanceAmount.toFixed(2)}
              </Text>
            </View>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Balance Amount:</Text>
              <Text style={styles.totalValue}>
                ₹{bill.balanceAmount.toFixed(2)}
              </Text>
            </View>
          </View>

          <TouchableOpacity
            style={styles.whatsAppButton}
            onPress={handleShareOnWhatsApp}
          >
            <Ionicons name="logo-whatsapp" size={24} color="white" />
            <Text style={styles.whatsAppButtonText}>SEND BILL ON WHATSAPP</Text>
          </TouchableOpacity>
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
  headerText: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#2196F3",
    marginLeft: 10,
  },
  infoCard: {
    backgroundColor: "white",
    padding: 20,
    borderRadius: 12,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#eee",
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    // Web-compatible box shadow
    boxShadow: "0px 2px 4px rgba(0, 0, 0, 0.1)",
  },
  dateText: {
    fontSize: 16,
    color: "#666",
    textAlign: "right",
    marginBottom: 15,
  },
  customerInfo: {
    marginBottom: 10,
  },
  label: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 5,
  },
  value: {
    fontSize: 16,
    color: "#666",
    paddingLeft: 10,
  },
  section: {
    backgroundColor: "white",
    padding: 20,
    borderRadius: 12,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#eee",
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    // Web-compatible box shadow
    boxShadow: "0px 2px 4px rgba(0, 0, 0, 0.1)",
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#2196F3",
    marginLeft: 10,
  },
  itemRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  itemDescription: {
    fontSize: 16,
    color: "#333",
    flex: 1,
  },
  itemAmount: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#2196F3",
    minWidth: 80,
    textAlign: "right",
  },
  totalsSection: {
    backgroundColor: "white",
    padding: 20,
    borderRadius: 12,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#eee",
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    // Web-compatible box shadow
    boxShadow: "0px 2px 4px rgba(0, 0, 0, 0.1)",
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 8,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
  },
  totalValue: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#2196F3",
  },
  whatsAppButton: {
    backgroundColor: "#25D366", // WhatsApp green
    padding: 20,
    borderRadius: 12,
    alignItems: "center",
    marginVertical: 10,
    flexDirection: "row",
    justifyContent: "center",
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    // Web-compatible box shadow
    boxShadow: "0px 2px 4px rgba(0, 0, 0, 0.2)",
  },
  whatsAppButtonText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 18,
    marginLeft: 10,
  },
  loadingText: {
    textAlign: "center",
    padding: 50,
    fontSize: 16,
    color: "#666",
  },
  errorText: {
    textAlign: "center",
    padding: 50,
    fontSize: 16,
    color: "#f44336",
  },
});
