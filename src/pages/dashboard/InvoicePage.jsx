import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, ArrowLeft } from "lucide-react";
import { format, parseISO } from "date-fns";

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------
const InvoicePage = () => {
    const { id } = useParams();
    const navigate = useNavigate();

    const [invoice, setInvoice] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // -----------------------------------------------------------------------
    // Fetch invoice data
    // -----------------------------------------------------------------------
    useEffect(() => {
        const fetchInvoice = async () => {
            try {
                const res = await api.get(`/enrollment/${id}/invoice`);
                setInvoice(res.data?.data || res.data || res);
            } catch (err) {
                console.error("Failed to fetch invoice", err);
                setError("Gagal memuat detail invoice. Silakan coba lagi.");
            } finally {
                setLoading(false);
            }
        };

        if (id) {
            fetchInvoice();
        }
    }, [id]);

    // -----------------------------------------------------------------------
    // Loading State
    // -----------------------------------------------------------------------
    if (loading) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-white">
                <Loader2 className="h-10 w-10 animate-spin text-primary/50 mb-4" />
                <p className="text-muted-foreground">Memuat invoice...</p>
            </div>
        );
    }

    // -----------------------------------------------------------------------
    // Error State
    // -----------------------------------------------------------------------
    if (error || !invoice) {
        return (
            <div className="min-h-screen container mx-auto p-6 max-w-3xl flex flex-col items-center justify-center">
                <Card className="border-destructive/50 bg-destructive/5 w-full">
                    <CardContent className="flex flex-col items-center justify-center py-12">
                        <p className="text-lg font-medium text-destructive mb-4">
                            {error || "Invoice tidak ditemukan"}
                        </p>
                        <Button
                            variant="outline"
                            onClick={() => window.location.reload()}
                        >
                            Coba Lagi
                        </Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    // -----------------------------------------------------------------------
    // Main UI - Compact Design (Reference)
    // -----------------------------------------------------------------------
    return (
        <div className="min-h-screen bg-white flex justify-center py-10 print:py-0">
            <div className="w-full max-w-3xl px-6 sm:px-12">
                {/* Back Button (Hidden on print) */}
                <div className="mb-8 print:hidden">
                    <Button
                        variant="ghost"
                        size="sm"
                        className="text-gray-500 hover:text-gray-900 -ml-4"
                        onClick={() => navigate("/dashboard/payments")}
                    >
                        <ArrowLeft className="mr-2 h-4 w-4" /> Kembali
                    </Button>
                </div>

                {/* Header Section */}
                <div className="flex flex-col sm:flex-row justify-between items-start mb-6">
                    <div>
                        <h1 className="text-4xl sm:text-5xl font-extrabold text-black tracking-tight mb-2 uppercase">
                            INVOICE
                        </h1>
                        <p className="text-gray-400 text-lg">
                            #{invoice.invoice_number}
                        </p>
                    </div>
                    <div className="text-left sm:text-right mt-6 sm:mt-0">
                        <p className="text-gray-400 text-xs font-bold uppercase tracking-widest mb-1">
                            Tanggal Terbit
                        </p>
                        <p className="font-bold text-xl text-black mb-1">
                            {invoice.issued_at
                                ? format(
                                      parseISO(invoice.issued_at),
                                      "d MMMM yyyy",
                                  )
                                : "-"}
                        </p>
                        <p className="text-violet-600 font-extrabold text-sm uppercase tracking-widest mt-2">
                            SUCCESS
                        </p>
                    </div>
                </div>

                {/* Separator Line */}
                <div className="h-1 w-full bg-violet-600 mb-10"></div>

                {/* Billing Information */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-10 mb-12">
                    {/* Company Info */}
                    <div className="space-y-1 text-sm text-gray-600 font-medium">
                        <h3 className="font-bold text-gray-500 uppercase tracking-widest mb-4">
                            Dibayarkan Kepada
                        </h3>
                        <p className="font-bold text-black text-base">
                            PT. Bootcamp Nusantara
                        </p>
                        <p>Gedung Inovasi Lt. 5</p>
                        <p>Jl. Jendral Sudirman Kav. 21, Jakarta Selatan</p>
                        <p className="text-violet-600 pt-2">
                            bootcampnusantara.id
                        </p>
                    </div>

                    {/* Customer Info */}
                    <div className="space-y-1 text-sm text-gray-600 font-medium text-right">
                        <h3 className="font-bold text-gray-500 uppercase tracking-widest mb-4">
                            Ditagihkan Kepada
                        </h3>
                        <p className="font-bold text-black text-base">
                            {invoice.customer?.name}
                        </p>
                        <p>{invoice.customer?.email}</p>
                        {invoice.customer?.phone_number && (
                            <p>{invoice.customer.phone_number}</p>
                        )}
                    </div>
                </div>

                {/* Order Details Table */}
                <div className="mb-12">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-t border-b border-gray-100 text-gray-800 text-sm uppercase font-bold tracking-wide">
                                <th className="py-4 w-1/2">
                                    Deskripsi Layanan
                                </th>
                                <th className="py-4 text-center">Kuantitas</th>
                                <th className="py-4 text-center">
                                    Harga Satuan
                                </th>
                                <th className="py-4 text-right">Total</th>
                            </tr>
                        </thead>
                        <tbody className="text-sm font-medium text-gray-600">
                            <tr className="border-b border-gray-100">
                                <td className="py-6 align-top pr-4">
                                    <p className="font-bold text-black text-base">
                                        {invoice.batch?.title ||
                                            "Kelas Regular"}
                                    </p>
                                    <p className="text-xs text-gray-500 leading-relaxed mt-1 max-w-[200px]">
                                        Akses penuh materi dan rekaman sesi
                                        live.
                                    </p>
                                </td>
                                <td className="py-6 align-top text-center text-violet-600 font-semibold">
                                    1
                                </td>
                                <td className="py-6 align-top text-center whitespace-nowrap">
                                    Rp{" "}
                                    {invoice.batch?.price
                                        ? parseInt(
                                              invoice.batch.price,
                                          ).toLocaleString("id-ID")
                                        : "0"}
                                </td>
                                <td className="py-6 align-top text-right whitespace-nowrap text-gray-600">
                                    Rp{" "}
                                    {invoice.batch?.price
                                        ? parseInt(
                                              invoice.batch.price,
                                          ).toLocaleString("id-ID")
                                        : "0"}
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                {/* Bottom Separator */}
                <div className="h-px w-full bg-gray-100 mb-8 mt-16"></div>

                {/* Footer Notes */}
                <div className="text-sm text-gray-700 font-medium flex flex-col sm:flex-row justify-between items-end gap-6 pb-20">
                    <div>
                        <p>
                            Dokumen ini sah dan diterbitkan secara elektronik
                            oleh sistem.
                        </p>
                        <p className="mt-1">
                            Terima kasih atas partisipasi Anda.
                        </p>
                    </div>

                    {/* Print Button */}
                    <div className="print:hidden">
                        <Button
                            className="bg-black hover:bg-gray-800 text-white rounded-md px-6"
                            onClick={() => window.print()}
                        >
                            Cetak
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default InvoicePage;
