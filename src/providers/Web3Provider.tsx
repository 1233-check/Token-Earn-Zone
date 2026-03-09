"use client";

import { createConfig, http, WagmiProvider } from 'wagmi';
import { bsc } from 'wagmi/chains';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { injected, walletConnect } from 'wagmi/connectors';

const queryClient = new QueryClient();

// If they eventually provide a projectId, we can still support WalletConnect alongside injected wallets
const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || '';

const connectors = [];
connectors.push(injected());

if (projectId) {
    connectors.push(walletConnect({ projectId, showQrModal: true }));
}

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
