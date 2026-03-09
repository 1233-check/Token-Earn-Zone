"use client";

import { useState, useEffect } from "react";
import { useWeb3Modal } from '@web3modal/wagmi/react';
import { useAccount, useDisconnect } from 'wagmi';

export default function ConnectButton() {
    const [mounted, setMounted] = useState(false);
    const { open } = useWeb3Modal();
    const { isConnected, address } = useAccount();
    const { disconnect } = useDisconnect();

    useEffect(() => {
        setMounted(true);
    }, []);

    const handleConnect = () => {
        if (isConnected) {
            disconnect();
        } else {
            open();
        }
    };

    const displayAddress = address ? `${address.slice(0, 6)}...${address.slice(-4)}` : '';

    return (
        <button
            onClick={handleConnect}
            className="px-4 py-2 rounded-lg bg-[var(--color-accent)] text-[#0a0f0a] font-semibold hover:bg-[var(--color-accent-hover)] transition-colors text-sm"
        >
            {mounted && isConnected ? displayAddress : "Connect Wallet"}
        </button>
    );
}
