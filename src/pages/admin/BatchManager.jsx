import { useState, useEffect } from "react";
import { api } from "@/lib/api";
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
import { Plus, Edit, Trash, CheckCircle, XCircle } from "lucide-react";
import toast from "react-hot-toast";

const BatchManager = () => {
    const [batches, setBatches] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingBatch, setEditingBatch] = useState(null);

    // Form State
    const [formData, setFormData] = useState({
        title: "",
        start_date: "",
        end_date: "",
        price: "",
        status: "OPEN",
    });

    const fetchBatches = async () => {
        try {
            const res = await api.get("/batch");
            setBatches(res.data || []);
        } catch (error) {
            toast.error("Failed to fetch batches");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchBatches();
    }, []);

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
                status: batch.status,
            });
        } else {
            setEditingBatch(null);
            setFormData({
                title: "",
                start_date: "",
                end_date: "",
                price: "",
                status: "OPEN",
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
            fetchBatches();
        } catch (error) {
            console.error(error);
            toast.error(error.response?.data?.message || "Operation failed");
        }
    };

    // Helper to toggle status quickly
    const toggleStatus = async (batch) => {
        try {
            const newStatus = batch.status === "OPEN" ? "CLOSED" : "OPEN";
            await api.put(`/batch/${batch.id}`, {
                ...batch,
                status: newStatus,
            });
            toast.success(`Batch ${newStatus}`);
            fetchBatches();
        } catch (error) {
            toast.error("Failed to update status");
        }
    };

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium">Batch List</h3>
                <Button onClick={() => handleOpenDialog()}>
                    <Plus className="h-4 w-4 mr-2" /> Add Batch
                </Button>
            </div>

            <div className="border rounded-md">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>ID</TableHead>
                            <TableHead>Title</TableHead>
                            <TableHead>Start Date</TableHead>
                            <TableHead>Price</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">
                                Actions
                            </TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {batches.map((batch) => (
                            <TableRow key={batch.id}>
                                <TableCell>{batch.id}</TableCell>
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
                                    <Badge
                                        variant={
                                            batch.status === "OPEN"
                                                ? "default"
                                                : "secondary"
                                        }
                                    >
                                        {batch.status}
                                    </Badge>
                                </TableCell>
                                <TableCell className="text-right space-x-2">
                                    <Button
                                        size="icon"
                                        variant="ghost"
                                        onClick={() => toggleStatus(batch)}
                                        title="Toggle Status"
                                    >
                                        {batch.status === "OPEN" ? (
                                            <XCircle className="h-4 w-4 text-red-500" />
                                        ) : (
                                            <CheckCircle className="h-4 w-4 text-green-500" />
                                        )}
                                    </Button>
                                    <Button
                                        size="icon"
                                        variant="outline"
                                        onClick={() => handleOpenDialog(batch)}
                                    >
                                        <Edit className="h-4 w-4" />
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))}
                        {batches.length === 0 && (
                            <TableRow>
                                <TableCell
                                    colSpan={6}
                                    className="text-center py-8 text-muted-foreground"
                                >
                                    No batches found. Create one to get started.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>

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
                                    <option value="OPEN">OPEN</option>
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
