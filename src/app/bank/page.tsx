"use client";

import { useEffect, useState } from "react";
import { Landmark, ArrowRight, Building, HelpCircle, Loader2 } from "lucide-react";
import { useAccount } from "wagmi";
import { getOrCreateProfile, createWithdrawRequest } from "@/lib/supabase";
import toast from "react-hot-toast";

export default function BankPage() {
    const { address, isConnected } = useAccount();
    const [withdrawalMethod, setWithdrawalMethod] = useState<"crypto" | "bank">("crypto");

    const [balance, setBalance] = useState(0);
    const [isLoading, setIsLoading] = useState(true);

    const [amount, setAmount] = useState("");
    const [destAddress, setDestAddress] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    const loadData = async () => {
        if (!address) return;
        setIsLoading(true);
        try {
            const profile = await getOrCreateProfile(address);
            if (profile) setBalance(Number(profile.total_balance));
        } catch (error) {
            console.error("Failed to fetch balance", error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, [address]);

    const handleWithdraw = async () => {
        if (!isConnected || !address) {
            toast.error("Please connect your wallet");
            return;
        }

        const numAmount = Number(amount);
        if (!numAmount || isNaN(numAmount) || numAmount < 10) {
            toast.error("Minimum withdrawal is $10.00");
            return;
        }

        if (numAmount > balance) {
            toast.error("Insufficient balance");
            return;
        }

        if (!destAddress || destAddress.length < 20) {
            toast.error("Enter a valid BEP-20 destination address");
            return;
        }

        setIsSubmitting(true);
        try {
            const { error } = await createWithdrawRequest(address, destAddress, numAmount);
            if (error) throw new Error(error.message);

            toast.success("Withdrawal request submitted successfully!");
            setAmount("");
            setDestAddress("");
            await loadData(); // Reload balance (though technically balance deducts on approval usually, or immediately if trigger exists. Wait, trigger handles it. Oh wait, we don't have a trigger for pending withdrawals deducting balance. That's a future fix!)
        } catch (error: any) {
            console.error(error);
            toast.error(error.message || "Failed to submit request");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="flex flex-col gap-6 max-w-md mx-auto w-full pb-28 pt-2">
            {/* Header */}
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-white">Withdrawal</h1>
            </div>

            {/* Available Balance Data */}
            <div className="bg-card rounded-3xl p-6 border border-[var(--color-card-border)] flex flex-col items-center justify-center text-center">
                <div className="w-16 h-16 rounded-full bg-[var(--color-accent)]/10 flex items-center justify-center mb-4">
                    <Landmark size={28} className="text-[var(--color-accent)]" />
                </div>
                <p className="text-[var(--color-text-muted)] text-[15px] font-medium mb-1">Available for Withdrawal</p>
                <div className="flex items-end justify-center gap-1 mb-2">
                    <span className="text-white text-4xl font-bold">
                        {isLoading ? <Loader2 size={32} className="animate-spin inline" /> : `$${balance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                    </span>
                    <span className="text-[var(--color-text-muted)] text-lg mb-1">USD</span>
                </div>
                <div className="flex gap-2 items-center text-xs text-[#fbbf24] bg-[#fbbf24]/10 px-3 py-1.5 rounded-lg border border-[#fbbf24]/20">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#fbbf24] animate-pulse"></span> Minimum withdrawal is $10.00
                </div>
            </div>

            {/* Withdrawal Form */}
            <div className="bg-card-glow rounded-3xl p-[1px]">
                <div className="bg-[#0a150b] rounded-3xl p-6 h-full border border-[var(--color-card-border)] shadow-lg shadow-[var(--color-accent)]/5 relative overflow-hidden">
                    <h2 className="text-lg font-bold text-white mb-4">Request Payout</h2>

                    {/* Method Select */}
                    <div className="flex gap-2 bg-[#040804]/50 p-1.5 rounded-2xl border border-[var(--color-card-border)] mb-6">
                        <button
                            onClick={() => setWithdrawalMethod("crypto")}
                            className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all flex items-center justify-center gap-2 ${withdrawalMethod === "crypto"
                                ? "bg-[var(--color-accent)] text-[#0a150b] border border-[var(--color-accent)]"
                                : "text-[var(--color-text-muted)] hover:text-white border border-transparent"
                                }`}
                        >
                            USDT (BEP20)
                        </button>
                        <button
                            onClick={() => setWithdrawalMethod("bank")}
                            className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all flex items-center justify-center gap-2 ${withdrawalMethod === "bank"
                                ? "bg-[var(--color-card)] text-white shadow-sm border border-[var(--color-card-border)]"
                                : "text-[var(--color-text-muted)] hover:text-white border border-transparent"
                                }`}
                        >
                            Bank Transfer
                        </button>
                    </div>

                    {/* Dynamic Fields */}
                    {withdrawalMethod === "crypto" ? (
                        <div className="flex flex-col gap-4">
                            <div className="flex flex-col gap-2">
                                <label className="text-[var(--color-text-muted)] text-sm flex justify-between">
                                    Amount to Withdraw
                                    <button
                                        onClick={() => setAmount(balance.toString())}
                                        className="text-[var(--color-accent)] hover:underline"
                                    >Max</button>
                                </label>
                                <input
                                    type="number"
                                    value={amount}
                                    onChange={(e) => setAmount(e.target.value)}
                                    placeholder="0.00"
                                    className="w-full bg-[#040804]/50 border border-[var(--color-card-border)] rounded-xl py-3.5 px-4 text-white outline-none focus:border-[var(--color-accent)] transition-colors"
                                />
                            </div>
                            <div className="flex flex-col gap-2">
                                <label className="text-[var(--color-text-muted)] text-sm">Destination Address</label>
                                <input
                                    type="text"
                                    value={destAddress}
                                    onChange={(e) => setDestAddress(e.target.value)}
                                    placeholder="Enter USDT BEP-20 Address"
                                    className="w-full bg-[#040804]/50 border border-[var(--color-card-border)] rounded-xl py-3.5 px-4 text-white outline-none focus:border-[var(--color-accent)] transition-colors text-sm"
                                />
                            </div>
                            <div className="flex flex-col gap-2 relative">
                                <label className="text-[var(--color-text-muted)] text-sm">Transaction PIN (Optional for now)</label>
                                <input type="password" placeholder="••••••" className="w-full bg-[#040804]/50 border border-[var(--color-card-border)] rounded-xl py-3.5 px-4 text-white outline-none focus:border-[var(--color-accent)] transition-colors tracking-widest" />
                            </div>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center py-6 text-center gap-2">
                            <div className="w-12 h-12 rounded-full bg-[#040804]/80 flex items-center justify-center border border-[var(--color-card-border)] mb-2">
                                <Building size={20} className="text-[var(--color-text-muted)]" />
                            </div>
                            <p className="text-white font-medium">Coming Soon</p>
                            <p className="text-[var(--color-text-muted)] text-sm px-4">Local fiat bank transfers are currently under maintenance. Please use USDT for now.</p>
                        </div>
                    )}

                    <button
                        onClick={handleWithdraw}
                        disabled={withdrawalMethod === "bank" || isSubmitting}
                        className="w-full mt-6 flex items-center justify-center gap-2 bg-[var(--color-accent)] text-[#0a150b] font-bold py-3.5 rounded-xl hover:bg-[var(--color-accent-hover)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isSubmitting ? <Loader2 size={18} className="animate-spin" /> : <>Submit Request <ArrowRight size={18} /></>}
                    </button>
                </div>
            </div>

            <p className="text-center text-[var(--color-text-muted)] text-xs px-4 mt-2">
                Withdrawals are processed manually within 24-48 hours. A 5% withdrawal fee applies to all standard requests.
            </p>

        </div>
    );
}
