"use client";

import { useState, useEffect } from "react";
import { useAccount } from "wagmi";
import { ShieldAlert, CheckCircle, XCircle, Loader2, Zap } from "lucide-react";
import toast from "react-hot-toast";
import {
    getAdminPendingTransactions,
    getAdminPendingSlots,
    updateTransactionStatus,
    updateSlotStatus,
    distributeDailyRoi
} from "@/lib/supabase";

export default function AdminDashboard() {
    const { address, isConnected } = useAccount();
    const adminAddress = process.env.NEXT_PUBLIC_ADMIN_WALLET_ADDRESS?.toLowerCase();

    const [activeTab, setActiveTab] = useState<"deposits" | "slots" | "system">("deposits");
    const [transactions, setTransactions] = useState<any[]>([]);
    const [slots, setSlots] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isActionLoading, setIsActionLoading] = useState(false);

    const checkIsAdmin = () => {
        if (!isConnected || !address || !adminAddress) return false;
        return address.toLowerCase() === adminAddress;
    };

    const loadData = async () => {
        if (!checkIsAdmin()) return;
        setIsLoading(true);
        try {
            const txRes = await getAdminPendingTransactions();
            if (txRes.data) setTransactions(txRes.data);

            const slotRes = await getAdminPendingSlots();
            if (slotRes.data) setSlots(slotRes.data);
        } catch (error) {
            console.error("Failed to load admin data", error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, [address, isConnected]);

    if (!checkIsAdmin()) {
        return (
            <div className="flex flex-col items-center justify-center p-8 text-center min-h-[60vh]">
                <ShieldAlert size={64} className="text-red-500 mb-4" />
                <h1 className="text-2xl font-bold text-white mb-2">Access Denied</h1>
                <p className="text-[var(--color-text-muted)]">You do not have administrator privileges to view this page.</p>
                <p className="text-xs text-red-500/50 mt-4 break-all">Admin Wallet expected: {adminAddress || 'Not Configured'}</p>
                <p className="text-xs text-[var(--color-text-muted)] mt-1 break-all">Your connected wallet: {address || 'None'}</p>
            </div>
        );
    }

    const handleTransaction = async (id: string, status: 'approved' | 'rejected') => {
        setIsActionLoading(true);
        try {
            const { error } = await updateTransactionStatus(id, status);
            if (error) throw new Error(error.message);
            toast.success(`Transaction ${status}`);
            await loadData();
        } catch (error: any) {
            toast.error(error.message || "Action failed");
        } finally {
            setIsActionLoading(false);
        }
    };

    const handleSlot = async (id: string, status: 'active' | 'rejected') => {
        setIsActionLoading(true);
        try {
            const { error } = await updateSlotStatus(id, status);
            if (error) throw new Error(error.message);
            toast.success(`Slot ${status === 'active' ? 'approved' : 'rejected'}`);
            await loadData();
        } catch (error: any) {
            toast.error(error.message || "Action failed");
        } finally {
            setIsActionLoading(false);
        }
    };

    const handleDistributeRoi = async () => {
        if (!confirm("Are you sure you want to trigger Daily ROI distribution? This will process all active slots.")) return;
        setIsActionLoading(true);
        try {
            const { error } = await distributeDailyRoi();
            if (error) throw new Error(error.message);
            toast.success("Daily ROI distributed successfully!");
        } catch (error: any) {
            toast.error(error.message || "Distribution failed");
        } finally {
            setIsActionLoading(false);
        }
    };

    return (
        <div className="flex flex-col gap-6 max-w-4xl mx-auto w-full pb-28 pt-2 px-4">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-[var(--color-accent)] flex items-center gap-2">
                    <ShieldAlert size={24} /> Admin Dashboard
                </h1>
                <button onClick={loadData} className="text-sm bg-[#040804]/50 border border-[var(--color-card-border)] px-4 py-2 rounded-lg text-white hover:bg-white/10 transition">
                    Refresh
                </button>
            </div>

            <div className="flex gap-2 bg-[#0a150b] p-1.5 rounded-2xl border border-[var(--color-card-border)] overflow-x-auto">
                <button
                    onClick={() => setActiveTab("deposits")}
                    className={`flex-1 py-2.5 px-4 rounded-xl text-sm font-semibold transition-all whitespace-nowrap ${activeTab === "deposits" ? "bg-card text-white shadow-sm border border-[var(--color-card-border)]" : "text-[var(--color-text-muted)] hover:text-white"}`}
                >
                    Pending TXs ({transactions.length})
                </button>
                <button
                    onClick={() => setActiveTab("slots")}
                    className={`flex-1 py-2.5 px-4 rounded-xl text-sm font-semibold transition-all whitespace-nowrap ${activeTab === "slots" ? "bg-card text-white shadow-sm border border-[var(--color-card-border)]" : "text-[var(--color-text-muted)] hover:text-white"}`}
                >
                    Pending Slots ({slots.length})
                </button>
                <button
                    onClick={() => setActiveTab("system")}
                    className={`flex-1 py-2.5 px-4 rounded-xl text-sm font-semibold transition-all whitespace-nowrap ${activeTab === "system" ? "bg-card text-white shadow-sm border border-[var(--color-card-border)]" : "text-[var(--color-text-muted)] hover:text-white"}`}
                >
                    System Tasks
                </button>
            </div>

            {isLoading ? (
                <div className="flex justify-center py-20">
                    <Loader2 size={40} className="animate-spin text-[var(--color-accent)]" />
                </div>
            ) : (
                <div className="bg-card rounded-3xl p-6 border border-[var(--color-card-border)]">

                    {activeTab === "deposits" && (
                        <div className="flex flex-col gap-4">
                            <h2 className="text-lg font-bold text-white mb-2">Pending Transactions</h2>
                            {transactions.length === 0 ? (
                                <p className="text-[var(--color-text-muted)] p-4 text-center">No pending transactions.</p>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left text-sm text-[var(--color-text-muted)] whitespace-nowrap">
                                        <thead className="text-xs text-white uppercase bg-[#040804]/50 border-b border-[var(--color-card-border)]">
                                            <tr>
                                                <th className="px-4 py-3 rounded-tl-lg">Type</th>
                                                <th className="px-4 py-3">User</th>
                                                <th className="px-4 py-3">Amount</th>
                                                <th className="px-4 py-3">Details (TxHash)</th>
                                                <th className="px-4 py-3 rounded-tr-lg">Action</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {transactions.map(tx => (
                                                <tr key={tx.id} className="border-b border-[var(--color-card-border)] hover:bg-white/5">
                                                    <td className="px-4 py-4 font-bold text-white uppercase">{tx.type}</td>
                                                    <td className="px-4 py-4 font-mono text-xs">{tx.wallet_address.substring(0, 8)}...</td>
                                                    <td className="px-4 py-4 font-bold text-[var(--color-accent)]">${Number(tx.amount).toFixed(2)}</td>
                                                    <td className="px-4 py-4 font-mono text-xs max-w-[150px] truncate" title={tx.tx_hash || tx.destination_address}>
                                                        {tx.tx_hash || tx.destination_address || 'N/A'}
                                                    </td>
                                                    <td className="px-4 py-4 flex gap-2">
                                                        <button
                                                            disabled={isActionLoading}
                                                            onClick={() => handleTransaction(tx.id, 'approved')}
                                                            className="text-[var(--color-accent)] bg-[var(--color-accent)]/10 hover:bg-[var(--color-accent)]/20 p-2 rounded-lg transition"
                                                            title="Approve"
                                                        >
                                                            <CheckCircle size={18} />
                                                        </button>
                                                        <button
                                                            disabled={isActionLoading}
                                                            onClick={() => handleTransaction(tx.id, 'rejected')}
                                                            className="text-red-500 bg-red-500/10 hover:bg-red-500/20 p-2 rounded-lg transition"
                                                            title="Reject"
                                                        >
                                                            <XCircle size={18} />
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === "slots" && (
                        <div className="flex flex-col gap-4">
                            <h2 className="text-lg font-bold text-white mb-2">Pending Slot Bookings</h2>
                            {slots.length === 0 ? (
                                <p className="text-[var(--color-text-muted)] p-4 text-center">No pending slot bookings.</p>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left text-sm text-[var(--color-text-muted)] whitespace-nowrap">
                                        <thead className="text-xs text-white uppercase bg-[#040804]/50 border-b border-[var(--color-card-border)]">
                                            <tr>
                                                <th className="px-4 py-3 rounded-tl-lg">User</th>
                                                <th className="px-4 py-3">Amount</th>
                                                <th className="px-4 py-3">Daily ROI</th>
                                                <th className="px-4 py-3 rounded-tr-lg">Action</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {slots.map(slot => (
                                                <tr key={slot.id} className="border-b border-[var(--color-card-border)] hover:bg-white/5">
                                                    <td className="px-4 py-4 font-mono text-xs">{slot.wallet_address.substring(0, 8)}...</td>
                                                    <td className="px-4 py-4 font-bold text-white">${Number(slot.amount).toFixed(2)}</td>
                                                    <td className="px-4 py-4 text-[#fbbf24]">{(Number(slot.daily_roi_rate) * 100).toFixed(1)}%</td>
                                                    <td className="px-4 py-4 flex gap-2">
                                                        <button
                                                            disabled={isActionLoading}
                                                            onClick={() => handleSlot(slot.id, 'active')}
                                                            className="text-[var(--color-accent)] bg-[var(--color-accent)]/10 hover:bg-[var(--color-accent)]/20 p-2 rounded-lg transition"
                                                            title="Approve (Start Timer)"
                                                        >
                                                            <CheckCircle size={18} />
                                                        </button>
                                                        <button
                                                            disabled={isActionLoading}
                                                            onClick={() => handleSlot(slot.id, 'rejected')}
                                                            className="text-red-500 bg-red-500/10 hover:bg-red-500/20 p-2 rounded-lg transition"
                                                            title="Reject"
                                                        >
                                                            <XCircle size={18} />
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === "system" && (
                        <div className="flex flex-col gap-6">
                            <h2 className="text-lg font-bold text-white mb-2">System Functions</h2>

                            <div className="bg-[#040804]/50 border border-[var(--color-card-border)] rounded-2xl p-5 flex flex-col gap-3 items-start">
                                <div className="w-12 h-12 rounded-full bg-[#fbbf24]/10 flex items-center justify-center text-[#fbbf24] mb-2">
                                    <Zap size={24} />
                                </div>
                                <h3 className="text-white font-bold text-lg">Distribute Daily ROI</h3>
                                <p className="text-[var(--color-text-muted)] text-sm mb-2 max-w-sm">
                                    Trigger the daily ROI distribution for all ACTIVE slots. This will calculate earnings based on the slot's rate and credit it to user wallets as transactions. It should ideally be run once every 24 hours.
                                </p>
                                <button
                                    onClick={handleDistributeRoi}
                                    disabled={isActionLoading}
                                    className="bg-white text-black font-bold py-2.5 px-6 rounded-xl hover:bg-gray-200 transition-colors flex items-center gap-2"
                                >
                                    {isActionLoading ? <Loader2 size={18} className="animate-spin" /> : <><Zap size={18} /> Trigger Distribution Now</>}
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
