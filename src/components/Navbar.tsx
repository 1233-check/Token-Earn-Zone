"use client";

import Link from "next/link";
import { User, TrendingUp } from "lucide-react";
import ConnectButton from "./ConnectButton";

export default function Navbar() {
    return (
        <header className="sticky top-0 z-50 w-full bg-[var(--color-background)] py-4">
            <div className="container mx-auto flex h-12 items-center px-4 justify-between">
                <Link href="/" className="flex items-center justify-center pt-1">
                    {/* We'll load the logo from the public folder but fallback to Icon if it fails */}
                    <img
                        src="/logo.png?v=4"
                        alt="Logo"
                        className="h-24 w-auto max-w-[240px] -ml-2 object-contain drop-shadow-[0_0_8px_rgba(25,172,62,0.5)]"
                        onError={(e) => {
                            e.currentTarget.style.display = 'none';
                            e.currentTarget.nextElementSibling?.classList.remove('hidden');
                        }}
                    />
                    <div className="hidden h-10 w-10 items-center justify-center rounded-full bg-[var(--color-accent)] text-white hover:bg-[var(--color-accent-hover)] transition-colors">
                        <TrendingUp size={20} />
                    </div>
                </Link>

                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--color-accent)] text-white hover:bg-[var(--color-accent-hover)] transition-colors cursor-pointer relative group">
                    <User size={20} />
                    <div className="absolute top-12 right-0 hidden group-hover:block bg-[#0a120a] border border-[#1a2a1b] p-2 rounded-xl min-w-[150px]">
                        <ConnectButton />
                    </div>
                </div>
            </div>
        </header>
    );
}
