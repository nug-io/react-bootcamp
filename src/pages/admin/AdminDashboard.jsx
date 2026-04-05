import { useState, useEffect } from "react";
import { Link, useNavigate, useSearchParams, useLocation } from "react-router-dom";
import { useAuthStore } from "@/stores/authStore";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { LogOut, LayoutDashboard, Users, BookOpen, Layers } from "lucide-react";

// Admin Sub-pages
import BatchManager from "./BatchManager";
import MaterialManager from "./MaterialManager";
import ParticipantList from "./ParticipantList";
import AdminUserManager from "./AdminUserManager";
import MentorManager from "./MentorManager";

const AdminDashboard = () => {
    const { logout, user } = useAuthStore();
    const navigate = useNavigate();
    const location = useLocation();
    const [searchParams, setSearchParams] = useSearchParams();
    
    // Determine active tab from path or search param
    const getActiveTab = () => {
        const path = location.pathname;
        if (path === "/admin/users") return "users";
        if (path === "/admin/mentor") return "mentors";
        return searchParams.get("tab") || "batches";
    };

    const activeTab = getActiveTab();

    const handleLogout = () => {
        logout();
        navigate("/");
    };

    const setActiveTab = (tabId) => {
        if (tabId === "users") navigate("/admin/users");
        else if (tabId === "mentors") navigate("/admin/mentor");
        else navigate(`/admin?tab=${tabId}`);
    };

    const menuItems = [
        { id: "batches", label: "Batch Management", icon: Layers },
        // { id: "materials", label: "Materials", icon: BookOpen }, // Merged into Batches usually, but requirement says separate tab allowed or specific CRUD
        // Requirements: "Menu Kiri: Batch, Peserta, Materi"
        { id: "materials", label: "Material Management", icon: BookOpen },
        { id: "participants", label: "Participants", icon: Users },
        { id: "users", label: "Users", icon: Users },
        { id: "mentors", label: "Mentors", icon: Users },
    ];

    return (
        <div className="flex h-screen bg-gray-100">
            {/* Sidebar */}
            <aside className="w-64 bg-white border-r flex flex-col">
                <div className="p-6 border-b flex items-center justify-center">
                    <h1 className="text-xl font-bold text-primary">
                        Admin Panel
                    </h1>
                </div>

                <div className="p-4 flex-1 space-y-2">
                    {menuItems.map((item) => {
                        const Icon = item.icon;
                        return (
                            <button
                                key={item.id}
                                onClick={() => setActiveTab(item.id)}
                                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-md text-sm font-medium transition-colors ${
                                    activeTab === item.id
                                        ? "bg-primary text-primary-foreground"
                                        : "text-gray-600 hover:bg-gray-100"
                                }`}
                            >
                                <Icon className="h-5 w-5" />
                                <span>{item.label}</span>
                            </button>
                        );
                    })}
                </div>

                <div className="p-4 border-t">
                    <div className="mb-4 text-xs text-center text-gray-500">
                        Logged in as {user?.email}
                    </div>
                    <Button
                        variant="destructive"
                        className="w-full"
                        onClick={handleLogout}
                    >
                        <LogOut className="h-4 w-4 mr-2" /> Logout
                    </Button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 overflow-auto p-8">
                <div className="max-w-6xl mx-auto">
                    <h2 className="text-2xl font-bold mb-6 capitalize">
                        {activeTab.replace("-", " ")}
                    </h2>

                    <Card>
                        <CardContent className="p-6">
                            {activeTab === "batches" && <BatchManager />}
                            {activeTab === "materials" && <MaterialManager />}
                            {activeTab === "participants" && (
                                <ParticipantList />
                            )}
                            {activeTab === 'users' && <AdminUserManager />}
                            {activeTab === 'mentors' && <MentorManager />}
                        </CardContent>
                    </Card>
                </div>
            </main>
        </div>
    );
};

export default AdminDashboard;
