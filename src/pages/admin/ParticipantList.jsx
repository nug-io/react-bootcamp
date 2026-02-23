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
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
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

const ParticipantList = () => {
    // State
    const [enrollments, setEnrollments] = useState([]);
    const [batches, setBatches] = useState([]);
    const [loading, setLoading] = useState(true);

    // Filter, Pagination & Sort State
    const [queryParams, setQueryParams] = useState({
        page: 1,
        limit: 10,
        q: "",
        batchId: "ALL",
        orderBy: "enrolled_at",
        orderDir: "desc",
    });

    const [meta, setMeta] = useState({
        page: 1,
        limit: 10,
        total: 0,
        totalPages: 1,
    });

    // Fetch Batches for Filter Dropdown
    useEffect(() => {
        const fetchBatches = async () => {
            try {
                // Fetch enough batches for the dropdown
                const res = await api.get("/batch", { params: { limit: 100 } });
                setBatches(res.data || []);
            } catch (error) {
                console.error("Failed to fetch batches for filter", error);
            }
        };
        fetchBatches();
    }, []);

    // Fetch Participants
    const fetchParticipants = useCallback(async () => {
        setLoading(true);
        try {
            const params = {
                page: queryParams.page,
                limit: queryParams.limit,
                orderBy: queryParams.orderBy,
                orderDir: queryParams.orderDir,
            };

            if (queryParams.q) params.q = queryParams.q;
            if (queryParams.batchId && queryParams.batchId !== "ALL") {
                params.batchId = queryParams.batchId;
            }

            const res = await api.get("/enrollment", { params });
            setEnrollments(res.data || []);
            setMeta(
                res.meta || { page: 1, limit: 10, total: 0, totalPages: 1 },
            );
        } catch (error) {
            console.error(error);
            setEnrollments([]); // Clear on error or handle gracefully
        } finally {
            setLoading(false);
        }
    }, [queryParams]);

    useEffect(() => {
        fetchParticipants();
    }, [fetchParticipants]);

    // Handlers
    const handleSearch = (e) => {
        setQueryParams((prev) => ({
            ...prev,
            q: e.target.value,
            page: 1, // Reset to first page on search
        }));
    };

    const handleBatchFilter = (batchId) => {
        setQueryParams((prev) => ({
            ...prev,
            batchId,
            page: 1, // Reset to first page on filter change
        }));
    };

    const handlePageChange = (newPage) => {
        if (newPage >= 1 && newPage <= meta.totalPages) {
            setQueryParams((prev) => ({ ...prev, page: newPage }));
        }
    };

    const handleSort = (field) => {
        setQueryParams((prev) => ({
            ...prev,
            orderBy: field,
            orderDir:
                prev.orderBy === field && prev.orderDir === "asc"
                    ? "desc"
                    : "asc",
        }));
    };

    // Render Helpers
    const renderSortIcon = (field) => {
        if (queryParams.orderBy !== field)
            return <ArrowUpDown className="ml-2 h-4 w-4 opacity-50" />;
        return queryParams.orderDir === "asc" ? (
            <ArrowUp className="ml-2 h-4 w-4" />
        ) : (
            <ArrowDown className="ml-2 h-4 w-4" />
        );
    };

    const renderPageNumbers = () => {
        const pages = [];
        const maxPagesToShow = 5;
        let startPage = Math.max(1, meta.page - 2);
        let endPage = Math.min(meta.totalPages, startPage + maxPagesToShow - 1);

        if (endPage - startPage < maxPagesToShow - 1) {
            startPage = Math.max(1, endPage - maxPagesToShow + 1);
        }

        for (let i = startPage; i <= endPage; i++) {
            const isActive = i === meta.page;
            pages.push(
                <Button
                    key={i}
                    size="sm"
                    variant={isActive ? "default" : "outline"}
                    onClick={isActive ? undefined : () => handlePageChange(i)}
                    className={isActive ? "cursor-default" : ""}
                >
                    {i}
                </Button>,
            );
        }
        return pages;
    };

    return (
        <div className="space-y-6">
            <h3 className="text-2xl font-bold tracking-tight">
                Participant List
            </h3>

            {/* Filters Section */}
            <div className="flex flex-col md:flex-row gap-4 items-end md:items-center bg-card p-4 rounded-lg border shadow-sm">
                <div className="flex-1 w-full md:w-auto space-y-2">
                    <div className="relative">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search by name or email..."
                            className="pl-8"
                            value={queryParams.q}
                            onChange={handleSearch}
                        />
                    </div>
                </div>

                <div className="w-full md:w-64 space-y-2">
                    <Select
                        value={queryParams.batchId.toString()}
                        onValueChange={handleBatchFilter}
                    >
                        <SelectTrigger>
                            <SelectValue placeholder="Filter by Batch" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="ALL">All Batches</SelectItem>
                            {batches.map((batch) => (
                                <SelectItem
                                    key={batch.id}
                                    value={batch.id.toString()}
                                >
                                    {batch.title}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {/* Table Section */}
            <div className="border rounded-md shadow-sm bg-card">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[50px]">#</TableHead>
                            <TableHead>
                                <Button
                                    variant="ghost"
                                    onClick={() => handleSort("user.name")}
                                    className="-ml-4"
                                >
                                    User Name
                                    {renderSortIcon("user.name")}
                                </Button>
                            </TableHead>
                            <TableHead>
                                <Button
                                    variant="ghost"
                                    onClick={() => handleSort("user.email")}
                                    className="-ml-4"
                                >
                                    Email
                                    {renderSortIcon("user.email")}
                                </Button>
                            </TableHead>
                            <TableHead>Phone Number</TableHead>
                            <TableHead>
                                <Button
                                    variant="ghost"
                                    onClick={() => handleSort("batch.title")}
                                    className="-ml-4"
                                >
                                    Batch
                                    {renderSortIcon("batch.title")}
                                </Button>
                            </TableHead>
                            <TableHead>
                                <Button
                                    variant="ghost"
                                    onClick={() => handleSort("payment_status")}
                                    className="-ml-4"
                                >
                                    Payment Status
                                    {renderSortIcon("payment_status")}
                                </Button>
                            </TableHead>
                            <TableHead>
                                <Button
                                    variant="ghost"
                                    onClick={() => handleSort("enrolled_at")}
                                    className="-ml-4"
                                >
                                    Enrolled At
                                    {renderSortIcon("enrolled_at")}
                                </Button>
                            </TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell
                                    colSpan={6}
                                    className="text-center py-8"
                                >
                                    <Loader2 className="animate-spin h-8 w-8 mx-auto text-primary/50" />
                                </TableCell>
                            </TableRow>
                        ) : enrollments.length > 0 ? (
                            enrollments.map((enr, index) => (
                                <TableRow key={enr.id || index}>
                                    <TableCell>
                                        {(meta.page - 1) * meta.limit +
                                            index +
                                            1}
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
                                        <Badge
                                            variant={
                                                enr.payment_status === "PAID"
                                                    ? "default"
                                                    : enr.payment_status ===
                                                        "PENDING"
                                                      ? "warning" // Assuming we might need a custom variant or just use class
                                                      : "secondary"
                                            }
                                            className={
                                                enr.payment_status === "PAID"
                                                    ? "bg-green-600 hover:bg-green-700"
                                                    : enr.payment_status ===
                                                        "PENDING"
                                                      ? "bg-yellow-600 hover:bg-yellow-700"
                                                      : "bg-gray-500"
                                            }
                                        >
                                            {enr.payment_status}
                                        </Badge>
                                        {enr.payment_status === "PENDING" &&
                                            enr.expires_at && (
                                                <div className="text-xs text-muted-foreground mt-1">
                                                    Exp:{" "}
                                                    {format(
                                                        new Date(
                                                            enr.expires_at,
                                                        ),
                                                        "d MMM HH:mm",
                                                    )}
                                                </div>
                                            )}
                                    </TableCell>
                                    <TableCell>
                                        {enr.enrolled_at
                                            ? format(
                                                  new Date(enr.enrolled_at),
                                                  "d MMM yyyy, HH:mm",
                                              )
                                            : "-"}
                                    </TableCell>
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell
                                    colSpan={6}
                                    className="text-center py-12 text-muted-foreground"
                                >
                                    No participants found matching your
                                    criteria.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* Pagination Controls */}
            <div className="flex items-center justify-between">
                <div className="text-sm text-muted-foreground">
                    Page {meta.page} of {meta.totalPages} ({meta.total} items)
                </div>

                <div className="flex items-center space-x-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePageChange(meta.page - 1)}
                        disabled={meta.page <= 1}
                    >
                        <ChevronLeft className="h-4 w-4" />
                    </Button>

                    {renderPageNumbers()}

                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePageChange(meta.page + 1)}
                        disabled={meta.page >= meta.totalPages}
                    >
                        <ChevronRight className="h-4 w-4" />
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default ParticipantList;
