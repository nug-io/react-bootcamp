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
import { format, differenceInDays, startOfDay } from "date-fns";
import {
    ArrowLeft,
    Calendar,
    Video,
    Clock,
    Users,
    Zap,
    Infinity,
} from "lucide-react";
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
                    navigate("/enroll/success", {
                        state: { batch, result, pending: true },
                    });
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
            toast.error(
                "Sistem pembayaran belum siap. Silakan refresh halaman.",
            );
        }
    };

    const handleEnroll = async () => {
        if (batch.is_full === true) {
            toast.error("Pendaftaran sudah penuh");
            return;
        }

        setEnrolling(true);
        try {
            const res = await api.post("/enrollment", {
                batch_id: parseInt(batchId),
            });

            // Check for Snap Token or Resume Payment
            if (res.data?.snapToken) {
                processPayment(res.data.snapToken);
            } else if (res.data?.resumePayment && res.data?.snapToken) {
                // Handle specific resume case if implementation detail differs,
                // but typically it just provides the token again.
                processPayment(res.data.snapToken);
            } else if (res.data?.resumePayment) {
                // Logic if new token is needed or handled differently
                toast("Anda sudah terdaftar, meneruskan pembayaran...", {
                    icon: "🔄",
                });
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

    const daysUntilStart = batch.start_date
        ? differenceInDays(
              startOfDay(new Date(batch.start_date)),
              startOfDay(new Date()),
          )
        : null;

    return (
        <div className="container mx-auto p-6 max-w-3xl space-y-4">
            <Link
                to="/batches"
                className="flex items-center text-sm font-medium text-muted-foreground hover:text-primary transition-colors mb-2"
            >
                <ArrowLeft className="h-4 w-4 mr-1.5" /> Kembali ke List Batch
            </Link>

            <Card className="overflow-hidden border-none shadow-xl ring-1 ring-border/50">
                <CardHeader className="bg-slate-50/50 border-b pb-8">
                    <div className="flex flex-col gap-4">
                        <div className="flex justify-between items-start">
                            <Badge
                                variant={
                                    batch.type === "LIVE"
                                        ? "default"
                                        : "secondary"
                                }
                                className="px-3 py-1 font-bold uppercase tracking-widest text-[10px]"
                            >
                                {batch.type || "LIVE"}
                            </Badge>
                            {batch.type === "LIVE" && (
                                <Badge
                                    variant={
                                        batch.status_effective === "OPEN"
                                            ? "outline"
                                            : "secondary"
                                    }
                                    className="font-bold border-primary/30"
                                >
                                    {batch.status_effective}
                                </Badge>
                            )}
                        </div>
                        <div>
                            <CardTitle className="text-3xl font-black tracking-tight leading-tight">
                                {batch.title}
                            </CardTitle>
                            <CardDescription className="mt-2 text-base font-medium">
                                {batch.type === "COURSE" ? (
                                    <span className="text-primary bg-primary/5 px-3 py-1 rounded-full">
                                        Akses Fleksibel
                                    </span>
                                ) : (
                                    <span className="text-muted-foreground">
                                        Mulai:{" "}
                                        <span className="text-foreground font-bold">
                                            {format(
                                                new Date(batch.start_date),
                                                "d MMM yyyy",
                                            )}
                                        </span>
                                        {batch.end_date &&
                                            ` — Selesai: ${format(new Date(batch.end_date), "d MMM yyyy")}`}
                                    </span>
                                )}
                            </CardDescription>
                        </div>
                    </div>
                </CardHeader>

                <CardContent className="p-8 space-y-10">
                    {/* Price & Urgency Signal */}
                    <div className="flex flex-col md:flex-row justify-between items-center bg-primary/5 p-6 rounded-2xl border border-primary/10 gap-6">
                        <div className="text-center md:text-left">
                            <span className="text-sm font-bold text-muted-foreground uppercase tracking-widest block mb-1">
                                Investasi Belajar
                            </span>
                            <span className="text-2xl font-black text-primary">
                                Rp{" "}
                                {parseInt(batch.price).toLocaleString("id-ID")}
                            </span>
                        </div>

                        {batch.type === "LIVE" && (
                            <div className="flex flex-col gap-2 items-center md:items-end">
                                {batch.remaining_quota > 0 &&
                                    batch.remaining_quota <= 5 && (
                                        <Badge
                                            variant="outline"
                                            className="text-sm border-orange-200 bg-orange-50 text-orange-700 font-black px-4 py-1.5 rounded-full animate-pulse"
                                        >
                                            🔥 Hanya sisa{" "}
                                            {batch.remaining_quota} kursi!
                                        </Badge>
                                    )}
                                {daysUntilStart >= 0 && daysUntilStart <= 3 && (
                                    <Badge
                                        variant="outline"
                                        className="text-sm border-blue-200 bg-blue-50 text-blue-700 font-black px-4 py-1.5 rounded-full"
                                    >
                                        ⏰{" "}
                                        {daysUntilStart === 0
                                            ? "Dimulai Hari Ini"
                                            : `Dimulai dlm ${daysUntilStart} hari`}
                                    </Badge>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Key Highlights */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        {batch.type === "LIVE" ? (
                            <>
                                <div className="flex items-center gap-3 p-4 rounded-xl border bg-card/50">
                                    <Calendar className="h-5 w-5 text-primary" />
                                    <span className="text-sm font-bold">
                                        Jadwal Terstruktur
                                    </span>
                                </div>
                                <div className="flex items-center gap-3 p-4 rounded-xl border bg-card/50">
                                    <Zap className="h-5 w-5 text-primary" />
                                    <span className="text-sm font-bold">
                                        Mentoring Langsung
                                    </span>
                                </div>
                                <div className="flex items-center gap-3 p-4 rounded-xl border bg-card/50">
                                    <Users className="h-5 w-5 text-primary" />
                                    <span className="text-sm font-bold">
                                        Kuota Terbatas
                                    </span>
                                </div>
                            </>
                        ) : (
                            <>
                                <div className="flex items-center gap-3 p-4 rounded-xl border bg-card/50">
                                    <Video className="h-5 w-5 text-primary" />
                                    <span className="text-sm font-bold">
                                        Video Learning
                                    </span>
                                </div>
                                <div className="flex items-center gap-3 p-4 rounded-xl border bg-card/50">
                                    <Infinity className="h-5 w-5 text-primary" />
                                    <span className="text-sm font-bold">
                                        Akses Seumur Hidup
                                    </span>
                                </div>
                                <div className="flex items-center gap-3 p-4 rounded-xl border bg-card/50">
                                    <Clock className="h-5 w-5 text-primary" />
                                    <span className="text-sm font-bold">
                                        Belajar Fleksibel
                                    </span>
                                </div>
                            </>
                        )}
                    </div>

                    {/* Mentor Section */}
                    {batch.mentors && batch.mentors.length > 0 && (
                        <div className="space-y-6">
                            <div className="flex items-center gap-2">
                                <h4 className="font-black text-xl tracking-tight">
                                    Mentor Praktisi
                                </h4>
                                <div className="h-px flex-1 bg-border" />
                            </div>
                            <div className="grid gap-4">
                                {batch.mentors.map((mentor) => (
                                    <div
                                        key={mentor.id}
                                        className="group bg-muted/30 p-5 rounded-2xl border border-border/50 hover:bg-muted/50 transition-colors"
                                    >
                                        <div className="font-bold text-primary text-lg">
                                            {mentor.name}
                                        </div>
                                        <div className="text-sm text-muted-foreground mt-2 leading-relaxed">
                                            {mentor.bio}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Description Section */}
                    <div className="space-y-6">
                        <div className="flex items-center gap-2">
                            <h4 className="font-black text-xl tracking-tight">
                                Tentang Program
                            </h4>
                            <div className="h-px flex-1 bg-border" />
                        </div>
                        <div className="prose prose-sm max-w-none text-muted-foreground leading-relaxed text-base">
                            {batch.description ? (
                                <p className="whitespace-pre-wrap">
                                    {batch.description}
                                </p>
                            ) : (
                                <p className="italic opacity-60">
                                    Tidak ada deskripsi detail untuk program
                                    ini.
                                </p>
                            )}
                        </div>
                    </div>
                </CardContent>

                <CardFooter className="p-8 bg-slate-50/50 border-t">
                    {batch.type === "COURSE" ||
                    batch.status_effective === "OPEN" ? (
                        <Button
                            className="w-full text-lg py-7 font-black rounded-2xl shadow-lg shadow-primary/20 hover:shadow-xl hover:scale-[1.01] transition-all"
                            onClick={handleEnroll}
                            disabled={enrolling}
                        >
                            {enrolling
                                ? "Memproses..."
                                : batch.type === "COURSE"
                                  ? "Mulai Belajar Sekarang"
                                  : "Daftar Sekarang"}
                        </Button>
                    ) : (
                        <Button
                            className="w-full py-7 text-lg font-bold rounded-2xl"
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
