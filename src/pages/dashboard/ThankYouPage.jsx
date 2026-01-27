import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { CheckCircle2 } from "lucide-react";

const ThankYouPage = () => {
    const { state } = useLocation();
    const batch = state?.batch;

    return (
        <div className="container mx-auto p-6 max-w-xl text-center min-h-[60vh] flex flex-col justify-center">
            <Card>
                <CardHeader>
                    <div className="mx-auto bg-green-100 p-3 rounded-full w-fit mb-4">
                        <CheckCircle2 className="h-10 w-10 text-green-600" />
                    </div>
                    <CardTitle className="text-2xl font-bold text-green-700">Pendaftaran Berhasil! 🎉</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <p className="text-gray-600">
                        Selamat, kamu telah terdaftar di <strong>{batch?.title || "Batch"}</strong>.
                    </p>

                    <div className="bg-blue-50 text-blue-800 p-4 rounded-lg text-sm text-left">
                        <p className="font-semibold mb-1">Informasi Penting:</p>
                        <ul className="list-disc pl-4 space-y-1">
                            <li>Link Zoom akan dikirim ke WhatsApp kamu 1 jam sebelum kelas.</li>
                            <li>Silahkan cek dashboard untuk melihat materi persiapan.</li>
                            <li>Jadwal: Senin & Kamis, 19.00 WIB.</li>
                        </ul>
                    </div>
                </CardContent>
                <CardFooter className="flex flex-col space-y-2">
                    <Button className="w-full" size="lg" asChild>
                        <Link to="/dashboard">Ke Dashboard Saya</Link>
                    </Button>
                    <Button variant="ghost" asChild>
                        <Link to="/">Kembali ke Beranda</Link>
                    </Button>
                </CardFooter>
            </Card>
        </div>
    );
};

export default ThankYouPage;
