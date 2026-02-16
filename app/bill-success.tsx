import React from "react";
import { View, StyleSheet, ScrollView, Alert, Platform } from "react-native";
import { Card, Title, Text, Button } from "react-native-paper";
import { useRouter, useLocalSearchParams } from "expo-router";
import { Bill } from "@/services/api";
import { pdfService } from "@/services/pdfService";

function BillSuccessScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [bill, setBill] = React.useState<Bill | null>(null);
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    if (params.bill) {
      try {
        const billData = JSON.parse(params.bill as string);
        setBill(billData);
      } catch (error) {
        console.error("Error parsing bill data:", error);
        Alert.alert("Error", "Invalid bill data");
        router.back();
      }
    } else {
      router.back();
    }
  }, [params.bill]);

  const handleShareWhatsApp = async () => {
    if (!bill) return;

    try {
      setLoading(true);
      
      const success = await pdfService.sharePDF(bill);

      if (success) {
        Alert.alert(
          "Success!",
          Platform.OS === "web" 
            ? "PDF downloaded successfully!" 
            : "Share sheet opened! Select WhatsApp or any other app."
        );
      } else {
        Alert.alert(
          "Sharing Unavailable",
          "Sharing is not available on this device."
        );
      }
    } catch (error: any) {
      console.error("Error sharing bill:", error);
      Alert.alert("Error", error.message || "Could not share the bill");
    } finally {
      setLoading(false);
    }
  };

  const handleViewBill = () => {
    if (bill) {
      router.push({
        pathname: "/bill-detail",
        params: { bill: JSON.stringify(bill) },
      });
    }
  };

  const handleCreateNewBill = () => {
    router.push("/create-bill");
  };

  if (!bill) {
    return (
      <View style={styles.container}>
        <Text>Loading...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Success Header */}
      <Card style={styles.successCard}>
        <Card.Content>
          <View style={styles.successIconContainer}>
            <Text style={styles.successIcon}>✅</Text>
          </View>
          <Title style={styles.successTitle}>Bill Saved Successfully!</Title>
          <Text style={styles.successMessage}>
            Your bill has been created and saved to the database.
          </Text>
        </Card.Content>
      </Card>

      {/* Bill Summary */}
      <Card style={styles.billSummaryCard}>
        <Card.Content>
          <Title style={styles.billSummaryTitle}>BILL SUMMARY</Title>

          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Customer:</Text>
            <Text style={styles.summaryValue}>{bill.customerName}</Text>
          </View>

          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Vehicle:</Text>
            <Text style={styles.summaryValue}>{bill.vehicleNumber}</Text>
          </View>

          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Date:</Text>
            <Text style={styles.summaryValue}>
              {new Date(bill.createdAt).toLocaleDateString("en-IN")}
            </Text>
          </View>

          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Total Amount:</Text>
            <Text style={styles.summaryValue}>
              ₹{bill.totalAmount.toFixed(2)}
            </Text>
          </View>

          {bill.advanceAmount > 0 && (
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Advance Paid:</Text>
              <Text style={styles.summaryValue}>
                ₹{bill.advanceAmount.toFixed(2)}
              </Text>
            </View>
          )}

          <View style={styles.balanceRow}>
            <Text style={styles.balanceLabel}>Balance Due:</Text>
            <Text style={styles.balanceValue}>
              ₹{bill.balanceAmount.toFixed(2)}
            </Text>
          </View>
        </Card.Content>
      </Card>

      {/* Action Buttons */}
      <View style={styles.buttonContainer}>
        <Button
          mode="contained"
          onPress={handleShareWhatsApp}
          style={[styles.actionButton, styles.whatsappButton]}
          labelStyle={styles.whatsappButtonText}
          icon="share-variant"
          loading={loading}
          disabled={loading}
        >
          SHARE BILL
        </Button>

        <Button
          mode="outlined"
          onPress={handleViewBill}
          style={[styles.actionButton, styles.viewButton]}
          labelStyle={styles.buttonText}
          icon="eye"
          disabled={loading}
        >
          VIEW BILL
        </Button>

        <Button
          mode="outlined"
          onPress={handleCreateNewBill}
          style={[styles.actionButton, styles.newBillButton]}
          labelStyle={styles.buttonText}
          icon="plus"
          disabled={loading}
        >
          CREATE NEW BILL
        </Button>
      </View>

      {/* Footer */}
      <Card style={styles.footerCard}>
        <Card.Content>
          <Text style={styles.footerText}>
            Thank you for using AKR Workshop Billing System!
          </Text>
          <Text style={styles.footerSubtext}>
            Your bills are securely stored in the cloud.
          </Text>
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
  successCard: {
    backgroundColor: "#2ecc71",
    marginBottom: 20,
    alignItems: "center",
    paddingVertical: 20,
  },
  successIconContainer: {
    marginBottom: 15,
  },
  successIcon: {
    fontSize: 60,
    textAlign: "center",
  },
  successTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "white",
    textAlign: "center",
    marginBottom: 10,
  },
  successMessage: {
    fontSize: 16,
    color: "rgba(255,255,255,0.9)",
    textAlign: "center",
  },
  billSummaryCard: {
    backgroundColor: "white",
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
    elevation: 3,
  },
  billSummaryTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#2c3e50",
    marginBottom: 15,
    textAlign: "center",
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#ecf0f1",
  },
  summaryLabel: {
    fontSize: 16,
    color: "#7f8c8d",
    fontWeight: "600",
  },
  summaryValue: {
    fontSize: 16,
    color: "#2c3e50",
    fontWeight: "500",
  },
  balanceRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 12,
    marginTop: 10,
    borderTopWidth: 2,
    borderTopColor: "#bdc3c7",
  },
  balanceLabel: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#2c3e50",
  },
  balanceValue: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#e74c3c",
  },
  buttonContainer: {
    gap: 15,
    marginBottom: 20,
  },
  actionButton: {
    height: 60,
    justifyContent: "center",
    borderRadius: 8,
    marginVertical: 5,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: "bold",
  },
  whatsappButton: {
    backgroundColor: "#25D366",
  },
  whatsappButtonText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "white",
  },
  viewButton: {
    borderColor: "#3498db",
    borderWidth: 2,
  },
  newBillButton: {
    borderColor: "#27ae60",
    borderWidth: 2,
  },
  footerCard: {
    backgroundColor: "#ecf0f1",
    elevation: 0,
  },
  footerText: {
    fontSize: 16,
    color: "#7f8c8d",
    textAlign: "center",
    fontWeight: "600",
  },
  footerSubtext: {
    fontSize: 14,
    color: "#95a5a6",
    textAlign: "center",
    marginTop: 5,
  },
});

export default BillSuccessScreen;
