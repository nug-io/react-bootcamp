import { useState, useEffect, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
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
import { Skeleton } from "@/components/ui/skeleton";
import { Search, ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { format } from "date-fns";
import toast from "react-hot-toast";

// ---------------------------------------------------------------------------
// Helper: build axios params object, skipping empty / "ALL" values
// ---------------------------------------------------------------------------
function buildParams(q) {
    const params = {};
    Object.entries(q).forEach(([key, val]) => {
        if (val !== "" && val !== "ALL" && val !== null && val !== undefined) {
            params[key] = val;
        }
    });
    return params;
}

// ---------------------------------------------------------------------------
// Helper: badge style per payment status
// ---------------------------------------------------------------------------
function StatusBadge({ status }) {
    const styles = {
        PAID: "bg-green-600 hover:bg-green-700 text-white",
        PENDING: "bg-yellow-500 hover:bg-yellow-600 text-white",
        EXPIRED: "bg-red-600 hover:bg-red-700 text-white",
    };
    return (
        <Badge className={styles[status] ?? "bg-gray-500 text-white"}>
            {status}
        </Badge>
    );
}

// ---------------------------------------------------------------------------
// Helper: action button per status
// ---------------------------------------------------------------------------
function ActionButton({ enrollment }) {
    const navigate = useNavigate();
    const { payment_status, enrollment_id, batch, payment_ref } = enrollment;

    // PAID → download invoice
    if (payment_status === "PAID") {
        const handleDownload = async () => {
            try {
                const res = await api.get(
                    `/enrollments/${enrollment_id}/invoice`,
                    {
                        responseType: "blob",
                    },
                );
                const url = window.URL.createObjectURL(new Blob([res]));
                const link = document.createElement("a");
                link.href = url;
                link.setAttribute("download", `invoice-${enrollment_id}.pdf`);
                document.body.appendChild(link);
                link.click();
                link.remove();
                window.URL.revokeObjectURL(url);
            } catch {
                toast.error("Gagal mengunduh invoice.");
            }
        };
        return (
            <Button size="sm" onClick={handleDownload}>
                Download Invoice
            </Button>
        );
    }

    // PENDING → open Midtrans Snap
    if (payment_status === "PENDING") {
        const handlePay = () => {
            if (!payment_ref) {
                toast.error("Link pembayaran tidak tersedia.");
                return;
            }
            if (window.snap) {
                window.snap.pay(payment_ref);
            } else {
                toast.error(
                    "Midtrans Snap belum siap. Coba muat ulang halaman.",
                );
            }
        };
        return (
            <Button
                size="sm"
                className="bg-yellow-500 hover:bg-yellow-600 text-white"
                onClick={handlePay}
            >
                Lanjutkan Pembayaran
            </Button>
        );
    }

    // EXPIRED → go to batch detail
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
const MyPaymentsPage = () => {
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
            // Example: GET /enrollments/my-payments?status=PAID&orderBy=enrolled_at&orderDir=desc&page=1&limit=10
            const res = await api.get("/enrollment/my-payments", { params });

            const payload = res?.data ?? {};

            setPayments(Array.isArray(payload.data) ? payload.data : []);
            setMeta(payload.meta ?? DEFAULT_META);
        } catch (err) {
            console.error("Failed to fetch payments", err);
            setError("Gagal memuat data pembayaran. Silakan coba lagi.");
        } finally {
            setLoading(false);
        }
    }, [queryParams]);

    useEffect(() => {
        fetchPayments();
    }, [fetchPayments]);

    // -----------------------------------------------------------------------
    // Update one filter key; reset page to 1 unless we're explicitly paging
    // -----------------------------------------------------------------------
    function handleChange(key, value) {
        setQueryParams((prev) => ({
            ...prev,
            [key]: value,
            page: key === "page" ? value : 1,
        }));
    }

    const handlePageChange = (newPage) => {
        if (newPage >= 1 && newPage <= meta.totalPages) {
            handleChange("page", newPage);
        }
    };

    // -----------------------------------------------------------------------
    // Sort dropdown value → orderBy + orderDir
    // -----------------------------------------------------------------------
    const SORT_OPTIONS = [
        { value: "enrolled_at:desc", label: "Terbaru" },
        { value: "enrolled_at:asc", label: "Terlama" },
        { value: "batch.title:asc", label: "Nama Batch A-Z" },
        { value: "batch.title:desc", label: "Nama Batch Z-A" },
    ];
    const currentSort = `${queryParams.orderBy}:${queryParams.orderDir}`;

    const handleSortChange = (val) => {
        const [orderBy, orderDir] = val.split(":");
        setQueryParams((prev) => ({ ...prev, orderBy, orderDir, page: 1 }));
    };

    // -----------------------------------------------------------------------
    // Render
    // -----------------------------------------------------------------------
    return (
        <div className="container mx-auto p-6 space-y-6">
            {/* Header */}
            <h1 className="text-2xl font-bold tracking-tight">My Payments</h1>

            {/* Toolbar */}
            <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
                {/* Search */}
                <div className="relative w-full sm:w-64">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        id="payments-search"
                        placeholder="Search batch..."
                        className="pl-8"
                        value={queryParams.q}
                        onChange={(e) => handleChange("q", e.target.value)}
                    />
                </div>

                {/* Status filter */}
                <Select
                    value={queryParams.status}
                    onValueChange={(val) => handleChange("status", val)}
                >
                    <SelectTrigger
                        id="payments-status"
                        className="w-full sm:w-40"
                    >
                        <SelectValue placeholder="All Status" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="ALL">All</SelectItem>
                        <SelectItem value="PAID">Paid</SelectItem>
                        <SelectItem value="PENDING">Pending</SelectItem>
                        <SelectItem value="EXPIRED">Expired</SelectItem>
                    </SelectContent>
                </Select>

                {/* Sort */}
                <Select value={currentSort} onValueChange={handleSortChange}>
                    <SelectTrigger
                        id="payments-sort"
                        className="w-full sm:w-48"
                    >
                        <SelectValue placeholder="Sort by" />
                    </SelectTrigger>
                    <SelectContent>
                        {SORT_OPTIONS.map((opt) => (
                            <SelectItem key={opt.value} value={opt.value}>
                                {opt.label}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            {/* Error */}
            {error && <p className="text-sm text-destructive">{error}</p>}

            {/* Table */}
            <div className="border rounded-lg shadow-sm bg-card">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Batch</TableHead>
                            <TableHead>Price</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Enrolled Date</TableHead>
                            <TableHead>Expiry</TableHead>
                            <TableHead className="text-right">Action</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            // Loading rows
                            Array.from({ length: 4 }).map((_, i) => (
                                <TableRow key={i}>
                                    {Array.from({ length: 6 }).map((__, j) => (
                                        <TableCell key={j}>
                                            <Skeleton className="h-5 w-full" />
                                        </TableCell>
                                    ))}
                                </TableRow>
                            ))
                        ) : payments.length === 0 ? (
                            // Empty state
                            <TableRow>
                                <TableCell
                                    colSpan={6}
                                    className="text-center py-16 text-muted-foreground"
                                >
                                    <div className="flex flex-col items-center gap-2">
                                        <span className="text-4xl">💳</span>
                                        <p className="font-medium">
                                            No payments found
                                        </p>
                                        <p className="text-sm">
                                            Belum ada riwayat pembayaran.
                                        </p>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            asChild
                                            className="mt-2"
                                        >
                                            <Link to="/batches">
                                                Lihat Batch Tersedia
                                            </Link>
                                        </Button>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ) : (
                            payments.map((p) => (
                                <TableRow key={p.enrollment_id}>
                                    <TableCell className="font-medium">
                                        {p.batch?.title || "-"}
                                    </TableCell>
                                    <TableCell>
                                        {p.batch?.price
                                            ? `Rp ${parseInt(p.batch.price).toLocaleString("id-ID")}`
                                            : "-"}
                                    </TableCell>
                                    <TableCell>
                                        <StatusBadge
                                            status={p.payment_status}
                                        />
                                    </TableCell>
                                    <TableCell>
                                        {p.enrolled_at
                                            ? format(
                                                  new Date(p.enrolled_at),
                                                  "d MMM yyyy",
                                              )
                                            : "-"}
                                    </TableCell>
                                    <TableCell>
                                        {p.expires_at ? (
                                            <span
                                                className={
                                                    p.payment_status ===
                                                    "EXPIRED"
                                                        ? "text-red-500 text-sm"
                                                        : "text-muted-foreground text-sm"
                                                }
                                            >
                                                {format(
                                                    new Date(p.expires_at),
                                                    "d MMM yyyy, HH:mm",
                                                )}
                                            </span>
                                        ) : (
                                            <span className="text-muted-foreground">
                                                -
                                            </span>
                                        )}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <ActionButton enrollment={p} />
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* Pagination */}
            {!loading && meta.totalPages > 1 && (
                <div className="flex items-center justify-between">
                    <p className="text-sm text-muted-foreground">
                        Page {meta.page} of {meta.totalPages}
                        <span className="ml-2 text-xs">
                            ({meta.total} items)
                        </span>
                    </p>
                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            disabled={meta.page <= 1}
                            onClick={() => handlePageChange(meta.page - 1)}
                        >
                            <ChevronLeft className="h-4 w-4" />
                            <span className="ml-1">Previous</span>
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            disabled={meta.page >= meta.totalPages}
                            onClick={() => handlePageChange(meta.page + 1)}
                        >
                            <span className="mr-1">Next</span>
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MyPaymentsPage;
