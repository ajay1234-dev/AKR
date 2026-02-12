import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";
import { Bill, BillItem, WorkDone } from "./api";

// Web-compatible storage using localStorage for web platform
const webStorage = {
  getItem: (key: string): any => {
    if (typeof window !== "undefined" && window.localStorage) {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : null;
    }
    return null;
  },
  setItem: (key: string, value: any) => {
    if (typeof window !== "undefined" && window.localStorage) {
      window.localStorage.setItem(key, JSON.stringify(value));
    }
  },
  removeItem: (key: string) => {
    if (typeof window !== "undefined" && window.localStorage) {
      window.localStorage.removeItem(key);
    }
  },
  getAllKeys: (): string[] => {
    if (typeof window !== "undefined" && window.localStorage) {
      const keys: string[] = [];
      for (let i = 0; i < window.localStorage.length; i++) {
        const key = window.localStorage.key(i);
        if (key) keys.push(key);
      }
      return keys;
    }
    return [];
  },
};

// Types for offline storage
export interface OfflineBill
  extends Omit<Bill, "createdAt" | "updatedAt" | "items" | "workDone"> {
  items: Omit<BillItem, "id" | "billId" | "createdAt">[];
  workDone: Omit<WorkDone, "id" | "billId" | "createdAt">[];
  createdAt: string;
  updatedAt: string;
  syncStatus: "pending" | "synced";
  localId: string;
}

class OfflineStorageService {
  private isWeb: boolean = Platform.OS === "web";

  private async getOfflineBillsFromWebStorage(): Promise<any[]> {
    const bills = webStorage.getItem("offline_bills");
    return bills || [];
  }

  async init(): Promise<void> {
    // On web platform, we use web storage
    if (Platform.OS === "web") {
      console.log("Using web storage for offline bills");
      return;
    }

    // For native platforms, we use AsyncStorage
    console.log("Using AsyncStorage for offline bills");
  }

  // Save bill locally - now empty since we save directly to Firebase
  async saveBillLocally(
    bill: Omit<Bill, "id" | "createdAt" | "updatedAt"> & {
      items: Omit<BillItem, "id" | "billId" | "createdAt">[];
      workDone: Omit<WorkDone, "id" | "billId" | "createdAt">[];
    }
  ): Promise<string> {
    // Since we're not using offline storage anymore, this is a no-op
    console.log("Offline storage is disabled - saving directly to Firebase");
    return "direct_firebase_save";
  }

  // Get all offline bills - now returns empty array since we don't use offline storage
  async getOfflineBills(): Promise<OfflineBill[]> {
    // Since we're not using offline storage anymore, return empty array
    return [];
  }

  // Mark bill as synced - now empty since we don't use offline storage
  async markBillAsSynced(localId: string, serverId: string): Promise<void> {
    // Since we're not using offline storage anymore, this is a no-op
    return;
  }

  // Clear synced bills - now empty since we don't use offline storage
  async clearSyncedBills(): Promise<void> {
    // Since we're not using offline storage anymore, this is a no-op
    return;
  }

  // Store last sync timestamp - now empty since we don't use offline storage
  async setLastSyncTime(timestamp: number): Promise<void> {
    // Since we're not using offline storage anymore, this is a no-op
    return;
  }

  // Get last sync timestamp - now returns 0 since we don't use offline storage
  async getLastSyncTime(): Promise<number> {
    // Since we're not using offline storage anymore, return 0
    return 0;
  }
}

export const offlineStorage = new OfflineStorageService();
