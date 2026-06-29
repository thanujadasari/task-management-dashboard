import axios from "axios";

const API = "http://localhost:5000/api/auth";

// Login
export const loginUser = async (userData) => {
  const response = await axios.post(`${API}/login`, userData);
  return response.data;
};

// Register
export const registerUser = async (userData) => {
  const response = await axios.post(`${API}/register`, userData);
  return response.data;
};

// Get All Tasks
export const getTasks = async () => {
  const response = await axios.get("http://localhost:5000/api/tasks");
  return response.data;
};

// Create Task
export const createTask = async (taskData) => {
  const response = await axios.post(
    "http://localhost:5000/api/tasks",
    taskData
  );

  return response.data;
};

// Delete Task
export const deleteTask = async (id) => {
  const response = await axios.delete(
    `http://localhost:5000/api/tasks/${id}`
  );

  return response.data;
};

// Get One Task
export const getTaskById = async (id) => {
  const tasks = await getTasks();
  return tasks.find((task) => task._id === id);
};

// Update Task
export const updateTask = async (id, taskData) => {
  const response = await axios.put(
    `http://localhost:5000/api/tasks/${id}`,
    taskData
  );

  return response.data;
};