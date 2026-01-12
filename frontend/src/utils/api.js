import axios from "axios";

const API_BASE_URL = "http://10.43.191.37:5001/api";

const api = axios.create({
  baseURL: API_BASE_URL,
});

export const billAPI = {
  createBill: (data) => api.post("/bills", data),
  getAllBills: () => api.get("/bills"),
  getBillById: (id) => api.get(`/bills/${id}`),
  getAllCustomers: () => api.get("/customers"),
  getCustomerById: (id) => api.get(`/customers/${id}`),
};

export default api;
