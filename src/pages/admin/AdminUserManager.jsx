import { useState, useEffect, useCallback } from "react";
import { api } from "@/lib/api";
import { extractErrorMessage } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
    Table,
    TableHeader,
    TableRow,
    TableHead,
    TableBody,
    TableCell,
} from "@/components/ui/table";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Loader2,
    Search,
    ChevronLeft,
    ChevronRight,
    Ban,
    Trash2,
    UserX,
    ArrowUpDown,
    ArrowUp,
    ArrowDown,
} from "lucide-react";
import toast from "react-hot-toast";

const AdminUserManager = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [summary, setSummary] = useState({
        ACTIVE: 0,
        SUSPENDED: 0,
        BANNED: 0,
        total: 0,
    });

    const [queryParams, setQueryParams] = useState({
        page: 1,
        limit: 10,
        q: "",
        role: "ALL",
        status: "ALL",
        orderBy: "created_at",
        orderDir: "desc",
    });

    const [meta, setMeta] = useState({
        page: 1,
        limit: 10,
        total: 0,
        totalPages: 1,
    });

    const fetchUsers = useCallback(async () => {
        setLoading(true);
        try {
            const params = {
                page: queryParams.page,
                limit: queryParams.limit,
                orderBy: queryParams.orderBy,
                orderDir: queryParams.orderDir,
            };

            if (queryParams.q) params.q = queryParams.q;
            if (queryParams.role !== "ALL") params.role = queryParams.role;
            if (queryParams.status !== "ALL") params.status = queryParams.status;

            const res = await api.get("/user", { params });
            setUsers(res.data || []);
            setMeta(res.meta || { page: 1, limit: 10, total: 0, totalPages: 1 });
            setSummary(res.summary || { ACTIVE: 0, SUSPENDED: 0, BANNED: 0, total: 0 });
        } catch (error) {
            console.error(error);
            toast.error("Failed to fetch users");
        } finally {
            setLoading(false);
        }
    }, [queryParams]);

    useEffect(() => {
        fetchUsers();
    }, [fetchUsers]);

    const handleSort = (field) => {
        setQueryParams((prev) => ({
            ...prev,
            orderBy: field,
            orderDir:
                prev.orderBy === field && prev.orderDir === "asc"
                    ? "desc"
                    : "asc",
            page: 1,
        }));
    };

    const renderSortIcon = (field) => {
        if (queryParams.orderBy !== field)
            return <ArrowUpDown className="ml-2 h-4 w-4 opacity-50" />;
        return queryParams.orderDir === "asc" ? (
            <ArrowUp className="ml-2 h-4 w-4" />
        ) : (
            <ArrowDown className="ml-2 h-4 w-4" />
        );
    };

    const handleSearch = (e) => {
        setQueryParams((prev) => ({
            ...prev,
            q: e.target.value,
            page: 1,
        }));
    };

    const handlePageChange = (newPage) => {
        if (newPage >= 1 && newPage <= meta.totalPages) {
            setQueryParams((prev) => ({ ...prev, page: newPage }));
        }
    };

    const handleRoleChange = async (userId, newRole) => {
        try {
            await api.patch(`/user/${userId}/role`, { role: newRole });
            toast.success("User role updated");
            fetchUsers();
        } catch (error) {
            toast.error(extractErrorMessage(error));
        }
    };

    const handleStatusAction = async (userId, action) => {
        const confirmMsg = `Are you sure you want to ${action} this user?`;
        if (!window.confirm(confirmMsg)) return;

        try {
            await api.patch(`/user/${userId}/${action}`);
            toast.success(`User ${action}ed`);
            fetchUsers();
        } catch (error) {
            toast.error(extractErrorMessage(error));
        }
    };

    const handleDelete = async (userId) => {
        if (!window.confirm("Are you sure you want to permanently delete this user? This action cannot be undone.")) return;

        try {
            await api.delete(`/user/${userId}`);
            toast.success("User deleted");
            fetchUsers();
        } catch (error) {
            toast.error(extractErrorMessage(error));
        }
    };

    const getStatusBadge = (status) => {
        switch (status) {
            case "ACTIVE":
                return <Badge className="bg-green-100 text-green-700 hover:bg-green-100 border-none">Active</Badge>;
            case "SUSPENDED":
                return <Badge className="bg-yellow-100 text-yellow-700 hover:bg-yellow-100 border-none">Suspended</Badge>;
            case "BANNED":
                return <Badge className="bg-red-100 text-red-700 hover:bg-red-100 border-none">Banned</Badge>;
            default:
                return <Badge variant="outline">{status}</Badge>;
        }
    };

    return (
        <div className="space-y-6">
            <div>
                <h3 className="text-2xl font-bold tracking-tight">User Management</h3>
                <p className="text-muted-foreground">
                    Manage system users, roles, and account statuses.
                </p>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-card border rounded-lg p-4 shadow-sm">
                    <div className="text-sm font-medium text-muted-foreground">Total Users</div>
                    <div className="text-2xl font-bold">{summary.total}</div>
                </div>
                <div className="bg-card border rounded-lg p-4 shadow-sm">
                    <div className="text-sm font-medium text-muted-foreground">Active</div>
                    <div className="text-2xl font-bold text-green-600">{summary.ACTIVE}</div>
                </div>
                <div className="bg-card border rounded-lg p-4 shadow-sm">
                    <div className="text-sm font-medium text-muted-foreground">Suspended</div>
                    <div className="text-2xl font-bold text-yellow-600">{summary.SUSPENDED}</div>
                </div>
                <div className="bg-card border rounded-lg p-4 shadow-sm">
                    <div className="text-sm font-medium text-muted-foreground">Banned</div>
                    <div className="text-2xl font-bold text-red-600">{summary.BANNED}</div>
                </div>
            </div>

            <div className="bg-card border rounded-lg shadow-sm overflow-hidden">
                {/* Filters */}
                <div className="p-4 border-b flex flex-col md:flex-row gap-4 bg-muted/5">
                    <div className="relative flex-1">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search by email..."
                            className="pl-8"
                            value={queryParams.q}
                            onChange={handleSearch}
                        />
                    </div>
                    <div className="flex gap-4">
                        <Select
                            value={queryParams.role}
                            onValueChange={(val) => setQueryParams(p => ({ ...p, role: val, page: 1 }))}
                        >
                            <SelectTrigger className="w-[150px]">
                                <SelectValue placeholder="Role" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="ALL">All Roles</SelectItem>
                                <SelectItem value="USER">User</SelectItem>
                                <SelectItem value="MENTOR">Mentor</SelectItem>
                                <SelectItem value="ADMIN">Admin</SelectItem>
                            </SelectContent>
                        </Select>
                        <Select
                            value={queryParams.status}
                            onValueChange={(val) => setQueryParams(p => ({ ...p, status: val, page: 1 }))}
                        >
                            <SelectTrigger className="w-[150px]">
                                <SelectValue placeholder="Status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="ALL">All Status</SelectItem>
                                <SelectItem value="ACTIVE">Active</SelectItem>
                                <SelectItem value="SUSPENDED">Suspended</SelectItem>
                                <SelectItem value="BANNED">Banned</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                {/* Table */}
                <div className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow className="hover:bg-transparent">
                                <TableHead className="w-[60px] font-bold text-center">#</TableHead>
                                <TableHead className="font-bold">
                                    <Button
                                        variant="ghost"
                                        onClick={() => handleSort("email")}
                                        className="-ml-4 hover:bg-transparent font-bold"
                                    >
                                        Email
                                        {renderSortIcon("email")}
                                    </Button>
                                </TableHead>
                                <TableHead className="font-bold text-center">Role</TableHead>
                                <TableHead className="font-bold text-center">Status</TableHead>
                                <TableHead className="text-right font-bold pr-6">User Control</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center py-10">
                                        <Loader2 className="animate-spin h-8 w-8 mx-auto text-primary/50" />
                                    </TableCell>
                                </TableRow>
                            ) : users.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center py-10 text-muted-foreground">
                                        No users match your current filters.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                users.map((user, index) => (
                                    <TableRow key={user.id} className="transition-colors">
                                        <TableCell className="text-center font-medium text-muted-foreground">
                                            {index + 1 + (meta.page - 1) * meta.limit}
                                        </TableCell>
                                        <TableCell className="font-medium py-4">{user.email}</TableCell>
                                        <TableCell className="text-center">
                                            <Select
                                                value={user.role}
                                                onValueChange={(val) => handleRoleChange(user.id, val)}
                                            >
                                                <SelectTrigger className="h-8 w-[120px] text-xs mx-auto">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="USER">User</SelectItem>
                                                    <SelectItem value="MENTOR">Mentor</SelectItem>
                                                    <SelectItem value="ADMIN">Admin</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </TableCell>
                                        <TableCell className="text-center">{getStatusBadge(user.status)}</TableCell>
                                        <TableCell className="text-right pr-6">
                                            <div className="flex justify-end items-center gap-1">
                                                <Button
                                                    size="icon"
                                                    variant="ghost"
                                                    className="h-8 w-8 text-yellow-600 hover:text-yellow-700 hover:bg-yellow-50"
                                                    title="Suspend User"
                                                    onClick={() => handleStatusAction(user.id, "suspend")}
                                                    disabled={user.status === "SUSPENDED"}
                                                >
                                                    <UserX className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    size="icon"
                                                    variant="ghost"
                                                    className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                                                    title="Ban User"
                                                    onClick={() => handleStatusAction(user.id, "ban")}
                                                    disabled={user.status === "BANNED"}
                                                >
                                                    <Ban className="h-4 w-4" />
                                                </Button>
                                                <div className="w-px h-4 bg-border mx-1" />
                                                <Button
                                                    size="icon"
                                                    variant="ghost"
                                                    className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/5"
                                                    title="Delete User"
                                                    onClick={() => handleDelete(user.id)}
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>

                {/* Pagination */}
                <div className="p-4 border-t flex items-center justify-between bg-muted/5">
                    <div className="text-sm text-muted-foreground">
                        Showing {users.length} of {meta.total} users
                    </div>
                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handlePageChange(meta.page - 1)}
                            disabled={meta.page <= 1 || loading}
                        >
                            <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <span className="text-sm font-medium">
                            Page {meta.page} of {meta.totalPages}
                        </span>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handlePageChange(meta.page + 1)}
                            disabled={meta.page >= meta.totalPages || loading}
                        >
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminUserManager;
