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

    const liveBatches = batches.filter((b) => b.type === "LIVE").slice(0, 3);
    const courseBatches = batches.filter((b) => b.type === "COURSE").slice(0, 3);

    const renderBatchCard = (batch) => (
        <Card key={batch.id} className="flex flex-col group hover:border-primary/50 transition-all duration-300 shadow-sm hover:shadow-md">
            <CardHeader>
                <div className="flex flex-col gap-2 mb-2">
                    <div className="flex justify-between items-start">
                        <Badge
                            variant={batch.type === "LIVE" ? "default" : "secondary"}
                            className="text-[10px] px-2 py-0 h-5"
                        >
                            {batch.type || "LIVE"}
                        </Badge>
                        <Badge
                            variant={batch.status_effective === "OPEN" ? "outline" : "secondary"}
                            className="text-[10px] px-2 py-0 h-5"
                        >
                            {batch.status_effective}
                        </Badge>
                    </div>
                    <CardTitle className="text-xl">
                        {batch.title}
                    </CardTitle>
                </div>
                <CardDescription>
                    {batch.type === "COURSE" ? (
                        <span className="text-primary font-medium">
                            Akses fleksibel
                        </span>
                    ) : (
                        <>
                            {format(new Date(batch.start_date), "d MMM yyyy")} -{" "}
                            {batch.end_date ? format(new Date(batch.end_date), "d MMM yyyy") : "Selesai"}
                        </>
                    )}
                </CardDescription>
            </CardHeader>
            <CardContent className="flex-1">
                <div className="space-y-2 text-sm text-gray-600">
                    <p className="text-lg font-bold text-gray-900">
                        Rp {parseInt(batch.price).toLocaleString("id-ID")}
                    </p>
                    {batch.type === "COURSE" ? (
                        <p>✨ Belajar kapan saja</p>
                    ) : (
                        <p>📅 Senin & Kamis, 19.00 WIB</p>
                    )}
                </div>
            </CardContent>
            <CardFooter>
                <Button
                    className="w-full group-hover:bg-primary group-hover:text-primary-foreground transition-colors"
                    asChild
                    disabled={batch.status_effective !== "OPEN"}
                >
                    <Link
                        to={
                            batch.status_effective === "OPEN"
                                ? isLoggedIn
                                    ? `/batches/${batch.id}`
                                    : `/auth?redirect=/batches/${batch.id}`
                                : "#"
                        }
                    >
                        {batch.status_effective === "OPEN" ? "Daftar Batch" : "Pendaftaran Tutup"}
                    </Link>
                </Button>
            </CardFooter>
        </Card>
    );

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
            <div id="batches">
                {loading ? (
                    <div className="flex justify-center py-20">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                ) : batches.length > 0 ? (
                    <>
                        {/* Section 1: LIVE */}
                        {liveBatches.length > 0 && (
                            <section className="py-16 bg-gray-50 border-b">
                                <div className="container mx-auto px-4">
                                    <div className="flex justify-between items-end mb-12">
                                        <div>
                                            <h2 className="text-3xl font-bold">Bootcamp Terdekat</h2>
                                            <p className="text-muted-foreground mt-2">Belajar live bareng mentor</p>
                                        </div>
                                        <Button variant="link" asChild className="text-primary font-semibold">
                                            <Link to="/batches?type=LIVE">Lihat Semua →</Link>
                                        </Button>
                                    </div>
                                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                                        {liveBatches.map((batch) => renderBatchCard(batch))}
                                    </div>
                                </div>
                            </section>
                        )}

                        {/* Section 2: COURSE */}
                        {courseBatches.length > 0 && (
                            <section className="py-16 bg-white">
                                <div className="container mx-auto px-4">
                                    <div className="flex justify-between items-end mb-12">
                                        <div>
                                            <h2 className="text-3xl font-bold">Course Fleksibel</h2>
                                            <p className="text-muted-foreground mt-2">Belajar kapan saja, tanpa batas waktu</p>
                                        </div>
                                        <Button variant="link" asChild className="text-primary font-semibold">
                                            <Link to="/batches?type=COURSE">Lihat Semua →</Link>
                                        </Button>
                                    </div>
                                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                                        {courseBatches.map((batch) => renderBatchCard(batch))}
                                    </div>
                                </div>
                            </section>
                        )}
                    </>
                ) : (
                    <div className="text-center py-20 text-gray-500">
                        Belum ada batch yang tersedia saat ini.
                    </div>
                )}
            </div>
        </div>
    );
};

export default LandingPage;
