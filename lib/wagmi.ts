import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { base } from 'wagmi/chains';
import { http, fallback } from 'wagmi';

const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || '';

// Base official RPC as primary, public endpoints as fallback
const baseTransport = fallback([
  http(process.env.NEXT_PUBLIC_BASE_RPC_URL || 'https://mainnet.base.org'),
  http('https://base.llamarpc.com'),
  http('https://base-rpc.publicnode.com'),
  http('https://1rpc.io/base'),
]);

// ERC-8021 Builder Code Attribution is handled in swap-executor.ts
// via withAttribution() — appended manually to each calldata

export const config = getDefaultConfig({
  appName: 'iDEX - DEX Aggregator',
  projectId,
  chains: [base],
  transports: { [base.id]: baseTransport },
  ssr: true,
});
