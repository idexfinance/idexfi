import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { base } from 'wagmi/chains';
import { http, fallback } from 'wagmi';
import { Attribution } from 'ox/erc8021';

const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || '';

// Base official RPC as primary, public endpoints as fallback
const baseTransport = fallback([
  http(process.env.NEXT_PUBLIC_BASE_RPC_URL || 'https://mainnet.base.org'),
  http('https://base.llamarpc.com'),
  http('https://base-rpc.publicnode.com'),
  http('https://1rpc.io/base'),
]);

// ERC-8021 Builder Code Attribution
// dataSuffix at config level automatically appends to ALL transactions
// No changes needed in hooks or components
const DATA_SUFFIX = Attribution.toDataSuffix({
  codes: ['bc_ri4d72mx'],
});

export const config = getDefaultConfig({
  appName: 'iDEX - DEX Aggregator',
  projectId,
  chains: [base],
  transports: { [base.id]: baseTransport },
  // @ts-ignore — dataSuffix supported in viem 2.45.0+
  dataSuffix: DATA_SUFFIX,
  ssr: true,
});
