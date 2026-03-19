"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Mail, ArrowLeft, CheckCircle } from "lucide-react";
import Link from "next/link";

const forgotPasswordSchema = z.object({
    email: z.string().email("Please enter a valid email address"),
});

type ForgotPasswordForm = z.infer<typeof forgotPasswordSchema>;

export default function ForgotPasswordPage() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [error, setError] = useState("");

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<ForgotPasswordForm>({
        resolver: zodResolver(forgotPasswordSchema),
    });

    const onSubmit = async (data: ForgotPasswordForm) => {
        setIsLoading(true);
        setError("");

        try {
            const response = await fetch("http://localhost:5050/auth/forgot-password", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    email: data.email,
                    platform: "web",
                }),
            });

            if (!response.ok) {
                throw new Error("Failed to send reset email");
            }

            setIsSuccess(true);
        } catch (err) {
            setError("Something went wrong. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    if (isSuccess) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-secondary/5 p-4">
                <div className="card max-w-md w-full text-center space-y-6">
                    <div className="flex justify-center">
                        <div className="p-4 bg-success/10 rounded-full">
                            <CheckCircle className="h-12 w-12 text-success" />
                        </div>
                    </div>
                    <h1 className="text-2xl font-bold text-text">Check Your Email</h1>
                    <p className="text-text-muted">
                        If an account with that email exists, we've sent you a password reset link.
                        Please check your inbox and follow the instructions.
                    </p>
                    <Link
                        href="/en/login"
                        className="btn-primary inline-flex items-center gap-2 justify-center w-full"
                    >
                        <ArrowLeft className="h-5 w-5" />
                        Back to Login
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-secondary/5 p-4">
            <div className="card max-w-md w-full space-y-6">
                <div className="text-center space-y-2">
                    <h1 className="text-3xl font-bold text-text">Forgot Password?</h1>
                    <p className="text-text-muted">
                        Enter your email address and we'll send you a link to reset your password.
                    </p>
                </div>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    <div>
                        <label htmlFor="email" className="block text-sm font-medium text-text mb-2">
                            Email Address
                        </label>
                        <div className="relative">
                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-text-muted" />
                            <input
                                {...register("email")}
                                id="email"
                                type="email"
                                placeholder="you@example.com"
                                className={`input pl-10 ${errors.email ? "border-error" : ""}`}
                                disabled={isLoading}
                            />
                        </div>
                        {errors.email && (
                            <p className="mt-1 text-sm text-error">{errors.email.message}</p>
                        )}
                    </div>

                    {error && (
                        <div className="p-3 bg-error/10 border border-error/20 rounded-lg">
                            <p className="text-sm text-error">{error}</p>
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={isLoading}
                        className="btn-primary w-full"
                    >
                        {isLoading ? "Sending..." : "Send Reset Link"}
                    </button>

                    <Link
                        href="/en/login"
                        className="btn-secondary w-full inline-flex items-center gap-2 justify-center"
                    >
                        <ArrowLeft className="h-5 w-5" />
                        Back to Login
                    </Link>
                </form>
            </div>
        </div>
    );
}
