"use client";

import { createConfig, http, WagmiProvider } from 'wagmi';
import { bsc } from 'wagmi/chains';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { injected, walletConnect } from 'wagmi/connectors';

const queryClient = new QueryClient();

const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || '';

// Only include WalletConnect connector if a valid projectId is provided
const connectors = projectId
    ? [injected(), walletConnect({ projectId, showQrModal: true })]
    : [injected()];

export const wagmiConfig = createConfig({
    chains: [bsc],
    connectors,
    transports: {
        [bsc.id]: http(),
    },
});

export function Web3Provider({ children }: { children: React.ReactNode }) {
    return (
        <WagmiProvider config={wagmiConfig}>
            <QueryClientProvider client={queryClient}>
                {children}
            </QueryClientProvider>
        </WagmiProvider>
    );
}
