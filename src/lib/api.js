import axios from "axios";

// Create axios instance with base URL (from env or default to localhost)
export const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || "http://localhost:3000",
});

// Request interceptor to add auth token
api.interceptors.request.use(
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

// Response interceptor for error handling
api.interceptors.response.use(
    (response) => response.data, // Return data directly for cleaner usage
    (error) => {
        // Optional: Handle 401 globally (e.g. redirect to login)
        if (error.response?.status === 401) {
            // Clear token if invalid?
            // localStorage.removeItem('token'); 
            // window.location.href = '/auth'; // Simple redirect, or use event bus
        }
        return Promise.reject(error);
    }
);
