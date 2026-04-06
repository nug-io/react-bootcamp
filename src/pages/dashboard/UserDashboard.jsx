import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { api } from "@/lib/api";
import { useAuthStore } from "@/stores/authStore";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { PlayCircle, Video, FileText } from "lucide-react";
import toast from "react-hot-toast";

const UserDashboard = () => {
    const { user } = useAuthStore();
    const [enrollments, setEnrollments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedBatchId, setSelectedBatchId] = useState(null);
    const [materials, setMaterials] = useState([]);
    const [loadingMaterials, setLoadingMaterials] = useState(false);

    useEffect(() => {
        const fetchEnrollments = async () => {
            try {
                const res = await api.get("/enrollment/my-enrollment");
                const data = res?.data || [];
                setEnrollments(data);
                
                if (data.length > 0) {
                    // Correct field: Enrollment object has batch.id
                    const firstBatchId = data[0].batch?.id;
                    if (firstBatchId) {
                        setSelectedBatchId(firstBatchId);
                    }
                }
            } catch (error) {
                console.error("Failed to fetch enrollments", error);
                toast.error("Gagal memuat data pendaftaran");
            } finally {
                setLoading(false);
            }
        };
        fetchEnrollments();
    }, []);

    useEffect(() => {
        if (!selectedBatchId) return;

        const fetchMaterials = async () => {
            setLoadingMaterials(true);
            try {
                const res = await api.get(`/material/batch/${selectedBatchId}`);
                setMaterials(res?.data || []);
            } catch (error) {
                console.error("Failed to fetch materials", error);
                setMaterials([]);
            } finally {
                setLoadingMaterials(false);
            }
        };
        fetchMaterials();
    }, [selectedBatchId]);

    if (loading) return <div className="p-6"><Skeleton className="h-64 w-full" /></div>;

    return (
        <div className="container mx-auto p-6 space-y-8">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold">Halo, {user?.name || 'Pelajar'} 👋</h1>
                    <p className="text-muted-foreground">Selamat belajar! Jangan lupa cek jadwal Zoom.</p>
                </div>
            </div>

            {enrollments.length === 0 ? (
                <Card className="text-center p-8">
                    <CardContent className="space-y-4">
                        <h3 className="text-lg font-medium">Kamu belum terdaftar di batch manapun.</h3>
                        <Button asChild>
                            <Link to="/batches">Lihat Batch Tersedia</Link>
                        </Button>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid lg:grid-cols-3 gap-8">
                    {/* Sidebar: List Batch Enrolled */}
                    <div className="lg:col-span-1 space-y-4">
                        <h2 className="font-semibold text-lg">Batch Saya</h2>
                        {enrollments.map((enrollment) => {
                            const batch = enrollment.batch || { title: `Batch #${enrollment.enrollment_id}` };
                            const batchId = batch.id;
                            const isSelected = selectedBatchId === batchId;

                            return (
                                <Card
                                    key={enrollment.enrollment_id || Math.random()}
                                    className={`cursor-pointer transition-colors ${isSelected ? 'border-primary bg-primary/5' : 'hover:bg-gray-50'}`}
                                    onClick={() => batchId && setSelectedBatchId(batchId)}
                                >
                                    <CardHeader className="p-4">
                                        <CardTitle className="text-base">{batch.title}</CardTitle>
                                        <CardDescription className="text-xs">
                                            {batch.type === 'COURSE' ? 'Akses Fleksibel' : 'Jadwal Terstruktur'}
                                        </CardDescription>
                                    </CardHeader>
                                </Card>
                            );
                        })}

                        <Card className="bg-blue-50 border-blue-100">
                            <CardHeader className="p-4">
                                <CardTitle className="text-sm font-semibold text-blue-800 flex items-center">
                                    <Video className="h-4 w-4 mr-2" /> Info Zoom
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-4 pt-0 text-xs text-blue-700">
                                Link Zoom akan dikirim via WhatsApp Group 1 jam sebelum kelas dimulai.
                            </CardContent>
                        </Card>
                    </div>

                    {/* Main: Material List */}
                    <div className="lg:col-span-2 space-y-4">
                        <h2 className="font-semibold text-lg">Materi & Rekaman</h2>

                        {loadingMaterials ? (
                            <div className="space-y-2">
                                <Skeleton className="h-16 w-full" />
                                <Skeleton className="h-16 w-full" />
                                <Skeleton className="h-16 w-full" />
                            </div>
                        ) : materials.length > 0 ? (
                            <div className="space-y-2">
                                {materials.map((material, index) => (
                                    <Card key={material.id} className="hover:shadow-md transition-shadow">
                                        <div className="flex items-center p-4">
                                            <div className="h-10 w-10 bg-primary/10 rounded-full flex items-center justify-center mr-4 text-primary font-bold">
                                                {index + 1}
                                            </div>
                                            <div className="flex-1">
                                                <h3 className="font-medium text-base">{material.title}</h3>
                                                <p className="text-xs text-muted-foreground flex items-center mt-1">
                                                    <FileText className="h-3 w-3 mr-1" /> Teks Modul
                                                    <span className="mx-2">•</span>
                                                    <PlayCircle className="h-3 w-3 mr-1" /> Video Rekaman
                                                </p>
                                            </div>
                                            <Button size="sm" variant="outline" asChild>
                                                <Link to={`/dashboard/materials/${material.id}`}>Buka Materi</Link>
                                            </Button>
                                        </div>
                                    </Card>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center p-8 bg-gray-50 rounded-lg border border-dashed text-gray-500">
                                Belum ada materi yang diupload untuk batch ini.
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default UserDashboard;
