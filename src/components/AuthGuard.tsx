"use client";

import { useAccount } from "wagmi";
import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";

// A wrapper component that checks authentication and redirects if necessary.
// This is used instead of Next.js Middleware which historically struggles with client-side Web3 connection state.
export default function AuthGuard({ children }: { children: React.ReactNode }) {
    const { isConnected } = useAccount();
    const router = useRouter();
    const pathname = usePathname();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        if (!mounted) return;

        // Public routes that don't require connection
        const isPublicRoute = pathname === "/login";

        if (!isConnected && !isPublicRoute) {
            // Not connected and trying to access a private route -> redirect to login
            router.replace("/login");
        } else if (isConnected && isPublicRoute) {
            // Connected but trying to access login -> redirect to dashboard
            router.replace("/");
        }
    }, [isConnected, pathname, mounted, router]);

    // Don't render children until mounted to prevent hydration errors,
    // and don't render private content if not connected (unless on a public route).
    if (!mounted) return null;

    // If they are on a protected route but not connected, render nothing while redirecting
    if (!isConnected && pathname !== "/login") return null;

    return <>{children}</>;
}
