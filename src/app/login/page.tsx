"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/providers/AuthProvider";
import { ShieldCheck, TrendingUp, Users, Mail, Lock, UserPlus, LogIn, Loader2, Eye, EyeOff } from "lucide-react";

export default function LoginPage() {
    const { user, isLoading: authLoading } = useAuth();
    const router = useRouter();
    const [mounted, setMounted] = useState(false);

    const [isSignUp, setIsSignUp] = useState(false);
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [fullName, setFullName] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState("");
    const [successMessage, setSuccessMessage] = useState("");

    useEffect(() => {
        setMounted(true);
    }, []);

    const { signUp, signIn } = useAuth();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setSuccessMessage("");
        setIsSubmitting(true);

        try {
            if (isSignUp) {
                const { error: signUpError } = await signUp(email, password, fullName);
                if (signUpError) {
                    setError(signUpError.message);
                } else {
                    setSuccessMessage("Account created! You can now log in.");
                    setIsSignUp(false);
                    setPassword("");
                }
            } else {
                const { error: signInError } = await signIn(email, password);
                if (signInError) {
                    setError(signInError.message);
                }
                // On success, the auth listener in AuthProvider handles redirect
            }
        } catch (err: any) {
            setError(err.message || "An unexpected error occurred");
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!mounted || authLoading) {
        return (
            <div className="min-h-[100dvh] flex items-center justify-center bg-[#040804]">
                <Loader2 size={32} className="animate-spin text-[var(--color-accent)]" />
            </div>
        );
    }

    return (
        <div className="min-h-[100dvh] flex flex-col items-center justify-center p-6 bg-[#040804] relative overflow-hidden">
            {/* Background Effects */}
            <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[var(--color-accent)]/10 rounded-full blur-[100px] pointer-events-none -translate-x-1/2 -translate-y-1/2" />
            <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-[var(--color-accent)]/5 rounded-full blur-[100px] pointer-events-none translate-x-1/2 translate-y-1/2" />

            <div className="w-full max-w-md flex flex-col items-center relative z-10">
                {/* Logo Area */}
                <div className="mb-8 flex flex-col items-center animate-fade-in-up">
                    <img
                        src="/logo.png?v=3"
                        alt="TOKEN EARN"
                        className="h-28 object-contain mb-4 drop-shadow-[0_0_15px_rgba(25,172,62,0.5)]"
                    />
                    <h1 className="text-3xl font-bold text-white tracking-tight text-center">
                        The Future of <span className="text-[var(--color-accent)]">Web3 Networking</span>
                    </h1>
                    <p className="text-[var(--color-text-muted)] text-center mt-3 text-sm max-w-[280px]">
                        Secure your slot today and start earning daily Token Earn Trade income.
                    </p>
                </div>

                {/* Feature Grid */}
                <div className="grid grid-cols-1 gap-3 w-full mb-8 animate-fade-in-up" style={{ animationDelay: "100ms" }}>
                    <div className="bg-card/50 backdrop-blur-md border border-[var(--color-card-border)] rounded-2xl p-4 flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-[var(--color-accent)]/10 flex items-center justify-center flex-shrink-0">
                            <TrendingUp size={20} className="text-[var(--color-accent)]" />
                        </div>
                        <div>
                            <h3 className="text-white font-semibold text-sm">Automated ROI</h3>
                            <p className="text-[var(--color-text-muted)] text-xs mt-0.5">Up to 12% daily returns on active slots.</p>
                        </div>
                    </div>
                    <div className="bg-card/50 backdrop-blur-md border border-[var(--color-card-border)] rounded-2xl p-4 flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-[#fbbf24]/10 flex items-center justify-center flex-shrink-0">
                            <Users size={20} className="text-[#fbbf24]" />
                        </div>
                        <div>
                            <h3 className="text-white font-semibold text-sm">Global Matrix</h3>
                            <p className="text-[var(--color-text-muted)] text-xs mt-0.5">Earn from your downline seamlessly.</p>
                        </div>
                    </div>
                </div>

                {/* Login / Sign Up Form */}
                <div className="w-full relative group animate-fade-in-up" style={{ animationDelay: "200ms" }}>
                    <div className="absolute -inset-1 bg-gradient-to-r from-[var(--color-accent)] to-[#0a150b] rounded-2xl blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200" />
                    <div className="relative bg-[#0a150b] rounded-2xl p-6 border border-[var(--color-accent)]/20 shadow-2xl">
                        <div className="flex items-center justify-center gap-2 mb-5">
                            <ShieldCheck size={24} className="text-[var(--color-accent)]" />
                            <h2 className="text-xl font-bold text-white">
                                {isSignUp ? "Create Account" : "Welcome Back"}
                            </h2>
                        </div>

                        {error && (
                            <div className="bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3 mb-4 text-red-400 text-sm text-center">
                                {error}
                            </div>
                        )}

                        {successMessage && (
                            <div className="bg-[var(--color-accent)]/10 border border-[var(--color-accent)]/30 rounded-xl px-4 py-3 mb-4 text-[var(--color-accent)] text-sm text-center">
                                {successMessage}
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                            {isSignUp && (
                                <div className="relative">
                                    <UserPlus size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]" />
                                    <input
                                        id="fullName"
                                        type="text"
                                        placeholder="Full Name (optional)"
                                        value={fullName}
                                        onChange={(e) => setFullName(e.target.value)}
                                        className="w-full bg-[#040804]/80 border border-[var(--color-card-border)] rounded-xl pl-12 pr-4 py-3.5 text-white placeholder:text-[var(--color-text-muted)]/50 focus:outline-none focus:border-[var(--color-accent)]/50 transition-colors text-sm"
                                    />
                                </div>
                            )}

                            <div className="relative">
                                <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]" />
                                <input
                                    id="email"
                                    type="email"
                                    placeholder="Email Address"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full bg-[#040804]/80 border border-[var(--color-card-border)] rounded-xl pl-12 pr-4 py-3.5 text-white placeholder:text-[var(--color-text-muted)]/50 focus:outline-none focus:border-[var(--color-accent)]/50 transition-colors text-sm"
                                />
                            </div>

                            <div className="relative">
                                <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]" />
                                <input
                                    id="password"
                                    type={showPassword ? "text" : "password"}
                                    placeholder="Password"
                                    required
                                    minLength={6}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full bg-[#040804]/80 border border-[var(--color-card-border)] rounded-xl pl-12 pr-12 py-3.5 text-white placeholder:text-[var(--color-text-muted)]/50 focus:outline-none focus:border-[var(--color-accent)]/50 transition-colors text-sm"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)] hover:text-white transition-colors"
                                >
                                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>

                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="w-full bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] text-white font-bold py-3.5 rounded-xl transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed text-sm shadow-[0_0_20px_rgba(25,172,62,0.3)]"
                            >
                                {isSubmitting ? (
                                    <Loader2 size={18} className="animate-spin" />
                                ) : isSignUp ? (
                                    <>
                                        <UserPlus size={18} /> Create Account
                                    </>
                                ) : (
                                    <>
                                        <LogIn size={18} /> Sign In
                                    </>
                                )}
                            </button>
                        </form>

                        <div className="mt-5 text-center">
                            <button
                                onClick={() => {
                                    setIsSignUp(!isSignUp);
                                    setError("");
                                    setSuccessMessage("");
                                }}
                                className="text-[var(--color-text-muted)] hover:text-[var(--color-accent)] text-sm transition-colors"
                            >
                                {isSignUp
                                    ? "Already have an account? Sign in"
                                    : "Don't have an account? Create one"}
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <p className="absolute bottom-6 text-center text-[var(--color-text-muted)] text-xs opacity-50">
                &copy; 2026 Token Earn. All rights reserved.
            </p>
        </div>
    );
}
