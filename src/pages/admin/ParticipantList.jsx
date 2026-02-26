import { useState, useEffect, useCallback } from "react";
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
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
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
// Sub-component: 5 summary stat cards
// ---------------------------------------------------------------------------
function SummaryCards({ summary }) {
    const cards = [
        { label: "Total Peserta",     value: summary.total,           color: "" },
        { label: "Sudah Bayar",       value: summary.paid,            color: "text-green-600" },
        { label: "Pending Aktif",     value: summary.pending_active,  color: "text-yellow-600" },
        { label: "Pending Expired",   value: summary.pending_expired, color: "text-red-600" },
        { label: "Total Pending",     value: summary.pending,         color: "text-muted-foreground" },
    ];

    return (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {cards.map((c) => (
                <div key={c.label} className="bg-card border rounded-lg p-4 shadow-sm">
                    <div className="text-sm font-medium text-muted-foreground">{c.label}</div>
                    <div className={`text-2xl font-bold ${c.color}`}>{c.value ?? 0}</div>
                </div>
            ))}
        </div>
    );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------
const DEFAULT_QUERY = {
    page: 1,
    limit: 10,
    q: "",
    batchId: "ALL",
    status: "ALL",       // payment status
    paid_only: false,
    is_expired: false,
    orderBy: "enrolled_at",
    orderDir: "desc",
};

const DEFAULT_META    = { page: 1, limit: 10, total: 0, totalPages: 1 };
const DEFAULT_SUMMARY = { total: 0, paid: 0, pending: 0, pending_active: 0, pending_expired: 0 };

const ParticipantList = () => {
    const [batches,     setBatches]     = useState([]);
    const [enrollments, setEnrollments] = useState([]);
    const [loading,     setLoading]     = useState(true);
    const [error,       setError]       = useState(null);
    const [queryParams, setQueryParams] = useState(DEFAULT_QUERY);
    const [meta,        setMeta]        = useState(DEFAULT_META);
    const [summary,     setSummary]     = useState(DEFAULT_SUMMARY);

    // -----------------------------------------------------------------------
    // Fetch batch list for the batchId dropdown (once on mount)
    // -----------------------------------------------------------------------
    useEffect(() => {
        const fetchBatches = async () => {
            try {
                const res = await api.get("/batch", { params: { limit: 100 } });
                setBatches(res.data || []);
            } catch (err) {
                console.error("Failed to fetch batches", err);
            }
        };
        fetchBatches();
    }, []);

    // -----------------------------------------------------------------------
    // Fetch participants whenever queryParams change
    // -----------------------------------------------------------------------
    const fetchParticipants = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const params = buildParams(queryParams);
            // Example: GET /enrollment?batchId=3&status=PAID&page=1&limit=10&orderBy=enrolled_at&orderDir=desc
            const res = await api.get("/enrollment", { params });
            setEnrollments(res.data    || []);
            setMeta(       res.meta    || DEFAULT_META);
            setSummary(    res.summary || DEFAULT_SUMMARY);
        } catch (err) {
            console.error("Failed to fetch participants", err);
            setError("Gagal memuat data peserta. Silakan coba lagi.");
            setEnrollments([]);
        } finally {
            setLoading(false);
        }
    }, [queryParams]);

    useEffect(() => {
        fetchParticipants();
    }, [fetchParticipants]);

    // -----------------------------------------------------------------------
    // Generic filter change: always reset page to 1 except when changing page
    // -----------------------------------------------------------------------
    function handleChange(key, value) {
        setQueryParams((prev) => ({
            ...prev,
            [key]: value,
            page: key === "page" ? value : 1,
        }));
    }

    // -----------------------------------------------------------------------
    // Sort by column header click (toggle asc/desc)
    // -----------------------------------------------------------------------
    const handleSort = (field) => {
        setQueryParams((prev) => ({
            ...prev,
            orderBy:  field,
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
        <div className="space-y-6">
            <h3 className="text-2xl font-bold tracking-tight">Participant List</h3>

            {/* Summary Cards */}
            <SummaryCards summary={summary} />

            {/* Main card: filters + table + pagination */}
            <div className="bg-card border rounded-lg shadow-sm">

                {/* Filter bar */}
                <div className="p-4 border-b flex flex-col lg:flex-row gap-4 items-start lg:items-center flex-wrap">

                    {/* Search */}
                    <div className="relative w-full sm:w-64">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            id="participant-search"
                            placeholder="Cari nama / email..."
                            className="pl-8"
                            value={queryParams.q}
                            onChange={(e) => handleChange("q", e.target.value)}
                        />
                    </div>

                    {/* Batch filter */}
                    <Select
                        value={queryParams.batchId.toString()}
                        onValueChange={(val) => handleChange("batchId", val)}
                    >
                        <SelectTrigger id="participant-batch" className="w-full sm:w-52">
                            <SelectValue placeholder="Semua Batch" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="ALL">Semua Batch</SelectItem>
                            {batches.map((b) => (
                                <SelectItem key={b.id} value={b.id.toString()}>
                                    {b.title}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    {/* Payment status filter */}
                    <Select
                        value={queryParams.status}
                        onValueChange={(val) => handleChange("status", val)}
                    >
                        <SelectTrigger id="participant-status" className="w-full sm:w-48">
                            <SelectValue placeholder="Semua Status" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="ALL">Semua Status</SelectItem>
                            <SelectItem value="PAID">PAID</SelectItem>
                            <SelectItem value="PENDING">PENDING</SelectItem>
                            <SelectItem value="ACTIVE">ACTIVE (pending aktif)</SelectItem>
                            <SelectItem value="EXPIRED">EXPIRED</SelectItem>
                        </SelectContent>
                    </Select>

                    {/* Quick toggles */}
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                            <Checkbox
                                id="paid-only"
                                checked={queryParams.paid_only}
                                onCheckedChange={(checked) => handleChange("paid_only", !!checked)}
                            />
                            <Label htmlFor="paid-only" className="cursor-pointer whitespace-nowrap">
                                Paid only
                            </Label>
                        </div>
                        <div className="flex items-center gap-2">
                            <Checkbox
                                id="is-expired"
                                checked={queryParams.is_expired}
                                onCheckedChange={(checked) => handleChange("is_expired", !!checked)}
                            />
                            <Label htmlFor="is-expired" className="cursor-pointer whitespace-nowrap">
                                Expired only
                            </Label>
                        </div>
                    </div>
                </div>

                {/* Error */}
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
                                        onClick={() => handleSort("user.name")}>
                                        Nama {renderSortIcon("user.name")}
                                    </Button>
                                </TableHead>
                                <TableHead>
                                    <Button variant="ghost" className="-ml-4 hover:bg-transparent"
                                        onClick={() => handleSort("user.email")}>
                                        Email {renderSortIcon("user.email")}
                                    </Button>
                                </TableHead>
                                <TableHead>No. HP</TableHead>
                                <TableHead>
                                    <Button variant="ghost" className="-ml-4 hover:bg-transparent"
                                        onClick={() => handleSort("batch.title")}>
                                        Batch {renderSortIcon("batch.title")}
                                    </Button>
                                </TableHead>
                                <TableHead>
                                    <Button variant="ghost" className="-ml-4 hover:bg-transparent"
                                        onClick={() => handleSort("payment_status")}>
                                        Status Bayar {renderSortIcon("payment_status")}
                                    </Button>
                                </TableHead>
                                <TableHead>
                                    <Button variant="ghost" className="-ml-4 hover:bg-transparent"
                                        onClick={() => handleSort("enrolled_at")}>
                                        Daftar {renderSortIcon("enrolled_at")}
                                    </Button>
                                </TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={7} className="text-center py-8">
                                        <Loader2 className="animate-spin h-8 w-8 mx-auto text-primary/50" />
                                    </TableCell>
                                </TableRow>
                            ) : enrollments.length > 0 ? (
                                enrollments.map((enr, index) => (
                                    <TableRow key={enr.id || index}>
                                        <TableCell>
                                            {(meta.page - 1) * meta.limit + index + 1}
                                        </TableCell>
                                        <TableCell className="font-medium">
                                            {enr.user?.name || "Unknown"}
                                        </TableCell>
                                        <TableCell>
                                            {enr.user?.email || "-"}
                                        </TableCell>
                                        <TableCell>
                                            {enr.user?.phone_number || "-"}
                                        </TableCell>
                                        <TableCell>
                                            {enr.batch?.title || enr.batch_id}
                                        </TableCell>
                                        <TableCell>
                                            <Badge className={paymentBadgeClass(enr.payment_status)}>
                                                {enr.payment_status}
                                            </Badge>
                                            {enr.payment_status === "PENDING" && enr.expires_at && (
                                                <div className="text-xs text-muted-foreground mt-1">
                                                    Exp: {format(new Date(enr.expires_at), "d MMM HH:mm")}
                                                </div>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            {enr.enrolled_at
                                                ? format(new Date(enr.enrolled_at), "d MMM yyyy, HH:mm")
                                                : "-"}
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={7} className="text-center py-12 text-muted-foreground">
                                        Tidak ada peserta yang sesuai filter.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>

                {/* Pagination */}
                <div className="p-4 border-t flex items-center justify-between">
                    <div className="text-sm text-muted-foreground">
                        Halaman {meta.page} dari {meta.totalPages} ({meta.total} peserta)
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

export default ParticipantList;
