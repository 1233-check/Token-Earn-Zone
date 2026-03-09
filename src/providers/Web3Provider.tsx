"use client";

import { createWeb3Modal, defaultWagmiConfig } from '@web3modal/wagmi/react';
import { WagmiProvider } from 'wagmi';
import { bsc } from 'wagmi/chains';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Setup queryClient
const queryClient = new QueryClient();

// Get projectId at https://cloud.walletconnect.com
// This is a test project ID provided for examples and might be rotated.
const projectId = 'afdeb51280802c66cffedbf5a0aee491';
// Create wagmiConfig
const metadata = {
    name: 'Token Earn',
    description: 'The Future of Web3 Networking',
    url: 'https://tokenearn.live',
    icons: ['https://tokenearn.live/logo.png']
}

const chains = [bsc] as const;
const wagmiConfig = defaultWagmiConfig({ chains, projectId, metadata });

// Create modal
createWeb3Modal({ wagmiConfig, projectId });

export function Web3Provider({ children }: { children: React.ReactNode }) {
    return (
        <WagmiProvider config={wagmiConfig}>
            <QueryClientProvider client={queryClient}>
                {children}
            </QueryClientProvider>
        </WagmiProvider>
    );
}
