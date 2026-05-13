"use client";

import { createAppKit } from '@reown/appkit/react';
import { WagmiProvider } from 'wagmi';
import { bsc } from '@reown/appkit/networks';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { WagmiAdapter } from '@reown/appkit-adapter-wagmi';
import React from 'react';

const queryClient = new QueryClient();

const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || '';

const metadata = {
    name: 'Token Earn Zone',
    description: 'The Future of Web3 Networking',
    url: typeof window !== 'undefined' ? window.location.origin : 'https://token-earn-zone.vercel.app',
    icons: ['/logo.png'],
};

const networks = [bsc] as const;

// Create wagmi adapter for AppKit
const wagmiAdapter = new WagmiAdapter({
    networks,
    projectId,
    ssr: true,
});

// Export wagmi config for use in other components
export const wagmiConfig = wagmiAdapter.wagmiConfig;

// Initialize AppKit only on the client side
if (typeof window !== 'undefined' && projectId) {
    createAppKit({
        adapters: [wagmiAdapter],
        networks,
        projectId,
        metadata,
        features: {
            analytics: false,
            email: false,
            socials: false,
        },
        themeMode: 'dark',
        themeVariables: {
            '--w3m-accent': '#19ac3e',
            '--w3m-color-mix': '#0a150b',
            '--w3m-color-mix-strength': 30,
            '--w3m-border-radius-master': '2px',
        },
        // Featured wallet IDs for MetaMask, Trust Wallet, Phantom, Coinbase
        featuredWalletIds: [
            'c57ca95b47569778a828d19178114f4db188b89b763c899ba0be274e97267d96', // MetaMask
            '4622a2b2d6af1c9844944291e5e7351a6aa24cd7b23099efac1b2fd875da31a0', // Trust Wallet
            'a797aa35c0fadbfc1a53e7f675162ed5226968b44a19ee3d24385c64d1d3c393', // Phantom
            'fd20dc426fb37566d803205b19bbc1d4096b248ac04548e18e34a0ee549047a7', // Coinbase
        ],
    });
}

export function Web3Provider({ children }: { children: React.ReactNode }) {
    return (
        <WagmiProvider config={wagmiConfig}>
            <QueryClientProvider client={queryClient}>
                {children}
            </QueryClientProvider>
        </WagmiProvider>
    );
}
