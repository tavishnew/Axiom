"use client";

import { useState } from "react";
import { signUp } from "@/lib/auth-client";

export default function SignUpPage() {
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        try {
            const result = await signUp.email({
                name,
                email,
                password,
                callbackURL: "/",
            });

            if (result.error) {
                setError(result.error.message || "Sign up failed");
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
                        Create your account
                    </p>
                </div>

                {/* Sign Up Card */}
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
                                Name
                            </label>
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="w-full"
                                placeholder="John Doe"
                                required
                            />
                        </div>

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
                                minLength={8}
                                required
                            />
                            <p className="text-xs mt-1" style={{ color: "var(--muted-foreground)" }}>
                                Minimum 8 characters
                            </p>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full btn-primary"
                        >
                            {loading ? "Creating account..." : "Create Account"}
                        </button>
                    </form>

                    <div
                        className="mt-6 pt-4 text-center border-t"
                        style={{ borderColor: "var(--border)" }}
                    >
                        <p className="text-sm" style={{ color: "var(--muted-foreground)" }}>
                            Already have an account?{" "}
                            <a
                                href="/auth/sign-in"
                                style={{ color: "oklch(0.52 0.14 190)" }}
                                className="font-medium"
                            >
                                Sign in
                            </a>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
