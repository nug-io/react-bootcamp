import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
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
import toast from "react-hot-toast";
import { format } from "date-fns";
import { ArrowLeft } from "lucide-react";
import useMidtrans from "@/hooks/useMidtrans";

const BatchDetail = () => {
    const { batchId } = useParams();
    const navigate = useNavigate();
    const [batch, setBatch] = useState(null);
    const [loading, setLoading] = useState(true);
    const [enrolling, setEnrolling] = useState(false);
    const { snap } = useMidtrans();

    useEffect(() => {
        const fetchBatch = async () => {
            try {
                // Try direct fetch first
                const detailRes = await api
                    .get(`/batch/${batchId}`)
                    .catch(() => null);

                if (detailRes) {
                    setBatch(detailRes.data);
                } else {
                    // Fallback to finding in list
                    const listRes = await api.get("/batch");
                    const found = listRes.data.find(
                        (b) => b.id === parseInt(batchId),
                    );
                    if (found) setBatch(found);
                }
            } catch (error) {
                toast.error("Gagal memuat detail batch");
            } finally {
                setLoading(false);
            }
        };
        fetchBatch();
    }, [batchId]);

    const processPayment = (snapToken) => {
        if (snap) {
            snap.pay(snapToken, {
                onSuccess: (result) => {
                    toast.success("Pembayaran Berhasil!");
                    navigate("/enroll/success", { state: { batch, result } });
                },
                onPending: (result) => {
                    toast.success("Menunggu Pembayaran...");
                    navigate("/enroll/success", { state: { batch, result, pending: true } });
                },
                onError: (result) => {
                    toast.error("Pembayaran Gagal");
                    console.error(result);
                },
                onClose: () => {
                    toast("Anda menutup popup pembayaran", { icon: "ℹ️" });
                },
            });
        } else {
            toast.error("Sistem pembayaran belum siap. Silakan refresh halaman.");
        }
    };

    const handleEnroll = async () => {
        if (batch.is_full === true) {
            toast.error("Pendaftaran sudah penuh");
            return;
        }

        setEnrolling(true);
        try {
            const res = await api.post("/enrollment", { batch_id: parseInt(batchId) });

            // Check for Snap Token or Resume Payment
            if (res.data?.snapToken) {
                processPayment(res.data.snapToken);
            } else if (res.data?.resumePayment && res.data?.snapToken) {
                // Handle specific resume case if implementation detail differs, 
                // but typically it just provides the token again.
                processPayment(res.data.snapToken);
            } else if (res.data?.resumePayment) {
                // Logic if new token is needed or handled differently
                toast("Anda sudah terdaftar, meneruskan pembayaran...", { icon: "🔄" });
                // If backend assumes we reuse token, it should send it.
                // If not sent, we might need another call or it's handled.
                // Based on prompt: "Trigger ulang Midtrans Snap" implies we get a token.
                // Assuming backend sends token even on resumePayment=true
                if (res.data.snapToken) {
                    processPayment(res.data.snapToken);
                } else {
                    navigate("/dashboard"); // Fallback
                }
            } else {
                // Free batch or immediate success
                toast.success("Berhasil mendaftar!");
                navigate("/enroll/success", { state: { batch } });
            }

        } catch (error) {
            if (error.response?.status === 409) {
                // If 409 but we want to allow resume?
                // Prompt says: "Jika response berisi resumePayment = true ... JANGAN error"
                // So typically the backend should return 200 OK with resumePayment: true
                // If backend returns 409, we stick to error.
                toast.error("Anda sudah terdaftar di batch ini");
            } else {
                toast.error(error.response?.data?.message || "Gagal mendaftar");
            }
        } finally {
            setEnrolling(false);
        }
    };

    if (loading)
        return (
            <div className="p-6">
                <Skeleton className="h-[400px] w-full" />
            </div>
        );
    if (!batch) return <div className="p-6">Batch tidak ditemukan</div>;

    return (
        <div className="container mx-auto p-6 max-w-3xl">
            <Link
                to="/batches"
                className="flex items-center text-sm text-muted-foreground mb-4 hover:text-primary"
            >
                <ArrowLeft className="h-4 w-4 mr-1" /> Kembali ke List Batch
            </Link>

            <Card>
                <CardHeader>
                    <div className="flex justify-between">
                        <CardTitle className="text-2xl">
                            {batch.title}
                        </CardTitle>
                        <Badge
                            variant={
                                batch.status_effective === "OPEN"
                                    ? "default"
                                    : "secondary"
                            }
                        >
                            {batch.status_effective}
                        </Badge>
                    </div>
                    <CardDescription>
                        Start:{" "}
                        {format(new Date(batch.start_date), "d MMMM yyyy")}
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                            <span className="font-semibold block text-gray-500">
                                Harga
                            </span>
                            <span className="text-lg font-bold">
                                Rp{" "}
                                {parseInt(batch.price).toLocaleString("id-ID")}
                            </span>
                        </div>
                        <div>
                            <span className="font-semibold block text-gray-500">
                                Jadwal
                            </span>
                            <span>Senin & Kamis, 19.00 WIB</span>
                        </div>
                        <div>
                            <span className="font-semibold block text-gray-500">
                                Durasi
                            </span>
                            <span>1 Bulan (Intensif)</span>
                        </div>
                        <div>
                            <span className="font-semibold block text-gray-500">
                                Kuota Tersisa
                            </span>
                            <span>{batch.quota - batch.enrolled_count}</span>
                        </div>
                    </div>

                    <div className="prose prose-sm max-w-none text-gray-700 bg-gray-50 p-4 rounded-lg">
                        <p>
                            Batch ini dirancang untuk pemula yang ingin
                            menguasai Fullstack Development. Anda akan belajar
                            React, Node.js, dan Database dari nol sampai deploy.
                        </p>
                        <ul className="list-disc pl-4 mt-2">
                            <li>Materi up-to-date</li>
                            <li>Live Zoom Session</li>
                            <li>Code Review Mentor</li>
                        </ul>
                    </div>
                </CardContent>
                <CardFooter>
                    {batch.status_effective === "OPEN" ? (
                        <Button
                            className="w-full text-lg py-6"
                            onClick={handleEnroll}
                            disabled={enrolling}
                        >
                            {enrolling ? "Memproses..." : "Daftar & Bayar"}
                        </Button>
                    ) : (
                        <Button
                            className="w-full py-6"
                            disabled
                            variant="secondary"
                        >
                            Pendaftaran Ditutup
                        </Button>
                    )}
                </CardFooter>
            </Card>
        </div>
    );
};

export default BatchDetail;
