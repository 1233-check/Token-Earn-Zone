"use client";

import { useState } from "react";
import { X, Loader2, ShieldCheck } from "lucide-react";
import { supabase } from "@/lib/supabase";
import toast from "react-hot-toast";

interface TransactionPinModalProps {
    isOpen: boolean;
    onClose: () => void;
    userId: string;
}

export default function TransactionPinModal({ isOpen, onClose, userId }: TransactionPinModalProps) {
    const [oldPin, setOldPin] = useState("");
    const [newPin, setNewPin] = useState("");
    const [confirmPin, setConfirmPin] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (newPin.length < 4) {
            toast.error("PIN must be at least 4 characters long.");
            return;
        }

        if (newPin !== confirmPin) {
            toast.error("New PINs do not match.");
            return;
        }

        setIsLoading(true);
        try {
            const { data, error } = await supabase.rpc("set_transaction_pin", {
                p_user_id: userId,
                p_new_pin: newPin,
                p_old_pin: oldPin || null
            });

            if (error) throw error;

            toast.success("Transaction PIN successfully set!");
            setOldPin("");
            setNewPin("");
            setConfirmPin("");
            onClose();
        } catch (error: any) {
            console.error("Error setting pin:", error);
            // Detect if they failed the old pin check
            if (error.message?.includes("Incorrect current PIN")) {
                toast.error("The current PIN you entered is incorrect.");
            } else {
                toast.error(error.message || "Failed to set Transaction PIN.");
            }
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-card w-full max-w-md rounded-3xl border border-[var(--color-card-border)] shadow-2xl overflow-hidden flex flex-col">
                <div className="flex justify-between items-center p-5 border-b border-[var(--color-card-border)] bg-white/5">
                    <h2 className="text-xl font-bold text-white flex items-center gap-2">
                        <ShieldCheck className="text-[var(--color-accent)]" size={24} />
                        Transaction PIN
                    </h2>
                    <button
                        onClick={onClose}
                        className="p-2 text-[var(--color-text-muted)] hover:text-white rounded-xl hover:bg-white/10 transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                <div className="p-6">
                    <p className="text-[var(--color-text-muted)] text-sm mb-6">
                        Your Transaction PIN is required to authorize all withdrawals and sensitive account changes.
                    </p>

                    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                        <div className="flex flex-col gap-1.5">
                            <label className="text-sm font-medium text-[var(--color-text-muted)]">Current PIN (Leave blank if setting for the first time)</label>
                            <input
                                type="password"
                                value={oldPin}
                                onChange={(e) => setOldPin(e.target.value)}
                                className="bg-[#0a150b] border border-[var(--color-card-border)] rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[var(--color-accent)] transition-colors font-mono"
                                placeholder="..."
                                maxLength={6}
                            />
                        </div>

                        <div className="flex flex-col gap-1.5">
                            <label className="text-sm font-medium text-[var(--color-text-muted)]">New PIN</label>
                            <input
                                type="password"
                                value={newPin}
                                onChange={(e) => setNewPin(e.target.value)}
                                className="bg-[#0a150b] border border-[var(--color-card-border)] rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[var(--color-accent)] transition-colors font-mono tracking-widest"
                                placeholder="••••"
                                required
                                minLength={4}
                                maxLength={6}
                            />
                        </div>

                        <div className="flex flex-col gap-1.5 mb-2">
                            <label className="text-sm font-medium text-[var(--color-text-muted)]">Confirm New PIN</label>
                            <input
                                type="password"
                                value={confirmPin}
                                onChange={(e) => setConfirmPin(e.target.value)}
                                className="bg-[#0a150b] border border-[var(--color-card-border)] rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[var(--color-accent)] transition-colors font-mono tracking-widest"
                                placeholder="••••"
                                required
                                minLength={4}
                                maxLength={6}
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading || !newPin || !confirmPin}
                            className="w-full py-4 mt-2 rounded-xl bg-[var(--color-accent)] text-[#0a150b] font-bold text-[15px] hover:bg-opacity-90 transition-all flex justify-center items-center disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isLoading ? <Loader2 className="animate-spin" size={20} /> : "Update PIN"}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}
