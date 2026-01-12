import AsyncStorage from "@react-native-async-storage/async-storage";

const OFFLINE_BILLS_KEY = "offline_bills";
const SYNC_STATUS_KEY = "sync_status";

// Save a bill to offline storage
export const saveOfflineBill = async (billData) => {
  try {
    // Add a temporary ID for offline use
    const offlineBill = {
      ...billData,
      id: `offline_${Date.now()}`, // Temporary ID for offline use
      isOffline: true,
      createdAt: new Date().toISOString(),
    };

    // Get existing offline bills
    const existingBills = await getOfflineBills();

    // Add new bill
    existingBills.push(offlineBill);

    // Save back to storage
    await AsyncStorage.setItem(
      OFFLINE_BILLS_KEY,
      JSON.stringify(existingBills)
    );

    return offlineBill.id;
  } catch (error) {
    console.error("Error saving offline bill:", error);
    throw error;
  }
};

// Get all offline bills
export const getOfflineBills = async () => {
  try {
    const billsJson = await AsyncStorage.getItem(OFFLINE_BILLS_KEY);
    return billsJson ? JSON.parse(billsJson) : [];
  } catch (error) {
    console.error("Error getting offline bills:", error);
    return [];
  }
};

// Remove an offline bill after successful sync
export const removeOfflineBill = async (billId) => {
  try {
    const existingBills = await getOfflineBills();
    const filteredBills = existingBills.filter((bill) => bill.id !== billId);
    await AsyncStorage.setItem(
      OFFLINE_BILLS_KEY,
      JSON.stringify(filteredBills)
    );
  } catch (error) {
    console.error("Error removing offline bill:", error);
  }
};

// Mark a bill for sync
export const markBillForSync = async (billId) => {
  try {
    const syncStatus = await getSyncStatus();
    syncStatus[billId] = { status: "pending", attempts: 0 };
    await AsyncStorage.setItem(SYNC_STATUS_KEY, JSON.stringify(syncStatus));
  } catch (error) {
    console.error("Error marking bill for sync:", error);
  }
};

// Get sync status for all bills
export const getSyncStatus = async () => {
  try {
    const statusJson = await AsyncStorage.getItem(SYNC_STATUS_KEY);
    return statusJson ? JSON.parse(statusJson) : {};
  } catch (error) {
    console.error("Error getting sync status:", error);
    return {};
  }
};

// Update sync status for a bill
export const updateSyncStatus = async (billId, status, error = null) => {
  try {
    const syncStatus = await getSyncStatus();
    syncStatus[billId] = {
      ...syncStatus[billId],
      status,
      lastAttempt: new Date().toISOString(),
      error,
      attempts: (syncStatus[billId]?.attempts || 0) + 1,
    };
    await AsyncStorage.setItem(SYNC_STATUS_KEY, JSON.stringify(syncStatus));
  } catch (error) {
    console.error("Error updating sync status:", error);
  }
};

// Attempt to sync offline bills when online
export const syncOfflineBills = async (apiCall) => {
  try {
    const offlineBills = await getOfflineBills();
    const syncStatus = await getSyncStatus();

    for (const bill of offlineBills) {
      const billId = bill.id;

      // Skip if already syncing or synced
      if (
        syncStatus[billId]?.status === "syncing" ||
        syncStatus[billId]?.status === "synced"
      ) {
        continue;
      }

      try {
        // Mark as syncing
        await updateSyncStatus(billId, "syncing");

        // Send bill to server
        const response = await apiCall(bill);

        // On success, mark as synced and remove from offline storage
        await updateSyncStatus(billId, "synced");
        await removeOfflineBill(billId);

        console.log(`Successfully synced bill: ${billId}`);
      } catch (error) {
        console.error(`Failed to sync bill ${billId}:`, error);
        await updateSyncStatus(billId, "failed", error.message);
      }
    }
  } catch (error) {
    console.error("Error during sync:", error);
  }
};

// Check if device is online (simple implementation)
export const checkOnlineStatus = async () => {
  // In a real implementation, you'd use NetInfo
  // For now, we'll return true to simulate checking
  return true; // Placeholder - implement with actual network check
};

// Clear all offline data (for testing)
export const clearOfflineData = async () => {
  try {
    await AsyncStorage.removeItem(OFFLINE_BILLS_KEY);
    await AsyncStorage.removeItem(SYNC_STATUS_KEY);
  } catch (error) {
    console.error("Error clearing offline data:", error);
  }
};
