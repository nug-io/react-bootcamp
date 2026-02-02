import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { api } from "@/lib/api";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";

const BatchList = () => {
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

    if (loading) {
        return (
            <div className="container mx-auto p-6 space-y-6">
                <h1 className="text-3xl font-bold">Pilih Batch</h1>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[1, 2, 3].map((i) => (
                        <Skeleton key={i} className="h-[250px] w-full rounded-xl" />
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="container mx-auto p-6 space-y-6">
            <h1 className="text-3xl font-bold">Pilih Batch</h1>

            {batches.length === 0 ? (
                <p className="text-muted-foreground">Belum ada batch yang tersedia.</p>
            ) : (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {batches.map((batch) => (
                        <Card key={batch.id} className="flex flex-col">
                            <CardHeader>
                                <div className="flex justify-between items-start">
                                    <CardTitle>{batch.title}</CardTitle>
                                    <Badge variant={batch.status_effective === 'OPEN' ? 'default' : 'secondary'}>{batch.status_effective}</Badge>
                                </div>
                                <CardDescription>Start: {format(new Date(batch.start_date), "d MMM yyyy")}</CardDescription>
                            </CardHeader>
                            <CardContent className="flex-1 space-y-2 text-sm">
                                <p className="font-semibold text-primary">Rp {parseInt(batch.price).toLocaleString('id-ID')}</p>
                                <p>{batch.end_date ? `End: ${format(new Date(batch.end_date), "d MMM yyyy")}` : 'Durasi: 1 Bulan'}</p>
                                <p className="text-muted-foreground">Jadwal: Senin & Kamis, 19.00 WIB</p>
                            </CardContent>
                            <CardFooter>
                                <Button className="w-full" variant="secondary" asChild>
                                    <Link to={`/batches/${batch.id}`}>Lihat Detail</Link>
                                </Button>
                            </CardFooter>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
};

export default BatchList;
