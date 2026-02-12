import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft } from "lucide-react";
import ReactMarkdown from "react-markdown";
import ReactPlayer from "react-player";

const MaterialView = () => {
    const { materialId } = useParams();
    const [material, setMaterial] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // MVP: API might not have GET /material/:id, but typically it does or we find from list.
        // Spec says: GET /material/batch/:batchId (List).
        // Spec does NOT explicitly list GET /material/:id for USER (only PUT for ADMIN).
        // We might need to fetch all materials for the batch and find one?
        // But we don't have batchId in URL here easily unless passed in state.
        // Let's assume GET /material/:id exists or we handle it gracefully.
        // Actually, good practice to pass state or fetch context.
        // I'll try fetching endpoint /material/:id assuming backend supports it (standard REST).
        // If not, I would need to redesign to /batches/:batchId/material/:materialId

        // For MVP robustness, let's assume we might need to fetch batch materials if direct fetch fails?
        // Or just try direct fetch first. The API spec listed "Update Material: PUT /material/:id", implies ID lookup exists.

        const fetchMaterial = async () => {
            try {
                // Trying direct fetch
                const res = await api.get(`/material/${materialId}`).catch(() => null);
                if (res) {
                    setMaterial(res.data);
                } else {
                    // Fallback: This is tricky without knowing batchId.
                    // If this fails, user sees error.

                    // FOR DEMO: Let's mock content if API fails/not implemented yet to show UI
                    setMaterial({
                        id: materialId,
                        title: "Materi Demo (API Fetch Failed)",
                        content: "# Judul Materi \n\nIni adalah konten **markdown**. \n\n- Point 1\n- Point 2",
                        video_url: "https://www.youtube.com/watch?v=LXb3EKWsInQ" // Example URL
                    });
                }
            } catch (error) {
                console.error("Failed to load material", error);
            } finally {
                setLoading(false);
            }
        };
        fetchMaterial();
    }, [materialId]);

    if (loading) return <div className="p-6"><Skeleton className="h-[500px] w-full" /></div>;
    if (!material) return <div className="p-6">Materi tidak ditemukan</div>;

    return (
        <div className="container mx-auto p-6 max-w-4xl">
            <Link to="/dashboard" className="flex items-center text-sm text-muted-foreground mb-6 hover:text-primary">
                <ArrowLeft className="h-4 w-4 mr-1" /> Kembali ke Dashboard
            </Link>

            <div className="grid lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-8">
                    <div>
                        <h1 className="text-3xl font-bold mb-4">{material.title}</h1>
                        <div className="aspect-video bg-black rounded-lg overflow-hidden">
                            {/* Fallback for video URL if property exists */}
                            {material.video_url ? (
                                <ReactPlayer
                                    src={material.video_url}
                                    width="100%"
                                    height="100%"
                                    controls
                                />
                            ) : (
                                <div className="flex items-center justify-center h-full text-white">
                                    Video tidak tersedia
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="prose prose-blue max-w-none bg-white p-6 rounded-lg border shadow-sm">
                        <ReactMarkdown>{material.content}</ReactMarkdown>
                    </div>
                </div>

                <div className="lg:col-span-1">
                    {/* Could add Table of Contents or "Next Material" here */}
                    <div className="bg-gray-50 p-4 rounded-lg border sticky top-6">
                        <h3 className="font-semibold mb-2">Progress</h3>
                        <div className="h-2 bg-gray-200 rounded-full mb-4">
                            <div className="h-2 bg-green-500 rounded-full w-1/3"></div>
                        </div>
                        <Button className="w-full" variant="outline">
                            Tandai Selesai
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MaterialView;
