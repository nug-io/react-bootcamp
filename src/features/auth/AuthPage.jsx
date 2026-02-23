import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { useAuthStore } from "@/stores/authStore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import toast from "react-hot-toast";

const loginSchema = z.object({
    email: z.string().email("Invalid email address"),
    password: z.string().min(6, "Password must be at least 6 characters"),
});

const registerSchema = loginSchema.extend({
    name: z.string().min(2, "Name must be at least 2 characters"),
    phone_number: z.string().min(10, "Phone number must be valid"),
});

const AuthPage = () => {
    const [isLogin, setIsLogin] = useState(true);

    const navigate = useNavigate();
    const location = useLocation();

    // Ambil redirect dari query
    const params = new URLSearchParams(location.search);
    const redirect = params.get("redirect") || "/";

    const { login, register: registerUser } = useAuthStore();

    const schema = isLogin ? loginSchema : registerSchema;

    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
        reset,
    } = useForm({
        resolver: zodResolver(schema),
    });

    const onSubmit = async (data) => {
        try {
            const user = isLogin
                ? await login(data.email, data.password)
                : await registerUser(data);

            toast.success(
                isLogin ? "Welcome back!" : "Account created successfully!",
            );

            const role = user?.role?.toLowerCase();

            const redirectMap = {
                admin: "/admin"
            };

            navigate(redirectMap[role] || redirect, { replace: true });
        } catch (error) {
            toast.error(
                error.response?.data?.message || "Authentication failed",
            );
        }
    };

    const toggleMode = () => {
        setIsLogin(!isLogin);
        reset(); // Clear form errors/values
    };

    return (
        <Card className="w-full">
            <CardHeader>
                <CardTitle>{isLogin ? "Login" : "Create an Account"}</CardTitle>
                <CardDescription>
                    {isLogin
                        ? "Enter your email below to login to your account"
                        : "Enter your details to create your account"}
                </CardDescription>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    {!isLogin && (
                        <>
                            <div className="space-y-2">
                                <Label htmlFor="name">Full Name</Label>
                                <Input
                                    id="name"
                                    placeholder="John Doe"
                                    {...register("name")}
                                />
                                {errors.name && (
                                    <p className="text-xs text-red-500">
                                        {errors.name.message}
                                    </p>
                                )}
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="phone">Phone Number</Label>
                                <Input
                                    id="phone"
                                    placeholder="08123456789"
                                    {...register("phone_number")}
                                />
                                {errors.phone_number && (
                                    <p className="text-xs text-red-500">
                                        {errors.phone_number.message}
                                    </p>
                                )}
                            </div>
                        </>
                    )}

                    <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input
                            id="email"
                            type="email"
                            placeholder="m@example.com"
                            {...register("email")}
                        />
                        {errors.email && (
                            <p className="text-xs text-red-500">
                                {errors.email.message}
                            </p>
                        )}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="password">Password</Label>
                        <Input
                            id="password"
                            type="password"
                            {...register("password")}
                        />
                        {errors.password && (
                            <p className="text-xs text-red-500">
                                {errors.password.message}
                            </p>
                        )}
                    </div>

                    <Button
                        type="submit"
                        className="w-full"
                        disabled={isSubmitting}
                    >
                        {isSubmitting
                            ? "Loading..."
                            : isLogin
                              ? "Login"
                              : "Sign Up"}
                    </Button>
                </form>
            </CardContent>
            <CardFooter className="flex justify-center">
                <p className="text-sm text-muted-foreground">
                    {isLogin
                        ? "Don't have an account? "
                        : "Already have an account? "}
                    <button
                        onClick={toggleMode}
                        className="text-primary hover:underline font-medium"
                    >
                        {isLogin ? "Sign up" : "Login"}
                    </button>
                </p>
            </CardFooter>
        </Card>
    );
};

export default AuthPage;
