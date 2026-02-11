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
    },
);

// Response interceptor for error handling
api.interceptors.response.use(
    (response) => {
        // Return data directly if successful
        return response.data ? response.data : response;
    },
    (error) => {
        const status = error.response ? error.response.status : null;
        const hasAuthHeader = error.config?.headers?.Authorization;

        if (status === 401 && hasAuthHeader) {
            // Global 401 handling: Clear token and redirect
            localStorage.removeItem("token");
            window.location.href = "/auth";
        }
        return Promise.reject(error);
    },
);
