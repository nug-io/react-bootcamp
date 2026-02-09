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
    Trash,
    CheckCircle,
    XCircle,
    Loader2,
    Search,
    ChevronLeft,
    ChevronRight,
    ArrowUpDown,
    ArrowUp,
    ArrowDown,
} from "lucide-react";
import toast from "react-hot-toast";
import { useSearchParams } from "react-router-dom";

const BatchManager = () => {
    // URL Search Params for persistency (optional, but good practice)
    // For simplicity as requested ("simple flow"), we'll stick to local state mainly,
    // but using useSearchParams can be a nice touch if desired later.
    // Sticking to useState for simplicity as per "junior friendly" request.

    const [batches, setBatches] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingBatch, setEditingBatch] = useState(null);

    // Filter & Sort State
    const [queryParams, setQueryParams] = useState({
        page: 1,
        limit: 10,
        q: "",
        status: "ALL", // ALL is client-side concept for "no filter"
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
        start_date: "",
        end_date: "",
        price: "",
        quota: "",
        status: "ACTIVE",
    });

    const fetchBatches = useCallback(async () => {
        setLoading(true);
        try {
            // Build query params
            const params = {
                page: queryParams.page,
                limit: queryParams.limit,
                orderBy: queryParams.orderBy,
                orderDir: queryParams.orderDir,
            };

            if (queryParams.q) params.q = queryParams.q;
            if (queryParams.status && queryParams.status !== "ALL")
                params.status = queryParams.status;
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
        } catch (error) {
            console.error(error);
            toast.error("Failed to fetch batches");
        } finally {
            setLoading(false);
        }
    }, [queryParams]); // Re-fetch when params change

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
        e.preventDefault();
        // Trigger fetch via state change
        // State update already triggers useEffect
    };

    const handlePageChange = (newPage) => {
        if (newPage >= 1 && newPage <= meta.totalPages) {
            setQueryParams((prev) => ({ ...prev, page: newPage }));
        }
    };

    const handleOpenDialog = (batch = null) => {
        if (batch) {
            setEditingBatch(batch);
            setFormData({
                title: batch.title,
                start_date: batch.start_date
                    ? batch.start_date.split("T")[0]
                    : "",
                end_date: batch.end_date ? batch.end_date.split("T")[0] : "",
                price: Number(batch.price),
                quota: Number(batch.quota),
                status: batch.status,
            });
        } else {
            setEditingBatch(null);
            setFormData({
                title: "",
                start_date: "",
                end_date: "",
                price: "",
                quota: "",
                status: "ACTIVE",
            });
        }
        setIsDialogOpen(true);
    };

    const handleSave = async (e) => {
        e.preventDefault();

        try {
            if (editingBatch) {
                await api.put(`/batch/${editingBatch.id}`, formData);
                toast.success("Batch updated");
            } else {
                await api.post("/batch", formData);
                toast.success("Batch created");
            }
            setIsDialogOpen(false);
            fetchBatches(); // Refresh list
        } catch (error) {
            console.error(error);
            toast.error(extractErrorMessage(error));
        }
    };

    // Helper to toggle status quickly
    const toggleStatus = async (batch) => {
        try {
            const newStatus = batch.status === "ACTIVE" ? "CLOSED" : "ACTIVE";
            await api.put(`/batch/${batch.id}`, {
                status: newStatus,
            });
            toast.success(`Batch ${newStatus}`);
            fetchBatches();
        } catch (error) {
            toast.error("Failed to update status");
        }
    };

    // Render Sort Icon
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

        for (let i = 1; i <= meta.totalPages; i++) {
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
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <h3 className="text-2xl font-bold tracking-tight">
                    Batch Management
                </h3>
                <Button onClick={() => handleOpenDialog()}>
                    <Plus className="h-4 w-4 mr-2" /> Add Batch
                </Button>
            </div>

            {/* Filters Section */}
            <div className="flex flex-col lg:flex-row gap-4 items-end lg:items-center bg-card p-4 rounded-lg border shadow-sm">
                <div className="flex-1 w-full lg:w-auto space-y-2">
                    <div className="relative">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search by title..."
                            className="pl-8"
                            value={queryParams.q}
                            onChange={(e) =>
                                setQueryParams((prev) => ({
                                    ...prev,
                                    q: e.target.value,
                                    page: 1,
                                }))
                            }
                        />
                    </div>
                </div>

                <div className="w-full lg:w-48 space-y-2">
                    <Select
                        value={queryParams.status}
                        onValueChange={(val) =>
                            setQueryParams((prev) => ({
                                ...prev,
                                status: val,
                                page: 1,
                            }))
                        }
                    >
                        <SelectTrigger>
                            <SelectValue placeholder="Filter Status" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="ALL">All Status</SelectItem>
                            <SelectItem value="OPEN">Open</SelectItem>
                            <SelectItem value="ONGOING">Ongoing</SelectItem>
                            <SelectItem value="FINISHED">Finished</SelectItem>
                            <SelectItem value="CLOSED">Closed</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                <div className="flex items-center space-x-2 pb-2 mt-4">
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
                    <Label htmlFor="is_full" className="cursor-pointer">
                        Only Full Batches
                    </Label>
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
                                    onClick={() => handleSort("title")}
                                    className="-ml-4"
                                >
                                    Title
                                    {renderSortIcon("title")}
                                </Button>
                            </TableHead>
                            <TableHead>
                                <Button
                                    variant="ghost"
                                    onClick={() => handleSort("start_date")}
                                    className="-ml-4"
                                >
                                    Start Date
                                    {renderSortIcon("start_date")}
                                </Button>
                            </TableHead>
                            <TableHead>
                                <Button
                                    variant="ghost"
                                    onClick={() => handleSort("price")}
                                    className="-ml-4"
                                >
                                    Price
                                    {renderSortIcon("price")}
                                </Button>
                            </TableHead>
                            <TableHead>
                                <Button
                                    variant="ghost"
                                    onClick={() =>
                                        handleSort("remaining_quota")
                                    }
                                    className="-ml-4"
                                >
                                    Quota
                                    {renderSortIcon("remaining_quota")}
                                </Button>
                            </TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">
                                Actions
                            </TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell
                                    colSpan={7}
                                    className="text-center py-8"
                                >
                                    <Loader2 className="animate-spin h-8 w-8 mx-auto text-primary/50" />
                                </TableCell>
                            </TableRow>
                        ) : batches.length > 0 ? (
                            batches.map((batch, index) => (
                                <TableRow key={batch.id}>
                                    <TableCell>
                                        {(meta.page - 1) * meta.limit +
                                            index +
                                            1}
                                    </TableCell>
                                    <TableCell className="font-medium">
                                        {batch.title}
                                    </TableCell>
                                    <TableCell>
                                        {format(
                                            new Date(batch.start_date),
                                            "d MMM yyyy",
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        Rp{" "}
                                        {parseInt(batch.price).toLocaleString(
                                            "id-ID",
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-2">
                                            <span
                                                className={
                                                    batch.remaining_quota === 0
                                                        ? "text-red-500 font-bold"
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
                                    <TableCell>
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
                                    </TableCell>
                                    <TableCell className="text-right space-x-2">
                                        <Button
                                            size="icon"
                                            variant="ghost"
                                            onClick={() => toggleStatus(batch)}
                                            title={
                                                batch.status === "ACTIVE"
                                                    ? "Close Batch"
                                                    : "Re-activate Batch"
                                            }
                                        >
                                            {batch.status === "ACTIVE" ? (
                                                <XCircle className="h-4 w-4 text-red-500" />
                                            ) : (
                                                <CheckCircle className="h-4 w-4 text-green-500" />
                                            )}
                                        </Button>
                                        <Button
                                            size="icon"
                                            variant="outline"
                                            onClick={() =>
                                                handleOpenDialog(batch)
                                            }
                                        >
                                            <Edit className="h-4 w-4" />
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell
                                    colSpan={7}
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

            {/* Create/Edit Dialog */}
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent>
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
                                    required
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
                                    required
                                    placeholder="50"
                                />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
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
