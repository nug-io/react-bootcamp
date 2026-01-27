import { Outlet, Link, useNavigate } from "react-router-dom";
import { useAuthStore } from "@/stores/authStore";

const MainLayout = () => {
    const { user, logout } = useAuthStore();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate("/");
    };

    return (
        <div className="flex flex-col min-h-screen">
            <header className="border-b bg-white">
                <div className="container mx-auto px-4 h-16 flex items-center justify-between">
                    <Link to="/" className="text-xl font-bold">Bootcamp Platform</Link>
                    <nav className="flex items-center gap-4">
                        {user ? (
                            <>
                                <Link to="/batches" className="text-sm font-medium hover:text-primary">Batches</Link>
                                <Link to="/dashboard" className="text-sm font-medium hover:text-primary">My Dashboard</Link>
                                <button onClick={handleLogout} className="text-sm text-red-600 hover:text-red-700">Logout</button>
                            </>
                        ) : (
                            <Link to="/auth" className="text-sm font-medium hover:text-primary">Login / Register</Link>
                        )}
                    </nav>
                </div>
            </header>

            <main className="flex-1">
                <Outlet />
            </main>

            <footer className="border-t py-6 bg-gray-50">
                <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
                    © 2026 Bootcamp Platform. All rights reserved.
                </div>
            </footer>
        </div>
    );
};

export default MainLayout;
