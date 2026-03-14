import { useState } from "react";
import { X } from "lucide-react";
import toast from "react-hot-toast";
import { useAuth } from "@/providers/AuthProvider";
import { createWithdrawRequest, verifyTransactionPin } from "@/lib/supabase";

interface WithdrawModalProps {
    isOpen: boolean;
    onClose: () => void;
    profitBalance?: number;
}

export default function WithdrawModal({ isOpen, onClose, profitBalance }: WithdrawModalProps) {
    const { user, profile, refreshProfile } = useAuth();
    const [address, setAddress] = useState("");
    const [amount, setAmount] = useState("");
    const [pin, setPin] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    if (!isOpen) return null;

    // Use profitBalance if provided, otherwise fall back to total_balance
    const withdrawableBalance = profitBalance ?? profile?.total_balance ?? 0;

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

        if (withdrawAmount > withdrawableBalance) {
            toast.error("Insufficient profit balance for withdrawal");
            return;
        }

        if (!pin || pin.length < 4) {
            toast.error("Please enter a valid Transaction PIN");
            return;
        }

        setIsSubmitting(true);

        // Verify PIN first
        try {
            const isPinValid = await verifyTransactionPin(user.id, pin);
            if (!isPinValid) {
                toast.error("Invalid Transaction PIN. Please try again or check your Profile security settings.");
                setIsSubmitting(false);
                return;
            }
        } catch (error) {
            toast.error("Error verifying PIN");
            setIsSubmitting(false);
            return;
        }

        const { error } = await createWithdrawRequest(user.id, address, withdrawAmount);

        setIsSubmitting(false);

        if (error) {
            toast.error(error.message || "Failed to submit withdrawal request");
            return;
        }

        toast.success("Withdrawal request submitted! Withdrawal Processing.");
        await refreshProfile();
        onClose();
        setAddress("");
        setAmount("");
        setPin("");
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
                <p className="text-sm text-gray-400 mb-6">Your withdrawal request is being processed. You will be notified once complete.</p>

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
                            <span className="text-gray-500">Profit Balance: ${withdrawableBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
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
                                onClick={() => setAmount(withdrawableBalance.toString())}
                                className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-[var(--color-accent)] font-bold hover:underline"
                            >
                                MAX
                            </button>
                        </div>
                    </div>

                    <div>
                        <label className="text-sm text-gray-400 mb-2 block">Transaction PIN</label>
                        <input
                            type="password"
                            value={pin}
                            onChange={(e) => setPin(e.target.value)}
                            placeholder="••••"
                            maxLength={6}
                            className="w-full bg-[#0a0f0a] border border-[var(--color-card-border)] rounded-xl px-4 py-3 text-white outline-none focus:border-[var(--color-accent)] transition-colors font-mono tracking-widest"
                        />
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
