import { useState } from "react";
import Image from "next/image";
import { X, Copy, Check } from "lucide-react";
import toast from "react-hot-toast";
import { useAuth } from "@/providers/AuthProvider";
import { createDepositRequest } from "@/lib/supabase";

interface DepositModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function DepositModal({ isOpen, onClose }: DepositModalProps) {
    const { user } = useAuth();
    const [hasTransferred, setHasTransferred] = useState(false);
    const [txHash, setTxHash] = useState("");
    const [amount, setAmount] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    // In a real app, this should come from process.env.NEXT_PUBLIC_ADMIN_WALLET_ADDRESS
    const depositAddress = process.env.NEXT_PUBLIC_ADMIN_WALLET_ADDRESS || "0x71C...976AdminWallet";

    if (!isOpen) return null;

    const copyAddress = () => {
        navigator.clipboard.writeText(depositAddress);
        toast.success("Address copied to clipboard");
    };

    const handleTransferClick = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!user) {
            toast.error("Please log in first");
            return;
        }

        if (!txHash || !amount) {
            toast.error("Please enter the transaction hash and amount");
            return;
        }

        setIsSubmitting(true);

        const { error } = await createDepositRequest(user.id, txHash, parseFloat(amount));

        setIsSubmitting(false);

        if (error) {
            toast.error(error.message || "Failed to submit request");
            return;
        }

        toast.success("Deposit request submitted! Waiting for admin approval.");
        setHasTransferred(true);
        setTimeout(() => {
            onClose();
            setHasTransferred(false);
            setTxHash("");
            setAmount("");
        }, 2000);
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

                <h2 className="text-2xl font-bold mb-6">Deposit Crypto</h2>

                <form onSubmit={handleTransferClick} className="flex flex-col items-center justify-center space-y-6">
                    <div className="bg-white p-2 rounded-xl flex justify-center items-center w-[200px] h-[200px] relative overflow-hidden">
                        <Image
                            src="/deposit-qr.jpg"
                            alt="Deposit QR Code"
                            fill
                            className="object-contain"
                            unoptimized
                        />
                    </div>

                    <div className="w-full">
                        <label className="text-sm text-gray-400 mb-2 block">Admin Deposit Address (BEP20)</label>
                        <div className="flex items-center p-3 bg-[#0a0f0a] rounded-xl border border-[var(--color-card-border)]">
                            <span className="flex-1 font-mono text-gray-300 truncate">{depositAddress}</span>
                            <button
                                type="button"
                                onClick={copyAddress}
                                className="ml-2 text-gray-400 hover:text-[var(--color-accent)] transition-colors"
                                title="Copy Address"
                            >
                                <Copy size={18} />
                            </button>
                        </div>
                        <p className="text-xs text-red-500 mt-2 text-center">Send only BEP20 tokens to this address.</p>
                    </div>

                    <div className="w-full">
                        <label className="text-sm text-gray-400 mb-2 block">Deposit Amount (USD)</label>
                        <input
                            type="number"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            placeholder="Amount sent..."
                            className="w-full bg-[#0a0f0a] border border-[var(--color-card-border)] rounded-xl px-4 py-3 text-white outline-none focus:border-[var(--color-accent)] transition-colors"
                        />
                    </div>

                    <div className="w-full">
                        <label className="text-sm text-gray-400 mb-2 block">Transaction Hash (Proof of Transfer)</label>
                        <input
                            type="text"
                            value={txHash}
                            onChange={(e) => setTxHash(e.target.value)}
                            placeholder="e.g. 0x123..."
                            className="w-full bg-[#0a0f0a] border border-[var(--color-card-border)] rounded-xl px-4 py-3 text-white outline-none focus:border-[var(--color-accent)] transition-colors"
                        />
                        <p className="text-xs text-gray-500 mt-2 text-center">After transferring, paste the Tx Hash here so we can verify the deposit.</p>
                    </div>

                    <button
                        type="submit"
                        disabled={isSubmitting || hasTransferred}
                        className={`w-full py-3 px-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-colors ${hasTransferred || isSubmitting
                            ? "bg-green-600/20 text-green-500 cursor-not-allowed"
                            : "bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] text-[#0a0f0a]"
                            }`}
                    >
                        {isSubmitting ? (
                            "Submitting Request..."
                        ) : hasTransferred ? (
                            <>
                                <Check size={20} />
                                Pending Admin Approval...
                            </>
                        ) : (
                            "I have made the transfer"
                        )}
                    </button>
                </form>
            </div>
        </div>
    );
}
