import { View, StyleSheet, ScrollView, Alert, Linking } from "react-native";
import { useState, useEffect } from "react";
import {
  TextInput,
  Button,
  Card,
  Title,
  Text,
  HelperText,
} from "react-native-paper";
import { useRouter, useLocalSearchParams } from "expo-router";
import { apiService } from "@/services/api";
import { Bill } from "@/services/api";
import { VoiceMicButton } from "@/components/voice/VoiceMicButton";

interface WorkDoneInput {
  workName: string;
  price: string;
}

interface BillItemInput {
  itemName: string;
  quantity: string;
  rate: string;
  unit: string; // New field for measurement units
}

export default function CreateBillScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();

  // Form state
  const [customerName, setCustomerName] = useState("");
  const [vehicleNumber, setVehicleNumber] = useState("");
  const [vehicleName, setVehicleName] = useState(""); // Added vehicle name state

  const [spareParts, setSpareParts] = useState("");
  const [totalAmount, setTotalAmount] = useState("");
  const [advanceAmount, setAdvanceAmount] = useState("0");
  const [balanceAmount, setBalanceAmount] = useState("0");
  const [items, setItems] = useState<BillItemInput[]>([
    { itemName: "", quantity: "1", rate: "", unit: "pcs" }, // Default unit added
  ]);
  const [workDoneList, setWorkDoneList] = useState<WorkDoneInput[]>([
    { workName: "", price: "" },
  ]);
  const [loading, setLoading] = useState(false);
  const [editingBill, setEditingBill] = useState<Bill | null>(null);

  // Load existing bill if editing
  useEffect(() => {
    if (params.bill && params.isEditing === "true") {
      try {
        const billData = JSON.parse(params.bill as string) as Bill;
        setEditingBill(billData);

        // Populate form with existing data
        setCustomerName(billData.customerName);
        setVehicleNumber(billData.vehicleNumber);
        setVehicleName(billData.vehicleName || ""); // Load vehicle name if it exists
        setSpareParts(billData.workDescription);
        setTotalAmount(billData.totalAmount.toString());
        setAdvanceAmount(billData.advanceAmount.toString());
        setBalanceAmount(billData.balanceAmount.toString());

        // Set items if they exist
        if (billData.items && billData.items.length > 0) {
          setItems(
            billData.items.map((item) => ({
              itemName: item.itemName,
              quantity: item.quantity.toString(),
              rate: item.rate.toString(),
              unit: item.unit || "pcs",
            }))
          );
        }

        // Set work done if they exist
        if (billData.workDone && billData.workDone.length > 0) {
          setWorkDoneList(
            billData.workDone.map((work) => ({
              workName: work.workName,
              price: work.price.toString(),
            }))
          );
        }
      } catch (error) {
        console.error("Error parsing bill data:", error);
        Alert.alert("Error", "Invalid bill data");
      }
    }
  }, [params.bill, params.isEditing]);

  // Calculate balance
  useEffect(() => {
    const total = parseFloat(totalAmount) || 0;
    const advance = parseFloat(advanceAmount) || 0;
    const balance = total - advance;
    setBalanceAmount(balance.toFixed(2));
  }, [totalAmount, advanceAmount]);

  // Calculate total amount based on items and work done
  useEffect(() => {
    const itemsTotal = items.reduce((sum, item) => {
      const quantity = parseFloat(item.quantity) || 0;
      const rate = parseFloat(item.rate) || 0;
      return sum + quantity * rate;
    }, 0);

    const workDoneTotal = workDoneList.reduce((sum, work) => {
      const price = parseFloat(work.price) || 0;
      return sum + price;
    }, 0);

    const total = itemsTotal + workDoneTotal;
    setTotalAmount(total.toString());
  }, [items, workDoneList]);

  const addItem = () => {
    setItems([
      ...items,
      { itemName: "", quantity: "1", rate: "", unit: "pcs" },
    ]);
  };

  const addWorkDone = () => {
    setWorkDoneList([...workDoneList, { workName: "", price: "" }]);
  };

  const updateWorkDone = (
    index: number,
    field: keyof WorkDoneInput,
    value: string
  ) => {
    const newWorkDoneList = [...workDoneList];
    newWorkDoneList[index][field] = value;
    setWorkDoneList(newWorkDoneList);
  };

  const removeWorkDone = (index: number) => {
    if (workDoneList.length > 1) {
      const newWorkDoneList = workDoneList.filter((_, i) => i !== index);
      setWorkDoneList(newWorkDoneList);
    }
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
    }
  };

  const validateForm = (): boolean => {
    if (!customerName.trim()) {
      Alert.alert("Error", "Please enter customer name");
      return false;
    }
    if (!vehicleNumber.trim()) {
      Alert.alert("Error", "Please enter vehicle number");
      return false;
    }
    if (!totalAmount || parseFloat(totalAmount) <= 0) {
      Alert.alert("Error", "Please enter valid total amount");
      return false;
    }
    return true;
  };

  const generateWhatsAppMessage = (billData: any) => {
    let message = `*🚗 MECHANIC BILL RECEIPT*\n\n`;
    message += `*Customer:* ${billData.customerName}\n`;
    message += `*Vehicle:* ${billData.vehicleNumber}\n`;
    if (billData.vehicleName && billData.vehicleName.trim()) {
      message += `*Model:* ${billData.vehicleName}\n`;
    }
    message += `*Date:* ${new Date().toLocaleDateString("en-IN")}\n`;

    if (billData.workDescription) {
      message += `\n*Work Description:*\n${billData.workDescription}\n`;
    }

    if (billData.items && billData.items.length > 0) {
      message += `\n*Items/Spare Parts:*\n`;
      billData.items.forEach((item: any, index: number) => {
        // Add unit information to the message if available
        const unitDisplay = item.unit ? ` ${item.unit}` : "";
        message += `${index + 1}. ${item.itemName} - Qty: ${
          item.quantity
        }${unitDisplay}, Rate: ₹${item.rate}, Amount: ₹${item.amount}\n`;
      });
    }

    if (billData.workDone && billData.workDone.length > 0) {
      message += `\n*Work Done:*\n`;
      billData.workDone.forEach((work: any, index: number) => {
        message += `${index + 1}. ${work.workName} - ₹${work.price}\n`;
      });
    }

    message += `\n*TOTAL AMOUNT:* ₹${billData.totalAmount}\n`;
    if (billData.advanceAmount > 0) {
      message += `*ADVANCE PAID:* ₹${billData.advanceAmount}\n`;
    }
    message += `*BALANCE:* ₹${billData.balanceAmount}\n\nThank you for your business!`;

    return encodeURIComponent(message);
  };

  const shareViaWhatsApp = async (billData: any) => {
    try {
      const message = generateWhatsAppMessage(billData);
      const whatsappUrl = `whatsapp://send?text=${message}`;

      const supported = await Linking.canOpenURL(whatsappUrl);
      if (supported) {
        await Linking.openURL(whatsappUrl);
      } else {
        Alert.alert("Error", "WhatsApp is not installed on this device");
      }
    } catch (error) {
      console.error("Error sharing via WhatsApp:", error);

      Alert.alert("Error", "Could not open WhatsApp");
    }
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setLoading(true);

    try {
      // Prepare bill data
      const billData = {
        customerId: editingBill?.customerId || `cust_${Date.now()}`,
        customerName: customerName.trim(),
        vehicleNumber: vehicleNumber.trim(),
        vehicleName: vehicleName.trim(), // Added vehicle name
        workDescription: spareParts.trim(),
        totalAmount: parseFloat(totalAmount),
        advanceAmount: parseFloat(advanceAmount) || 0,
        balanceAmount: parseFloat(balanceAmount),
        items: items
          .filter((item) => item.itemName.trim() && item.rate)
          .map((item) => ({
            itemName: item.itemName.trim(),
            quantity: parseFloat(item.quantity) || 1,
            rate: parseFloat(item.rate),
            unit: item.unit || "pcs",
            amount: (parseFloat(item.quantity) || 1) * parseFloat(item.rate),
          })),
        workDone: workDoneList
          .filter((work) => work.workName.trim() && work.price)
          .map((work) => ({
            workName: work.workName.trim(),
            price: parseFloat(work.price),
          })),
      };

      let result;
      if (editingBill && editingBill.id) {
        // Update existing bill
        await apiService.updateBill(editingBill.id, billData);
        // Get the updated bill with the same ID
        result = {
          ...billData,
          id: editingBill.id,
          createdAt: editingBill.createdAt,
          updatedAt: new Date().toISOString(),
        };
      } else {
        // Create new bill
        result = await apiService.createBill(billData);
      }

      if (result) {
        // Clear loading state and show success message
        setLoading(false);
        // Navigate to success screen instead of showing alert
        router.push({
          pathname: "/bill-success",
          params: { bill: JSON.stringify(result) },
        });
      } else {
        throw new Error("Failed to save bill to Firebase");
      }
    } catch (error: any) {
      console.error("Error saving bill:", error);
      let errorMessage = "Failed to save bill. Please try again.";

      if (error.message) {
        errorMessage = error.message;
      } else if (error.code) {
        errorMessage = `Error: ${error.code}`;
      }

      Alert.alert("Error", errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Card style={styles.card}>
        <Card.Content>
          <Title style={styles.title}>
            {editingBill ? "EDIT BILL" : "NEW BILL"}
          </Title>

          {/* Customer Details */}
          <View style={styles.inputWithVoiceContainer}>
            <TextInput
              label="Customer Name *"
              value={customerName}
              onChangeText={setCustomerName}
              style={[styles.input, styles.inputWithVoice]}
              mode="outlined"
              left={<TextInput.Icon icon="account" />}
            />
            <View style={styles.voiceButtonContainer}>
              <VoiceMicButton
                onTextUpdate={setCustomerName}
                field="customerName"
                size="medium"
              />
            </View>
          </View>

          <View style={styles.inputWithVoiceContainer}>
            <TextInput
              label="Vehicle Number *"
              value={vehicleNumber}
              onChangeText={setVehicleNumber}
              style={[styles.input, styles.inputWithVoice]}
              mode="outlined"
              left={<TextInput.Icon icon="car" />}
            />
            <View style={styles.voiceButtonContainer}>
              <VoiceMicButton
                onTextUpdate={setVehicleNumber}
                field="vehicleName" // Using vehicleName field type
                size="medium"
              />
            </View>
          </View>

          {/* Vehicle Name Field */}
          <View style={styles.inputWithVoiceContainer}>
            <TextInput
              label="Vehicle Name"
              value={vehicleName}
              onChangeText={setVehicleName}
              style={[styles.input, styles.inputWithVoice]}
              mode="outlined"
              left={<TextInput.Icon icon="car-info" />}
            />
            <View style={styles.voiceButtonContainer}>
              <VoiceMicButton
                onTextUpdate={setVehicleName}
                field="vehicleName" // Using vehicleName field type
                size="medium"
              />
            </View>
          </View>

          {/* Work Done Section */}
          <Title style={styles.sectionTitle}>WORK DONE</Title>

          <View style={styles.inputWithVoiceContainer}>
            <TextInput
              label="Work Description"
              value={spareParts}
              onChangeText={setSpareParts}
              style={[styles.input, styles.inputWithVoice]}
              mode="outlined"
              multiline
              numberOfLines={3}
              placeholder="Describe the work performed..."
              left={<TextInput.Icon icon="wrench" />}
            />
            <View style={styles.voiceButtonContainer}>
              <VoiceMicButton
                onTextUpdate={setSpareParts}
                field="workDescription"
                size="medium"
              />
            </View>
          </View>

          {workDoneList.map((work, index) => (
            <View key={index} style={styles.itemRow}>
              <View style={styles.inputWithVoiceContainer}>
                <TextInput
                  label={`Work ${index + 1} *`}
                  value={work.workName}
                  onChangeText={(value) =>
                    updateWorkDone(index, "workName", value)
                  }
                  style={[
                    styles.input,
                    styles.itemInput,
                    styles.inputWithVoice,
                  ]}
                  mode="outlined"
                  placeholder="Enter work description"
                />
                <View style={styles.voiceButtonContainer}>
                  <VoiceMicButton
                    onTextUpdate={(text) =>
                      updateWorkDone(index, "workName", text)
                    }
                    field="workDone"
                    size="small"
                  />
                </View>
              </View>

              <View style={styles.quantityRateContainer}>
                <TextInput
                  label="Price *"
                  value={work.price}
                  onChangeText={(value) =>
                    updateWorkDone(
                      index,
                      "price",
                      value.replace(/[^0-9.]/g, "")
                    )
                  }
                  style={[styles.input, styles.smallInput]}
                  mode="outlined"
                  keyboardType="decimal-pad"
                  placeholder="0.00"
                />
              </View>

              {workDoneList.length > 1 && (
                <Button
                  mode="outlined"
                  onPress={() => removeWorkDone(index)}
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
            onPress={addWorkDone}
            style={styles.addItemButton}
            textColor="#3498db"
            icon="plus"
          >
            ADD WORK DONE
          </Button>

          {/* Items Section */}
          <Title style={styles.sectionTitle}>ITEMS/SERVICES</Title>

          {items.map((item, index) => (
            <View key={index} style={styles.itemRow}>
              <View style={styles.inputWithVoiceContainer}>
                <TextInput
                  label={`Item ${index + 1}`}
                  value={item.itemName}
                  onChangeText={(value) => updateItem(index, "itemName", value)}
                  style={[
                    styles.input,
                    styles.itemInput,
                    styles.inputWithVoice,
                  ]}
                  mode="outlined"
                  placeholder="Enter item name..."
                />
                <View style={styles.voiceButtonContainer}>
                  <VoiceMicButton
                    onTextUpdate={(text) => updateItem(index, "itemName", text)}
                    field="item"
                    itemIndex={index}
                    size="small"
                  />
                </View>
              </View>

              <View style={styles.quantityRateContainer}>
                <View style={styles.quantityUnitContainer}>
                  <TextInput
                    label="Qty"
                    value={item.quantity}
                    onChangeText={(value) =>
                      updateItem(
                        index,
                        "quantity",
                        value.replace(/[^0-9.]/g, "")
                      )
                    }
                    style={[styles.input, styles.smallInput]}
                    mode="outlined"
                    keyboardType="decimal-pad"
                  />

                  <TextInput
                    label="Unit"
                    value={item.unit}
                    onChangeText={(value) => updateItem(index, "unit", value)}
                    style={[styles.input, styles.unitInput]}
                    mode="outlined"
                    right={<TextInput.Icon icon="scale" />}
                  />
                </View>

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
            ADD SPARE PART
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
  quantityUnitContainer: {
    flexDirection: "row",
    gap: 10,
    flex: 2,
  },
  unitInput: {
    flex: 1,
    marginBottom: 0,
  },
  workDoneButton: {
    backgroundColor: "#2ecc71",
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
  inputWithVoiceContainer: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 15,
  },
  inputWithVoice: {
    flex: 1,
    marginRight: 10,
    backgroundColor: "white",
  },
  voiceButtonContainer: {
    marginTop: 12,
  },
});
