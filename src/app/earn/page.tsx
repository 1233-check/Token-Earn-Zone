"use client";

import { CircleDollarSign, TrendingUp, Zap, Clock, PackageOpen, Loader2 } from "lucide-react";
import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import { useAccount } from "wagmi";
import { getDailySlotsConfig, getUserSlotStats, bookSlot } from "@/lib/supabase";

export default function EarnPage() {
    const { address, isConnected } = useAccount();
    const [activeTab, setActiveTab] = useState<"packages" | "mining">("packages");
    const [slotsRemaining, setSlotsRemaining] = useState<number>(50);
    const [userSlots, setUserSlots] = useState<{ activeSlots: number, pendingSlots: number, totalSlots: number, totalEarned: number, bookings?: any[] }>({ activeSlots: 0, pendingSlots: 0, totalSlots: 0, totalEarned: 0 });
    const [isBooking, setIsBooking] = useState(false);
    const [isLoadingStats, setIsLoadingStats] = useState(true);

    const loadStats = async () => {
        setIsLoadingStats(true);
        try {
            const config = await getDailySlotsConfig();
            // Maximum daily slots is 50. Config returns slots_booked
            setSlotsRemaining(Math.max(0, 50 - (config?.slots_booked || 0)));

            if (address) {
                const stats = await getUserSlotStats(address);
                setUserSlots(stats);
            }
        } catch (error) {
            console.error("Failed to load slots data", error);
        } finally {
            setIsLoadingStats(false);
        }
    };

    useEffect(() => {
        loadStats();
    }, [address]);

    const handlePreBook = async (amount: number, roiRate: number) => {
        if (!isConnected || !address) {
            toast.error("Please connect your wallet first.");
            return;
        }

        if (userSlots.totalSlots >= 10) {
            toast.error("You have reached the maximum limit of 10 slots.");
            return;
        }

        setIsBooking(true);
        try {
            const { data, error } = await bookSlot(address, amount, roiRate);

            if (error) {
                throw new Error(error.message);
            }

            // Assume success if no error
            toast.success("Successfully booked! Waiting for Admin Approval.");
            await loadStats(); // Reload to reflect changes

        } catch (error: any) {
            console.error("Booking failed:", error);
            toast.error(error.message || "Failed to book slot. Check your Deposit Wallet Balance.");
        } finally {
            setIsBooking(false);
        }
    };

    return (
        <div className="flex flex-col gap-6 max-w-md mx-auto w-full pb-28 pt-2">
            {/* Header */}
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-white">Investment</h1>
                <div className="bg-[var(--color-accent)]/10 text-[var(--color-accent)] px-3 py-1 rounded-lg text-sm font-semibold border border-[var(--color-accent)]/20">
                    Rank: Starter
                </div>
            </div>

            {/* Stats Overview */}
            <div className="grid grid-cols-2 gap-4">
                <div className="bg-card rounded-2xl p-5 border border-[var(--color-card-border)] flex flex-col justify-between hover:border-[var(--color-accent)]/50 transition-colors">
                    <div className="w-10 h-10 rounded-full bg-[var(--color-accent)]/10 flex items-center justify-center mb-3">
                        <TrendingUp size={18} className="text-[var(--color-accent)]" />
                    </div>
                    <div>
                        <p className="text-[var(--color-text-muted)] text-sm mb-1">Total Token Earn Trade Income</p>
                        <p className="text-xl font-bold text-white">${isLoadingStats ? "..." : (userSlots.totalEarned || "0.00")}</p>
                    </div>
                </div>
                <div className="bg-card rounded-2xl p-5 border border-[var(--color-card-border)] flex flex-col justify-between hover:border-[var(--color-accent)]/50 transition-colors">
                    <div className="w-10 h-10 rounded-full bg-[#fbbf24]/10 flex items-center justify-center mb-3">
                        <Zap size={18} className="text-[#fbbf24]" />
                    </div>
                    <div>
                        <p className="text-[var(--color-text-muted)] text-sm mb-1">Your Slots</p>
                        <p className="text-xl font-bold text-white">{isLoadingStats ? "..." : `${userSlots.totalSlots} / 10`}</p>
                    </div>
                </div>
            </div>

            {/* Navigation Tabs */}
            <div className="flex gap-2 bg-[#0a150b] p-1.5 rounded-2xl border border-[var(--color-card-border)]">
                <button
                    onClick={() => setActiveTab("packages")}
                    className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all ${activeTab === "packages"
                        ? "bg-card text-white shadow-sm border border-[var(--color-card-border)]"
                        : "text-[var(--color-text-muted)] hover:text-white"
                        }`}
                >
                    Activation Packages
                </button>
                <button
                    onClick={() => setActiveTab("mining")}
                    className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all ${activeTab === "mining"
                        ? "bg-card text-white shadow-sm border border-[var(--color-card-border)]"
                        : "text-[var(--color-text-muted)] hover:text-white"
                        }`}
                >
                    My Mining
                </button>
            </div>

            {/* Package Content */}
            <div className="space-y-4">
                {activeTab === "packages" ? (
                    <>
                        <div className="bg-card-glow rounded-3xl p-[1px]">
                            <div className="bg-[#0a150b] rounded-3xl p-6 h-full border border-[var(--color-card-border)]">
                                <div className="flex justify-between items-start mb-4">
                                    <div>
                                        <span className="text-[var(--color-text-muted)] text-sm uppercase tracking-wider font-semibold">Basic Tier</span>
                                        <h3 className="text-2xl font-bold text-white flex items-center gap-1 mt-1">
                                            $20 <span className="text-[var(--color-text-muted)] text-base font-normal">/ pre-book</span>
                                        </h3>
                                    </div>
                                    <div className="w-12 h-12 rounded-full bg-[var(--color-accent)]/20 flex items-center justify-center text-[var(--color-accent)]">
                                        <CircleDollarSign size={24} />
                                    </div>
                                </div>

                                <ul className="mb-6 space-y-2">
                                    <li className="flex items-center gap-2 text-sm text-[var(--color-text-muted)]">
                                        <div className="w-1.5 h-1.5 rounded-full bg-[var(--color-accent)]" /> Up to 10% Daily ROI
                                    </li>
                                    <li className="flex items-center gap-2 text-sm text-[var(--color-text-muted)]">
                                        <div className="w-1.5 h-1.5 rounded-full bg-[var(--color-accent)]" /> Level 1 Referral Bonus (5%)
                                    </li>
                                    <li className="flex items-center gap-2 text-sm text-[var(--color-text-muted)]">
                                        <div className="w-1.5 h-1.5 rounded-full bg-[var(--color-accent)]" /> Instant Withdrawals
                                    </li>
                                </ul>

                                <div className="mb-4 bg-[#040804]/50 p-3 rounded-xl border border-[var(--color-card-border)] flex items-center justify-between">
                                    <span className="text-sm text-[var(--color-text-muted)] flex items-center gap-1.5"><Clock size={16} /> Daily Slots Today</span>
                                    <span className={`font-bold text-sm ${slotsRemaining > 0 ? "text-[var(--color-accent)]" : "text-[#fbbf24]"}`}>
                                        {slotsRemaining > 0 ? `${slotsRemaining} / 50 Available` : "0 / 50 (Waitlist)"}
                                    </span>
                                </div>

                                <button
                                    onClick={() => handlePreBook(20, 0.10)}
                                    disabled={isBooking || userSlots.totalSlots >= 10}
                                    className="w-full py-3.5 flex items-center justify-center gap-2 rounded-xl bg-[var(--color-accent)] text-[#0a150b] font-bold text-sm tracking-wide hover:bg-[var(--color-accent-hover)] transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
                                >
                                    {isBooking ? <Loader2 size={18} className="animate-spin" /> :
                                        (userSlots.totalSlots >= 10 ? "Maximum Slots Reached" :
                                            (slotsRemaining > 0 ? "Pre-book Slot ($20)" : "Join Hold Queue ($20)"))}
                                </button>
                            </div>
                        </div>

                        <div className="bg-card rounded-3xl p-6 border border-[var(--color-card-border)] opacity-80 hover:opacity-100 transition-opacity">
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <span className="text-[var(--color-text-muted)] text-sm uppercase tracking-wider font-semibold">Pro Tier</span>
                                    <h3 className="text-2xl font-bold text-white flex items-center gap-1 mt-1">
                                        $100 <span className="text-[var(--color-text-muted)] text-base font-normal">/ minimum</span>
                                    </h3>
                                </div>
                                <div className="w-12 h-12 rounded-full bg-[#3b82f6]/20 flex items-center justify-center text-[#3b82f6]">
                                    <Zap size={24} />
                                </div>
                            </div>

                            <ul className="mb-6 space-y-2">
                                <li className="flex items-center gap-2 text-sm text-[var(--color-text-muted)]">
                                    <div className="w-1.5 h-1.5 rounded-full bg-[#3b82f6]" /> Up to 12% Daily ROI
                                </li>
                                <li className="flex items-center gap-2 text-sm text-[var(--color-text-muted)]">
                                    <div className="w-1.5 h-1.5 rounded-full bg-[#3b82f6]" /> Level 1 Referral Bonus (10%)
                                </li>
                                <li className="flex items-center gap-2 text-sm text-[var(--color-text-muted)]">
                                    <div className="w-1.5 h-1.5 rounded-full bg-[#3b82f6]" /> Priority Withdrawals
                                </li>
                            </ul>
                            <button
                                onClick={() => handlePreBook(100, 0.12)}
                                disabled={isBooking || userSlots.totalSlots >= 10}
                                className="w-full py-3.5 flex items-center justify-center gap-2 rounded-xl bg-white/5 border border-[var(--color-card-border)] text-white font-bold text-sm hover:bg-white/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isBooking ? <Loader2 size={18} className="animate-spin" /> :
                                    (userSlots.totalSlots >= 10 ? "Maximum Slots Reached" : "Upgrade Required ($100)")}
                            </button>
                        </div>
                    </>
                ) : (
                    <div className="flex flex-col gap-4">
                        {isLoadingStats ? (
                            <div className="flex justify-center py-12">
                                <Loader2 size={32} className="animate-spin text-[var(--color-accent)]" />
                            </div>
                        ) : userSlots.bookings && userSlots.bookings.length > 0 ? (
                            userSlots.bookings.map((slot: any) => (
                                <div key={slot.id} className="bg-card rounded-2xl p-5 border border-[var(--color-card-border)]">
                                    <div className="flex justify-between items-center mb-3">
                                        <div className="flex items-center gap-2">
                                            <div className={`w-2 h-2 rounded-full ${slot.status === 'active' ? 'bg-[var(--color-accent)]' : 'bg-[#fbbf24]'}`} />
                                            <span className="text-white font-medium">Slot ${slot.amount}</span>
                                        </div>
                                        <div className={`px-2 py-0.5 rounded text-xs ${slot.status === 'active' ? 'bg-[var(--color-accent)]/10 text-[var(--color-accent)]' : 'bg-[#fbbf24]/10 text-[#fbbf24]'}`}>
                                            {slot.status === 'active' ? 'Active Mining' : 'Pending Admin Approval'}
                                        </div>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-[var(--color-text-muted)]">Total Earned:</span>
                                        <span className="text-white font-semibold">${Number(slot.total_earned).toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between text-sm mt-1">
                                        <span className="text-[var(--color-text-muted)]">Daily ROI:</span>
                                        <span className="text-[var(--color-text-muted)]">{(Number(slot.daily_roi_rate) * 100).toFixed(1)}%</span>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="flex flex-col items-center justify-center py-12 px-6 bg-card rounded-3xl border border-[var(--color-card-border)] text-center">
                                <div className="w-20 h-20 rounded-full bg-[#0a150b] flex items-center justify-center mb-6">
                                    <PackageOpen size={32} className="text-[var(--color-text-muted)]" />
                                </div>
                                <h3 className="text-xl font-bold text-white mb-2">No Active Mining</h3>
                                <p className="text-[var(--color-text-muted)] text-sm mb-6">
                                    You do not have any active investment packages running right now. Activate a package to start earning daily Token Earn Trade income.
                                </p>
                                <button
                                    onClick={() => setActiveTab("packages")}
                                    className="text-[var(--color-accent)] font-semibold text-sm hover:underline flex items-center justify-center"
                                >
                                    Browse Packages
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </div>

        </div>
    );
}
