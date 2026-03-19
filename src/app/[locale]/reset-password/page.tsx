"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Lock, CheckCircle, AlertCircle } from "lucide-react";
import Link from "next/link";

const resetPasswordSchema = z.object({
    newPassword: z.string().min(6, "Password must be at least 6 characters"),
    confirmPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
});

type ResetPasswordForm = z.infer<typeof resetPasswordSchema>;

export default function ResetPasswordPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const token = searchParams.get("token");

    const [isLoading, setIsLoading] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [error, setError] = useState("");

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<ResetPasswordForm>({
        resolver: zodResolver(resetPasswordSchema),
    });

    useEffect(() => {
        if (!token) {
            setError("Invalid reset link. Please request a new password reset.");
        }
    }, [token]);

    const onSubmit = async (data: ResetPasswordForm) => {
        if (!token) {
            setError("Invalid reset link");
            return;
        }

        setIsLoading(true);
        setError("");

        try {
            const response = await fetch("http://localhost:5050/auth/reset-password", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    token,
                    newPassword: data.newPassword,
                }),
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || "Failed to reset password");
            }

            setIsSuccess(true);
            setTimeout(() => {
                router.push("/en/login");
            }, 3000);
        } catch (err: any) {
            setError(err.message || "Something went wrong. Please try again.");
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
                    <h1 className="text-2xl font-bold text-text">Password Reset Successful!</h1>
                    <p className="text-text-muted">
                        Your password has been reset successfully. Redirecting to login...
                    </p>
                </div>
            </div>
        );
    }

    if (!token) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-secondary/5 p-4">
                <div className="card max-w-md w-full text-center space-y-6">
                    <div className="flex justify-center">
                        <div className="p-4 bg-error/10 rounded-full">
                            <AlertCircle className="h-12 w-12 text-error" />
                        </div>
                    </div>
                    <h1 className="text-2xl font-bold text-text">Invalid Reset Link</h1>
                    <p className="text-text-muted">
                        This password reset link is invalid or has expired. Please request a new one.
                    </p>
                    <Link href="/en/forgot-password" className="btn-primary inline-block w-full">
                        Request New Link
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-secondary/5 p-4">
            <div className="card max-w-md w-full space-y-6">
                <div className="text-center space-y-2">
                    <h1 className="text-3xl font-bold text-text">Reset Password</h1>
                    <p className="text-text-muted">
                        Enter your new password below.
                    </p>
                </div>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    <div>
                        <label htmlFor="newPassword" className="block text-sm font-medium text-text mb-2">
                            New Password
                        </label>
                        <div className="relative">
                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-text-muted" />
                            <input
                                {...register("newPassword")}
                                id="newPassword"
                                type="password"
                                placeholder="••••••••"
                                className={`input pl-10 ${errors.newPassword ? "border-error" : ""}`}
                                disabled={isLoading}
                            />
                        </div>
                        {errors.newPassword && (
                            <p className="mt-1 text-sm text-error">{errors.newPassword.message}</p>
                        )}
                    </div>

                    <div>
                        <label htmlFor="confirmPassword" className="block text-sm font-medium text-text mb-2">
                            Confirm Password
                        </label>
                        <div className="relative">
                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-text-muted" />
                            <input
                                {...register("confirmPassword")}
                                id="confirmPassword"
                                type="password"
                                placeholder="••••••••"
                                className={`input pl-10 ${errors.confirmPassword ? "border-error" : ""}`}
                                disabled={isLoading}
                            />
                        </div>
                        {errors.confirmPassword && (
                            <p className="mt-1 text-sm text-error">{errors.confirmPassword.message}</p>
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
                        {isLoading ? "Resetting..." : "Reset Password"}
                    </button>

                    <Link
                        href="/en/login"
                        className="btn-secondary w-full inline-block text-center"
                    >
                        Back to Login
                    </Link>
                </form>
            </div>
        </div>
    );
}
