"use client";

import { useState, useEffect } from "react";
import { useAccount, useConnect, useDisconnect } from 'wagmi';

export default function ConnectButton() {
    const [mounted, setMounted] = useState(false);
    const { isConnected, address } = useAccount();
    const { connect, connectors, isPending } = useConnect();
    const { disconnect } = useDisconnect();
    const [showOptions, setShowOptions] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    const handleDisconnect = () => {
        disconnect();
    };

    const displayAddress = address ? `${address.slice(0, 6)}...${address.slice(-4)}` : '';

    if (!mounted) return null;

    if (isConnected) {
        return (
            <button
                onClick={handleDisconnect}
                className="px-4 py-2 rounded-full border border-[var(--color-card-border)] bg-card text-[#ea0606] font-semibold hover:bg-white/5 transition-colors text-sm flex items-center gap-2"
            >
                <div className="w-2 h-2 rounded-full bg-[var(--color-accent)]"></div>
                {displayAddress} <span className="text-[var(--color-text-muted)] text-xs ml-1">(Disconnect)</span>
            </button>
        );
    }

    return (
        <div className="relative w-full max-w-sm mx-auto">
            {!showOptions ? (
                <button
                    onClick={() => setShowOptions(true)}
                    className="w-full py-3.5 rounded-xl bg-[var(--color-accent)] text-[#0a0f0a] font-bold tracking-wide hover:bg-[var(--color-accent-hover)] transition-colors"
                >
                    Connect Wallet
                </button>
            ) : (
                <div className="flex flex-col gap-2 w-full animate-fade-in-up">
                    <p className="text-sm font-semibold text-white mb-2 text-center">Select Wallet Provider</p>
                    {connectors.map((connector) => (
                        <button
                            key={connector.uid}
                            onClick={() => connect({ connector })}
                            disabled={isPending}
                            className="w-full text-left px-4 py-3.5 rounded-xl bg-card border border-[var(--color-card-border)] text-white font-medium hover:border-[var(--color-accent)] transition-all flex items-center justify-between group"
                        >
                            <span className="group-hover:text-[var(--color-accent)] transition-colors">{connector.name}</span>
                            {isPending && <span className="text-xs text-[var(--color-accent)] animate-pulse">Connecting...</span>}
                        </button>
                    ))}
                    <button
                        onClick={() => setShowOptions(false)}
                        className="text-sm text-[var(--color-text-muted)] hover:text-white mt-3 transition-colors text-center w-full"
                    >
                        Cancel
                    </button>
                </div>
            )}
        </div>
    );
}
