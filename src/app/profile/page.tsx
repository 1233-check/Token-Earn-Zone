"use client";

import { useAccount, useDisconnect } from "wagmi";
import { User, LogOut, ShieldCheck, KeyRound, Users, Trophy, Wallet, Loader2, Copy, Check } from "lucide-react";
import ConnectButton from "@/components/ConnectButton";
import { useEffect, useState } from "react";
import { useAuth } from "@/providers/AuthProvider";
import { getDashboardStats } from "@/lib/supabase";
import toast from "react-hot-toast";

export default function ProfilePage() {
    const { user, profile, signOut, isLoading: authLoading } = useAuth();
    const { isConnected, address } = useAccount();
    const { disconnect } = useDisconnect();
    const [mounted, setMounted] = useState(false);
    const [stats, setStats] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [copiedId, setCopiedId] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        const loadData = async () => {
            if (user && profile) {
                setIsLoading(true);
                try {
                    const walletAddr = address || profile.wallet_address;
                    if (walletAddr) {
                        const dashboardStats = await getDashboardStats(walletAddr);
                        setStats(dashboardStats);
                    }
                } catch (e) {
                    console.error("Failed to load stats", e);
                } finally {
                    setIsLoading(false);
                }
            }
        };
        loadData();
    }, [user, profile, address]);

    const handleCopyId = () => {
        if (profile?.unique_id) {
            navigator.clipboard.writeText(profile.unique_id);
            setCopiedId(true);
            toast.success("Member ID copied!");
            setTimeout(() => setCopiedId(false), 2000);
        }
    };

    const handleLogout = async () => {
        if (isConnected) disconnect();
        await signOut();
    };

    if (!mounted || authLoading) return null;

    return (
        <div className="flex flex-col gap-6 max-w-md mx-auto w-full pb-28 pt-2">
            {/* Header */}
            <div className="flex items-center justify-between px-1">
                <h1 className="text-2xl font-bold text-white">Profile</h1>
                {user && (
                    <button
                        onClick={handleLogout}
                        className="text-[var(--color-text-muted)] hover:text-red-400 transition-colors flex items-center gap-1 text-sm bg-white/5 px-3 py-1.5 rounded-lg"
                    >
                        <LogOut size={16} /> Logout
                    </button>
                )}
            </div>

            {user && profile ? (
                <>
                    {/* User Info Card */}
                    <div className="bg-card rounded-3xl p-6 border border-[var(--color-card-border)] flex flex-col items-center justify-center relative overflow-hidden">
                        <div className="w-20 h-20 rounded-full bg-[#0a150b] border-2 border-[var(--color-accent)] flex items-center justify-center mb-4 relative z-10 shadow-[0_0_15px_rgba(25,172,62,0.3)]">
                            <User size={36} className="text-[var(--color-text-muted)]" />
                        </div>

                        {/* Full Name */}
                        {profile.full_name && (
                            <h2 className="text-lg font-bold text-white mb-1">{profile.full_name}</h2>
                        )}

                        {/* Member ID - Prominent */}
                        <div className="flex flex-col items-center mb-2">
                            <span className="text-[var(--color-text-muted)] text-xs mb-1.5">Member ID</span>
                            <button
                                onClick={handleCopyId}
                                className="flex items-center gap-2 text-[var(--color-accent)] font-mono text-lg font-bold bg-[var(--color-accent)]/10 px-5 py-2 rounded-xl border border-[var(--color-accent)]/20 hover:bg-[var(--color-accent)]/20 transition-colors"
                            >
                                {profile.unique_id}
                                {copiedId ? <Check size={16} /> : <Copy size={16} />}
                            </button>
                        </div>

                        {/* Email */}
                        <p className="text-[var(--color-text-muted)] text-sm mb-4">
                            {profile.email}
                        </p>

                        <div className="flex w-full mt-2 border-t border-[var(--color-card-border)] pt-4 px-2">
                            <div className="flex-1 flex flex-col items-center border-r border-[var(--color-card-border)]">
                                <span className="text-[var(--color-text-muted)] text-xs mb-1">Join Date</span>
                                <span className="text-white font-medium text-sm">
                                    {isLoading ? <Loader2 size={14} className="animate-spin" /> : profile.created_at ? new Date(profile.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : 'Unknown'}
                                </span>
                            </div>
                            <div className="flex-1 flex flex-col items-center">
                                <span className="text-[var(--color-text-muted)] text-xs mb-1">Status</span>
                                <span className="text-[var(--color-accent)] font-semibold text-sm">Active</span>
                            </div>
                        </div>
                    </div>

                    {/* Wallet Connection Card */}
                    <div className="bg-card rounded-3xl p-5 border border-[var(--color-card-border)]">
                        <div className="flex items-center gap-2 mb-3">
                            <Wallet size={18} className="text-[var(--color-accent)]" />
                            <span className="text-white font-medium text-sm">Web3 Wallet</span>
                        </div>
                        {isConnected && address ? (
                            <div className="flex items-center gap-2">
                                <p className="text-[var(--color-text-muted)] font-mono text-xs truncate flex-1 bg-[#040804] px-3 py-2 rounded-lg border border-[var(--color-card-border)]">
                                    {address}
                                </p>
                            </div>
                        ) : (
                            <div className="flex flex-col gap-2">
                                <p className="text-[var(--color-text-muted)] text-xs">Connect a wallet for deposits & withdrawals</p>
                                <ConnectButton />
                            </div>
                        )}
                    </div>

                    {/* Network Stats */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-card rounded-2xl p-5 border border-[var(--color-card-border)] flex flex-col">
                            <div className="flex items-center gap-2 mb-3">
                                <Users size={18} className="text-[var(--color-text-muted)]" />
                                <span className="text-white font-medium text-sm">Direct Referrals</span>
                            </div>
                            <span className="text-2xl font-bold text-white">0</span>
                        </div>
                        <div className="bg-card rounded-2xl p-5 border border-[var(--color-card-border)] flex flex-col">
                            <div className="flex items-center gap-2 mb-3">
                                <Users size={18} className="text-[var(--color-accent)]" />
                                <span className="text-white font-medium text-sm">Team Size</span>
                            </div>
                            <span className="text-2xl font-bold text-[var(--color-accent)]">0</span>
                        </div>
                        <div className="bg-card rounded-2xl p-5 border border-[var(--color-card-border)] flex flex-col col-span-2">
                            <div className="flex items-center gap-2 mb-3">
                                <Trophy size={18} className="text-[#fbbf24]" />
                                <span className="text-white font-medium text-sm">Current Network Rank</span>
                            </div>
                            <div className="flex justify-between items-end">
                                <span className="text-2xl font-bold text-white">Starter</span>
                                <span className="text-[var(--color-text-muted)] text-xs pb-1">
                                    {isLoading ? <Loader2 size={12} className="animate-spin inline" /> : stats?.currentUnit || 0}/100 PV to next rank
                                </span>
                            </div>
                            <div className="w-full h-1.5 bg-[#0a150b] rounded-full mt-3 overflow-hidden">
                                <div className="h-full bg-[var(--color-accent)] rounded-full transition-all duration-1000" style={{ width: `${Math.min(100, (stats?.currentUnit || 0) / 100 * 100)}%` }}></div>
                            </div>
                        </div>
                    </div>

                    {/* Security Actions */}
                    <h2 className="text-lg font-bold text-white px-1 mt-2">Security</h2>
                    <div className="bg-card rounded-3xl border border-[var(--color-card-border)] overflow-hidden flex flex-col">
                        <button className="flex items-center justify-between p-5 border-b border-[var(--color-card-border)] hover:bg-white/5 text-left transition-colors">
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-full bg-[#0a150b] flex items-center justify-center border border-[var(--color-card-border)]">
                                    <KeyRound size={18} className="text-[var(--color-text-muted)]" />
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-white font-medium text-sm">Change Login Password</span>
                                    <span className="text-[var(--color-text-muted)] text-xs mt-0.5">Update your account access key</span>
                                </div>
                            </div>
                            <span className="text-[var(--color-text-muted)]">›</span>
                        </button>
                        <button className="flex items-center justify-between p-5 hover:bg-white/5 text-left transition-colors">
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-full bg-[#0a150b] flex items-center justify-center border border-[var(--color-card-border)]">
                                    <ShieldCheck size={18} className="text-[var(--color-text-muted)]" />
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-white font-medium text-sm">Transaction PIN</span>
                                    <span className="text-[var(--color-text-muted)] text-xs mt-0.5">Required for withdrawals</span>
                                </div>
                            </div>
                            <span className="text-[var(--color-text-muted)]">›</span>
                        </button>
                    </div>
                </>
            ) : (
                <div className="bg-card rounded-3xl p-8 border border-[var(--color-card-border)] flex flex-col items-center justify-center text-center gap-4">
                    <Loader2 size={32} className="animate-spin text-[var(--color-accent)]" />
                    <p className="text-[var(--color-text-muted)] text-sm">Loading profile...</p>
                </div>
            )}
        </div>
    );
}
