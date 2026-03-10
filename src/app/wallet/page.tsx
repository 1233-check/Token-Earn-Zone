"use client";

import { useEffect, useState } from "react";
import { ArrowDownLeft, ArrowUpRight, History, Send, QrCode, Copy, Loader2, CheckCircle2, Clock, XCircle } from "lucide-react";
import toast from "react-hot-toast";
import { useAuth } from "@/providers/AuthProvider";
import { getDashboardStats, getTransactions, createDepositRequest } from "@/lib/supabase";

export default function WalletPage() {
    const { user, profile } = useAuth();
    const [activeTab, setActiveTab] = useState<"deposit" | "transfer">("deposit");

    const [totalDeposits, setTotalDeposits] = useState(0);
    const [transactions, setTransactions] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const [depositAmount, setDepositAmount] = useState("");
    const [txHash, setTxHash] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    const loadData = async () => {
        if (!user) return;
        setIsLoading(true);
        try {
            const stats = await getDashboardStats(user.id);
            if (stats) setTotalDeposits(stats.totalDeposits);

            const txs = await getTransactions(user.id);
            setTransactions(txs || []);
        } catch (error) {
            console.error("Failed to load wallet data", error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, [user]);

    const handleDepositSubmit = async () => {
        if (!user) {
            toast.error("Please login first");
            return;
        }
        if (!depositAmount || isNaN(Number(depositAmount)) || Number(depositAmount) <= 0) {
            toast.error("Enter a valid deposit amount");
            return;
        }
        if (!txHash || txHash.trim().length < 10) {
            toast.error("Enter a valid transaction hash");
            return;
        }

        setIsSubmitting(true);
        try {
            const { error } = await createDepositRequest(user.id, txHash, Number(depositAmount));
            if (error) throw new Error(error.message);

            toast.success("Deposit request submitted for approval!");
            setDepositAmount("");
            setTxHash("");
            await loadData();
        } catch (error: any) {
            console.error(error);
            toast.error(error.message || "Failed to submit request");
        } finally {
            setIsSubmitting(false);
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'approved': return <CheckCircle2 size={16} className="text-[var(--color-accent)]" />;
            case 'rejected': return <XCircle size={16} className="text-red-500" />;
            default: return <Clock size={16} className="text-[#fbbf24]" />;
        }
    };

    return (
        <div className="flex flex-col gap-6 max-w-md mx-auto w-full pb-28 pt-2">
            {/* Header */}
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-white">Wallet</h1>
            </div>

            {/* Main Balance Card */}
            <div className="bg-card-glow rounded-3xl p-[1px]">
                <div className="bg-[#0a150b] rounded-3xl p-6 h-full border border-[var(--color-card-border)] relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-[var(--color-accent)]/10 rounded-full blur-3xl -mr-10 -mt-10" />
                    <div className="absolute bottom-0 left-0 w-24 h-24 bg-[var(--color-accent)]/10 rounded-full blur-2xl -ml-10 -mb-10" />

                    <div className="relative z-10 flex flex-col items-center justify-center text-center">
                        <p className="text-[var(--color-text-muted)] text-[15px] font-medium mb-1">Total Deposit Balance</p>
                        <div className="flex items-end justify-center gap-1 mb-6">
                            <span className="text-[var(--color-accent)] text-4xl font-bold">
                                {isLoading ? <Loader2 className="animate-spin inline" size={32} /> : `$${totalDeposits.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                            </span>
                            <span className="text-[var(--color-text-muted)] text-lg mb-1">USD</span>
                        </div>

                        {/* Quick Actions */}
                        <div className="flex gap-4 w-full">
                            <button
                                onClick={() => setActiveTab("deposit")}
                                className={`flex-1 py-3 rounded-xl flex items-center justify-center gap-2 font-medium transition-all ${activeTab === "deposit"
                                    ? "bg-[var(--color-accent)] text-[#0a150b]"
                                    : "bg-white/5 text-white hover:bg-white/10 border border-white/10"
                                    }`}
                            >
                                <ArrowDownLeft size={18} />
                                Deposit
                            </button>
                            <button
                                onClick={() => setActiveTab("transfer")}
                                className={`flex-1 py-3 rounded-xl flex items-center justify-center gap-2 font-medium transition-all ${activeTab === "transfer"
                                    ? "bg-[var(--color-accent)] text-[#0a150b]"
                                    : "bg-white/5 text-white hover:bg-white/10 border border-white/10"
                                    }`}
                            >
                                <Send size={18} />
                                P2P Transfer
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Form / Content Area based on Tab */}
            <div className="bg-card rounded-3xl p-6 border border-[var(--color-card-border)]">
                {activeTab === "deposit" ? (
                    <div className="flex flex-col gap-4">
                        <h2 className="text-lg font-bold text-white mb-2">Fund Wallet (BEP20)</h2>

                        <div className="bg-[#040804]/50 border border-[var(--color-card-border)] rounded-2xl p-4 flex flex-col items-center gap-3">
                            <div className="w-40 h-40 bg-white rounded-xl p-2 flex items-center justify-center">
                                <img src="/qr.png" alt="Admin Deposit QR" className="w-full h-full object-contain" />
                            </div>
                            <p className="text-[var(--color-text-muted)] text-sm text-center">Scan or copy the address below to send USDT (BEP20)</p>
                            <div className="flex w-full mt-1">
                                <input type="text" readOnly value="0xef3186b9f68b5b9fcb32e31681fff0d057205fc1" className="w-full bg-[#0a150b] border border-[var(--color-text-muted)] border-r-0 rounded-l-lg py-2.5 px-3 text-white text-xs outline-none tracking-wider" />
                                <button onClick={() => { navigator.clipboard.writeText("0xef3186b9f68b5b9fcb32e31681fff0d057205fc1"); toast.success("Address copied!"); }} className="bg-[var(--color-text-muted)] hover:bg-gray-500 text-[#0a150b] px-4 rounded-r-lg flex items-center justify-center transition-colors">
                                    <Copy size={16} />
                                </button>
                            </div>
                        </div>

                        <div className="flex flex-col gap-2 mt-2 relative">
                            <label className="text-[var(--color-text-muted)] text-sm">Deposit Amount (USD)</label>
                            <div className="relative">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/50">$</span>
                                <input
                                    type="number"
                                    value={depositAmount}
                                    onChange={(e) => setDepositAmount(e.target.value)}
                                    placeholder="0.00"
                                    className="w-full bg-[#040804]/50 border border-[var(--color-text-muted)] rounded-xl py-3 pl-8 pr-16 text-white outline-none focus:border-[var(--color-accent)] transition-colors"
                                />
                                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)] pointer-events-none text-sm">USDT</span>
                            </div>
                        </div>

                        <div className="flex flex-col gap-2">
                            <label className="text-[var(--color-text-muted)] text-sm">Transaction Hash (TxID)</label>
                            <input
                                type="text"
                                value={txHash}
                                onChange={(e) => setTxHash(e.target.value)}
                                placeholder="Paste transaction hash here"
                                className="w-full bg-[#040804]/50 border border-[var(--color-text-muted)] rounded-xl py-3 px-4 text-white outline-none focus:border-[var(--color-accent)] transition-colors text-sm"
                            />
                        </div>

                        <button
                            onClick={handleDepositSubmit}
                            disabled={isSubmitting}
                            className="w-full mt-2 bg-[var(--color-accent)] text-[#0a150b] font-bold py-3.5 flex items-center justify-center gap-2 rounded-xl hover:bg-[var(--color-accent-hover)] transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
                        >
                            {isSubmitting ? <Loader2 size={18} className="animate-spin" /> : "Submit for Approval"}
                        </button>
                    </div>
                ) : (
                    <div className="flex flex-col gap-4">
                        <h2 className="text-lg font-bold text-white mb-2">Member Transfer</h2>
                        <div className="flex flex-col gap-2">
                            <label className="text-[var(--color-text-muted)] text-sm">Recipient User ID</label>
                            <input type="text" placeholder="Enter Member ID" className="w-full bg-[#040804]/50 border border-[var(--color-text-muted)] rounded-xl py-3 px-4 text-white outline-none focus:border-[var(--color-accent)] transition-colors" />
                        </div>
                        <div className="flex flex-col gap-2">
                            <label className="text-[var(--color-text-muted)] text-sm">Amount to Transfer</label>
                            <input type="number" placeholder="0.00" className="w-full bg-[#040804]/50 border border-[var(--color-text-muted)] rounded-xl py-3 px-4 text-white outline-none focus:border-[var(--color-accent)] transition-colors" />
                        </div>
                        <button className="w-full mt-2 bg-[var(--color-accent)] text-[#0a150b] font-bold py-3.5 rounded-xl hover:opacity-90 transition-opacity">
                            Send Funds
                        </button>
                    </div>
                )}
            </div>

            {/* Transaction History Placeholder */}
            <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between px-1">
                    <h2 className="text-lg font-bold text-white flex items-center gap-2">
                        <History size={20} className="text-[var(--color-accent)]" />
                        Recent Activity
                    </h2>
                    <button className="text-[var(--color-text-muted)] text-sm hover:text-[var(--color-accent)]">View All</button>
                </div>

                <div className="flex flex-col gap-3">
                    {isLoading ? (
                        <div className="flex justify-center py-6">
                            <Loader2 size={24} className="animate-spin text-[var(--color-text-muted)]" />
                        </div>
                    ) : transactions.length > 0 ? (
                        transactions.map((tx) => (
                            <div key={tx.id} className="bg-card rounded-2xl p-4 border border-[var(--color-card-border)] flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-[#0a150b] flex items-center justify-center border border-[#1a2a1b]">
                                        {tx.type === 'deposit' ? <ArrowDownLeft size={16} className="text-[var(--color-accent)]" /> :
                                            tx.type === 'withdrawal' ? <ArrowUpRight size={16} className="text-red-400" /> :
                                                tx.type === 'roi_distribution' ? <History size={16} className="text-blue-400" /> :
                                                    <Send size={16} className="text-white" />}
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-white text-sm font-semibold capitalize">{tx.type.replace('_', ' ')}</span>
                                        <span className="text-[var(--color-text-muted)] text-xs">{new Date(tx.created_at).toLocaleDateString()}</span>
                                    </div>
                                </div>
                                <div className="flex flex-col items-end gap-1">
                                    <span className={`text-sm font-bold ${tx.type === 'deposit' || tx.type === 'roi_distribution' ? 'text-[var(--color-accent)]' : 'text-white'}`}>
                                        {tx.type === 'withdrawal' ? '-' : '+'}${Number(tx.amount).toFixed(2)}
                                    </span>
                                    <div className="flex items-center gap-1">
                                        {getStatusIcon(tx.status)}
                                        <span className={`text-[10px] uppercase font-bold tracking-wider ${tx.status === 'approved' ? 'text-[var(--color-accent)]' :
                                            tx.status === 'rejected' ? 'text-red-500' : 'text-[#fbbf24]'
                                            }`}>{tx.status}</span>
                                    </div>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="bg-card rounded-2xl border border-[var(--color-card-border)] overflow-hidden flex flex-col items-center justify-center py-10 opacity-70">
                            <History size={32} className="text-[var(--color-text-muted)] mb-3" />
                            <p className="text-[var(--color-text-muted)] text-sm">No recent transactions found.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
