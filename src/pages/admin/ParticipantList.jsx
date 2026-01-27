import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";

const ParticipantList = () => {
    const [enrollments, setEnrollments] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchParticipants = async () => {
            try {
                // MVP: Assuming GET /enrollments returns all for admin.
                // If not, we might need to fetch by batch or users.
                const res = await api.get("/enrollment").catch(() => ({ data: [] }));
                setEnrollments(res.data || []);
            } catch (error) {
                console.error(error);
            } finally {
                setLoading(false);
            }
        };
        fetchParticipants();
    }, []);

    if (loading) return <Skeleton className="h-40 w-full" />;

    return (
        <div className="space-y-4">
            <h3 className="text-lg font-medium">Participant List</h3>
            <div className="border rounded-md">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>User Name</TableHead>
                            <TableHead>Email</TableHead>
                            <TableHead>Batch</TableHead>
                            <TableHead>Enrolled At</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {enrollments.length > 0 ? (
                            enrollments.map((enr) => (
                                <TableRow key={enr.id}>
                                    <TableCell className="font-medium">{enr.user?.name || "Unknown"}</TableCell>
                                    <TableCell>{enr.user?.email || "-"}</TableCell>
                                    <TableCell>{enr.batch?.title || enr.batch_id}</TableCell>
                                    <TableCell>{enr.created_at ? new Date(enr.created_at).toLocaleDateString() : "-"}</TableCell>
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={4} className="text-center py-6 text-muted-foreground">
                                    No participants found.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
};

export default ParticipantList;
