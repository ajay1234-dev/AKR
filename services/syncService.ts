import NetInfo from "@react-native-community/netinfo";
import { apiService } from "./api";
import { offlineStorage, OfflineBill } from "./offlineStorage";

class SyncService {
  private isSyncing = false;

  async checkConnection(): Promise<boolean> {
    try {
      // Check if device has network connectivity
      const state = await NetInfo.fetch();
      const hasNetwork =
        state.isConnected === true && state.isInternetReachable === true;

      if (!hasNetwork) {
        return false;
      }

      // We now rely on direct Firebase calls, so always return true
      // The actual connection will be tested by the API calls themselves
      return true;
    } catch (error) {
      console.warn("Network check failed:", error);
      return false;
    }
  }

  async syncPendingBills(): Promise<void> {
    // Since we're not using offline storage anymore, this method is empty
    // All bills are saved directly to Firebase
    console.log("Sync skipped - no offline bills to sync");
    return;
  }

  async scheduleSync(): Promise<void> {
    // Since we're not using offline storage anymore, this method is empty
    // All bills are saved directly to Firebase
    return;
  }
}

export const syncService = new SyncService();
