import * as SQLite from "expo-sqlite";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";
import { Bill, Customer, BillItem } from "./api";

// Types for offline storage
export interface OfflineBill
  extends Omit<Bill, "createdAt" | "updatedAt" | "items"> {
  items: Omit<BillItem, "id" | "billId" | "createdAt">[];
  createdAt: string;
  updatedAt: string;
  syncStatus: "pending" | "synced";
  localId: string;
}

class OfflineStorageService {
  private db: SQLite.SQLiteDatabase | null = null;

  async init(): Promise<void> {
    // Guard against web platform
    if (Platform.OS === "web") {
      console.log("SQLite disabled on web platform");
      return;
    }

    try {
      this.db = await SQLite.openDatabaseAsync("akr_workshop.db");

      // Create tables
      await this.db.execAsync(`
        CREATE TABLE IF NOT EXISTS offline_bills (
          localId TEXT PRIMARY KEY,
          id TEXT,
          customerId TEXT,
          customerName TEXT,
          vehicleNumber TEXT,
          workDescription TEXT,
          totalAmount REAL,
          advanceAmount REAL,
          balanceAmount REAL,
          createdAt TEXT,
          updatedAt TEXT,
          syncStatus TEXT DEFAULT 'pending'
        );
        
        CREATE TABLE IF NOT EXISTS offline_bill_items (
          id TEXT PRIMARY KEY,
          localBillId TEXT,
          itemName TEXT,
          quantity INTEGER,
          rate REAL,
          amount REAL,
          FOREIGN KEY(localBillId) REFERENCES offline_bills(localId) ON DELETE CASCADE
        );
      `);
    } catch (error) {
      console.warn(
        "Error initializing offline storage (continuing in offline mode):",
        error
      );
    }
  }

  // Save bill locally
  async saveBillLocally(
    bill: Omit<Bill, "id" | "createdAt" | "updatedAt"> & {
      items: Omit<BillItem, "id" | "billId" | "createdAt">[];
    }
  ): Promise<string> {
    // Guard against web platform
    if (Platform.OS === "web") {
      console.log("Offline storage disabled on web");
      return `web_${Date.now()}`;
    }

    if (!this.db) await this.init();

    const localId = `local_${Date.now()}_${Math.random()
      .toString(36)
      .substr(2, 9)}`;
    const now = new Date().toISOString();

    try {
      // Insert bill
      await this.db!.runAsync(
        `INSERT INTO offline_bills (
          localId, customerId, customerName, vehicleNumber, workDescription,
          totalAmount, advanceAmount, balanceAmount, createdAt, updatedAt, syncStatus
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          localId,
          bill.customerId,
          bill.customerName,
          bill.vehicleNumber,
          bill.workDescription,
          bill.totalAmount,
          bill.advanceAmount,
          bill.balanceAmount,
          now,
          now,
          "pending",
        ]
      );

      // Insert items
      for (const item of bill.items) {
        const itemId = `item_${Date.now()}_${Math.random()
          .toString(36)
          .substr(2, 9)}`;
        await this.db!.runAsync(
          `INSERT INTO offline_bill_items (
            id, localBillId, itemName, quantity, rate, amount
          ) VALUES (?, ?, ?, ?, ?, ?)`,
          [
            itemId,
            localId,
            item.itemName,
            item.quantity,
            item.rate,
            item.amount,
          ]
        );
      }

      return localId;
    } catch (error) {
      console.error("Error saving bill locally:", error);
      throw error;
    }
  }

  // Get all offline bills
  async getOfflineBills(): Promise<OfflineBill[]> {
    // Guard against web platform
    if (Platform.OS === "web") {
      console.log("Returning empty bills list on web");
      return [];
    }

    if (!this.db) await this.init();

    try {
      const billsResult = (await this.db!.getAllAsync(
        "SELECT * FROM offline_bills ORDER BY createdAt DESC"
      )) as any[];

      const bills: OfflineBill[] = [];

      for (const billRow of billsResult) {
        const itemsResult = (await this.db!.getAllAsync(
          "SELECT * FROM offline_bill_items WHERE localBillId = ?",
          [billRow.localId]
        )) as any[];

        bills.push({
          ...billRow,
          items: itemsResult.map((item) => ({
            itemName: item.itemName,
            quantity: item.quantity,
            rate: item.rate,
            amount: item.amount,
          })),
          createdAt: new Date(billRow.createdAt),
          updatedAt: new Date(billRow.updatedAt),
        });
      }

      return bills;
    } catch (error) {
      console.error("Error getting offline bills:", error);
      return [];
    }
  }

  // Mark bill as synced
  async markBillAsSynced(localId: string, serverId: string): Promise<void> {
    // Guard against web platform
    if (Platform.OS === "web") {
      console.log("Marking bill as synced skipped on web");
      return;
    }

    if (!this.db) await this.init();

    try {
      await this.db!.runAsync(
        "UPDATE offline_bills SET id = ?, syncStatus = ? WHERE localId = ?",
        [serverId, "synced", localId]
      );
    } catch (error) {
      console.error("Error marking bill as synced:", error);
    }
  }

  // Clear synced bills
  async clearSyncedBills(): Promise<void> {
    // Guard against web platform
    if (Platform.OS === "web") {
      console.log("Clearing synced bills skipped on web");
      return;
    }

    if (!this.db) await this.init();

    try {
      await this.db!.runAsync(
        "DELETE FROM offline_bills WHERE syncStatus = ?",
        ["synced"]
      );
    } catch (error) {
      console.error("Error clearing synced bills:", error);
    }
  }

  // Store last sync timestamp
  async setLastSyncTime(timestamp: number): Promise<void> {
    try {
      await AsyncStorage.setItem("last_sync_time", timestamp.toString());
    } catch (error) {
      console.error("Error setting last sync time:", error);
    }
  }

  // Get last sync timestamp
  async getLastSyncTime(): Promise<number> {
    try {
      const timestamp = await AsyncStorage.getItem("last_sync_time");
      return timestamp ? parseInt(timestamp, 10) : 0;
    } catch (error) {
      console.error("Error getting last sync time:", error);
      return 0;
    }
  }
}

export const offlineStorage = new OfflineStorageService();
