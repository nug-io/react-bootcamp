import { useState, useEffect, useCallback } from "react";
import { api } from "@/lib/api";
import { extractErrorMessage } from "@/lib/utils";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
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
import { Checkbox } from "@/components/ui/checkbox";
import {
    Plus,
    Edit,
    CheckCircle,
    XCircle,
    Loader2,
    Search,
    ChevronLeft,
    ChevronRight,
    ArrowUpDown,
    ArrowUp,
    ArrowDown,
    Eye,
} from "lucide-react";
import toast from "react-hot-toast";

const BatchManager = () => {
    const [batches, setBatches] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingBatch, setEditingBatch] = useState(null);

    // Mentor Selection State
    const [mentorsList, setMentorsList] = useState([]);
    const [loadingMentors, setLoadingMentors] = useState(false);
    const [selectedMentors, setSelectedMentors] = useState([]);

    // Summary State (Backend-driven)
    const [summary, setSummary] = useState({
        active: 0,
        open: 0,
        ongoing: 0,
        full: 0,
    });

    // Filter, Pagination & Sort State
    const [queryParams, setQueryParams] = useState({
        page: 1,
        limit: 10,
        q: "",
        liveStatus: "ALL",
        courseStatus: "ALL",
        type: "LIVE",
        is_full: false,
        orderBy: "created_at",
        orderDir: "desc",
    });

    const [meta, setMeta] = useState({
        page: 1,
        limit: 10,
        total: 0,
        totalPages: 1,
    });

    // Form State
    const [formData, setFormData] = useState({
        title: "",
        description: "",
        type: "LIVE",
        tags: "",
        start_date: "",
        end_date: "",
        price: "",
        quota: "",
        status: "ACTIVE",
    });

    const fetchMentors = useCallback(async () => {
        setLoadingMentors(true);
        try {
            const res = await api.get("/mentor", { params: { mode: "list" } });
            setMentorsList(res.data || []);
        } catch (error) {
            console.error("Failed to fetch mentors", error);
        } finally {
            setLoadingMentors(false);
        }
    }, []);

    const fetchBatches = useCallback(async () => {
        setLoading(true);
        try {
            const params = {
                page: queryParams.page,
                limit: queryParams.limit,
                orderBy: queryParams.orderBy,
                orderDir: queryParams.orderDir,
            };

            if (queryParams.q) params.q = queryParams.q;

            // Use context-aware status
            const currentStatus =
                queryParams.type === "LIVE"
                    ? queryParams.liveStatus
                    : queryParams.courseStatus;

            if (currentStatus && currentStatus !== "ALL")
                params.status = currentStatus;

            if (queryParams.type && queryParams.type !== "ALL")
                params.type = queryParams.type;

            if (queryParams.is_full) params.is_full = true;

            const res = await api.get("/batch", { params });
            setBatches(res.data || []);
            setMeta(
                res.meta || {
                    page: 1,
                    limit: 10,
                    total: 0,
                    totalPages: 1,
                },
            );
            // Set summary directly from backend response
            setSummary(
                res.summary || {
                    active: 0,
                    open: 0,
                    ongoing: 0,
                    full: 0,
                },
            );
        } catch (error) {
            console.error(error);
            toast.error("Failed to fetch batches");
        } finally {
            setLoading(false);
        }
    }, [queryParams]);

    useEffect(() => {
        fetchBatches();
    }, [fetchBatches]);

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

    const handleSearch = (e) => {
        setQueryParams((prev) => ({
            ...prev,
            q: e.target.value,
            page: 1, // Reset page on search
        }));
    };

    const handlePageChange = (newPage) => {
        if (newPage >= 1 && newPage <= meta.totalPages) {
            setQueryParams((prev) => ({ ...prev, page: newPage }));
        }
    };

    const handleTabChange = (type) => {
        setQueryParams((prev) => ({
            ...prev,
            type,
            page: 1,
        }));
    };

    // Dialog & Form Handlers
    const handleOpenDialog = async (batch = null) => {
        if (mentorsList.length === 0) fetchMentors();

        if (batch) {
            setEditingBatch(batch);
            const initialData = {
                title: batch.title,
                description: batch.description || "",
                type: batch.type || "LIVE",
                tags: batch.tags ? batch.tags.join(", ") : "",
                start_date: batch.start_date
                    ? formatDateLocal(batch.start_date)
                    : "",
                end_date: batch.end_date ? formatDateLocal(batch.end_date) : "",
                price: Number(batch.price),
                quota: Number(batch.quota),
                status: batch.status,
            };
            setFormData(initialData);
            setSelectedMentors([]);
            setIsDialogOpen(true);

            // Fetch detailed batch for mentors
            try {
                const res = await api.get(`/batch/${batch.id}`);
                if (res.data && res.data.mentors) {
                    setSelectedMentors(res.data.mentors.map((m) => m.id));
                }
            } catch (error) {
                console.error("Failed to fetch batch mentors:", error);
            }
        } else {
            setEditingBatch(null);
            setFormData({
                title: "",
                description: "",
                type: queryParams.type || "LIVE", // Default to current tab type
                tags: "",
                start_date: "",
                end_date: "",
                price: "",
                quota: "",
                status: "ACTIVE",
            });
            setSelectedMentors([]);
            setIsDialogOpen(true);
        }
    };

    const handleSave = async (e) => {
        e.preventDefault();
        try {
            const payload = {
                ...formData,
                tags: formData.tags
                    ? formData.tags
                          .split(",")
                          .map((t) => t.trim())
                          .filter(Boolean)
                    : [],
                mentors: selectedMentors,
            };

            // Remove invalid fields for COURSE
            if (payload.type === "COURSE") {
                delete payload.start_date;
                delete payload.end_date;
                delete payload.quota;
            }

            if (editingBatch) {
                await api.put(`/batch/${editingBatch.id}`, payload);
                toast.success("Batch updated");
            } else {
                await api.post("/batch", payload);
                toast.success("Batch created");
            }
            setIsDialogOpen(false);
            fetchBatches();
        } catch (error) {
            console.error(error);
            toast.error(extractErrorMessage(error));
        }
    };

    const toggleMentorSelection = (mentorId) => {
        setSelectedMentors((prev) =>
            prev.includes(mentorId)
                ? prev.filter((id) => id !== mentorId)
                : [...prev, mentorId],
        );
    };

    const toggleStatus = async (batch) => {
        try {
            const newStatus = batch.status === "ACTIVE" ? "CLOSED" : "ACTIVE";
            await api.put(`/batch/${batch.id}`, { status: newStatus });
            toast.success(`Batch ${newStatus}`);
            fetchBatches();
        } catch (error) {
            toast.error("Failed to update status");
        }
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

    const isStartingSoon = (dateStr) => {
        if (!dateStr) return false;
        const start = new Date(dateStr);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const diff = (start - today) / (1000 * 60 * 60 * 24);
        return diff >= 0 && diff <= 3;
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

    const formatDateLocal = (dateString) => {
        const date = new Date(dateString);

        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, "0");
        const day = String(date.getDate()).padStart(2, "0");

        return `${year}-${month}-${day}`;
    };

    return (
        <div className="space-y-6">
            <div>
                <h3 className="text-2xl font-bold tracking-tight">Batches</h3>
                <p className="text-muted-foreground">
                    Manage your live bootcamps and courses
                </p>
            </div>

            {/* Summary Cards Section (Backend Driven) */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {queryParams.type === "LIVE" ? (
                    <>
                        <div className="bg-card border rounded-lg p-4 shadow-sm">
                            <div className="text-sm font-medium text-muted-foreground">
                                Active Batches
                            </div>
                            <div className="text-2xl font-bold">
                                {summary.active}
                            </div>
                        </div>
                        <div className="bg-card border rounded-lg p-4 shadow-sm">
                            <div className="text-sm font-medium text-muted-foreground">
                                Open for Enrollment
                            </div>
                            <div className="text-2xl font-bold text-green-600">
                                {summary.open}
                            </div>
                        </div>
                        <div className="bg-card border rounded-lg p-4 shadow-sm">
                            <div className="text-sm font-medium text-muted-foreground">
                                Ongoing Classes
                            </div>
                            <div className="text-2xl font-bold text-blue-600">
                                {summary.ongoing}
                            </div>
                        </div>
                        <div className="bg-card border rounded-lg p-4 shadow-sm">
                            <div className="text-sm font-medium text-muted-foreground">
                                Full Capacity
                            </div>
                            <div className="text-2xl font-bold text-red-600">
                                {summary.full}
                            </div>
                        </div>
                    </>
                ) : (
                    <>
                        <div className="bg-card border rounded-lg p-4 shadow-sm">
                            <div className="text-sm font-medium text-muted-foreground">
                                Total Courses
                            </div>
                            <div className="text-2xl font-bold">
                                {meta.total}
                            </div>
                        </div>
                        <div className="bg-card border rounded-lg p-4 shadow-sm">
                            <div className="text-sm font-medium text-muted-foreground">
                                Active Courses
                            </div>
                            <div className="text-2xl font-bold text-green-600">
                                {summary.active}
                            </div>
                        </div>
                        <div className="bg-card border rounded-lg p-4 shadow-sm">
                            <div className="text-sm font-medium text-muted-foreground">
                                Inactive Courses
                            </div>
                            <div className="text-2xl font-bold text-muted-foreground">
                                {Math.max(0, meta.total - summary.active)}
                            </div>
                        </div>
                    </>
                )}
            </div>

            {/* Main Content Card: Tabs + Filters + Table + Pagination */}
            <div className="bg-card border rounded-lg shadow-sm overflow-hidden">
                {/* Tabs Switcher (Segmented Control style) */}
                <div className="flex bg-muted/50 p-1.5 gap-1.5">
                    <button
                        className={`flex-1 flex items-center justify-center gap-2 py-2 text-sm font-medium transition-all rounded-md ${
                            queryParams.type === "LIVE"
                                ? "bg-primary/10 text-primary shadow-sm"
                                : "text-muted-foreground hover:bg-muted"
                        }`}
                        onClick={() => handleTabChange("LIVE")}
                    >
                        Live Bootcamp
                        {queryParams.type === "LIVE" && (
                            <span className="bg-primary/20 px-1.5 rounded text-[10px]">
                                {meta.total}
                            </span>
                        )}
                    </button>
                    <button
                        className={`flex-1 flex items-center justify-center gap-2 py-2 text-sm font-medium transition-all rounded-md ${
                            queryParams.type === "COURSE"
                                ? "bg-primary/10 text-primary shadow-sm"
                                : "text-muted-foreground hover:bg-muted"
                        }`}
                        onClick={() => handleTabChange("COURSE")}
                    >
                        Course
                        {queryParams.type === "COURSE" && (
                            <span className="bg-primary/20 px-1.5 rounded text-[10px]">
                                {meta.total}
                            </span>
                        )}
                    </button>
                </div>

                {/* Visual Header: Filters & Actions */}
                <div className="p-4 border-b flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                    {/* Left: Filters */}
                    <div className="flex flex-col sm:flex-row gap-4 w-full lg:w-auto items-start sm:items-center flex-1">
                        <div className="relative w-full sm:w-64">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search by title..."
                                className="pl-8"
                                value={queryParams.q}
                                onChange={handleSearch}
                            />
                        </div>

                        <Select
                            value={
                                queryParams.type === "LIVE"
                                    ? queryParams.liveStatus
                                    : queryParams.courseStatus
                            }
                            onValueChange={(val) =>
                                setQueryParams((prev) => ({
                                    ...prev,
                                    [prev.type === "LIVE"
                                        ? "liveStatus"
                                        : "courseStatus"]: val,
                                    page: 1,
                                }))
                            }
                        >
                            <SelectTrigger className="w-full sm:w-[150px]">
                                <SelectValue placeholder="Filter Status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="ALL">All Status</SelectItem>
                                {queryParams.type === "LIVE" ? (
                                    <>
                                        <SelectItem value="OPEN">
                                            Open
                                        </SelectItem>
                                        <SelectItem value="ONGOING">
                                            Ongoing
                                        </SelectItem>
                                        <SelectItem value="FULL">
                                            Full
                                        </SelectItem>
                                        <SelectItem value="CLOSED">
                                            Closed
                                        </SelectItem>
                                    </>
                                ) : (
                                    <>
                                        <SelectItem value="ACTIVE">
                                            Active
                                        </SelectItem>
                                        <SelectItem value="CLOSED">
                                            Closed
                                        </SelectItem>
                                    </>
                                )}
                            </SelectContent>
                        </Select>

                        {queryParams.type === "LIVE" && (
                            <div className="flex items-center space-x-2">
                                <Checkbox
                                    id="is_full"
                                    checked={queryParams.is_full}
                                    onCheckedChange={(checked) =>
                                        setQueryParams((prev) => ({
                                            ...prev,
                                            is_full: checked,
                                            page: 1,
                                        }))
                                    }
                                />
                                <Label
                                    htmlFor="is_full"
                                    className="cursor-pointer whitespace-nowrap text-sm"
                                >
                                    Only Full
                                </Label>
                            </div>
                        )}
                    </div>

                    {/* Right: Primary Action */}
                    <Button onClick={() => handleOpenDialog()}>
                        <Plus className="h-4 w-4 mr-2" />
                        {queryParams.type === "LIVE"
                            ? "Create Live Bootcamp"
                            : "Create Course"}
                    </Button>
                </div>

                {/* Table Section */}
                <div className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow className="hover:bg-transparent">
                                <TableHead className="w-[50px] font-bold">
                                    #
                                </TableHead>
                                <TableHead className="font-bold">
                                    <Button
                                        variant="ghost"
                                        onClick={() => handleSort("title")}
                                        className="-ml-4 hover:bg-transparent font-bold"
                                    >
                                        Title
                                        {renderSortIcon("title")}
                                    </Button>
                                </TableHead>
                                {queryParams.type === "LIVE" && (
                                    <>
                                        <TableHead className="font-bold">
                                            <Button
                                                variant="ghost"
                                                onClick={() =>
                                                    handleSort("start_date")
                                                }
                                                className="-ml-4 hover:bg-transparent font-bold"
                                            >
                                                Start Date
                                                {renderSortIcon("start_date")}
                                            </Button>
                                        </TableHead>
                                    </>
                                )}
                                <TableHead className="font-bold">
                                    <Button
                                        variant="ghost"
                                        onClick={() => handleSort("price")}
                                        className="-ml-4 hover:bg-transparent font-bold"
                                    >
                                        Price
                                        {renderSortIcon("price")}
                                    </Button>
                                </TableHead>
                                {queryParams.type === "LIVE" && (
                                    <TableHead className="font-bold">
                                        <Button
                                            variant="ghost"
                                            onClick={() =>
                                                handleSort("remaining_quota")
                                            }
                                            className="-ml-4 hover:bg-transparent font-bold"
                                        >
                                            Quota
                                            {renderSortIcon("remaining_quota")}
                                        </Button>
                                    </TableHead>
                                )}
                                <TableHead className="font-bold">
                                    Status
                                </TableHead>
                                <TableHead className="text-right font-bold">
                                    Actions
                                </TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell
                                        colSpan={
                                            queryParams.type === "LIVE" ? 7 : 5
                                        }
                                        className="text-center py-8"
                                    >
                                        <Loader2 className="animate-spin h-8 w-8 mx-auto text-primary/50" />
                                    </TableCell>
                                </TableRow>
                            ) : batches.length > 0 ? (
                                batches.map((batch, index) => (
                                    <TableRow
                                        key={batch.id}
                                        className={`transition-colors py-4 ${
                                            batch.type === "LIVE" &&
                                            batch.is_full
                                                ? "bg-destructive/5"
                                                : batch.type === "LIVE" &&
                                                    batch.remaining_quota <= 5
                                                  ? "bg-primary/5"
                                                  : ""
                                        }`}
                                    >
                                        <TableCell>
                                            {(meta.page - 1) * meta.limit +
                                                index +
                                                1}
                                        </TableCell>
                                        <TableCell className="font-medium py-3">
                                            <div className="flex flex-col gap-1">
                                                <span className="text-base">
                                                    {batch.title}
                                                </span>
                                                {batch.type === "COURSE" && (
                                                    <span className="text-xs text-muted-foreground font-normal">
                                                        Self-paced learning, no
                                                        schedule
                                                    </span>
                                                )}
                                                {batch.type === "LIVE" && (
                                                    <div className="flex flex-wrap gap-1 mt-1">
                                                        {batch.remaining_quota !==
                                                            null &&
                                                            batch.remaining_quota <=
                                                                5 &&
                                                            batch.remaining_quota >
                                                                0 && (
                                                                <Badge
                                                                    variant="outline"
                                                                    className="text-[10px] px-1.5 py-0 h-4 border-orange-200 bg-orange-50 text-orange-700"
                                                                >
                                                                    🔥 Almost
                                                                    Full
                                                                </Badge>
                                                            )}
                                                        {isStartingSoon(
                                                            batch.start_date,
                                                        ) && (
                                                            <Badge
                                                                variant="outline"
                                                                className="text-[10px] px-1.5 py-0 h-4 border-blue-200 bg-blue-50 text-blue-700"
                                                            >
                                                                ⏰ Starting Soon
                                                            </Badge>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        </TableCell>
                                        {queryParams.type === "LIVE" && (
                                            <TableCell>
                                                {batch.start_date
                                                    ? format(
                                                          new Date(
                                                              batch.start_date,
                                                          ),
                                                          "d MMM yyyy",
                                                      )
                                                    : "-"}
                                            </TableCell>
                                        )}
                                        <TableCell>
                                            Rp{" "}
                                            {parseInt(
                                                batch.price,
                                            ).toLocaleString("id-ID")}
                                        </TableCell>
                                        {queryParams.type === "LIVE" && (
                                            <TableCell>
                                                <div className="flex items-center gap-2">
                                                    <span
                                                        className={
                                                            batch.remaining_quota ===
                                                            0
                                                                ? "text-red-600 font-bold"
                                                                : ""
                                                        }
                                                    >
                                                        {batch.enrolled_count}
                                                    </span>
                                                    <span className="text-muted-foreground text-xs">
                                                        / {batch.quota}
                                                    </span>
                                                </div>
                                            </TableCell>
                                        )}
                                        <TableCell>
                                            {batch.type === "LIVE" ? (
                                                <Badge
                                                    variant={
                                                        batch.status_effective ===
                                                        "OPEN"
                                                            ? "default"
                                                            : batch.status_effective ===
                                                                "CLOSED"
                                                              ? "destructive"
                                                              : "secondary"
                                                    }
                                                >
                                                    {batch.status_effective}
                                                </Badge>
                                            ) : (
                                                <Badge
                                                    variant={
                                                        batch.status ===
                                                        "ACTIVE"
                                                            ? "default"
                                                            : "destructive"
                                                    }
                                                >
                                                    {batch.status === "ACTIVE"
                                                        ? "Active"
                                                        : "Closed"}
                                                </Badge>
                                            )}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex items-center justify-end gap-1">
                                                <Button
                                                    size="icon"
                                                    variant="ghost"
                                                    className="h-8 w-8"
                                                    onClick={() =>
                                                        console.log(
                                                            "View Batch",
                                                            batch.id,
                                                        )
                                                    }
                                                    title="View Details"
                                                >
                                                    <Eye className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    size="icon"
                                                    variant="ghost"
                                                    className="h-8 w-8"
                                                    onClick={() =>
                                                        toggleStatus(batch)
                                                    }
                                                    title={
                                                        batch.status ===
                                                        "ACTIVE"
                                                            ? "Close Batch"
                                                            : "Re-activate Batch"
                                                    }
                                                >
                                                    {batch.status ===
                                                    "ACTIVE" ? (
                                                        <XCircle className="h-4 w-4 text-red-500" />
                                                    ) : (
                                                        <CheckCircle className="h-4 w-4 text-green-500" />
                                                    )}
                                                </Button>
                                                <Button
                                                    size="icon"
                                                    variant="ghost"
                                                    className="h-8 w-8"
                                                    onClick={() =>
                                                        handleOpenDialog(batch)
                                                    }
                                                    title="Edit Batch"
                                                >
                                                    <Edit className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell
                                        colSpan={
                                            queryParams.type === "LIVE" ? 7 : 5
                                        }
                                        className="text-center py-12 text-muted-foreground"
                                    >
                                        No batches found matching your criteria.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>

                {/* Pagination Controls */}
                <div className="p-4 border-t flex items-center justify-between">
                    <div className="text-sm text-muted-foreground">
                        Page {meta.page} of {meta.totalPages} ({meta.total}{" "}
                        items)
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

            {/* Create/Edit Dialog */}
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>
                            {editingBatch ? "Edit Batch" : "Create New Batch"}
                        </DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleSave} className="space-y-4">
                        <div className="space-y-2">
                            <Label>Title</Label>
                            <Input
                                value={formData.title}
                                onChange={(e) =>
                                    setFormData({
                                        ...formData,
                                        title: e.target.value,
                                    })
                                }
                                required
                                placeholder="Fullstack Batch 1"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Description</Label>
                            <textarea
                                className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                value={formData.description}
                                onChange={(e) =>
                                    setFormData({
                                        ...formData,
                                        description: e.target.value,
                                    })
                                }
                                placeholder="Describe this batch..."
                                rows={3}
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Batch Type</Label>
                                <Select
                                    value={formData.type}
                                    onValueChange={(val) =>
                                        setFormData({
                                            ...formData,
                                            type: val,
                                            // Reset fields if switching to COURSE
                                            ...(val === "COURSE" && {
                                                start_date: "",
                                                end_date: "",
                                                quota: "",
                                            }),
                                        })
                                    }
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select type" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="LIVE">
                                            LIVE
                                        </SelectItem>
                                        <SelectItem value="COURSE">
                                            COURSE
                                        </SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label>Status</Label>
                                <select
                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                                    value={formData.status}
                                    onChange={(e) =>
                                        setFormData({
                                            ...formData,
                                            status: e.target.value,
                                        })
                                    }
                                >
                                    <option value="ACTIVE">ACTIVE</option>
                                    <option value="CLOSED">CLOSED</option>
                                </select>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label>Mentors</Label>
                            <div className="border rounded-md p-3 max-h-40 overflow-y-auto space-y-2 bg-muted/5">
                                {loadingMentors ? (
                                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                        <Loader2 className="h-3 w-3 animate-spin" />
                                        Loading mentors...
                                    </div>
                                ) : mentorsList.length === 0 ? (
                                    <div className="text-xs text-muted-foreground italic">
                                        No mentors available
                                    </div>
                                ) : (
                                    mentorsList.map((mentor) => (
                                        <div
                                            key={mentor.id}
                                            className="flex items-center space-x-2"
                                        >
                                            <Checkbox
                                                id={`mentor-${mentor.id}`}
                                                checked={selectedMentors.includes(
                                                    mentor.id,
                                                )}
                                                onCheckedChange={() =>
                                                    toggleMentorSelection(
                                                        mentor.id,
                                                    )
                                                }
                                            />
                                            <Label
                                                htmlFor={`mentor-${mentor.id}`}
                                                className="text-sm font-normal cursor-pointer flex-1"
                                            >
                                                {mentor.name}{" "}
                                                <span className="text-[10px] text-muted-foreground">
                                                    ({mentor.user?.email})
                                                </span>
                                            </Label>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label>Tags</Label>
                            <Input
                                value={formData.tags}
                                onChange={(e) =>
                                    setFormData({
                                        ...formData,
                                        tags: e.target.value,
                                    })
                                }
                                placeholder="e.g. react, frontend, beginner"
                            />
                        </div>

                        {formData.type === "LIVE" && (
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Start Date</Label>
                                    <Input
                                        type="date"
                                        value={formData.start_date}
                                        onChange={(e) =>
                                            setFormData({
                                                ...formData,
                                                start_date: e.target.value,
                                            })
                                        }
                                        required={formData.type === "LIVE"}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>End Date</Label>
                                    <Input
                                        type="date"
                                        value={formData.end_date}
                                        onChange={(e) =>
                                            setFormData({
                                                ...formData,
                                                end_date: e.target.value,
                                            })
                                        }
                                    />
                                </div>
                            </div>
                        )}

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Price</Label>
                                <Input
                                    type="number"
                                    value={formData.price}
                                    onChange={(e) =>
                                        setFormData({
                                            ...formData,
                                            price: Number(e.target.value),
                                        })
                                    }
                                    required
                                    placeholder="5000000"
                                />
                            </div>
                            {formData.type === "LIVE" && (
                                <div className="space-y-2">
                                    <Label>Quota</Label>
                                    <Input
                                        type="number"
                                        value={formData.quota}
                                        onChange={(e) =>
                                            setFormData({
                                                ...formData,
                                                quota: Number(e.target.value),
                                            })
                                        }
                                        required={formData.type === "LIVE"}
                                        placeholder="50"
                                    />
                                </div>
                            )}
                        </div>

                        <DialogFooter>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setIsDialogOpen(false)}
                            >
                                Cancel
                            </Button>
                            <Button type="submit">Save Changes</Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default BatchManager;
