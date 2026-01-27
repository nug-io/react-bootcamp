import { Outlet, Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";

const SidebarItem = ({ to, label, active }) => (
    <Link
        to={to}
        className={cn(
            "block px-4 py-2 rounded-md text-sm font-medium",
            active
                ? "bg-primary text-primary-foreground"
                : "text-gray-700 hover:bg-gray-100"
        )}
    >
        {label}
    </Link>
);

const DashboardLayout = () => {
    const location = useLocation();

    return (
        <div className="min-h-screen flex bg-gray-50">
            {/* Sidebar - Desktop */}
            <aside className="w-64 bg-white border-r hidden md:block">
                <div className="p-6 border-b">
                    <Link to="/" className="text-xl font-bold">Bootcamp</Link>
                </div>
                <nav className="p-4 space-y-2">
                    <SidebarItem
                        to="/dashboard"
                        label="Overview"
                        active={location.pathname === "/dashboard"}
                    />
                    <SidebarItem
                        to="/batches"
                        label="Browse Batches"
                        active={location.pathname === "/batches"}
                    />
                </nav>
            </aside>

            {/* Main Content */}
            <div className="flex-1 flex flex-col">
                {/* Mobile Header placeholder */}
                <header className="md:hidden bg-white p-4 border-b flex justify-between items-center">
                    <Link to="/" className="font-bold">Bootcamp</Link>
                    <Link to="/dashboard" className="text-sm">Menu</Link>
                </header>

                <main className="flex-1 p-6">
                    <Outlet />
                </main>
            </div>
        </div>
    );
};

export default DashboardLayout;
