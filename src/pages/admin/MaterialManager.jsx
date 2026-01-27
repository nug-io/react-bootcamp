import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { Plus, Edit, Trash, Loader2 } from "lucide-react";
import toast from "react-hot-toast";

const MaterialManager = () => {
    const [batches, setBatches] = useState([]);
    const [selectedBatchId, setSelectedBatchId] = useState("");
    const [materials, setMaterials] = useState([]);
    const [loading, setLoading] = useState(false);

    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingMaterial, setEditingMaterial] = useState(null);
    const [formData, setFormData] = useState({
        title: "",
        content: "",
        video_url: "",
        order: 1,
    });

    // Fetch batches for dropdown
    useEffect(() => {
        const loadBatches = async () => {
            const res = await api.get("/batch");
            setBatches(res.data || []);
            if (res.data && res.data.length > 0) {
                setSelectedBatchId(res.data[0].id);
            }
        };
        loadBatches();
    }, []);

    // Fetch materials when batch changes
    useEffect(() => {
        if (!selectedBatchId) return;
        const fetchMaterials = async () => {
            setLoading(true);
            try {
                const res = await api.get(`/material/batch/${selectedBatchId}`);
                setMaterials(res.data || []);
            } catch (error) {
                console.error(error);
                setMaterials([]); // Reset on error
            } finally {
                setLoading(false);
            }
        };
        fetchMaterials();
    }, [selectedBatchId]);

    const handleOpenDialog = (material = null) => {
        if (material) {
            setEditingMaterial(material);
            setFormData({
                title: material.title,
                content: material.content,
                video_url: material.video_url || "",
                order: material.order || 1,
            });
        } else {
            setEditingMaterial(null);
            setFormData({
                title: "",
                content: "",
                video_url: "",
                order: materials.length + 1,
            });
        }
        setIsDialogOpen(true);
    };

    const handleSave = async (e) => {
        e.preventDefault();
        try {
            const payload = {
                title: formData.title,
                content: formData.content,
                // video_url: formData.video_url,
                order: Number(formData.order),
                batch_id: Number(selectedBatchId),
            };

            if (editingMaterial) {
                await api.put(`/material/${editingMaterial.id}`, payload);
                toast.success("Material updated");
            } else {
                await api.post("/material", payload);
                toast.success("Material added");
            }
            setIsDialogOpen(false);
            // Refresh list
            const res = await api.get(`/material/batch/${selectedBatchId}`);
            setMaterials(res.data || []);
        } catch (error) {
            toast.error(error.response?.data?.message || "Operation failed");
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure?")) return;
        try {
            await api.delete(`/material/${id}`); // Assuming delete endpoint exists
            toast.success("Material deleted");
            setMaterials(materials.filter((m) => m.id !== id));
        } catch (error) {
            toast.error("Failed to delete");
        }
    };

    return (
        <div className="space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="w-full md:w-1/3">
                    <Label>Select Batch</Label>
                    <select
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                        value={selectedBatchId}
                        onChange={(e) => setSelectedBatchId(e.target.value)}
                    >
                        {batches.map((b) => (
                            <option key={b.id} value={b.id}>
                                {b.title}
                            </option>
                        ))}
                    </select>
                </div>
                <Button
                    onClick={() => handleOpenDialog()}
                    disabled={!selectedBatchId}
                >
                    <Plus className="h-4 w-4 mr-2" /> Add Material
                </Button>
            </div>

            <div className="border rounded-md">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[50px]">#</TableHead>
                            <TableHead>Title</TableHead>
                            <TableHead>Content Preview</TableHead>
                            <TableHead>Video</TableHead>
                            <TableHead className="text-right">
                                Actions
                            </TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell
                                    colSpan={5}
                                    className="text-center py-4"
                                >
                                    <Loader2 className="animate-spin h-5 w-5 mx-auto" />
                                </TableCell>
                            </TableRow>
                        ) : materials.length > 0 ? (
                            materials.map((m) => (
                                <TableRow key={m.id}>
                                    <TableCell>{m.order}</TableCell>
                                    <TableCell className="font-medium">
                                        {m.title}
                                    </TableCell>
                                    <TableCell className="max-w-xs truncate text-muted-foreground">
                                        {m.content}
                                    </TableCell>
                                    <TableCell>
                                        {m.video_url ? "Yes" : "No"}
                                    </TableCell>
                                    <TableCell className="text-right space-x-2">
                                        <Button
                                            size="icon"
                                            variant="outline"
                                            onClick={() => handleOpenDialog(m)}
                                        >
                                            <Edit className="h-4 w-4" />
                                        </Button>
                                        <Button
                                            size="icon"
                                            variant="destructive"
                                            onClick={() => handleDelete(m.id)}
                                        >
                                            <Trash className="h-4 w-4" />
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell
                                    colSpan={5}
                                    className="text-center py-8 text-muted-foreground"
                                >
                                    No materials found for this batch.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>
                            {editingMaterial ? "Edit Material" : "Add Material"}
                        </DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleSave} className="space-y-4">
                        <div className="grid grid-cols-4 gap-4">
                            <div className="col-span-3 space-y-2">
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
                                />
                            </div>
                            <div className="col-span-1 space-y-2">
                                <Label>Order</Label>
                                <Input
                                    type="number"
                                    value={formData.order}
                                    onChange={(e) =>
                                        setFormData({
                                            ...formData,
                                            order: e.target.value,
                                        })
                                    }
                                    required
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label>Video URL</Label>
                            <Input
                                value={formData.video_url}
                                onChange={(e) =>
                                    setFormData({
                                        ...formData,
                                        video_url: e.target.value,
                                    })
                                }
                                placeholder="https://youtube.com/..."
                            />
                        </div>

                        <div className="space-y-2">
                            <Label>Content (Markdown)</Label>
                            <textarea
                                className="flex min-h-[150px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                value={formData.content}
                                onChange={(e) =>
                                    setFormData({
                                        ...formData,
                                        content: e.target.value,
                                    })
                                }
                                placeholder="# Heading &#10;Content..."
                                required
                            />
                        </div>

                        <DialogFooter>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setIsDialogOpen(false)}
                            >
                                Cancel
                            </Button>
                            <Button type="submit">Save</Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default MaterialManager;
