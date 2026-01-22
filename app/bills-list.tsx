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
import * as Speech from "expo-speech";
import { apiService, Bill } from "@/services/api";
import { offlineStorage, OfflineBill } from "@/services/offlineStorage";
import { syncService } from "@/services/syncService";

export default function BillsListScreen() {
  const router = useRouter();
  const [bills, setBills] = useState<(Bill | OfflineBill)[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadBills();
    speak("Bills list screen loaded");
  }, []);

  const speak = (text: string) => {
    Speech.speak(text, {
      language: "en-US",
      pitch: 1.0,
      rate: 0.8,
    });
  };

  const loadBills = async () => {
    setLoading(true);
    try {
      // Load online bills
      const onlineBills = await apiService.getBills();

      // Load offline bills
      const offlineBills = await offlineStorage.getOfflineBills();

      // Combine and sort by date (newest first)
      const allBills = [...onlineBills, ...offlineBills].sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );

      setBills(allBills);
    } catch (error) {
      console.error("Error loading bills:", error);
      // Load offline bills as fallback
      const offlineBills = await offlineStorage.getOfflineBills();
      setBills(offlineBills);
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

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const renderBillItem = ({ item }: { item: Bill | OfflineBill }) => {
    const isOffline = "syncStatus" in item;
    const isPending = isOffline && item.syncStatus === "pending";

    return (
      <Card
        style={[styles.billCard, isPending && styles.pendingCard]}
        onPress={() => viewBillDetails(item)}
      >
        <Card.Content>
          <View style={styles.billHeader}>
            <Title style={styles.billTitle}>{item.customerName}</Title>
            {isPending && <Text style={styles.pendingBadge}>OFFLINE</Text>}
          </View>

          <Text style={styles.vehicleText}>🚗 {item.vehicleNumber}</Text>

          <Text style={styles.descriptionText} numberOfLines={2}>
            {item.workDescription}
          </Text>

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
            <Button
              mode="text"
              onPress={() => viewBillDetails(item)}
              textColor="#3498db"
              compact
            >
              View Details
            </Button>
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
        keyExtractor={(item) => ("id" in item ? item.id : item.localId)}
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
    marginBottom: 12,
    lineHeight: 20,
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
