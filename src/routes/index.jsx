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
import ThankYouPage from "@/pages/dashboard/ThankYouPage";

// Protect routes
const ProtectedRoute = ({ allowedRoles }) => {
    const { user, token } = useAuthStore();

    if (!token || !user) {
        return <Navigate to="/auth" replace />;
    }

    if (allowedRoles && !allowedRoles.includes(user.role)) {
        return <Navigate to="/dashboard" replace />; // or 403 page
    }

    return <Outlet />;
};

// Redirect if already logged in
const PublicRoute = () => {
    const { token } = useAuthStore();
    // If logged in, go to batches or dashboard
    if (token) return <Navigate to="/batches" replace />;
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

            {/* User Routes (Protected) */}
            <Route element={<ProtectedRoute allowedRoles={['USER', 'ADMIN']} />}>
                {/* Batches Flow (can use MainLayout or DashboardLayout?) - User requested separate flow */}
                <Route element={<MainLayout />}>
                    <Route path="/batches" element={<BatchList />} />
                    <Route path="/batches/:batchId" element={<BatchDetail />} />
                </Route>

                <Route element={<MainLayout />}> {/* Or minimal layout */}
                    <Route path="/enroll/success" element={<ThankYouPage />} />
                </Route>

                <Route element={<DashboardLayout />}>
                    <Route path="/dashboard" element={<UserDashboard />} />
                    <Route path="/dashboard/payments" element={<MyPayment />} />
                    <Route path="/dashboard/invoice/:id" element={<InvoicePage />} />
                    <Route path="/dashboard/materials/:materialId" element={<MaterialView />} />
                </Route>
            </Route>

            {/* Admin Routes (Protected) */}
            <Route element={<ProtectedRoute allowedRoles={['ADMIN']} />}>
                <Route path="/admin" element={<AdminDashboard />} />
            </Route>

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
    );
};
