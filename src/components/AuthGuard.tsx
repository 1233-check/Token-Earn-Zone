"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/providers/AuthProvider";
import { Loader2 } from "lucide-react";

// A wrapper component that checks Supabase Auth session and redirects if necessary.
export default function AuthGuard({ children }: { children: React.ReactNode }) {
    const { user, isLoading } = useAuth();
    const router = useRouter();
    const pathname = usePathname();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        if (!mounted || isLoading) return;

        const isPublicRoute = pathname === "/login";

        if (!user && !isPublicRoute) {
            router.replace("/login");
        } else if (user && isPublicRoute) {
            router.replace("/");
        }
    }, [user, isLoading, pathname, mounted, router]);

    // Show loading spinner while auth state is being determined
    if (!mounted || isLoading) {
        return (
            <div className="min-h-[100dvh] flex items-center justify-center bg-[#040804]">
                <Loader2 size={32} className="animate-spin text-[var(--color-accent)]" />
            </div>
        );
    }

    // If on protected route but not authenticated, show nothing while redirecting
    if (!user && pathname !== "/login") return null;

    return <>{children}</>;
}
