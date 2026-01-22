import { API_URL } from "@/utils/apiConfig";

// Types
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
  createdAt: string;
}

export interface Bill {
  id: string;
  customerId: string;
  customerName: string;
  vehicleNumber: string;
  workDescription: string;
  totalAmount: number;
  advanceAmount: number;
  balanceAmount: number;
  createdAt: string;
  updatedAt: string;
  items: BillItem[];
}

// API Service
class ApiService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = API_URL;
  }

  // Customer APIs
  async getCustomers(): Promise<Customer[]> {
    try {
      const response = await fetch(`${this.baseUrl}/api/customers`);
      if (!response.ok)
        throw new Error(`Failed to fetch customers: ${response.status}`);
      const data = await response.json();
      return Array.isArray(data) ? data : [];
    } catch (error) {
      console.warn("API call failed (continuing offline):", error);
      return [];
    }
  }

  async createCustomer(
    customerData: Omit<Customer, "id" | "createdAt" | "updatedAt">
  ): Promise<Customer | null> {
    try {
      const response = await fetch(`${this.baseUrl}/api/customers`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: customerData.name,
          phone: customerData.phone || null,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.error || `Failed to create customer: ${response.status}`
        );
      }

      return await response.json();
    } catch (error) {
      console.warn("API call failed (continuing offline):", error);
      return null;
    }
  }

  // Bill APIs
  async getBills(): Promise<Bill[]> {
    try {
      const response = await fetch(`${this.baseUrl}/api/bills`);
      if (!response.ok)
        throw new Error(`Failed to fetch bills: ${response.status}`);
      const data = await response.json();
      return Array.isArray(data) ? data : [];
    } catch (error) {
      console.warn("API call failed (continuing offline):", error);
      return [];
    }
  }

  async getBill(id: string): Promise<Bill | null> {
    try {
      const response = await fetch(`${this.baseUrl}/api/bills/${id}`);
      if (!response.ok) {
        if (response.status === 404) return null;
        throw new Error(`Failed to fetch bill: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.warn("API call failed (continuing offline):", error);
      return null;
    }
  }

  async createBill(
    billData: Omit<Bill, "id" | "createdAt" | "updatedAt"> & {
      items: Omit<BillItem, "id" | "billId" | "createdAt">[];
    }
  ): Promise<Bill | null> {
    try {
      const response = await fetch(`${this.baseUrl}/api/bills`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          customerId: billData.customerId,
          customerName: billData.customerName,
          vehicleNumber: billData.vehicleNumber,
          workDescription: billData.workDescription,
          totalAmount: billData.totalAmount,
          advanceAmount: billData.advanceAmount,
          balanceAmount: billData.balanceAmount,
          items: billData.items.map((item) => ({
            itemName: item.itemName,
            quantity: item.quantity,
            rate: item.rate,
            amount: item.amount,
          })),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.error || `Failed to create bill: ${response.status}`
        );
      }

      return await response.json();
    } catch (error) {
      console.warn("API call failed (continuing offline):", error);
      return null;
    }
  }

  // Health check
  async healthCheck(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/api/health`);
      return response.ok;
    } catch (error) {
      console.warn("Health check failed (assuming offline):", error);
      return false;
    }
  }
}

export const apiService = new ApiService();
