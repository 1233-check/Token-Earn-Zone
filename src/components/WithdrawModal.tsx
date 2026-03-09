import { useState } from "react";
import { X } from "lucide-react";
import toast from "react-hot-toast";
import { useAuth } from "@/providers/AuthProvider";
import { createWithdrawRequest } from "@/lib/supabase";

interface WithdrawModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function WithdrawModal({ isOpen, onClose }: WithdrawModalProps) {
    const { user, profile, refreshProfile } = useAuth();
    const [address, setAddress] = useState("");
    const [amount, setAmount] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    if (!isOpen) return null;

    const handleWithdraw = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!user || !profile) {
            toast.error("Please log in first");
            return;
        }

        if (!address || !amount) {
            toast.error("Please fill in all fields");
            return;
        }

        const withdrawAmount = parseFloat(amount);

        if (withdrawAmount <= 0) {
            toast.error("Amount must be greater than 0");
            return;
        }

        if (withdrawAmount > profile.total_balance) {
            toast.error("Insufficient balance");
            return;
        }

        setIsSubmitting(true);

        const { error } = await createWithdrawRequest(user.id, address, withdrawAmount);

        setIsSubmitting(false);

        if (error) {
            toast.error(error.message || "Failed to submit withdrawal request");
            return;
        }

        toast.success("Withdrawal request submitted! Waiting for admin approval.");
        await refreshProfile();
        onClose();
        setAddress("");
        setAmount("");
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="bg-[var(--color-card)] border border-[var(--color-card-border)] rounded-2xl p-6 w-full max-w-md relative">
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
                >
                    <X size={24} />
                </button>

                <h2 className="text-2xl font-bold mb-2">Withdraw Crypto</h2>
                <p className="text-sm text-gray-400 mb-6">Your withdrawal request will be processed manually by an admin.</p>

                <form onSubmit={handleWithdraw} className="space-y-4">
                    <div>
                        <label className="text-sm text-gray-400 mb-2 block">Destination Address</label>
                        <input
                            type="text"
                            value={address}
                            onChange={(e) => setAddress(e.target.value)}
                            placeholder="0x..."
                            className="w-full bg-[#0a0f0a] border border-[var(--color-card-border)] rounded-xl px-4 py-3 text-white outline-none focus:border-[var(--color-accent)] transition-colors"
                        />
                    </div>

                    <div>
                        <label className="text-sm text-gray-400 mb-2 flex justify-between">
                            <span>Amount (USD)</span>
                            <span className="text-gray-500">Balance: ${profile?.total_balance?.toLocaleString(undefined, { minimumFractionDigits: 2 }) || "0.00"}</span>
                        </label>
                        <div className="relative">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                            <input
                                type="number"
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                placeholder="0.00"
                                className="w-full bg-[#0a0f0a] border border-[var(--color-card-border)] rounded-xl pl-8 pr-16 py-3 text-white outline-none focus:border-[var(--color-accent)] transition-colors"
                            />
                            <button
                                type="button"
                                onClick={() => setAmount(profile?.total_balance?.toString() || "0")}
                                className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-[var(--color-accent)] font-bold hover:underline"
                            >
                                MAX
                            </button>
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full py-3 px-4 mt-4 rounded-xl font-bold flex items-center justify-center gap-2 bg-transparent border border-[var(--color-accent)] text-[var(--color-accent)] hover:bg-[var(--color-accent)]/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isSubmitting ? "Processing..." : "Confirm Withdrawal"}
                    </button>
                </form>
            </div>
        </div>
    );
}
