import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription,
    CardFooter,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { api } from "@/lib/api";
import { format } from "date-fns";
import { Loader2 } from "lucide-react";

const LandingPage = () => {
    const [batches, setBatches] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchBatches = async () => {
            try {
                const res = await api.get("/batch");
                setBatches(res.data || []);
            } catch (error) {
                console.error("Failed to fetch batches", error);
            } finally {
                setLoading(false);
            }
        };
        fetchBatches();
    }, []);

    const isLoggedIn = !!localStorage.getItem("token");

    return (
        <div className="flex flex-col min-h-screen">
            {/* Hero Section */}
            <section className="bg-primary text-primary-foreground py-20 md:py-32">
                <div className="container mx-auto px-4 text-center">
                    <h1 className="text-4xl md:text-6xl font-bold mb-6">
                        Belajar Coding dari Nol, <br /> Terstruktur & Live
                    </h1>
                    <p className="text-lg md:text-xl mb-8 max-w-2xl mx-auto opacity-90">
                        Platform bootcamp online dengan kurikulum terkini,
                        mentor berpengalaman, dan jadwal fleksibel. Mulai karir
                        IT-mu sekarang!
                    </p>
                    <div className="flex justify-center gap-4">
                        <Button size="lg" variant="secondary" asChild>
                            <Link to="/auth">Daftar Sekarang</Link>
                        </Button>
                        <Button
                            size="lg"
                            variant="outline"
                            className="bg-transparent border-primary-foreground/50 hover:bg-primary-foreground/10 text-primary-foreground"
                            asChild
                        >
                            <a href="#batches">Lihat Batch</a>
                        </Button>
                    </div>
                </div>
            </section>

            {/* Program Overview */}
            <section className="py-16 bg-white">
                <div className="container mx-auto px-4">
                    <h2 className="text-3xl font-bold text-center mb-12">
                        Kenapa Belajar Di Sini?
                    </h2>
                    <div className="grid md:grid-cols-3 gap-8">
                        <Card>
                            <CardHeader>
                                <CardTitle>Kurikulum Terstruktur</CardTitle>
                            </CardHeader>
                            <CardContent>
                                Materi disusun dari dasar hingga mahir, sesuai
                                kebutuhan industri saat ini.
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader>
                                <CardTitle>Mentoring Live</CardTitle>
                            </CardHeader>
                            <CardContent>
                                Sesi Zoom langsung dengan mentor untuk tanya
                                jawab dan code review.
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader>
                                <CardTitle>Akses Seumur Hidup</CardTitle>
                            </CardHeader>
                            <CardContent>
                                Rekaman kelas dan materi update bisa diakses
                                kapan saja melalui dashboard.
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </section>

            {/* Batch List */}
            <section id="batches" className="py-16 bg-gray-50">
                <div className="container mx-auto px-4">
                    <h2 className="text-3xl font-bold text-center mb-12">
                        Pilih Jadwal Belajar
                    </h2>

                    {loading ? (
                        <div className="flex justify-center">
                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        </div>
                    ) : batches.length > 0 ? (
                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {batches.map((batch) => (
                                <Card key={batch.id} className="flex flex-col">
                                    <CardHeader>
                                        <div className="flex justify-between items-start">
                                            <CardTitle className="text-xl">
                                                {batch.title}
                                            </CardTitle>
                                            <Badge
                                                variant={
                                                    batch.status_effective ===
                                                    "OPEN"
                                                        ? "default"
                                                        : "secondary"
                                                }
                                            >
                                                {batch.status_effective}
                                            </Badge>
                                        </div>
                                        <CardDescription>
                                            {format(
                                                new Date(batch.start_date),
                                                "d MMM yyyy",
                                            )}{" "}
                                            -{" "}
                                            {batch.end_date
                                                ? format(
                                                      new Date(batch.end_date),
                                                      "d MMM yyyy",
                                                  )
                                                : "Selesai"}
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent className="flex-1">
                                        <div className="space-y-2 text-sm text-gray-600">
                                            <p>
                                                💰 Rp{" "}
                                                {parseInt(
                                                    batch.price,
                                                ).toLocaleString("id-ID")}
                                            </p>
                                            {/* Assuming API returns schedule if available, or static placeholder */}
                                            <p>📅 Senin & Kamis, 19.00 WIB</p>
                                        </div>
                                    </CardContent>
                                    <CardFooter>
                                        <Button
                                            className="w-full"
                                            asChild
                                            disabled={
                                                batch.status_effective !==
                                                "OPEN"
                                            }
                                        >
                                            <Link
                                                to={
                                                    batch.status_effective ===
                                                    "OPEN"
                                                        ? isLoggedIn
                                                            ? `/batches/${batch.id}`
                                                            : `/auth?redirect=/batches/${batch.id}`
                                                        : "#"
                                                }
                                            >
                                                {batch.status_effective ===
                                                "OPEN"
                                                    ? "Daftar Batch"
                                                    : "Pendaftaran Tutup"}
                                            </Link>
                                        </Button>
                                    </CardFooter>
                                </Card>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center text-gray-500">
                            Belum ada batch yang tersedia saat ini.
                        </div>
                    )}
                </div>
            </section>
        </div>
    );
};

export default LandingPage;
