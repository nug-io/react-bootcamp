import { useEffect, useState } from "react";

const useMidtrans = () => {
    const [snap, setSnap] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const scriptUrl = import.meta.env.VITE_MIDTRANS_SCRIPT_URL;
        const clientKey = import.meta.env.VITE_MIDTRANS_CLIENT_KEY;

        if (!scriptUrl || !clientKey) {
            console.error("Midtrans configuration missing in .env");
            setLoading(false);
            return;
        }

        // Check if script is already loaded
        if (window.snap) {
            setSnap(window.snap);
            setLoading(false);
            return;
        }

        const script = document.createElement("script");
        script.src = scriptUrl;
        script.setAttribute("data-client-key", clientKey);
        script.async = true;

        script.onload = () => {
            setSnap(window.snap);
            setLoading(false);
        };

        script.onerror = () => {
            console.error("Failed to load Midtrans Snap script");
            setLoading(false);
        };

        document.body.appendChild(script);

        return () => {
            document.body.removeChild(script);
        };
    }, []);

    return { snap, loading };
};

export default useMidtrans;
