"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Gauge, Wallet, User, Landmark, Headset } from "lucide-react";

export default function Footer() {
    const pathname = usePathname();

    const navItems = [
        { href: "/", icon: Gauge },
        { href: "/wallet", icon: Wallet },
        { href: "/profile", icon: User },
        { href: "/bank", icon: Landmark },
        { href: "/support", icon: Headset },
    ];

    return (
        <footer className="fixed bottom-0 left-0 w-full bg-[#0a150b] border-t border-[var(--color-card-border)] z-50 md:rounded-none safe-area-bottom">
            <div className="max-w-md mx-auto flex justify-between items-center px-4 py-3">
                {navItems.map((item) => {
                    const isActive = pathname === item.href;
                    const Icon = item.icon;
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={`flex flex-col items-center justify-center p-2 rounded-xl transition-all duration-200 ${isActive
                                    ? "text-[var(--color-accent)] bg-[var(--color-accent)]/10"
                                    : "text-[var(--color-text-muted)] hover:text-white hover:bg-white/5"
                                }`}
                        >
                            <Icon size={24} strokeWidth={isActive ? 2 : 1.5} />
                        </Link>
                    )
                })}
            </div>
        </footer>
    );
}
