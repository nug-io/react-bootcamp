import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { api } from "@/lib/api";
import {
    Card,
    CardHeader,
    CardTitle,
    CardDescription,
    CardContent,
    CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { format } from "date-fns";

// ---------------------------------------------------------------------------
// Helper: build query string, skip empty/undefined values
// ---------------------------------------------------------------------------
function buildQueryString(params) {
    const qs = new URLSearchParams();
    Object.entries(params).forEach(([key, val]) => {
        if (val !== "" && val !== undefined && val !== null) {
            qs.set(key, val);
        }
    });
    return qs.toString();
}

// ---------------------------------------------------------------------------
// Sub-component: Filter bar
// Props:
//   filters  – current filter state object
//   onChange – (key, value) => void  ← tell parent to update one filter field
// ---------------------------------------------------------------------------
function BatchFilterBar({ filters, onChange }) {
    return (
        <div className="flex flex-wrap gap-3 items-center">
            {/* 1. Search */}
            <Input
                id="batch-search"
                type="search"
                placeholder="Cari judul batch..."
                value={filters.q}
                onChange={(e) => onChange("q", e.target.value)}
                className="w-52"
            />

            {/* 2. Status */}
            <Select
                value={filters.status}
                onValueChange={(val) => onChange("status", val === "all" ? "" : val)}
            >
                <SelectTrigger id="batch-status" className="w-40">
                    <SelectValue placeholder="Semua Status" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">Semua Status</SelectItem>
                    <SelectItem value="OPEN">OPEN</SelectItem>
                    <SelectItem value="ONGOING">ONGOING</SelectItem>
                    <SelectItem value="CLOSED">CLOSED</SelectItem>
                </SelectContent>
            </Select>

            {/* 3. Kuota */}
            <Select
                value={filters.is_full}
                onValueChange={(val) => onChange("is_full", val === "all" ? "" : val)}
            >
                <SelectTrigger id="batch-quota" className="w-44">
                    <SelectValue placeholder="Semua Kuota" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">Semua Kuota</SelectItem>
                    <SelectItem value="false">Belum penuh</SelectItem>
                    <SelectItem value="true">Sudah penuh</SelectItem>
                </SelectContent>
            </Select>

            {/* 4. Sort */}
            <Select
                value={`${filters.orderBy}:${filters.orderDir}`}
                onValueChange={(val) => {
                    const [orderBy, orderDir] = val.split(":");
                    onChange("orderBy", orderBy);
                    onChange("orderDir", orderDir);
                }}
            >
                <SelectTrigger id="batch-sort" className="w-48">
                    <SelectValue placeholder="Urutkan" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="created_at:desc">Terbaru</SelectItem>
                    <SelectItem value="title:asc">Judul A–Z</SelectItem>
                    <SelectItem value="price:asc">Harga Terendah</SelectItem>
                    <SelectItem value="remaining_quota:asc">Kuota Tersisa</SelectItem>
                </SelectContent>
            </Select>
        </div>
    );
}

// ---------------------------------------------------------------------------
// Helper: badge variant per status
// ---------------------------------------------------------------------------
function statusVariant(status) {
    if (status === "OPEN") return "default";
    if (status === "ONGOING") return "secondary";
    return "outline";
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------
const DEFAULT_FILTERS = {
    q: "",
    status: "",
    is_full: "",
    orderBy: "created_at",
    orderDir: "desc",
    page: 1,
    limit: 9,
};

const BatchList = () => {
    const [filters, setFilters] = useState(DEFAULT_FILTERS);
    const [batches, setBatches] = useState([]);
    const [meta, setMeta] = useState(null);      // { page, limit, total, totalPages }
    const [summary, setSummary] = useState(null); // { open, ongoing, full, active }
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // -----------------------------------------------------------------------
    // Fetch whenever filters change
    // -----------------------------------------------------------------------
    const fetchBatches = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const qs = buildQueryString(filters);
            // Example URL produced: /batch?q=react&status=OPEN&page=1&limit=9&orderBy=created_at&orderDir=desc
            const res = await api.get(`/batch?${qs}`);
            setBatches(res.data || []);
            setMeta(res.meta || null);
            setSummary(res.summary || null);
        } catch (err) {
            console.error("Failed to fetch batches", err);
            setError("Gagal memuat data batch. Silakan coba lagi.");
        } finally {
            setLoading(false);
        }
    }, [filters]);

    useEffect(() => {
        fetchBatches();
    }, [fetchBatches]);

    // -----------------------------------------------------------------------
    // Update a single filter field; reset page to 1 for non-page changes
    // -----------------------------------------------------------------------
    function handleFilterChange(key, value) {
        setFilters((prev) => ({
            ...prev,
            [key]: value,
            // keep page as-is when explicitly changing page, otherwise reset
            page: key === "page" ? value : 1,
        }));
    }

    // -----------------------------------------------------------------------
    // Render helpers
    // -----------------------------------------------------------------------
    const totalPages = meta?.totalPages ?? 1;
    const currentPage = filters.page;

    return (
        <div className="container mx-auto p-6 space-y-6">
            <h1 className="text-3xl font-bold">Pilih Batch</h1>

            {/* Summary badges */}
            {summary && (
                <div className="flex flex-wrap gap-2 text-sm">
                    <Badge variant="default">Open: {summary.open}</Badge>
                    <Badge variant="secondary">Ongoing: {summary.ongoing}</Badge>
                    <Badge variant="outline">Full: {summary.full}</Badge>
                </div>
            )}

            {/* Filter bar */}
            <BatchFilterBar filters={filters} onChange={handleFilterChange} />

            {/* Error */}
            {error && (
                <p className="text-destructive text-sm">{error}</p>
            )}

            {/* Loading skeleton */}
            {loading ? (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {Array.from({ length: filters.limit }).map((_, i) => (
                        <Skeleton key={i} className="h-[250px] w-full rounded-xl" />
                    ))}
                </div>
            ) : batches.length === 0 ? (
                <p className="text-muted-foreground">
                    Tidak ada batch yang sesuai filter.
                </p>
            ) : (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {batches.map((batch) => (
                        <Card key={batch.id} className="flex flex-col">
                            <CardHeader>
                                <div className="flex justify-between items-start gap-2">
                                    <CardTitle className="leading-snug">
                                        {batch.title}
                                    </CardTitle>
                                    <div className="flex flex-col gap-1 items-end shrink-0">
                                        <Badge variant={statusVariant(batch.status_effective)}>
                                            {batch.status_effective}
                                        </Badge>
                                        {batch.is_full && (
                                            <Badge variant="destructive" className="text-xs">
                                                Penuh
                                            </Badge>
                                        )}
                                    </div>
                                </div>
                                <CardDescription>
                                    Start:{" "}
                                    {format(new Date(batch.start_date), "d MMM yyyy")}
                                </CardDescription>
                            </CardHeader>

                            <CardContent className="flex-1 space-y-2 text-sm">
                                <p className="font-semibold text-primary">
                                    Rp{" "}
                                    {parseInt(batch.price).toLocaleString("id-ID")}
                                </p>
                                <p>
                                    {batch.end_date
                                        ? `End: ${format(new Date(batch.end_date), "d MMM yyyy")}`
                                        : "Durasi: 1 Bulan"}
                                </p>
                                <p className="text-muted-foreground">
                                    Jadwal: Senin &amp; Kamis, 19.00 WIB
                                </p>
                                {batch.remaining_quota !== undefined && (
                                    <p className="text-muted-foreground">
                                        Sisa kuota:{" "}
                                        <span className="font-medium text-foreground">
                                            {batch.remaining_quota}
                                        </span>
                                    </p>
                                )}
                            </CardContent>

                            <CardFooter>
                                <Button
                                    className="w-full"
                                    variant="secondary"
                                    asChild
                                >
                                    <Link to={`/batches/${batch.id}`}>
                                        Lihat Detail
                                    </Link>
                                </Button>
                            </CardFooter>
                        </Card>
                    ))}
                </div>
            )}

            {/* Pagination */}
            {!loading && totalPages > 1 && (
                <div className="flex items-center justify-center gap-4 pt-2">
                    <Button
                        variant="outline"
                        size="sm"
                        disabled={currentPage <= 1}
                        onClick={() => handleFilterChange("page", currentPage - 1)}
                    >
                        ← Sebelumnya
                    </Button>
                    <span className="text-sm text-muted-foreground">
                        Halaman {currentPage} / {totalPages}
                    </span>
                    <Button
                        variant="outline"
                        size="sm"
                        disabled={currentPage >= totalPages}
                        onClick={() => handleFilterChange("page", currentPage + 1)}
                    >
                        Selanjutnya →
                    </Button>
                </div>
            )}
        </div>
    );
};

export default BatchList;
