import NetInfo from "@react-native-community/netinfo";
import { apiService } from "./api";
import { offlineStorage, OfflineBill } from "./offlineStorage";

class SyncService {
  private isSyncing = false;

  async checkConnection(): Promise<boolean> {
    try {
      const state = await NetInfo.fetch();
      return state.isConnected === true && state.isInternetReachable === true;
    } catch (error) {
      console.warn("Network check failed (assuming offline):", error);
      return false;
    }
  }

  async syncPendingBills(): Promise<void> {
    if (this.isSyncing) return;

    this.isSyncing = true;

    try {
      const isConnected = await this.checkConnection();
      if (!isConnected) {
        console.log("No internet connection, skipping sync");
        return;
      }

      const offlineBills = await offlineStorage.getOfflineBills();
      const pendingBills = offlineBills.filter(
        (bill) => bill.syncStatus === "pending"
      );

      if (pendingBills.length === 0) {
        console.log("No pending bills to sync");
        return;
      }

      console.log(`Syncing ${pendingBills.length} bills...`);

      for (const offlineBill of pendingBills) {
        try {
          // Convert offline bill to server format
          const billData = {
            customerId: offlineBill.customerId,
            customerName: offlineBill.customerName,
            vehicleNumber: offlineBill.vehicleNumber,
            workDescription: offlineBill.workDescription,
            totalAmount: offlineBill.totalAmount,
            advanceAmount: offlineBill.advanceAmount,
            balanceAmount: offlineBill.balanceAmount,
            items: offlineBill.items,
          };

          const result = await apiService.createBill(billData);

          if (result && result.id) {
            // Mark as synced
            await offlineStorage.markBillAsSynced(
              offlineBill.localId,
              result.id
            );
            console.log(`Successfully synced bill ${offlineBill.localId}`);
          } else {
            console.warn(`Failed to sync bill ${offlineBill.localId}`);
          }
        } catch (error) {
          console.error(`Error syncing bill ${offlineBill.localId}:`, error);
        }
      }

      // Clean up synced bills
      await offlineStorage.clearSyncedBills();

      // Update last sync time
      await offlineStorage.setLastSyncTime(Date.now());

      console.log("Sync completed successfully");
    } catch (error) {
      console.warn(
        "Sync process encountered issues (continuing offline):",
        error
      );
    } finally {
      this.isSyncing = false;
    }
  }

  async scheduleSync(): Promise<void> {
    // Check if we should sync (every 5 minutes or when coming online)
    const lastSyncTime = await offlineStorage.getLastSyncTime();
    const fiveMinutesAgo = Date.now() - 5 * 60 * 1000;

    if (lastSyncTime < fiveMinutesAgo) {
      await this.syncPendingBills();
    }
  }
}

export const syncService = new SyncService();
