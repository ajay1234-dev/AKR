import { db } from "./firebaseConfig";
import {
  collection,
  doc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  getDoc,
  query,
  orderBy,
  limit,
  Timestamp,
} from "firebase/firestore";

// Types for our data
export interface Customer {
  id?: string;
  name: string;
  phone?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface BillItem {
  id?: string;
  itemName: string;
  quantity: number;
  rate: number;
  amount: number;
  unit: string;
}

export interface WorkDone {
  id?: string;
  workName: string;
  price: number;
}

export interface Bill {
  id?: string;
  customerId: string;
  customerName: string;
  vehicleNumber: string;
  vehicleName?: string; // Added vehicle name field
  workDescription: string;
  totalAmount: number;
  advanceAmount: number;
  balanceAmount: number;
  items: BillItem[];
  workDone: WorkDone[];
  createdAt?: Date;
  updatedAt?: Date;
}

class FirebaseService {
  // Customer methods
  async getCustomers(): Promise<Customer[]> {
    try {
      const customersRef = collection(db, "customers");
      const q = query(customersRef, orderBy("createdAt", "desc"));
      const querySnapshot = await getDocs(q);

      const customers: Customer[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        customers.push({
          id: doc.id,
          name: data.name,
          phone: data.phone,
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
        });
      });

      return customers;
    } catch (error) {
      console.error("Error fetching customers:", error);
      return [];
    }
  }

  async createCustomer(
    customerData: Omit<Customer, "id" | "createdAt" | "updatedAt">
  ): Promise<Customer | null> {
    try {
      const customersRef = collection(db, "customers");
      const docData = {
        ...customerData,
        createdAt: Timestamp.fromDate(new Date()),
        updatedAt: Timestamp.fromDate(new Date()),
      };

      const docRef = await addDoc(customersRef, docData);

      return {
        id: docRef.id,
        ...customerData,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
    } catch (error) {
      console.error("Error creating customer:", error);
      return null;
    }
  }

  // Bill methods
  async getBills(): Promise<Bill[]> {
    try {
      const billsRef = collection(db, "bills");
      const q = query(billsRef, orderBy("createdAt", "desc"));
      const querySnapshot = await getDocs(q);

      const bills: Bill[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        bills.push({
          id: doc.id,
          customerId: data.customerId,
          customerName: data.customerName,
          vehicleNumber: data.vehicleNumber,
          workDescription: data.workDescription,
          totalAmount: data.totalAmount,
          advanceAmount: data.advanceAmount || 0,
          balanceAmount: data.balanceAmount,
          items: data.items || [],
          workDone: data.workDone || [],
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
        });
      });

      return bills;
    } catch (error) {
      console.error("Error fetching bills:", error);
      return [];
    }
  }

  async getBill(id: string): Promise<Bill | null> {
    try {
      const billRef = doc(db, "bills", id);
      const docSnap = await getDoc(billRef);

      if (docSnap.exists()) {
        const data = docSnap.data();
        return {
          id: docSnap.id,
          customerId: data.customerId,
          customerName: data.customerName,
          vehicleNumber: data.vehicleNumber,
          workDescription: data.workDescription,
          totalAmount: data.totalAmount,
          advanceAmount: data.advanceAmount || 0,
          balanceAmount: data.balanceAmount,
          items: data.items || [],
          workDone: data.workDone || [],
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
        };
      }

      return null;
    } catch (error) {
      console.error("Error fetching bill:", error);
      return null;
    }
  }

  async createBill(
    billData: Omit<Bill, "id" | "createdAt" | "updatedAt">
  ): Promise<Bill | null> {
    try {
      const billsRef = collection(db, "bills");
      const docData = {
        ...billData,
        createdAt: Timestamp.fromDate(new Date()),
        updatedAt: Timestamp.fromDate(new Date()),
      };

      const docRef = await addDoc(billsRef, docData);

      return {
        id: docRef.id,
        ...billData,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
    } catch (error) {
      console.error("Error creating bill:", error);
      return null;
    }
  }

  async updateBill(
    id: string,
    billData: Partial<Omit<Bill, "id" | "createdAt" | "updatedAt">>
  ): Promise<void> {
    try {
      const billRef = doc(db, "bills", id);
      await updateDoc(billRef, {
        ...billData,
        updatedAt: Timestamp.fromDate(new Date()),
      });
    } catch (error) {
      console.error("Error updating bill:", error);
    }
  }

  async deleteBill(id: string): Promise<void> {
    try {
      const billRef = doc(db, "bills", id);
      await deleteDoc(billRef);
    } catch (error) {
      console.error("Error deleting bill:", error);
    }
  }

  // Health check to verify Firebase connection
  async healthCheck(): Promise<boolean> {
    try {
      // Try to fetch a simple document to verify connection
      const testCollection = collection(db, "health_check");
      const q = query(testCollection, orderBy("timestamp", "desc"), limit(1));
      await getDocs(q);
      return true;
    } catch (error) {
      console.error("Firebase health check failed:", error);
      return false;
    }
  }
}

export const firebaseService = new FirebaseService();
