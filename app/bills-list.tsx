import { View, StyleSheet, FlatList, Alert } from "react-native";
import { useState, useEffect } from "react";
import {
  Card,
  Title,
  Text,
  Button,
  ActivityIndicator,
  Divider,
} from "react-native-paper";
import { useRouter } from "expo-router";

import { apiService, Bill } from "@/services/api";
import { pdfService } from "@/services/pdfService";

export default function BillsListScreen() {
  const router = useRouter();
  const [bills, setBills] = useState<Bill[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadBills();
  }, []);

  const loadBills = async () => {
    setLoading(true);
    try {
      // Load bills directly from Firebase
      const onlineBills = await apiService.getBills();

      // Sort by date (newest first)
      const sortedBills = onlineBills.sort((a, b) => {
        const aDate = a.createdAt ? new Date(a.createdAt) : new Date(0);
        const bDate = b.createdAt ? new Date(b.createdAt) : new Date(0);
        return bDate.getTime() - aDate.getTime();
      });

      setBills(sortedBills);
    } catch (error: any) {
      console.error("Error loading bills from Firebase:", error);
      // Set to empty array since we don't have offline storage anymore
      setBills([]);

      let errorMessage = "Failed to load bills. Please try again.";

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

  const onRefresh = async () => {
    setRefreshing(true);
    await loadBills();
    setRefreshing(false);
  };

  const viewBillDetails = (bill: Bill | OfflineBill) => {
    // Pass bill data to detail screen
    router.push({
      pathname: "/bill-detail",
      params: {
        bill: JSON.stringify(bill),
      },
    });
  };

  const editBill = (bill: Bill) => {
    router.push({
      pathname: "/create-bill",
      params: {
        bill: JSON.stringify(bill),
        isEditing: true,
      },
    });
  };

  const shareBill = async (bill: Bill) => {
    try {
      Alert.alert(
        "Sharing Bill",
        "Generating PDF and preparing for sharing...",
        [{ text: "OK" }]
      );

      const success = await pdfService.sharePDF(bill);

      if (success) {
        Alert.alert(
          "Success!",
          "Bill shared successfully. The share sheet is now open with WhatsApp and other apps."
        );
      } else {
        Alert.alert(
          "Sharing Unavailable",
          "Sharing is not available on this device. The PDF has been generated."
        );
      }
    } catch (error: any) {
      console.error("Error sharing bill:", error);
      Alert.alert("Error", "Could not share the bill. Please try again.");
    }
  };

  const deleteBill = async (billId: string, billIndex: number) => {
    Alert.alert(
      "Confirm Delete",
      "Are you sure you want to delete this bill? This action cannot be undone.",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await apiService.deleteBill(billId);
              // Remove the bill from the local state
              const updatedBills = [...bills];
              updatedBills.splice(billIndex, 1);
              setBills(updatedBills);
            } catch (error: any) {
              console.error("Error deleting bill:", error);

              let errorMessage = "Failed to delete bill. Please try again.";

              if (error.message) {
                errorMessage = error.message;
              } else if (error.code) {
                errorMessage = `Error: ${error.code}`;
              }

              Alert.alert("Error", errorMessage);
            }
          },
        },
      ]
    );
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const renderBillItem = ({ item, index }: { item: Bill; index: number }) => {
    return (
      <Card style={styles.billCard}>
        <Card.Content>
          <View style={styles.billHeader}>
            <Title style={styles.billTitle}>{item.customerName}</Title>
            <Button
              mode="text"
              onPress={() => deleteBill(item.id, index)}
              textColor="#e74c3c"
              compact
            >
              Delete
            </Button>
          </View>

          <Text style={styles.vehicleText}>🚗 {item.vehicleNumber}</Text>

          {item.workDescription ? (
            <Text style={styles.descriptionText} numberOfLines={2}>
              {item.workDescription}
            </Text>
          ) : null}

          {/* Show work done summary if available */}
          {"workDone" in item && item.workDone && item.workDone.length > 0 ? (
            <Text style={styles.workDoneSummary}>
              🛠️ {item.workDone.length} work item
              {item.workDone.length !== 1 ? "s" : ""} completed
            </Text>
          ) : null}

          <Divider style={styles.divider} />

          <View style={styles.amountRow}>
            <View style={styles.amountItem}>
              <Text style={styles.amountLabel}>Total</Text>
              <Text style={styles.amountValue}>
                ₹{item.totalAmount.toFixed(2)}
              </Text>
            </View>

            <View style={styles.amountItem}>
              <Text style={styles.amountLabel}>Advance</Text>
              <Text style={styles.amountValue}>
                ₹{item.advanceAmount.toFixed(2)}
              </Text>
            </View>

            <View style={styles.amountItem}>
              <Text style={styles.amountLabel}>Balance</Text>
              <Text style={[styles.amountValue, styles.balanceAmount]}>
                ₹{item.balanceAmount.toFixed(2)}
              </Text>
            </View>
          </View>

          <View style={styles.footer}>
            <Text style={styles.dateText}>{formatDate(item.createdAt)}</Text>
            <View style={styles.buttonRow}>
              <Button
                mode="text"
                onPress={() => editBill(item)}
                textColor="#f39c12"
                compact
              >
                Edit
              </Button>
              <Button
                mode="text"
                onPress={() => shareBill(item)}
                textColor="#25D366"
                compact
              >
                Share
              </Button>
              <Button
                mode="text"
                onPress={() => viewBillDetails(item)}
                textColor="#3498db"
                compact
              >
                View
              </Button>
            </View>
          </View>
        </Card.Content>
      </Card>
    );
  };

  const renderEmptyState = () => (
    <Card style={styles.emptyCard}>
      <Card.Content style={styles.emptyCardContent}>
        <Text style={styles.emptyTitle}>No Bills Found</Text>
        <Text style={styles.emptyMessage}>
          You haven't created any bills yet. Tap "Create Bill" to get started.
        </Text>
        <Button
          mode="contained"
          onPress={() => router.push("/create-bill")}
          style={styles.createButton}
          icon="plus"
        >
          CREATE NEW BILL
        </Button>
      </Card.Content>
    </Card>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3498db" />
        <Text style={styles.loadingText}>Loading bills...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={bills}
        renderItem={renderBillItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        refreshing={refreshing}
        onRefresh={onRefresh}
        ListEmptyComponent={renderEmptyState}
        ListHeaderComponent={
          bills.length > 0 ? (
            <Text style={styles.headerText}>
              Showing {bills.length} bill{bills.length !== 1 ? "s" : ""}
            </Text>
          ) : null
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#ecf0f1",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#ecf0f1",
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: "#7f8c8d",
  },
  listContent: {
    padding: 20,
  },
  headerText: {
    fontSize: 16,
    color: "#7f8c8d",
    marginBottom: 15,
    textAlign: "center",
  },
  billCard: {
    marginBottom: 15,
    backgroundColor: "white",
    elevation: 2,
  },
  pendingCard: {
    borderLeftWidth: 4,
    borderLeftColor: "#f39c12",
  },
  billHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  billTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#2c3e50",
    flex: 1,
  },
  pendingBadge: {
    backgroundColor: "#f39c12",
    color: "white",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    fontSize: 12,
    fontWeight: "bold",
  },
  vehicleText: {
    fontSize: 16,
    color: "#34495e",
    marginBottom: 8,
  },
  descriptionText: {
    fontSize: 14,
    color: "#7f8c8d",
    marginBottom: 8,
    lineHeight: 20,
  },
  workDoneSummary: {
    fontSize: 14,
    color: "#3498db",
    fontWeight: "600",
    marginBottom: 12,
  },
  divider: {
    marginVertical: 12,
  },
  amountRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 15,
  },
  amountItem: {
    alignItems: "center",
    flex: 1,
  },
  amountLabel: {
    fontSize: 12,
    color: "#7f8c8d",
    marginBottom: 4,
  },
  amountValue: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#2c3e50",
  },
  balanceAmount: {
    color: "#e74c3c",
  },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  buttonRow: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  dateText: {
    fontSize: 12,
    color: "#95a5a6",
  },
  emptyCard: {
    backgroundColor: "white",
    elevation: 2,
  },
  emptyCardContent: {
    alignItems: "center",
    paddingVertical: 30,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#2c3e50",
    marginBottom: 10,
  },
  emptyMessage: {
    fontSize: 16,
    color: "#7f8c8d",
    textAlign: "center",
    marginBottom: 20,
    lineHeight: 24,
  },
  createButton: {
    backgroundColor: "#27ae60",
  },
});
