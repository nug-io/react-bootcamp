import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { api } from "@/lib/api";
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
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    Search,
    ChevronLeft,
    ChevronRight,
    Loader2,
    ArrowUpDown,
    ArrowUp,
    ArrowDown,
} from "lucide-react";
import { format } from "date-fns";
import toast from "react-hot-toast";

// ---------------------------------------------------------------------------
// Helper: build query string, skip falsy / empty / "ALL" values
// ---------------------------------------------------------------------------
function buildParams(q) {
    const params = {};
    Object.entries(q).forEach(([key, val]) => {
        if (val !== "" && val !== false && val !== null && val !== undefined && val !== "ALL") {
            params[key] = val;
        }
    });
    return params;
}

// ---------------------------------------------------------------------------
// Helper: Badge color per payment status
// ---------------------------------------------------------------------------
function paymentBadgeClass(status) {
    if (status === "PAID")    return "bg-green-600 hover:bg-green-700";
    if (status === "PENDING") return "bg-yellow-600 hover:bg-yellow-700";
    return "bg-gray-500";
}

// ---------------------------------------------------------------------------
// Helper: Action button per status
// ---------------------------------------------------------------------------
function ActionButton({ enrollment }) {
    const { payment_status, enrollment_id, batch, payment_ref } = enrollment;

    if (payment_status === "PAID") {
        return (
            <Button size="sm" variant="outline" asChild>
                <Link to={`/dashboard/invoice/${enrollment_id}`} target="_blank" rel="noopener noreferrer">
                    Lihat Invoice
                </Link>
            </Button>
        );
    }

    if (payment_status === "PENDING") {
        const handlePay = () => {
            if (!payment_ref) {
                toast.error("Link pembayaran tidak tersedia.");
                return;
            }
            if (window.snap) {
                window.snap.pay(payment_ref);
            } else {
                toast.error("Midtrans Snap belum siap. Coba muat ulang halaman.");
            }
        };
        return (
            <Button size="sm" className="bg-yellow-600 hover:bg-yellow-700 text-white" onClick={handlePay}>
                Lanjutkan Pembayaran
            </Button>
        );
    }

    if (payment_status === "EXPIRED") {
        return (
            <Button size="sm" variant="secondary" asChild>
                <Link to={`/batches/${batch?.id}`}>Daftar Ulang</Link>
            </Button>
        );
    }

    return null;
}

// ---------------------------------------------------------------------------
// Default state
// ---------------------------------------------------------------------------
const DEFAULT_QUERY = {
    page: 1,
    limit: 10,
    q: "",
    status: "ALL",
    orderBy: "enrolled_at",
    orderDir: "desc",
};

