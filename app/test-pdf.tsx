import React from "react";
import { View, Text, Button, Alert } from "react-native";
import { pdfService } from "@/services/pdfService";

const TestPDFScreen = () => {
  const testBill = {
    id: "test-bill-123",
    customerId: "cust_123",
    customerName: "Test Customer",
    vehicleNumber: "TN 01 AB 1234",
    workDescription: "Engine repair and maintenance",
    totalAmount: 5000,
    advanceAmount: 1000,
    balanceAmount: 4000,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    items: [
      {
        itemName: "Engine Oil",
        quantity: 2,
        rate: 500,
        amount: 1000,
        unit: "liters",
      },
      {
        itemName: "Air Filter",
        quantity: 1,
        rate: 300,
        amount: 300,
        unit: "pcs",
      },
    ],
    workDone: [
      {
        workName: "Engine tune-up",
        price: 2000,
      },
      {
        workName: "Oil change",
        price: 500,
      },
    ],
  };

  const handleTestPDF = async () => {
    try {
      console.log("=== PDF Generation Test Started ===");
      console.log("Test bill data:", JSON.stringify(testBill, null, 2));

      const result = await pdfService.generatePDF(testBill);

      console.log("=== PDF Generation Test Completed ===");
      console.log("Result type:", typeof result);
      console.log("Result length:", result.length);
      console.log("Result preview:", result.substring(0, 100) + "...");

      Alert.alert(
        "✅ Success",
        `PDF generated successfully!\nResult type: ${typeof result}\nResult length: ${
          result.length
        } characters`
      );
    } catch (error: any) {
      console.error("=== PDF Generation Test FAILED ===");
      console.error("Error name:", error.name);
      console.error("Error message:", error.message);
      console.error("Error stack:", error.stack);

      Alert.alert(
        "❌ Error",
        `PDF generation failed:

${error.name}: ${error.message}

Check console for details.`
      );
    }
  };

  return (
    <View
      style={{
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        padding: 20,
      }}
    >
      <Text style={{ fontSize: 24, fontWeight: "bold", marginBottom: 20 }}>
        PDF Generation Test
      </Text>
      <Text style={{ marginBottom: 30, textAlign: "center" }}>
        This screen tests PDF generation functionality to verify the jsPDF
        AutoTable fix.
      </Text>
      <Button
        title="Generate Test PDF"
        onPress={handleTestPDF}
        color="#27ae60"
      />
    </View>
  );
};

export default TestPDFScreen;
