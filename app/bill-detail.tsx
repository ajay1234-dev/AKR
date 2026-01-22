import { View, StyleSheet, ScrollView } from "react-native";
import { useState, useEffect } from "react";
import { Card, Title, Text, Button } from "react-native-paper";
import { useRouter, useLocalSearchParams } from "expo-router";
import * as Speech from "expo-speech";
import { Bill } from "@/services/api";
import { OfflineBill } from "@/services/offlineStorage";

export default function BillDetailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [bill, setBill] = useState<Bill | OfflineBill | null>(null);

  useEffect(() => {
    if (params.bill) {
      try {
        const billData = JSON.parse(params.bill as string);
        setBill(billData);
        speak(`Bill details for ${billData.customerName}`);
      } catch (error) {
        console.error("Error parsing bill data:", error);
        router.back();
      }
    } else {
      router.back();
    }
  }, [params.bill]);

  const speak = (text: string) => {
    Speech.speak(text, {
      language: "en-US",
      pitch: 1.0,
      rate: 0.8,
    });
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return (
      date.toLocaleDateString("en-IN", {
        weekday: "long",
        day: "2-digit",
        month: "long",
        year: "numeric",
      }) +
      " at " +
      date.toLocaleTimeString("en-IN", {
        hour: "2-digit",
        minute: "2-digit",
      })
    );
  };

  const printBill = () => {
    speak("Print feature coming soon");
    alert("Print feature will be available in the next update.");
  };

  const shareBill = () => {
    speak("Share feature coming soon");
    alert("Share feature will be available in the next update.");
  };

  if (!bill) {
    return null;
  }

  const isOffline = "syncStatus" in bill;
  const isPending = isOffline && bill.syncStatus === "pending";

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Header Card */}
      <Card style={styles.headerCard}>
        <Card.Content>
          <View style={styles.statusRow}>
            <Title style={styles.customerName}>{bill.customerName}</Title>
            {isPending && <Text style={styles.offlineBadge}>OFFLINE</Text>}
          </View>

          <Text style={styles.vehicleInfo}>
            🚗 Vehicle: {bill.vehicleNumber}
          </Text>

          <Text style={styles.dateInfo}>
            📅 Created: {formatDate(bill.createdAt)}
          </Text>
        </Card.Content>
      </Card>

      {/* Work Description */}
      <Card style={styles.sectionCard}>
        <Card.Content>
          <Title style={styles.sectionTitle}>WORK DESCRIPTION</Title>
          <Text style={styles.descriptionText}>
            {bill.workDescription || "No description provided"}
          </Text>
        </Card.Content>
      </Card>

      {/* Items List */}
      {bill.items && bill.items.length > 0 && (
        <Card style={styles.sectionCard}>
          <Card.Content>
            <Title style={styles.sectionTitle}>ITEMS & SERVICES</Title>
            {bill.items.map((item, index) => (
              <View key={index} style={styles.itemRow}>
                <View style={styles.itemHeader}>
                  <Text style={styles.itemName}>{item.itemName}</Text>
                  <Text style={styles.itemQuantity}>Qty: {item.quantity}</Text>
                </View>
                <View style={styles.itemFooter}>
                  <Text style={styles.itemRate}>
                    ₹{item.rate.toFixed(2)} each
                  </Text>
                  <Text style={styles.itemAmount}>
                    ₹{item.amount.toFixed(2)}
                  </Text>
                </View>
              </View>
            ))}
          </Card.Content>
        </Card>
      )}

      {/* Amount Summary */}
      <Card style={styles.summaryCard}>
        <Card.Content>
          <Title style={styles.summaryTitle}>PAYMENT SUMMARY</Title>

          <View style={styles.amountRow}>
            <Text style={styles.amountLabel}>Total Amount:</Text>
            <Text style={styles.totalAmount}>
              ₹{bill.totalAmount.toFixed(2)}
            </Text>
          </View>

          <View style={styles.amountRow}>
            <Text style={styles.amountLabel}>Advance Paid:</Text>
            <Text style={styles.advanceAmount}>
              ₹{bill.advanceAmount.toFixed(2)}
            </Text>
          </View>

          <View style={styles.balanceRow}>
            <Text style={styles.balanceLabel}>Balance Due:</Text>
            <Text style={styles.balanceAmount}>
              ₹{bill.balanceAmount.toFixed(2)}
            </Text>
          </View>
        </Card.Content>
      </Card>

      {/* Action Buttons */}
      <View style={styles.buttonContainer}>
        <Button
          mode="contained"
          onPress={printBill}
          style={[styles.actionButton, styles.printButton]}
          labelStyle={styles.buttonText}
          icon="printer"
        >
          PRINT BILL
        </Button>

        <Button
          mode="outlined"
          onPress={shareBill}
          style={[styles.actionButton, styles.shareButton]}
          labelStyle={styles.shareButtonText}
          icon="share"
        >
          SHARE BILL
        </Button>
      </View>

      {/* Footer Info */}
      <Card style={styles.footerCard}>
        <Card.Content>
          <Text style={styles.footerText}>
            Thank you for choosing AKR Workshop!
          </Text>
          <Text style={styles.footerSubtext}>
            For any queries, please contact us.
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
  headerCard: {
    backgroundColor: "#3498db",
    marginBottom: 20,
    elevation: 4,
  },
  statusRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  customerName: {
    fontSize: 24,
    fontWeight: "bold",
    color: "white",
    flex: 1,
  },
  offlineBadge: {
    backgroundColor: "#f39c12",
    color: "white",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
    fontSize: 12,
    fontWeight: "bold",
  },
  vehicleInfo: {
    fontSize: 18,
    color: "white",
    marginBottom: 8,
  },
  dateInfo: {
    fontSize: 14,
    color: "rgba(255,255,255,0.9)",
  },
  sectionCard: {
    backgroundColor: "white",
    marginBottom: 20,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#2c3e50",
    marginBottom: 15,
  },
  descriptionText: {
    fontSize: 16,
    color: "#34495e",
    lineHeight: 24,
  },
  itemRow: {
    backgroundColor: "#f8f9fa",
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
  },
  itemHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  itemName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#2c3e50",
    flex: 1,
  },
  itemQuantity: {
    fontSize: 14,
    color: "#7f8c8d",
    minWidth: 60,
    textAlign: "right",
  },
  itemFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  itemRate: {
    fontSize: 14,
    color: "#7f8c8d",
  },
  itemAmount: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#27ae60",
  },
  summaryCard: {
    backgroundColor: "#2c3e50",
    marginBottom: 20,
    elevation: 4,
  },
  summaryTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "white",
    marginBottom: 20,
    textAlign: "center",
  },
  amountRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 15,
  },
  balanceRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.2)",
  },
  amountLabel: {
    fontSize: 16,
    color: "rgba(255,255,255,0.9)",
  },
  balanceLabel: {
    fontSize: 18,
    fontWeight: "bold",
    color: "white",
  },
  totalAmount: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#27ae60",
  },
  advanceAmount: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#3498db",
  },
  balanceAmount: {
    fontSize: 20,
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
  },
  buttonText: {
    fontSize: 18,
    fontWeight: "bold",
  },
  printButton: {
    backgroundColor: "#27ae60",
  },
  shareButton: {
    borderColor: "#3498db",
    borderWidth: 2,
  },
  shareButtonText: {
    fontSize: 18,
    color: "#3498db",
    fontWeight: "bold",
  },
  footerCard: {
    backgroundColor: "#ecf0f1",
    elevation: 0,
  },
  footerText: {
    fontSize: 16,
    color: "#7f8c8d",
    textAlign: "center",
    fontStyle: "italic",
  },
  footerSubtext: {
    fontSize: 14,
    color: "#95a5a6",
    textAlign: "center",
    marginTop: 5,
  },
});
