import { clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs) {
    return twMerge(clsx(inputs))
}

export const extractErrorMessage = (error) => {
    const message = error?.response?.data?.message;

    if (!message) return "Something went wrong";

    if (typeof message === "string") return message;

    if (Array.isArray(message)) {
        return message.map((m) => m.message).join(", ");
    }

    return "Unexpected error";
};
