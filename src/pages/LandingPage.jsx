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

    const liveBatches = batches
        .filter((b) => b.type === "LIVE")
        .sort((a, b) => new Date(a.start_date) - new Date(b.start_date))
        .slice(0, 3);
        
    const courseBatches = batches
        .filter((b) => b.type === "COURSE")
        .slice(0, 3);

    const renderBatchCard = (batch) => (
        <Card key={batch.id} className="flex flex-col group hover:border-primary/50 transition-all duration-300 shadow-md hover:shadow-xl border-muted/60">
            <CardHeader className="pb-4">
                <div className="flex flex-col gap-3 mb-2">
                    <div className="flex justify-between items-start">
                        <Badge
                            variant={batch.type === "LIVE" ? "default" : "secondary"}
                            className="text-[10px] px-2.5 py-0.5 font-bold uppercase tracking-wider"
                        >
                            {batch.type || "LIVE"}
                        </Badge>
                        {batch.type === "LIVE" && (
                            <Badge
                                variant={batch.status_effective === "OPEN" ? "outline" : "secondary"}
                                className="text-[10px] px-2.5 py-0.5 font-bold uppercase tracking-wider"
                            >
                                {batch.status_effective}
                            </Badge>
                        )}
                    </div>
                    <CardTitle className="text-xl font-bold line-clamp-2 min-h-[3.5rem]">
                        {batch.title}
                    </CardTitle>
                </div>
                <CardDescription className="flex items-center gap-2">
                    {batch.type === "COURSE" ? (
                        <span className="text-primary font-semibold bg-primary/5 px-2 py-0.5 rounded text-xs">
                            Video Learning
                        </span>
                    ) : (
                        <span className="text-muted-foreground font-medium text-xs bg-muted px-2 py-0.5 rounded">
                            Mulai: {format(new Date(batch.start_date), "d MMM yyyy")}
                        </span>
                    )}
                </CardDescription>
            </CardHeader>
            <CardContent className="flex-1 pb-6">
                <div className="space-y-4">
                    <div className="flex items-baseline gap-1">
                        <span className="text-2xl font-black text-foreground">
                            Rp {parseInt(batch.price).toLocaleString("id-ID")}
                        </span>
                    </div>
                    
                    <div className="space-y-2 text-sm text-muted-foreground border-t pt-4">
                        {batch.type === "COURSE" ? (
                            <p className="flex items-center gap-2">
                                <span>✨</span> Belajar kapan saja, di mana saja
                            </p>
                        ) : (
                            <p className="flex items-center gap-2">
                                <span>📅</span> Mentoring Langsung
                            </p>
                        )}
                        <p className="flex items-center gap-2">
                            <span>🚀</span> Akses materi seumur hidup
                        </p>
                    </div>
                </div>
            </CardContent>
            <CardFooter className="pt-0">
                <Button
                    className="w-full font-bold group-hover:scale-[1.02] transition-transform"
                    asChild
                    disabled={batch.type === "LIVE" && batch.status_effective !== "OPEN"}
                >
                    <Link
                        to={
                            batch.type === "COURSE" || batch.status_effective === "OPEN"
                                ? isLoggedIn
                                    ? `/batches/${batch.id}`
                                    : `/auth?redirect=/batches/${batch.id}`
                                : "#"
                        }
                    >
                        {batch.type === "COURSE" 
                            ? "Mulai Belajar" 
                            : batch.status_effective === "OPEN" 
                                ? "Daftar Sekarang" 
                                : "Pendaftaran Tutup"}
                    </Link>
                </Button>
            </CardFooter>
        </Card>
    );

    return (
        <div className="flex flex-col min-h-screen">
            {/* Hero Section */}
            <section className="relative overflow-hidden bg-slate-950 text-white py-24 md:py-32 lg:py-40">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(59,130,246,0.1),transparent)]" />
                <div className="container relative mx-auto px-4 text-center">
                    <Badge variant="outline" className="mb-6 border-primary/50 text-primary-foreground/80 hover:bg-transparent">
                        #1 Tech Bootcamp di Indonesia
                    </Badge>
                    <h1 className="text-5xl md:text-7xl font-black mb-8 leading-[1.1] tracking-tight">
                        Kuasai Skill Tech <br /> 
                        <span className="text-primary">Masa Depanmu</span>
                    </h1>
                    <p className="text-lg md:text-xl mb-12 max-w-2xl mx-auto text-slate-400 font-medium">
                        Kurikulum standar industri, mentor praktisi ahli, dan dukungan karir profesional. Pilih metode belajarmu sekarang.
                    </p>
                    <div className="flex flex-col sm:flex-row justify-center gap-4">
                        <Button size="lg" className="h-14 px-8 text-base font-bold rounded-full" asChild>
                            <a href="#live">Lihat Bootcamp Live</a>
                        </Button>
                        <Button
                            size="lg"
                            variant="outline"
                            className="h-14 px-8 text-base font-bold rounded-full border-slate-700 bg-slate-900/50 hover:bg-slate-800"
                            asChild
                        >
                            <a href="#course">Course Fleksibel</a>
                        </Button>
                    </div>
                </div>
            </section>

            {/* Value Proposition */}
            <section className="py-24 bg-white">
                <div className="container mx-auto px-4">
                    <div className="text-center max-w-3xl mx-auto mb-16">
                        <h2 className="text-3xl md:text-4xl font-bold mb-4 tracking-tight">
                            Kenapa Belajar Di Sini?
                        </h2>
                        <p className="text-muted-foreground">
                            Kami memberikan pengalaman belajar terbaik untuk membantumu mencapai tujuan karirmu lebih cepat.
                        </p>
                    </div>
                    <div className="grid md:grid-cols-3 gap-8">
                        <div className="p-8 rounded-2xl border border-muted bg-slate-50/50 hover:shadow-lg transition-shadow">
                            <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center text-primary mb-6">
                                <span className="text-2xl">📚</span>
                            </div>
                            <h3 className="text-xl font-bold mb-3">Kurikulum Terstruktur</h3>
                            <p className="text-muted-foreground leading-relaxed">
                                Materi disusun dari dasar hingga mahir oleh praktisi industri, memastikan relevansi dengan kebutuhan pasar kerja.
                            </p>
                        </div>
                        <div className="p-8 rounded-2xl border border-muted bg-slate-50/50 hover:shadow-lg transition-shadow">
                            <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center text-primary mb-6">
                                <span className="text-2xl">⚡</span>
                            </div>
                            <h3 className="text-xl font-bold mb-3">Mentoring Live</h3>
                            <p className="text-muted-foreground leading-relaxed">
                                Sesi interaktif langsung dengan mentor berpengalaman untuk bimbingan mendalam dan pemecahan masalah secara real-time.
                            </p>
                        </div>
                        <div className="p-8 rounded-2xl border border-muted bg-slate-50/50 hover:shadow-lg transition-shadow">
                            <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center text-primary mb-6">
                                <span className="text-2xl">🔓</span>
                            </div>
                            <h3 className="text-xl font-bold mb-3">Akses Seumur Hidup</h3>
                            <p className="text-muted-foreground leading-relaxed">
                                Belajar sesuai ritmemu sendiri. Nikmati akses tanpa batas ke rekaman kelas dan update materi selamanya.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Batch List Container */}
            <div className="pb-24">
                {loading ? (
                    <div className="flex justify-center py-24">
                        <Loader2 className="h-10 w-10 animate-spin text-primary opacity-50" />
                    </div>
                ) : batches.length > 0 ? (
                    <>
                        {/* Section 1: LIVE */}
                        {liveBatches.length > 0 && (
                            <section id="live" className="py-24 bg-slate-50 scroll-mt-20">
                                <div className="container mx-auto px-4">
                                    <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-12 gap-6">
                                        <div className="max-w-2xl">
                                            <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-3">Bootcamp Terdekat</h2>
                                            <p className="text-muted-foreground font-medium">Belajar intensif secara live bersama mentor ahli dalam jadwal yang terstruktur.</p>
                                        </div>
                                        <Button variant="outline" asChild className="rounded-full font-bold px-6 shadow-sm">
                                            <Link to="/batches?type=LIVE">Lihat Semua Bootcamp</Link>
                                        </Button>
                                    </div>
                                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                                        {liveBatches.map((batch) => renderBatchCard(batch))}
                                    </div>
                                </div>
                            </section>
                        )}

                        {/* Section 2: COURSE */}
                        {courseBatches.length > 0 && (
                            <section id="course" className="py-24 bg-white scroll-mt-20">
                                <div className="container mx-auto px-4">
                                    <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-12 gap-6">
                                        <div className="max-w-2xl">
                                            <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-3">Course Fleksibel</h2>
                                            <p className="text-muted-foreground font-medium">Kuasai skill baru kapan saja dengan modul video yang bisa diakses seumur hidup.</p>
                                        </div>
                                        <Button variant="outline" asChild className="rounded-full font-bold px-6 shadow-sm">
                                            <Link to="/batches?type=COURSE">Lihat Semua Course</Link>
                                        </Button>
                                    </div>
                                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                                        {courseBatches.map((batch) => renderBatchCard(batch))}
                                    </div>
                                </div>
                            </section>
                        )}
                    </>
                ) : (
                    <div className="text-center py-32 text-muted-foreground bg-slate-50 border-y">
                        <p className="text-xl font-medium">Belum ada batch yang tersedia saat ini.</p>
                        <p className="mt-2">Silakan cek kembali dalam waktu dekat!</p>
                    </div>
                )}
            </div>

            {/* Final CTA Section */}
            <section className="py-24 bg-primary text-primary-foreground">
                <div className="container mx-auto px-4 text-center max-w-4xl">
                    <h2 className="text-3xl md:text-5xl font-black mb-8 leading-tight">
                        Siap Memulai Karir <br /> 
                        Impianmu di Dunia Tech?
                    </h2>
                    <p className="text-lg md:text-xl mb-12 opacity-90 max-w-2xl mx-auto">
                        Bergabunglah dengan ribuan alumni yang telah sukses berkarir di perusahaan teknologi ternama.
                    </p>
                    <div className="flex flex-col sm:flex-row justify-center gap-4">
                        <Button size="lg" variant="secondary" className="h-14 px-10 text-base font-bold rounded-full" asChild>
                            <Link to="/auth">Daftar Sekarang — Gratis</Link>
                        </Button>
                        <Button
                            size="lg"
                            variant="outline"
                            className="h-14 px-10 text-base font-bold rounded-full bg-transparent border-primary-foreground/50 hover:bg-primary-foreground/10 text-primary-foreground"
                        >
                            Hubungi Konsultan Kami
                        </Button>
                    </div>
                </div>
            </section>
        </div>
    );
};

export default LandingPage;