const DEFAULT_META = { page: 1, limit: 10, total: 0, totalPages: 1 };

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------
const MyPayment = () => {
    const [payments, setPayments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [queryParams, setQueryParams] = useState(DEFAULT_QUERY);
    const [meta, setMeta] = useState(DEFAULT_META);

    // -----------------------------------------------------------------------
    // Fetch whenever queryParams changes
    // -----------------------------------------------------------------------
    const fetchPayments = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const params = buildParams(queryParams);
            const res = await api.get("/enrollment/my-payment", { params });

            const payloadData = res?.data ?? {};
            
            // Handle if data is wrapped or direct
            const list = Array.isArray(payloadData.data) ? payloadData.data : (Array.isArray(payloadData) ? payloadData : []);
            const m = payloadData.meta ?? (res.meta ?? DEFAULT_META);

            setPayments(list);
            setMeta(m);
        } catch (err) {
            console.error("Failed to fetch payments", err);
            setError("Gagal memuat data pembayaran. Silakan coba lagi.");
            setPayments([]);
        } finally {
            setLoading(false);
        }
    }, [queryParams]);

    useEffect(() => {
        fetchPayments();
    }, [fetchPayments]);

    // -----------------------------------------------------------------------
    // Generic filter change: reset page to 1
    // -----------------------------------------------------------------------
    function handleChange(key, value) {
        setQueryParams((prev) => ({
            ...prev,
            [key]: value,
            page: key === "page" ? value : 1,
        }));
    }

    // -----------------------------------------------------------------------
    // Sort by column header (toggle asc/desc)
    // -----------------------------------------------------------------------
    const handleSort = (field) => {
        setQueryParams((prev) => ({
            ...prev,
            orderBy: field,
            orderDir: prev.orderBy === field && prev.orderDir === "asc" ? "desc" : "asc",
            page: 1,
        }));
    };

    const handlePageChange = (newPage) => {
        if (newPage >= 1 && newPage <= meta.totalPages) {
            handleChange("page", newPage);
        }
    };

    // -----------------------------------------------------------------------
    // Render helpers
    // -----------------------------------------------------------------------
    const renderSortIcon = (field) => {
        if (queryParams.orderBy !== field)
            return <ArrowUpDown className="ml-2 h-4 w-4 opacity-50" />;
        return queryParams.orderDir === "asc"
            ? <ArrowUp   className="ml-2 h-4 w-4" />
            : <ArrowDown className="ml-2 h-4 w-4" />;
    };

    const renderPageNumbers = () => {
        const pages = [];
        const maxPages = 5;
        let start = Math.max(1, meta.page - 2);
        let end   = Math.min(meta.totalPages, start + maxPages - 1);
        if (end - start < maxPages - 1) start = Math.max(1, end - maxPages + 1);

        for (let i = start; i <= end; i++) {
            const active = i === meta.page;
            pages.push(
                <Button key={i} size="sm"
                    variant={active ? "default" : "outline"}
                    onClick={active ? undefined : () => handlePageChange(i)}
                    className={active ? "cursor-default" : ""}
                >
                    {i}
                </Button>
            );
        }
        return pages;
    };

    return (
        <div className="container mx-auto p-6 space-y-6">
            <h1 className="text-2xl font-bold tracking-tight">My Payments</h1>

            <div className="bg-card border rounded-lg shadow-sm">
                
                {/* Visual Header: Filters */}
                <div className="p-4 border-b flex flex-col sm:flex-row items-start sm:items-center gap-4 flex-wrap">
                    {/* Search */}
                    <div className="relative w-full sm:w-64">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            id="payments-search"
                            placeholder="Cari batch..."
                            className="pl-8"
                            value={queryParams.q}
                            onChange={(e) => handleChange("q", e.target.value)}
                        />
                    </div>

                    {/* Status Filter */}
                    <Select
                        value={queryParams.status}
                        onValueChange={(val) => handleChange("status", val)}
                    >
                        <SelectTrigger id="payments-status" className="w-full sm:w-48">
                            <SelectValue placeholder="Semua Status" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="ALL">Semua Status</SelectItem>
                            <SelectItem value="PAID">PAID</SelectItem>
                            <SelectItem value="PENDING">PENDING</SelectItem>
                            <SelectItem value="EXPIRED">EXPIRED</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                {/* Error Summary */}
                {error && (
                    <p className="px-4 py-2 text-sm text-destructive">{error}</p>
                )}

                {/* Table */}
                <div className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-[50px]">#</TableHead>
                                <TableHead>
                                    <Button variant="ghost" className="-ml-4 hover:bg-transparent"
                                        onClick={() => handleSort("batch.title")}>
                                        Batch {renderSortIcon("batch.title")}
                                    </Button>
                                </TableHead>
                                <TableHead>Price</TableHead>
                                <TableHead>
                                    <Button variant="ghost" className="-ml-4 hover:bg-transparent"
                                        onClick={() => handleSort("payment_status")}>
                                        Status {renderSortIcon("payment_status")}
                                    </Button>
                                </TableHead>
                                <TableHead>
                                    <Button variant="ghost" className="-ml-4 hover:bg-transparent"
                                        onClick={() => handleSort("enrolled_at")}>
                                        Enrolled Date {renderSortIcon("enrolled_at")}
                                    </Button>
                                </TableHead>
                                <TableHead>Expiry</TableHead>
                                <TableHead className="text-right">Action</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={7} className="text-center py-8">
                                        <Loader2 className="animate-spin h-8 w-8 mx-auto text-primary/50" />
                                    </TableCell>
                                </TableRow>
                            ) : payments.length > 0 ? (
                                payments.map((p, index) => (
                                    <TableRow key={p.enrollment_id}>
                                        <TableCell>
                                            {(meta.page - 1) * meta.limit + index + 1}
                                        </TableCell>
                                        <TableCell className="font-medium">
                                            {p.batch?.title || "-"}
                                        </TableCell>
                                        <TableCell>
                                            {p.batch?.price
                                                ? `Rp ${parseInt(p.batch.price).toLocaleString("id-ID")}`
                                                : "-"}
                                        </TableCell>
                                        <TableCell>
                                            <Badge className={paymentBadgeClass(p.payment_status)}>
                                                {p.payment_status}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            {p.enrolled_at
                                                ? format(new Date(p.enrolled_at), "d MMM yyyy, HH:mm")
                                                : "-"}
                                        </TableCell>
                                        <TableCell>
                                            {p.expires_at ? (
                                                <span className={
                                                        p.payment_status === "EXPIRED"
                                                            ? "text-red-600 text-sm"
                                                            : "text-muted-foreground text-sm"
                                                    }>
                                                    {format(new Date(p.expires_at), "d MMM yyyy, HH:mm")}
                                                </span>
                                            ) : (
                                                <span className="text-muted-foreground">-</span>
                                            )}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <ActionButton enrollment={p} />
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={7} className="text-center py-12 text-muted-foreground">
                                        Tidak ada data pembayaran yang ditemukan.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>

                {/* Pagination */}
                <div className="p-4 border-t flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="text-sm text-muted-foreground">
                        Halaman {meta.page} dari {meta.totalPages} ({meta.total} entries)
                    </div>
                    <div className="flex items-center space-x-2">
                        <Button variant="outline" size="sm"
                            onClick={() => handlePageChange(meta.page - 1)}
                            disabled={meta.page <= 1}>
                            <ChevronLeft className="h-4 w-4" />
                        </Button>
                        {renderPageNumbers()}
                        <Button variant="outline" size="sm"
                            onClick={() => handlePageChange(meta.page + 1)}
                            disabled={meta.page >= meta.totalPages}>
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MyPayment;
