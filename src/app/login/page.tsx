"use client";

import { useAccount } from "wagmi";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import ConnectButton from "@/components/ConnectButton";
import { ShieldCheck, TrendingUp, Users } from "lucide-react";

export default function LoginPage() {
    const { isConnected } = useAccount();
    const router = useRouter();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    // Redirect to dashboard if already connected
    useEffect(() => {
        if (mounted && isConnected) {
            router.push("/");
        }
    }, [isConnected, mounted, router]);

    if (!mounted) return null;

    return (
        <div className="min-h-[100dvh] flex flex-col items-center justify-center p-6 bg-[#040804] relative overflow-hidden">
            {/* Background Effects */}
            <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[var(--color-accent)]/10 rounded-full blur-[100px] pointer-events-none -translate-x-1/2 -translate-y-1/2" />
            <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-[var(--color-accent)]/5 rounded-full blur-[100px] pointer-events-none translate-x-1/2 translate-y-1/2" />

            <div className="w-full max-w-md flex flex-col items-center relative z-10">
                {/* Logo Area */}
                <div className="mb-12 flex flex-col items-center animate-fade-in-up">
                    <img
                        src="/logo.png?v=3"
                        alt="TOKEN EARN"
                        className="h-32 object-contain mb-4 drop-shadow-[0_0_15px_rgba(25,172,62,0.5)]"
                    />
                    <h1 className="text-3xl font-bold text-white tracking-tight text-center">
                        The Future of <span className="text-[var(--color-accent)]">Web3 Networking</span>
                    </h1>
                    <p className="text-[var(--color-text-muted)] text-center mt-3 text-sm max-w-[280px]">
                        Secure your slot today and start earning daily Token Earn Trade income.
                    </p>
                </div>

                {/* Feature Grid */}
                <div className="grid grid-cols-1 gap-4 w-full mb-10 animate-fade-in-up" style={{ animationDelay: "100ms" }}>
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

                {/* Connect Action */}
                <div className="w-full relative group animate-fade-in-up" style={{ animationDelay: "200ms" }}>
                    <div className="absolute -inset-1 bg-gradient-to-r from-[var(--color-accent)] to-[#0a150b] rounded-2xl blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200" />
                    <div className="relative bg-[#0a150b] rounded-2xl p-6 border border-[var(--color-accent)]/20 shadow-2xl flex flex-col items-center text-center">
                        <ShieldCheck size={32} className="text-[var(--color-accent)] mb-4" />
                        <h2 className="text-xl font-bold text-white mb-2">Secure Access</h2>
                        <p className="text-[var(--color-text-muted)] text-sm mb-6">
                            No email required. Connect your decentralized wallet to authenticate instantly.
                        </p>
                        <div className="w-full relative z-50">
                            <ConnectButton />
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
