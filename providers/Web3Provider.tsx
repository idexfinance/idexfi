'use client';

import '@rainbow-me/rainbowkit/styles.css';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { WagmiProvider } from 'wagmi';
import { RainbowKitProvider, lightTheme } from '@rainbow-me/rainbowkit';
import { config } from '@/lib/wagmi';
import { ReactNode } from 'react';

const queryClient = new QueryClient();

const idexTheme = lightTheme({
  accentColor: '#f97316',        // orange-500
  accentColorForeground: 'white',
  borderRadius: 'large',
  fontStack: 'system',
});

export function Web3Provider({ children }: { children: ReactNode }) {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider
          theme={idexTheme}
          locale="en-US"
          appInfo={{ appName: 'iDEX', appUrl: 'https://idexfi.vercel.app' }}
        >
          {children}
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
