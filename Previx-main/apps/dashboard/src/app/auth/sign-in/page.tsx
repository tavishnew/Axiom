"use client";

import { useState } from "react";
import { signIn } from "@/lib/auth-client";

export default function SignInPage() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        try {
            const result = await signIn.email({
                email,
                password,
                callbackURL: "/",
            });

            if (result.error) {
                setError(result.error.message || "Sign in failed");
            }
        } catch (err) {
            setError("An unexpected error occurred");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center gradient-mesh p-4">
            <div className="w-full max-w-md">
                {/* Logo */}
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold gradient-text">AccessForge</h1>
                    <p className="text-sm mt-2" style={{ color: "var(--muted-foreground)" }}>
                        Sign in to your dashboard
                    </p>
                </div>

                {/* Sign In Card */}
                <div className="card">
                    <form onSubmit={handleSubmit} className="space-y-4">
                        {error && (
                            <div
                                className="p-3 rounded text-sm"
                                style={{
                                    background: "oklch(0.93 0.10 25)",
                                    color: "oklch(0.45 0.20 25)",
                                }}
                            >
                                {error}
                            </div>
                        )}

                        <div>
                            <label
                                className="block text-sm font-medium mb-1"
                                style={{ color: "var(--foreground)" }}
                            >
                                Email
                            </label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full"
                                placeholder="you@company.com"
                                required
                            />
                        </div>

                        <div>
                            <label
                                className="block text-sm font-medium mb-1"
                                style={{ color: "var(--foreground)" }}
                            >
                                Password
                            </label>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full"
                                placeholder="••••••••"
                                required
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full btn-primary"
                        >
                            {loading ? "Signing in..." : "Sign In"}
                        </button>
                    </form>

                    <div
                        className="mt-6 pt-4 text-center border-t"
                        style={{ borderColor: "var(--border)" }}
                    >
                        <p className="text-sm" style={{ color: "var(--muted-foreground)" }}>
                            Don&apos;t have an account?{" "}
                            <a
                                href="/auth/sign-up"
                                style={{ color: "oklch(0.52 0.14 190)" }}
                                className="font-medium"
                            >
                                Sign up
                            </a>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
