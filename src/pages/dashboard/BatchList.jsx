import { useState, useEffect, useCallback, useMemo } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { api } from "@/lib/api";
import TagFilter from "@/components/TagFilter";
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
import { format, differenceInDays, startOfDay } from "date-fns";
import { X, Search, Filter } from "lucide-react";

// ---------------------------------------------------------------------------
// Helper: build query string, skip empty/undefined values
// ---------------------------------------------------------------------------
function buildQueryString(params) {
    const qs = new URLSearchParams();
    Object.entries(params).forEach(([key, val]) => {
        if (val !== "" && val !== undefined && val !== null) {
            // Special handling for tags array
            if (key === "tags" && Array.isArray(val)) {
                if (val.length > 0) {
                    qs.set("tag", val.join(","));
                }
            } else {
                qs.set(key, val);
            }
        }
    });
    return qs.toString();
}

// ---------------------------------------------------------------------------
// Sub-component: Filter bar
// ---------------------------------------------------------------------------
function BatchFilterBar({ filters, onChange }) {
    return (
        <div className="space-y-6">
            {/* Row 1: Search & Basic Filters */}
            <div className="bg-muted/30 p-4 rounded-xl space-y-4">
                <div className="flex flex-col md:flex-row gap-4">
                    {/* Search */}
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            id="batch-search"
                            type="search"
                            placeholder="Cari judul batch..."
                            value={filters.q}
                            onChange={(e) => onChange("q", e.target.value)}
                            className="pl-9 bg-background"
                        />
                    </div>

                    <div className="flex flex-wrap gap-3">
                        {/* Type */}
                        <Select
                            value={filters.type || "all"}
                            onValueChange={(val) => onChange("type", val === "all" ? "" : val)}
                        >
                            <SelectTrigger id="batch-type" className="w-[160px] bg-background">
                                <SelectValue placeholder="Tipe" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Semua Tipe</SelectItem>
                                <SelectItem value="LIVE">Bootcamp (LIVE)</SelectItem>
                                <SelectItem value="COURSE">Course (COURSE)</SelectItem>
                            </SelectContent>
                        </Select>

                        {/* Status */}
                        <Select
                            value={filters.status}
                            onValueChange={(val) => onChange("status", val === "all" ? "" : val)}
                        >
                            <SelectTrigger id="batch-status" className="w-[160px] bg-background">
                                <SelectValue placeholder="Status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Semua Status</SelectItem>
                                <SelectItem value="OPEN">OPEN</SelectItem>
                                <SelectItem value="ONGOING">ONGOING</SelectItem>
                                <SelectItem value="CLOSED">CLOSED</SelectItem>
                            </SelectContent>
                        </Select>

                        {/* Kuota */}
                        <Select
                            value={filters.is_full}
                            onValueChange={(val) => onChange("is_full", val === "all" ? "" : val)}
                        >
                            <SelectTrigger id="batch-quota" className="w-[160px] bg-background">
                                <SelectValue placeholder="Kuota" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Semua Kuota</SelectItem>
                                <SelectItem value="false">Belum penuh</SelectItem>
                                <SelectItem value="true">Sudah penuh</SelectItem>
                            </SelectContent>
                        </Select>

                        {/* Sort */}
                        <Select
                            value={`${filters.orderBy}:${filters.orderDir}`}
                            onValueChange={(val) => {
                                const [orderBy, orderDir] = val.split(":");
                                onChange("orderBy", orderBy);
                                onChange("orderDir", orderDir);
                            }}
                        >
                            <SelectTrigger id="batch-sort" className="w-[180px] bg-background">
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
                </div>
            </div>
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
    type: "",
    tags: [],
    tagMode: "or",
    orderBy: "created_at",
    orderDir: "desc",
    page: 1,
    limit: 9,
};

const BatchList = () => {
    const [searchParams] = useSearchParams();
    
    // Initial filters state, merging DEFAULT with any URL params
    const [filters, setFilters] = useState(() => {
        const typeFromUrl = searchParams.get("type") || "";
        return {
            ...DEFAULT_FILTERS,
            type: typeFromUrl
        };
    });

    const [batches, setBatches] = useState([]);
    const [meta, setMeta] = useState(null);      // { page, limit, total, totalPages }
    const [summary, setSummary] = useState(null); // { open, ongoing, full, active, summaryByTag }
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Sync state with URL params if they change (e.g. navigation)
    useEffect(() => {
        const typeFromUrl = searchParams.get("type") || "";
        if (typeFromUrl !== filters.type) {
            setFilters(prev => ({ ...prev, type: typeFromUrl }));
        }
    }, [searchParams]);

    // Extract all unique tags with counts
    const availableTags = useMemo(() => {
        if (summary?.summaryByTag) {
            return summary.summaryByTag; // Returns { tag1: count, tag2: count }
        }
        // Fallback: collect from batches data with dummy counts or just as array
        const tagMap = {};
        batches.forEach((batch) => {
            if (batch.tags && Array.isArray(batch.tags)) {
                batch.tags.forEach((tag) => {
                    tagMap[tag] = (tagMap[tag] || 0) + 1;
                });
            }
        });
        return tagMap;
    }, [batches, summary]);

    // -----------------------------------------------------------------------
    // Fetch whenever filters change
    // -----------------------------------------------------------------------
    const fetchBatches = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const qs = buildQueryString(filters);
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

    const toggleTag = (tag) => {
        const currentTags = [...filters.tags];
        const index = currentTags.indexOf(tag);
        if (index > -1) {
            currentTags.splice(index, 1);
        } else {
            currentTags.push(tag);
        }
        handleFilterChange("tags", currentTags);
    };

    const clearAllFilters = () => {
        setFilters(DEFAULT_FILTERS);
    };

    // -----------------------------------------------------------------------
    // Render helpers
    // -----------------------------------------------------------------------
    const totalPages = meta?.totalPages ?? 1;
    const currentPage = filters.page;

    const hasActiveFilters = filters.tags.length > 0 || filters.q !== "" || filters.status !== "" || filters.is_full !== "" || filters.type !== "";

    return (
        <div className="container mx-auto p-6 space-y-8">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <h1 className="text-3xl font-extrabold tracking-tight">Pilih Batch</h1>
            </div>

            <div className="space-y-6">
                {/* Filter sections */}
                <div className="space-y-4">
                    <BatchFilterBar filters={filters} onChange={handleFilterChange} />
                    
                    <div className="space-y-3 px-1">
                        <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                            <Filter className="h-3.5 w-3.5" />
                            Filter per Topik
                        </div>
                        <TagFilter 
                            tags={availableTags} 
                            selectedTags={filters.tags} 
                            onToggle={toggleTag} 
                            limit={10}
                        />
                    </div>
                </div>

                {/* Active Filters Row */}
                {hasActiveFilters && (
                    <div className="flex flex-wrap items-center gap-2 py-3 border-t border-b">
                        <span className="text-sm font-medium text-muted-foreground mr-1">Filter Aktif:</span>
                        
                        {/* Type Chip */}
                        {filters.type && (
                            <Badge className="pl-3 pr-1 py-1 rounded-full bg-primary/10 text-primary border-primary/20 hover:bg-primary/15 transition-colors flex items-center gap-1">
                                Tipe: {filters.type}
                                <button 
                                    onClick={() => handleFilterChange("type", "")}
                                    className="p-0.5 hover:bg-primary/20 rounded-full transition-colors"
                                >
                                    <X className="h-3 w-3" />
                                </button>
                            </Badge>
                        )}

                        {filters.tags.map(tag => (
                            <Badge key={tag} className="pl-3 pr-1 py-1 rounded-full bg-primary/10 text-primary border-primary/20 hover:bg-primary/15 transition-colors flex items-center gap-1">
                                {tag}
                                <button 
                                    onClick={() => toggleTag(tag)}
                                    className="p-0.5 hover:bg-primary/20 rounded-full transition-colors"
                                >
                                    <X className="h-3 w-3" />
                                </button>
                            </Badge>
                        ))}

                        <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={clearAllFilters}
                            className="h-7 text-xs font-semibold hover:text-destructive hover:bg-destructive/5"
                        >
                            Hapus Semua
                        </Button>
                    </div>
                )}
            </div>

            {/* Error */}
            {error && (
                <div className="p-4 bg-destructive/5 border border-destructive/20 rounded-lg text-destructive text-sm font-medium">
                    {error}
                </div>
            )}

            {/* Result Count & Filter Feedback Row */}
            {!loading && meta && (
                <div className="flex items-center justify-between px-1 -mb-4">
                    <p className="text-sm font-medium text-muted-foreground">
                        Menampilkan <span className="text-foreground font-bold">{meta.total}</span> hasil
                    </p>
                    {hasActiveFilters && (
                        <p className="text-xs text-primary/80 font-medium italic">
                            Hasil disesuaikan dengan filter
                        </p>
                    )}
                </div>
            )}

            {/* Loading skeleton */}
            {loading ? (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {Array.from({ length: filters.limit }).map((_, i) => (
                        <Skeleton key={i} className="h-[250px] w-full rounded-xl" />
                    ))}
                </div>
            ) : batches.length === 0 ? (
                <div className="text-center py-24 bg-muted/10 rounded-3xl border-2 border-dashed border-muted-foreground/20 space-y-4">
                    <div className="bg-muted w-16 h-16 rounded-full flex items-center justify-center mx-auto text-2xl">
                        🔍
                    </div>
                    <div className="space-y-2">
                        <h3 className="text-xl font-bold">Ups! Tidak ada batch ditemukan</h3>
                        <p className="text-muted-foreground max-w-xs mx-auto text-sm">
                            Coba ubah kata kunci pencarian atau reset filter untuk melihat pilihan lainnya.
                        </p>
                    </div>
                    <Button variant="outline" onClick={clearAllFilters} className="rounded-full px-8">
                        Mulai Ulang Pencarian
                    </Button>
                </div>
            ) : (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {batches.map((batch) => {
                        const daysUntilStart = differenceInDays(
                            startOfDay(new Date(batch.start_date)),
                            startOfDay(new Date())
                        );

                        return (
                            <Card key={batch.id} className="flex flex-col group hover:border-primary/50 transition-all duration-300 shadow-sm hover:shadow-md">
                                <CardHeader className="pb-3">
                                    <div className="flex justify-between items-start gap-2">
                                        <CardTitle className="leading-snug text-lg">
                                            {batch.title}
                                        </CardTitle>
                                        <div className="flex flex-col gap-1 items-end shrink-0">
                                            {batch.type === "COURSE" ? (
                                                <Badge
                                                    variant="outline"
                                                    className="text-[10px] px-2.5 py-0.5 font-bold uppercase tracking-wider border-primary/30 text-primary"
                                                >
                                                    Course
                                                </Badge>
                                            ) : (
                                                <>
                                                    <Badge variant={statusVariant(batch.status_effective)} className="px-2 py-0 text-[10px]">
                                                        {batch.status_effective}
                                                    </Badge>
                                                    {batch.is_full && (
                                                        <Badge variant="destructive" className="px-2 py-0 text-[10px]">
                                                            Penuh
                                                        </Badge>
                                                    )}
                                                </>
                                            )}
                                        </div>
                                    </div>
                                    <CardDescription className="text-xs">
                                        {batch.type === "COURSE" ? (
                                            <span className="text-primary font-semibold">
                                                Video Learning
                                            </span>
                                        ) : (
                                            <>
                                                Start:{" "}
                                                {format(new Date(batch.start_date), "d MMM yyyy")}
                                            </>
                                        )}
                                    </CardDescription>
                                </CardHeader>

                                <CardContent className="flex-1 space-y-4 text-sm pb-4">
                                    <div className="space-y-2">
                                        <div className="flex items-baseline justify-between gap-2">
                                            <p className="text-xl font-bold text-primary">
                                                Rp{" "}
                                                {parseInt(batch.price).toLocaleString("id-ID")}
                                            </p>
                                            
                                            {/* Smart Urgency/Scarcity Highlights - ONLY for LIVE */}
                                            {batch.type === "LIVE" && (
                                                <div className="flex flex-wrap gap-2 justify-end">
                                                    {batch.remaining_quota > 0 && batch.remaining_quota <= 5 && (
                                                        <Badge variant="outline" className="text-[10px] border-orange-200 bg-orange-50 text-orange-700 font-bold px-2 py-0">
                                                            🔥 Sisa {batch.remaining_quota} kursi
                                                        </Badge>
                                                    )}
                                                    {daysUntilStart >= 0 && daysUntilStart <= 3 && (
                                                        <Badge variant="outline" className="text-[10px] border-blue-200 bg-blue-50 text-blue-700 font-bold px-2 py-0">
                                                            ⏰ {daysUntilStart === 0 ? "Mulai Hari Ini" : `Mulai dlm ${daysUntilStart} hari`}
                                                        </Badge>
                                                    )}
                                                </div>
                                            )}
                                        </div>

                                        <div className="space-y-1 text-muted-foreground text-xs font-medium border-t pt-3">
                                            {batch.type === "LIVE" ? (
                                                <>
                                                    <p>
                                                        {batch.end_date
                                                            ? `Selesai: ${format(new Date(batch.end_date), "d MMM yyyy")}`
                                                            : "Durasi: 1 Bulan"}
                                                    </p>
                                                    {batch.remaining_quota !== undefined && (
                                                        <p className={batch.remaining_quota < 5 ? "text-orange-600 font-bold" : ""}>
                                                            Sisa kuota: {batch.remaining_quota}
                                                        </p>
                                                    )}
                                                </>
                                            ) : (
                                                <>
                                                    <p className="flex items-center gap-1.5">
                                                        <span>✨</span> Belajar kapan saja, di mana saja
                                                    </p>
                                                    <p className="flex items-center gap-1.5">
                                                        <span>🚀</span> Akses materi seumur hidup
                                                    </p>
                                                </>
                                            )}
                                        </div>
                                    </div>

                                    {/* Display Batch Tags */}
                                    {batch.tags && batch.tags.length > 0 && (
                                        <div className="flex flex-wrap gap-1.5 pt-1">
                                            {batch.tags.map((tag) => (
                                                <Badge 
                                                    key={tag} 
                                                    variant="outline" 
                                                    className="text-[10px] px-2 py-0 font-normal rounded-full border-muted-foreground/10 bg-muted/30"
                                                >
                                                    {tag}
                                                </Badge>
                                            ))}
                                        </div>
                                    )}
                                </CardContent>

                                <CardFooter className="pt-0">
                                    <Button
                                        className="w-full font-semibold"
                                        asChild
                                    >
                                        <Link to={`/batches/${batch.id}`}>
                                            Lihat Detail
                                        </Link>
                                    </Button>
                                </CardFooter>
                            </Card>
                        );
                    })}
                </div>
            )}

            {/* Pagination */}
            {!loading && totalPages > 1 && (
                <div className="flex items-center justify-center gap-4 pt-4 border-t">
                    <Button
                        variant="outline"
                        size="sm"
                        disabled={currentPage <= 1}
                        onClick={() => handleFilterChange("page", currentPage - 1)}
                        className="rounded-full px-4"
                    >
                        ← Sebelumnya
                    </Button>
                    <span className="text-sm font-medium">
                        Halaman <span className="text-primary">{currentPage}</span> / {totalPages}
                    </span>
                    <Button
                        variant="outline"
                        size="sm"
                        disabled={currentPage >= totalPages}
                        onClick={() => handleFilterChange("page", currentPage + 1)}
                        className="rounded-full px-4"
                    >
                        Selanjutnya →
                    </Button>
                </div>
            )}
        </div>
    );
};

export default BatchList;
