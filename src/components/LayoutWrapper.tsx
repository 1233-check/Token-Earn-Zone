"use client";

import { usePathname } from "next/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export default function LayoutWrapper({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const isLoginPage = pathname === "/login";

    return (
        <>
            {!isLoginPage && <Navbar />}
            <main className="flex-1 container mx-auto flex flex-col">
                {children}
            </main>
            {!isLoginPage && <Footer />}
        </>
    );
}
