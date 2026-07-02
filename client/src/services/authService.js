import axios from "axios";

// Create Axios Instance with base URL
const API = axios.create({
  baseURL: "http://localhost:5000/api",
});

// Inject Bearer Token automatically on all outgoing requests
API.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

/* ==========================================================================
   AUTHENTICATION & PROFILE SERVICES
   ========================================================================== */

// Login User
export const loginUser = async (userData) => {
  const response = await API.post("/auth/login", userData);
  return response.data;
};

// Register User
export const registerUser = async (userData) => {
  const response = await API.post("/auth/register", userData);
  return response.data;
};

// Get User Profile details
export const fetchProfile = async () => {
  const response = await API.get("/auth/me");
  return response.data;
};

/* ==========================================================================
   TASK SERVICES (BACKUP / RETAINED COEXISTENCE)
   ========================================================================== */

// Get All Tasks
export const getTasks = async () => {
  const response = await API.get("/tasks");
  return response.data;
};

// Create Task
export const createTask = async (taskData) => {
  const response = await API.post("/tasks", taskData);
  return response.data;
};

// Delete Task
export const deleteTask = async (id) => {
  const response = await API.delete(`/tasks/${id}`);
  return response.data;
};

// Get One Task
export const getTaskById = async (id) => {
  const tasks = await getTasks();
  return tasks.find((task) => task._id === id);
};

// Update Task
export const updateTask = async (id, taskData) => {
  const response = await API.put(`/tasks/${id}`, taskData);
  return response.data;
};

/* ==========================================================================
   SAAS BILLING PLANS SERVICES (ADMIN / CLIENT)
   ========================================================================== */

// Fetch all available subscription plans
export const fetchPlans = async () => {
  const response = await API.get("/plans");
  return response.data;
};

// Create a new subscription plan (Admin only)
export const createPlan = async (planData) => {
  const response = await API.post("/plans", planData);
  return response.data;
};

// Update a subscription plan (Admin only)
export const updatePlan = async (id, planData) => {
  const response = await API.put(`/plans/${id}`, planData);
  return response.data;
};

// Delete a subscription plan (Admin only)
export const deletePlan = async (id) => {
  const response = await API.delete(`/plans/${id}`);
  return response.data;
};

/* ==========================================================================
   SAAS SUBSCRIPTIONS SERVICES
   ========================================================================== */

// Subscribe a customer to a billing plan
export const subscribeToPlan = async (planId) => {
  const response = await API.post("/subscriptions/subscribe", { planId });
  return response.data;
};

// Cancel customer subscription
export const cancelSubscription = async () => {
  const response = await API.post("/subscriptions/cancel");
  return response.data;
};

// List all user profiles and subscriptions (Admin only)
export const fetchAdminSubscriptions = async () => {
  const response = await API.get("/subscriptions/admin/users");
  return response.data;
};

// Override user role/subscription (Admin only)
export const updateUserSubscription = async (userId, updateData) => {
  const response = await API.put(`/subscriptions/admin/update/${userId}`, updateData);
  return response.data;
};

/* ==========================================================================
   SAAS INVOICES SERVICES
   ========================================================================== */

// Get customer invoices
export const fetchMyInvoices = async () => {
  const response = await API.get("/invoices/my");
  return response.data;
};

// Get all system invoices (Admin only)
export const fetchAllInvoices = async () => {
  const response = await API.get("/invoices/all");
  return response.data;
};

// Pay an invoice (Customer)
export const payInvoice = async (id) => {
  const response = await API.post(`/invoices/pay/${id}`);
  return response.data;
};

// Create a custom test invoice (Admin only)
export const createManualInvoice = async (invoiceData) => {
  const response = await API.post("/invoices/create", invoiceData);
  return response.data;
};