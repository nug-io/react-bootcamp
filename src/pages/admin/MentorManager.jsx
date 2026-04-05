import { useState, useEffect, useCallback } from "react";
import { api } from "@/lib/api";
import { extractErrorMessage } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Table,
    TableHeader,
    TableRow,
    TableHead,
    TableBody,
    TableCell,
} from "@/components/ui/table";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
    Loader2,
    Search,
    Edit,
    ChevronLeft,
    ChevronRight,
    ArrowUpDown,
    ArrowUp,
    ArrowDown,
    Plus,
} from "lucide-react";
import toast from "react-hot-toast";

const MentorManager = () => {
    const [mentors, setMentors] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [queryParams, setQueryParams] = useState({
        page: 1,
        limit: 10,
        q: "",
        orderBy: "created_at",
        orderDir: "desc",
    });
    const [meta, setMeta] = useState({
        page: 1,
        limit: 10,
        total: 0,
        totalPages: 1,
    });

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [mode, setMode] = useState("CREATE"); // "CREATE" | "EDIT"
    const [selectedMentor, setSelectedMentor] = useState(null);
    const [loadingDetail, setLoadingDetail] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    const [users, setUsers] = useState([]);
    const [loadingUsers, setLoadingUsers] = useState(false);

    const [formData, setFormData] = useState({
        user_id: "",
        name: "",
        bio: "",
        linkedin: "",
        github: "",
        website: "",
    });

    const fetchMentors = useCallback(async () => {
        setLoading(true);
        try {
            const params = {
                page: queryParams.page,
                limit: queryParams.limit,
                orderBy: queryParams.orderBy,
                orderDir: queryParams.orderDir,
            };
            if (queryParams.q) params.q = queryParams.q;

            const res = await api.get("/mentor", { params });
            setMentors(res.data || []);
            setMeta(
                res.meta || { page: 1, limit: 10, total: 0, totalPages: 1 },
            );
        } catch (error) {
            console.error(error);
            toast.error("Failed to fetch mentors");
        } finally {
            setLoading(false);
        }
    }, [queryParams]);

    const fetchUsers = async () => {
        setLoadingUsers(true);
        try {
            const res = await api.get("/user", {
                params: { role: "USER", limit: 100 },
            });
            setUsers(res.data || []);
        } catch (error) {
            toast.error("Failed to fetch users for selection");
        } finally {
            setLoadingUsers(false);
        }
    };

    useEffect(() => {
        fetchMentors();
    }, [fetchMentors]);

    const handleSearch = (e) => {
        e.preventDefault();
        setQueryParams((prev) => ({ ...prev, q: searchTerm, page: 1 }));
    };

    const handleSort = (field) => {
        setQueryParams((prev) => ({
            ...prev,
            orderBy: field,
            orderDir:
                prev.orderBy === field && prev.orderDir === "desc"
                    ? "asc"
                    : "desc",
            page: 1,
        }));
    };

    const renderSortIcon = (field) => {
        if (queryParams.orderBy !== field)
            return <ArrowUpDown className="ml-2 h-4 w-4 opacity-50" />;
        return queryParams.orderDir === "asc" ? (
            <ArrowUp className="ml-2 h-4 w-4" />
        ) : (
            <ArrowDown className="ml-2 h-4 w-4" />
        );
    };

    const handlePageChange = (newPage) => {
        if (newPage >= 1 && newPage <= meta.totalPages) {
            setQueryParams((prev) => ({ ...prev, page: newPage }));
        }
    };

    const handleCreateClick = () => {
        setMode("CREATE");
        setFormData({
            user_id: "",
            name: "",
            bio: "",
            linkedin: "",
            github: "",
            website: "",
        });
        setIsModalOpen(true);
        fetchUsers();
    };

    const handleEditClick = async (mentor) => {
        setMode("EDIT");
        setSelectedMentor(mentor);
        setIsModalOpen(true);
        setLoadingDetail(true);
        try {
            const res = await api.get(`/mentor/${mentor.id}`);
            const data = res.data;
            setFormData({
                user_id: data.user?.id || "",
                name: data.name || "",
                bio: data.bio || "",
                linkedin: data.linkedin || "",
                github: data.github || "",
                website: data.website || "",
            });
        } catch (error) {
            toast.error(extractErrorMessage(error));
            setIsModalOpen(false);
        } finally {
            setLoadingDetail(false);
        }
    };

    const validateUrl = (url) => {
        if (!url) return true;
        try {
            new URL(url);
            return true;
        } catch (_) {
            return false;
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (mode === "CREATE" && !formData.user_id) {
            toast.error("User selection is required");
            return;
        }

        if (!formData.name.trim() || !formData.bio.trim()) {
            toast.error("Name and Bio are required");
            return;
        }

        if (!validateUrl(formData.linkedin)) {
            toast.error("Invalid LinkedIn URL");
            return;
        }
        if (!validateUrl(formData.github)) {
            toast.error("Invalid GitHub URL");
            return;
        }
        if (!validateUrl(formData.website)) {
            toast.error("Invalid Website URL");
            return;
        }

        setSubmitting(true);
        try {
            if (mode === "CREATE") {
                await api.post("/mentor", {
                    ...formData,
                    user_id: parseInt(formData.user_id),
                });
                toast.success("Mentor created successfully");
            } else {
                const { user_id, ...patchData } = formData;
                await api.patch(`/mentor/${selectedMentor.id}`, patchData);
                toast.success("Mentor updated successfully");
            }
            setIsModalOpen(false);
            fetchMentors();
        } catch (error) {
            toast.error(extractErrorMessage(error));
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <form
                    onSubmit={handleSearch}
                    className="relative w-full md:w-96"
                >
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search mentor name..."
                        className="pl-9"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </form>
                <Button onClick={handleCreateClick}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Mentor
                </Button>
            </div>

            <div className="border rounded-md">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-16">#</TableHead>
                            <TableHead
                                className="cursor-pointer hover:bg-muted/50 transition-colors"
                                onClick={() => handleSort("name")}
                            >
                                <div className="flex items-center">
                                    Name
                                    {renderSortIcon("name")}
                                </div>
                            </TableHead>
                            <TableHead>Email</TableHead>
                            <TableHead className="text-right">
                                Actions
                            </TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell
                                    colSpan={4}
                                    className="h-24 text-center"
                                >
                                    <div className="flex items-center justify-center">
                                        <Loader2 className="h-6 w-6 animate-spin mr-2" />
                                        Loading mentors...
                                    </div>
                                </TableCell>
                            </TableRow>
                        ) : mentors.length === 0 ? (
                            <TableRow>
                                <TableCell
                                    colSpan={4}
                                    className="h-48 text-center text-muted-foreground"
                                >
                                    <div className="flex flex-col items-center gap-2">
                                        <p>No mentors found.</p>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={handleCreateClick}
                                        >
                                            <Plus className="h-4 w-4 mr-2" />
                                            Create Mentor
                                        </Button>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ) : (
                            mentors.map((mentor, index) => (
                                <TableRow key={mentor.id}>
                                    <TableCell>
                                        {(meta.page - 1) * meta.limit +
                                            index +
                                            1}
                                    </TableCell>
                                    <TableCell className="font-medium">
                                        {mentor.name}
                                    </TableCell>
                                    <TableCell>
                                        {mentor.user?.email || "-"}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() =>
                                                handleEditClick(mentor)
                                            }
                                        >
                                            <Edit className="h-4 w-4 mr-2" />
                                            Edit
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* Pagination */}
            {meta.totalPages > 1 && (
                <div className="flex items-center justify-end space-x-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePageChange(meta.page - 1)}
                        disabled={meta.page <= 1}
                    >
                        <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <div className="text-sm font-medium">
                        Page {meta.page} of {meta.totalPages}
                    </div>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePageChange(meta.page + 1)}
                        disabled={meta.page >= meta.totalPages}
                    >
                        <ChevronRight className="h-4 w-4" />
                    </Button>
                </div>
            )}

            {/* Create/Edit Modal */}
            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                        <DialogTitle>
                            {mode === "CREATE"
                                ? "Create New Mentor"
                                : "Edit Mentor Profile"}
                        </DialogTitle>
                    </DialogHeader>
                    {loadingDetail ? (
                        <div className="flex flex-col items-center justify-center py-8">
                            <Loader2 className="h-8 w-8 animate-spin text-primary mb-2" />
                            <p className="text-sm text-muted-foreground">
                                Loading details...
                            </p>
                        </div>
                    ) : (
                        <form
                            onSubmit={handleSubmit}
                            className="space-y-4 py-4"
                        >
                            {mode === "CREATE" && (
                                <div className="space-y-2">
                                    <Label htmlFor="user_id">
                                        Select User (Email)
                                    </Label>
                                    <select
                                        id="user_id"
                                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                                        value={formData.user_id}
                                        onChange={(e) =>
                                            setFormData({
                                                ...formData,
                                                user_id: e.target.value,
                                            })
                                        }
                                        required
                                        disabled={loadingUsers}
                                    >
                                        <option value="">
                                            {loadingUsers
                                                ? "Loading users..."
                                                : "Select a user"}
                                        </option>
                                        {users.map((u) => (
                                            <option key={u.id} value={u.id}>
                                                {u.email}
                                            </option>
                                        ))}
                                    </select>
                                    <p className="text-[0.7rem] text-muted-foreground">
                                        Only users with role USER can be
                                        promoted to Mentor profiles.
                                    </p>
                                </div>
                            )}
                            <div className="space-y-2">
                                <Label htmlFor="name">Full Name</Label>
                                <Input
                                    id="name"
                                    value={formData.name}
                                    onChange={(e) =>
                                        setFormData({
                                            ...formData,
                                            name: e.target.value,
                                        })
                                    }
                                    required
                                    placeholder="e.g. John Doe"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="bio">Bio</Label>
                                <textarea
                                    id="bio"
                                    className="flex min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                    value={formData.bio}
                                    onChange={(e) =>
                                        setFormData({
                                            ...formData,
                                            bio: e.target.value,
                                        })
                                    }
                                    required
                                    placeholder="Expertise, experience, etc."
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="linkedin">LinkedIn URL</Label>
                                <Input
                                    id="linkedin"
                                    type="url"
                                    placeholder="https://linkedin.com/in/..."
                                    value={formData.linkedin}
                                    onChange={(e) =>
                                        setFormData({
                                            ...formData,
                                            linkedin: e.target.value,
                                        })
                                    }
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="github">GitHub URL</Label>
                                <Input
                                    id="github"
                                    type="url"
                                    placeholder="https://github.com/..."
                                    value={formData.github}
                                    onChange={(e) =>
                                        setFormData({
                                            ...formData,
                                            github: e.target.value,
                                        })
                                    }
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="website">Website URL</Label>
                                <Input
                                    id="website"
                                    type="url"
                                    placeholder="https://..."
                                    value={formData.website}
                                    onChange={(e) =>
                                        setFormData({
                                            ...formData,
                                            website: e.target.value,
                                        })
                                    }
                                />
                            </div>
                            <DialogFooter className="pt-4">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => setIsModalOpen(false)}
                                    disabled={submitting}
                                >
                                    Cancel
                                </Button>
                                <Button type="submit" disabled={submitting}>
                                    {submitting && (
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    )}
                                    {mode === "CREATE"
                                        ? "Create Mentor"
                                        : "Save Changes"}
                                </Button>
                            </DialogFooter>
                        </form>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default MentorManager;
