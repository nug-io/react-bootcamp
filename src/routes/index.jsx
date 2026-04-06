import { Routes, Route, Navigate, Outlet } from "react-router-dom";
import { useAuthStore } from "@/stores/authStore";

// Layouts (to be created)
import MainLayout from "@/layouts/MainLayout";
import AuthLayout from "@/layouts/AuthLayout";
import DashboardLayout from "@/layouts/DashboardLayout";

// Pages (to be created)
import LandingPage from "@/pages/LandingPage";
import AuthPage from "@/features/auth/AuthPage";
import UserDashboard from "@/pages/dashboard/UserDashboard";
import BatchList from "@/pages/dashboard/BatchList";
import BatchDetail from "@/pages/dashboard/BatchDetail";
import MaterialView from "@/pages/dashboard/MaterialView";
import MyPayment from "@/pages/dashboard/MyPayment";
import InvoicePage from "@/pages/dashboard/InvoicePage";
import AdminDashboard from "@/pages/admin/AdminDashboard";
import AdminUserManager from "@/pages/admin/AdminUserManager";
import ThankYouPage from "@/pages/dashboard/ThankYouPage";

// Protect routes
const ProtectedRoute = ({ allowedRoles }) => {
    const { user, token } = useAuthStore();

    if (!token || !user) {
        return <Navigate to="/auth" replace />;
    }

    const userRole = user.role?.toUpperCase();
    const roles = allowedRoles.map(r => r.toUpperCase());

    if (allowedRoles && !roles.includes(userRole)) {
        return <Navigate to="/" replace />; 
    }

    return <Outlet />;
};

// Redirect if already logged in
const PublicRoute = () => {
    const { token, user } = useAuthStore();
    // If logged in, go to dashboard or admin
    if (token && user) {
        const userRole = user.role?.toUpperCase();
        return <Navigate to={userRole === 'ADMIN' ? "/admin" : "/dashboard"} replace />;
    }
    return <Outlet />;
};

export const AppRoutes = () => {
    return (
        <Routes>
            {/* Public Routes */}
            <Route element={<MainLayout />}>
                <Route path="/" element={<LandingPage />} />
            </Route>

            {/* Auth Routes */}
            <Route element={<PublicRoute />}>
                <Route element={<AuthLayout />}>
                    <Route path="/auth" element={<AuthPage />} />
                </Route>
            </Route>

            {/* User & Mentor Routes (Protected) */}
            <Route
                element={<ProtectedRoute allowedRoles={["USER", "ADMIN", "MENTOR"]} />}
            >
                <Route element={<MainLayout />}>
                    <Route path="/batches" element={<BatchList />} />
                    <Route path="/batches/:batchId" element={<BatchDetail />} />
                    <Route path="/enroll/success" element={<ThankYouPage />} />
                </Route>

                <Route element={<DashboardLayout />}>
                    <Route path="/dashboard" element={<UserDashboard />} />
                    <Route path="/dashboard/payments" element={<MyPayment />} />
                    <Route
                        path="/dashboard/invoice/:id"
                        element={<InvoicePage />}
                    />
                    <Route
                        path="/dashboard/materials/:materialId"
                        element={<MaterialView />}
                    />
                </Route>
            </Route>

            {/* Admin & Mentor Management Routes (Protected) */}
            <Route element={<ProtectedRoute allowedRoles={['ADMIN', 'MENTOR']} />}>
                <Route path="/admin" element={<AdminDashboard />} />
                <Route path="/admin/users" element={<AdminDashboard />} />
                <Route path="/admin/mentor" element={<AdminDashboard />} />
            </Route>

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
    );
};
