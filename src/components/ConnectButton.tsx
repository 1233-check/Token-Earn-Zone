"use client";

import { useAppKit, useAppKitAccount } from '@reown/appkit/react';
import { useDisconnect } from 'wagmi';

export default function ConnectButton() {
    const { open } = useAppKit();
    const { address, isConnected } = useAppKitAccount();
    const { disconnect } = useDisconnect();

    const displayAddress = address ? `${address.slice(0, 6)}...${address.slice(-4)}` : '';

    if (isConnected && address) {
        return (
            <button
                onClick={() => disconnect()}
                className="px-4 py-2 rounded-full border border-[var(--color-card-border)] bg-card text-[#ea0606] font-semibold hover:bg-white/5 transition-colors text-sm flex items-center gap-2"
            >
                <div className="w-2 h-2 rounded-full bg-[var(--color-accent)]"></div>
                {displayAddress} <span className="text-[var(--color-text-muted)] text-xs ml-1">(Disconnect)</span>
            </button>
        );
    }

    return (
        <div className="relative w-full max-w-sm mx-auto">
            <button
                onClick={() => open()}
                className="w-full py-3.5 rounded-xl bg-[var(--color-accent)] text-[#0a0f0a] font-bold tracking-wide hover:bg-[var(--color-accent-hover)] transition-colors"
            >
                Connect Wallet
            </button>
        </div>
    );
}
