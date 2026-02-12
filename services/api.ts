// Import Firebase service instead of using HTTP API
import {
  firebaseService,
  Customer,
  Bill,
  BillItem,
  WorkDone,
} from "./firebaseService";

// Types
// Re-export types from firebaseService to maintain compatibility
export interface Customer {
  id: string;
  name: string;
  phone?: string;
  createdAt: string;
  updatedAt: string;
}

export interface BillItem {
  id: string;
  billId: string;
  itemName: string;
  quantity: number;
  rate: number;
  amount: number;
  unit: string;
  createdAt: string;
}

export interface WorkDone {
  id: string;
  billId: string;
  workName: string;
  price: number;
  createdAt: string;
}

export interface Bill {
  id: string;
  customerId: string;
  customerName: string;
  vehicleNumber: string;
  vehicleName?: string; // Added vehicle name field
  workDescription: string;
  totalAmount: number;
  advanceAmount: number;
  balanceAmount: number;
  createdAt: string;
  updatedAt: string;
  items: BillItem[];
  workDone: WorkDone[];
}

// Export the types to be used in other modules
export type { Customer, BillItem, WorkDone, Bill };

// API Service
// Using Firebase instead of HTTP API
class ApiService {
  // Customer APIs
  async getCustomers(): Promise<Customer[]> {
    try {
      return await firebaseService.getCustomers();
    } catch (error) {
      console.warn("Firebase call failed (continuing offline):", error);
      return [];
    }
  }

  async createCustomer(
    customerData: Omit<Customer, "id" | "createdAt" | "updatedAt">
  ): Promise<Customer | null> {
    try {
      return await firebaseService.createCustomer(customerData);
    } catch (error) {
      console.warn("Firebase call failed (continuing offline):", error);
      return null;
    }
  }

  // Bill APIs
  async getBills(): Promise<Bill[]> {
    try {
      return await firebaseService.getBills();
    } catch (error) {
      console.warn("Firebase call failed (continuing offline):", error);
      return [];
    }
  }

  async getBill(id: string): Promise<Bill | null> {
    try {
      return await firebaseService.getBill(id);
    } catch (error) {
      console.warn("Firebase call failed (continuing offline):", error);
      return null;
    }
  }

  async createBill(
    billData: Omit<Bill, "id" | "createdAt" | "updatedAt"> & {
      items: Omit<BillItem, "id" | "billId" | "createdAt">[];
      workDone: Omit<WorkDone, "id" | "billId" | "createdAt">[];
    }
  ): Promise<Bill | null> {
    try {
      // Transform the data to match the Bill interface
      const transformedBillData: Omit<Bill, "id" | "createdAt" | "updatedAt"> =
        {
          ...billData,
          items: billData.items.map((item) => ({
            itemName: item.itemName,
            quantity: item.quantity,
            rate: item.rate,
            amount: item.amount,
            unit: item.unit,
          })),
          workDone: billData.workDone.map((work) => ({
            workName: work.workName,
            price: work.price,
          })),
        };

      return await firebaseService.createBill(transformedBillData);
    } catch (error) {
      console.warn("Firebase call failed (continuing offline):", error);
      return null;
    }
  }

  async updateBill(
    id: string,
    billData: Partial<Omit<Bill, "id" | "createdAt" | "updatedAt">>
  ): Promise<void> {
    try {
      await firebaseService.updateBill(id, billData);
    } catch (error) {
      console.warn("Firebase call failed (continuing offline):", error);
      throw error;
    }
  }

  async deleteBill(id: string): Promise<void> {
    try {
      await firebaseService.deleteBill(id);
    } catch (error) {
      console.warn("Firebase call failed (continuing offline):", error);
    }
  }

  // Health check - check if Firebase is accessible
  async healthCheck(): Promise<boolean> {
    try {
      // Use the Firebase service health check
      return await firebaseService.healthCheck();
    } catch (error) {
      console.warn("Firebase health check failed:", error);
      return false;
    }
  }
}

export const apiService = new ApiService();
