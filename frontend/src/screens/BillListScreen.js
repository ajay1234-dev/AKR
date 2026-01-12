import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  SafeAreaView,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { billAPI } from "../utils/api";
import { speakText } from "../utils/tts/textToSpeech";

export default function BillListScreen({ navigation }) {
  const [bills, setBills] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBills();
  }, []);

  const fetchBills = async () => {
    try {
      const response = await billAPI.getAllBills();
      setBills(response.data);
      speakText("Loaded bills. Tap on any bill to see details");
    } catch (error) {
      console.error("Error fetching bills:", error);
      speakText("Failed to load bills. Please try again.");
      Alert.alert("Error", "Failed to load bills. Please try again.");
    } finally {
      setLoading(false);
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

  const renderBillItem = ({ item }) => (
    <TouchableOpacity
      style={styles.billItem}
      onPress={() => {
        speakText(`Viewing bill ${item.billNumber} for ${item.customer.name}`);
        navigation.navigate("BillDetail", { billId: item.id });
      }}
    >
      <View style={styles.billHeader}>
        <Text style={styles.billNumber}>{item.billNumber}</Text>
        <Text style={styles.billDate}>{formatDate(item.createdAt)}</Text>
      </View>
      <Text style={styles.customerName}>{item.customer.name}</Text>
      <Text style={styles.vehicleNumber}>{item.customer.vehicleNumber}</Text>
      <View style={styles.amountsContainer}>
        <Text style={styles.amountText}>
          Total: ₹{item.totalAmount.toFixed(2)}
        </Text>
        <Text style={styles.amountText}>
          Balance: ₹{item.balanceAmount.toFixed(2)}
        </Text>
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    speakText("Loading bills...");
    return (
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <SafeAreaView style={styles.container}>
          <View style={styles.scrollContentWithoutScroll}>
            <View style={styles.header}>
              <Ionicons name="list-outline" size={30} color="#2196F3" />
              <Text style={styles.headerText}>📋 PREVIOUS BILLS</Text>
            </View>
            <Text style={styles.loadingText}>Loading bills...</Text>
          </View>
        </SafeAreaView>
      </KeyboardAvoidingView>
    );
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <SafeAreaView style={styles.container}>
        <View style={styles.scrollContentWithoutScroll}>
          <View style={styles.header}>
            <Ionicons name="list-outline" size={30} color="#2196F3" />
            <Text style={styles.headerText}>📋 PREVIOUS BILLS</Text>
          </View>

          {bills.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="receipt-outline" size={80} color="#ccc" />
              <Text style={styles.emptyText}>No bills found</Text>
              <Text style={styles.emptySubtext}>
                Create your first bill to get started
              </Text>
            </View>
          ) : (
            <FlatList
              data={bills}
              renderItem={renderBillItem}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.listContent}
            />
          )}
        </View>
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
    paddingBottom: 50,
  },
  scrollContentWithoutScroll: {
    flex: 1,
    padding: 20,
    paddingBottom: 50,
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
  listContent: {
    padding: 10,
  },
  billItem: {
    backgroundColor: "white",
    padding: 20,
    marginVertical: 8,
    marginHorizontal: 15,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#eee",
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    // Web-compatible box shadow
    boxShadow: "0px 3px 5px rgba(0, 0, 0, 0.1)",
  },
  billHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  billNumber: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#2196F3",
  },
  billDate: {
    fontSize: 14,
    color: "#666",
  },
  customerName: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
    marginBottom: 5,
  },
  vehicleNumber: {
    fontSize: 16,
    color: "#666",
    marginBottom: 10,
  },
  amountsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  amountText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
  },
  loadingText: {
    textAlign: "center",
    padding: 50,
    fontSize: 18,
    color: "#666",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  emptyText: {
    fontSize: 20,
    color: "#666",
    marginBottom: 10,
    textAlign: "center",
  },
  emptySubtext: {
    fontSize: 16,
    color: "#999",
    textAlign: "center",
  },
});
