import { View, StyleSheet, ScrollView, Alert } from "react-native";
import { useState, useEffect } from "react";
import { TextInput, Button, Card, Title, Text } from "react-native-paper";
import { useRouter } from "expo-router";
import * as Speech from "expo-speech";
import { apiService } from "@/services/api";
import { offlineStorage } from "@/services/offlineStorage";
import { syncService } from "@/services/syncService";

interface BillItemInput {
  itemName: string;
  quantity: string;
  rate: string;
}

export default function CreateBillScreen() {
  const router = useRouter();

  // Form state
  const [customerName, setCustomerName] = useState("");
  const [vehicleNumber, setVehicleNumber] = useState("");
  const [workDescription, setWorkDescription] = useState("");
  const [spareParts, setSpareParts] = useState("");
  const [totalAmount, setTotalAmount] = useState("");
  const [advanceAmount, setAdvanceAmount] = useState("0");
  const [balanceAmount, setBalanceAmount] = useState("0");
  const [items, setItems] = useState<BillItemInput[]>([
    { itemName: "", quantity: "1", rate: "" },
  ]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    speak("Create new bill screen loaded. Please enter customer details.");
  }, []);

  const speak = (text: string) => {
    Speech.speak(text, {
      language: "en-US",
      pitch: 1.0,
      rate: 0.8,
    });
  };

  // Calculate balance
  useEffect(() => {
    const total = parseFloat(totalAmount) || 0;
    const advance = parseFloat(advanceAmount) || 0;
    const balance = total - advance;
    setBalanceAmount(balance.toFixed(2));
  }, [totalAmount, advanceAmount]);

  const addItem = () => {
    setItems([...items, { itemName: "", quantity: "1", rate: "" }]);
    speak("Item added");
  };

  const updateItem = (
    index: number,
    field: keyof BillItemInput,
    value: string
  ) => {
    const newItems = [...items];
    newItems[index][field] = value;
    setItems(newItems);
  };

  const removeItem = (index: number) => {
    if (items.length > 1) {
      const newItems = items.filter((_, i) => i !== index);
      setItems(newItems);
      speak("Item removed");
    }
  };

  const validateForm = (): boolean => {
    if (!customerName.trim()) {
      speak("Please enter customer name");
      Alert.alert("Error", "Please enter customer name");
      return false;
    }
    if (!vehicleNumber.trim()) {
      speak("Please enter vehicle number");
      Alert.alert("Error", "Please enter vehicle number");
      return false;
    }
    if (!totalAmount || parseFloat(totalAmount) <= 0) {
      speak("Please enter valid total amount");
      Alert.alert("Error", "Please enter valid total amount");
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setLoading(true);

    try {
      speak("Saving bill...");

      // Prepare bill data
      const billData = {
        customerId: `cust_${Date.now()}`,
        customerName: customerName.trim(),
        vehicleNumber: vehicleNumber.trim(),
        workDescription: workDescription.trim() || spareParts.trim(),
        totalAmount: parseFloat(totalAmount),
        advanceAmount: parseFloat(advanceAmount) || 0,
        balanceAmount: parseFloat(balanceAmount),
        items: items
          .filter((item) => item.itemName.trim() && item.rate)
          .map((item) => ({
            itemName: item.itemName.trim(),
            quantity: parseInt(item.quantity) || 1,
            rate: parseFloat(item.rate),
            amount: (parseInt(item.quantity) || 1) * parseFloat(item.rate),
          })),
      };

      // Try to save online first
      const isConnected = await syncService.checkConnection();

      if (isConnected) {
        const result = await apiService.createBill(billData);
        if (result) {
          speak("Bill saved successfully");
          Alert.alert("Success", "Bill saved successfully!", [
            { text: "OK", onPress: () => router.back() },
          ]);
        } else {
          throw new Error("Failed to save bill online");
        }
      } else {
        // Save offline
        await offlineStorage.saveBillLocally(billData);
        speak("Bill saved offline. Will sync when internet is available.");
        Alert.alert(
          "Saved Offline",
          "Bill saved offline. Will sync when internet is available.",
          [{ text: "OK", onPress: () => router.back() }]
        );
      }
    } catch (error) {
      speak("Error saving bill");
      console.error("Error saving bill:", error);
      Alert.alert("Error", "Failed to save bill. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Card style={styles.card}>
        <Card.Content>
          <Title style={styles.title}>NEW BILL</Title>

          {/* Customer Details */}
          <TextInput
            label="Customer Name *"
            value={customerName}
            onChangeText={setCustomerName}
            style={styles.input}
            mode="outlined"
            left={<TextInput.Icon icon="account" />}
          />

          <TextInput
            label="Vehicle Number *"
            value={vehicleNumber}
            onChangeText={setVehicleNumber}
            style={styles.input}
            mode="outlined"
            left={<TextInput.Icon icon="car" />}
          />

          <TextInput
            label="Work Description"
            value={workDescription}
            onChangeText={setWorkDescription}
            style={styles.input}
            mode="outlined"
            multiline
            numberOfLines={3}
            left={<TextInput.Icon icon="wrench" />}
          />

          {/* Items Section */}
          <Title style={styles.sectionTitle}>ITEMS/SERVICES</Title>

          {items.map((item, index) => (
            <View key={index} style={styles.itemRow}>
              <TextInput
                label={`Item ${index + 1}`}
                value={item.itemName}
                onChangeText={(value) => updateItem(index, "itemName", value)}
                style={[styles.input, styles.itemInput]}
                mode="outlined"
              />

              <View style={styles.quantityRateContainer}>
                <TextInput
                  label="Qty"
                  value={item.quantity}
                  onChangeText={(value) =>
                    updateItem(index, "quantity", value.replace(/[^0-9]/g, ""))
                  }
                  style={[styles.input, styles.smallInput]}
                  mode="outlined"
                  keyboardType="numeric"
                />

                <TextInput
                  label="Rate"
                  value={item.rate}
                  onChangeText={(value) =>
                    updateItem(index, "rate", value.replace(/[^0-9.]/g, ""))
                  }
                  style={[styles.input, styles.smallInput]}
                  mode="outlined"
                  keyboardType="decimal-pad"
                />
              </View>

              {items.length > 1 && (
                <Button
                  mode="outlined"
                  onPress={() => removeItem(index)}
                  style={styles.removeItemButton}
                  textColor="#e74c3c"
                >
                  Remove
                </Button>
              )}
            </View>
          ))}

          <Button
            mode="text"
            onPress={addItem}
            style={styles.addItemButton}
            textColor="#3498db"
            icon="plus"
          >
            ADD ITEM
          </Button>

          {/* Amount Details */}
          <Title style={styles.sectionTitle}>AMOUNT DETAILS</Title>

          <TextInput
            label="Total Amount *"
            value={totalAmount}
            onChangeText={(value) =>
              setTotalAmount(value.replace(/[^0-9.]/g, ""))
            }
            style={styles.input}
            mode="outlined"
            keyboardType="decimal-pad"
            left={<TextInput.Icon icon="currency-inr" />}
          />

          <TextInput
            label="Advance Amount"
            value={advanceAmount}
            onChangeText={(value) =>
              setAdvanceAmount(value.replace(/[^0-9.]/g, ""))
            }
            style={styles.input}
            mode="outlined"
            keyboardType="decimal-pad"
            left={<TextInput.Icon icon="cash" />}
          />

          <Card style={styles.balanceCard}>
            <Card.Content>
              <Text style={styles.balanceLabel}>BALANCE AMOUNT:</Text>
              <Text style={styles.balanceAmount}>₹ {balanceAmount}</Text>
            </Card.Content>
          </Card>

          {/* Submit Button */}
          <Button
            mode="contained"
            onPress={handleSubmit}
            loading={loading}
            disabled={loading}
            style={styles.submitButton}
            labelStyle={styles.submitButtonText}
            icon="content-save"
          >
            {loading ? "SAVING..." : "SAVE BILL"}
          </Button>
        </Card.Content>
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#ecf0f1",
  },
  content: {
    padding: 20,
  },
  card: {
    backgroundColor: "white",
    elevation: 4,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#2c3e50",
    textAlign: "center",
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#34495e",
    marginTop: 20,
    marginBottom: 15,
  },
  input: {
    marginBottom: 15,
    backgroundColor: "white",
  },
  itemRow: {
    marginBottom: 15,
    padding: 10,
    backgroundColor: "#f8f9fa",
    borderRadius: 8,
  },
  itemInput: {
    marginBottom: 10,
  },
  quantityRateContainer: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 10,
  },
  smallInput: {
    flex: 1,
    marginBottom: 0,
  },
  removeItemButton: {
    marginTop: 5,
    borderColor: "#e74c3c",
  },
  addItemButton: {
    marginVertical: 10,
  },
  balanceCard: {
    backgroundColor: "#3498db",
    marginVertical: 15,
  },
  balanceLabel: {
    fontSize: 16,
    color: "white",
    fontWeight: "600",
  },
  balanceAmount: {
    fontSize: 24,
    fontWeight: "bold",
    color: "white",
    textAlign: "center",
    marginTop: 5,
  },
  submitButton: {
    backgroundColor: "#27ae60",
    height: 60,
    justifyContent: "center",
    marginTop: 20,
    marginBottom: 10,
  },
  submitButtonText: {
    fontSize: 18,
    fontWeight: "bold",
  },
});
