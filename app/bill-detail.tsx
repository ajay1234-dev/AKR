import {
  View,
  StyleSheet,
  ScrollView,
  Linking,
  Alert,
  Share,
  PermissionsAndroid,
  Platform,
} from "react-native";

import * as FileSystem from "expo-file-system";
import { pdfService } from "@/services/pdfService";
import React, { useState, useEffect } from "react";
import { Card, Title, Text, Button } from "react-native-paper";
import { useRouter, useLocalSearchParams } from "expo-router";

import { Bill } from "@/services/api";

function BillDetailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [bill, setBill] = useState<Bill | null>(null);

  // Move useRef declaration BEFORE any conditional returns
  const billContentRef = React.useRef(null);

  useEffect(() => {
    if (params.bill) {
      try {
        const billData = JSON.parse(params.bill as string);
        setBill(billData);

        // Show welcome message when bill detail loads
        setTimeout(() => {
          Alert.alert(
            "Bill Ready!",
            "Your bill has been loaded. Choose how you'd like to share it.",
            [
              {
                text: "Got it!",
                style: "default",
              },
            ]
          );
        }, 500);
      } catch (error: any) {
        console.error("Error parsing bill data:", error);

        let errorMessage = "Failed to load bill data. Please try again.";

        if (error.message) {
          errorMessage = error.message;
        } else if (error.code) {
          errorMessage = `Error: ${error.code}`;
        }

        Alert.alert("Error", errorMessage);
        router.back();
      }
    } else {
      router.back();
    }
  }, [params.bill]);

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
    Alert.alert("Print Feature", "Print feature will be available in the next update.");
  };

  const shareBill = async () => {
    if (!bill) return;

    try {
      // Share PDF via native share sheet (includes WhatsApp, Email, etc.)
      const success = await pdfService.sharePDF(bill);

      if (success) {
        Alert.alert(
          "Success!",
          "Bill shared successfully!"
        );
      } else {
        Alert.alert(
          "Sharing Unavailable",
          "Sharing is not available on this device."
        );
      }
    } catch (error: any) {
      console.error("Error sharing bill:", error);
      Alert.alert("Share Error", error.message || "Could not share bill");
    }
  };

  const shareBillWithContactSelection = async () => {
    if (!bill) return;

    try {
      // Same as shareBill - opens native share sheet where user can select contact
      const success = await pdfService.sharePDF(bill);

      if (success) {
        Alert.alert(
          "Success!",
          "Share sheet opened. Select a contact to share the bill."
        );
      } else {
        Alert.alert(
          "Sharing Unavailable",
          "Sharing is not available on this device."
        );
      }
    } catch (error: any) {
      console.error("Error sharing bill:", error);
      Alert.alert("Share Error", error.message || "Could not share bill");
    }
  };

  const shareBillAsPDF = async () => {
    if (!bill) return;

    try {
      // Generate and share PDF
      const success = await pdfService.sharePDF(bill);

      if (success) {
        Alert.alert(
          "Success!",
          Platform.OS === "web" 
            ? "PDF downloaded successfully!" 
            : "Share sheet opened with PDF!"
        );
      } else {
        Alert.alert(
          "Sharing Unavailable",
          "Sharing is not available on this device."
        );
      }
    } catch (error: any) {
      console.error("Error generating PDF:", error);
      Alert.alert("PDF Error", error.message || "Could not generate PDF");
    }
  };

  const handleEditBill = () => {
    if (bill) {
      router.push({
        pathname: "/create-bill",
        params: {
          bill: JSON.stringify(bill),
          isEditing: "true",
        },
      });
    }
  };

  if (!bill) {
    return null;
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View ref={billContentRef} collapsable={false}>
        {/* Header Card */}
        <Card style={styles.headerCard}>
          <Card.Content>
            <View style={styles.statusRow}>
              <Title style={styles.customerName}>{bill.customerName}</Title>
            </View>

            <View>
              <Text style={styles.vehicleInfo}>
                🚗 Vehicle: {bill.vehicleNumber}
              </Text>
              {bill.vehicleName && bill.vehicleName.trim() ? (
                <Text style={styles.vehicleInfo}>
                  🏷️ Model: {bill.vehicleName}
                </Text>
              ) : null}
            </View>

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

        {/* Work Done List */}
        {"workDone" in bill && bill.workDone && bill.workDone.length > 0 && (
          <Card style={styles.sectionCard}>
            <Card.Content>
              <Title style={styles.sectionTitle}>WORK DONE</Title>
              {bill.workDone.map((work: any, index: number) => (
                <View key={index} style={styles.itemRow}>
                  <View style={styles.itemHeader}>
                    <Text style={styles.itemName}>{work.workName}</Text>
                  </View>
                  <View style={styles.itemFooter}>
                    <Text style={styles.itemAmount}>
                      ₹{work.price.toFixed(2)}
                    </Text>
                  </View>
                </View>
              ))}
            </Card.Content>
          </Card>
        )}

        {/* Items List */}
        {bill.items && bill.items.length > 0 && (
          <Card style={styles.sectionCard}>
            <Card.Content>
              <Title style={styles.sectionTitle}>SPARE PARTS & ITEMS</Title>
              {bill.items.map((item, index) => (
                <View key={index} style={styles.itemRow}>
                  <View style={styles.itemHeader}>
                    <Text style={styles.itemName}>{item.itemName}</Text>
                    <Text style={styles.itemQuantity}>
                      Qty: {item.quantity} {item.unit || ""}
                    </Text>
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
          <Text style={styles.instructionText}>
            💡 Choose how to share this bill
          </Text>

          <Button
            mode="contained"
            onPress={handleEditBill}
            style={[styles.actionButton, styles.editButton]}
            labelStyle={styles.buttonText}
            icon="pencil"
          >
            EDIT BILL
          </Button>

          <Button
            mode="outlined"
            onPress={printBill}
            style={[styles.actionButton, styles.printButton]}
            labelStyle={styles.buttonText}
            icon="printer"
          >
            PRINT BILL
          </Button>

          <Button
            mode="contained"
            onPress={shareBillAsPDF}
            style={[styles.actionButton, styles.shareButton]}
            labelStyle={styles.buttonText}
            icon="file-pdf-box"
          >
            DOWNLOAD / SHARE PDF
          </Button>

          <Button
            mode="outlined"
            onPress={shareBill}
            style={[styles.actionButton, styles.shareWebButton]}
            labelStyle={styles.shareButtonText}
            icon="share-variant"
          >
            SHARE VIA APPS
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
      </View>
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
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
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
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
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
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
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
  instructionText: {
    fontSize: 16,
    color: "#34495e",
    textAlign: "center",
    fontWeight: "600",
    marginBottom: 15,
    paddingHorizontal: 10,
  },
  actionButton: {
    height: 60,
    justifyContent: "center",
  },
  buttonText: {
    fontSize: 18,
    fontWeight: "bold",
  },
  editButton: {
    backgroundColor: "#3498db",
  },
  printButton: {
    borderColor: "#95a5a6",
    borderWidth: 2,
  },
  shareButton: {
    backgroundColor: "#27ae60",
  },
  shareWebButton: {
    borderColor: "#3498db",
    borderWidth: 2,
  },
  shareImageButton: {
    borderColor: "#9b59b6",
    borderWidth: 2,
  },
  shareButtonText: {
    fontSize: 16,
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

export default BillDetailScreen;
