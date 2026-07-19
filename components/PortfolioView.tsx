'use client';

import { useAccount, useBalance, useReadContracts, usePublicClient } from 'wagmi';
import { formatUnits } from 'viem';
import { TOKENS } from '@/lib/contracts';
import { useState, useEffect } from 'react';

// ── Token metadata ────────────────────────────────────────────────────────────
const TW = 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/base/assets';

const TOKEN_META = [
  {
    symbol: 'ETH',  name: 'Ethereum',       decimals: 18,
    logoUrl: 'https://assets.coingecko.com/coins/images/279/large/ethereum.png',
    fallback: 'from-blue-500 to-indigo-600',
  },
  {
    symbol: 'WETH', name: 'Wrapped Ether',  decimals: 18,
    logoUrl: `${TW}/0x4200000000000000000000000000000000000006/logo.png`,
    fallback: 'from-blue-400 to-indigo-500',
  },
  {
    symbol: 'USDC', name: 'USD Coin',       decimals: 6,
    logoUrl: `${TW}/0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913/logo.png`,
    fallback: 'from-blue-500 to-blue-700',
  },
  {
    symbol: 'DAI',  name: 'Dai Stablecoin', decimals: 18,
    logoUrl: `${TW}/0x50c5725949A6F0c72E6C4a641F24049A917DB0Cb/logo.png`,
    fallback: 'from-yellow-400 to-orange-500',
  },
  {
    symbol: 'USDT', name: 'Tether USD',     decimals: 6,
    logoUrl: `${TW}/0xfde4C96c8593536E31F229EA8f37b2ADa2699bb2/logo.png`,
    fallback: 'from-green-500 to-teal-600',
  },
];

const STABLE_PRICES: Record<string, number> = { USDC: 1, DAI: 1, USDT: 1 };

const ERC20_BALANCE_ABI = [
  {
    name: 'balanceOf', type: 'function', stateMutability: 'view',
    inputs: [{ name: 'account', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }],
  },
] as const;

// ── Token logo with fallback ──────────────────────────────────────────────────
function TokenLogo({ symbol, logoUrl, fallback }: { symbol: string; logoUrl: string; fallback: string }) {
  const [err, setErr] = useState(false);
  if (err) {
    return (
      <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${fallback} flex items-center justify-center shrink-0`}>
        <span className="text-white text-xs font-bold">{symbol.slice(0, 3)}</span>
      </div>
    );
  }
  return (
    <img
      src={logoUrl}
      alt={symbol}
      width={40}
      height={40}
      className="w-10 h-10 rounded-full object-cover shrink-0"
      onError={() => setErr(true)}
    />
  );
}

// ── Token row ─────────────────────────────────────────────────────────────────
function AssetRow({
  symbol, name, logoUrl, fallback, amount, usdValue,
}: {
  symbol: string; name: string; logoUrl: string; fallback: string;
  amount: number; usdValue: number;
}) {
  if (usdValue < 0.005) return null;

  return (
    <div className="flex items-center justify-between py-4 border-b border-orange-100/10 last:border-0">
      {/* Left: logo + name */}
      <div className="flex items-center gap-3">
        <TokenLogo symbol={symbol} logoUrl={logoUrl} fallback={fallback} />
        <div>
          <p className="font-bold text-gray-800 text-sm">{name}</p>
          <p className="text-gray-500 text-xs mt-0.5">
            {amount.toLocaleString('en-US', { maximumFractionDigits: 6 })} {symbol}
          </p>
        </div>
      </div>

      {/* Right: USD value */}
      <div className="text-right">
        <p className="font-bold text-gray-800 text-sm">
          ${usdValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </p>
      </div>
    </div>
  );
}

// ── Mini sparkline (static decorative curve) ──────────────────────────────────
function MiniChart() {
  return (
    <svg viewBox="0 0 300 80" className="w-full h-16 mt-4" preserveAspectRatio="none">
      <defs>
        <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#7B61FF" stopOpacity="0.35" />
          <stop offset="100%" stopColor="#7B61FF" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path
        d="M0,70 C30,65 50,55 80,48 C110,41 130,38 160,30 C190,22 220,18 250,12 C270,8 285,6 300,4"
        fill="none"
        stroke="#9B8AFF"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      <path
        d="M0,70 C30,65 50,55 80,48 C110,41 130,38 160,30 C190,22 220,18 250,12 C270,8 285,6 300,4 L300,80 L0,80 Z"
        fill="url(#chartGrad)"
      />
    </svg>
  );
}

// ── Gas fee fetcher ───────────────────────────────────────────────────────────
function useGasPrice() {
  const publicClient = usePublicClient();
  const [gwei, setGwei] = useState<string | null>(null);

  useEffect(() => {
    if (!publicClient) return;
    publicClient.getGasPrice().then((p) => {
      // convert wei → gwei, show 3 decimals
      setGwei((Number(p) / 1e9).toFixed(3));
    }).catch(() => {});
  }, [publicClient]);

  return gwei;
}

// ── Not connected state ───────────────────────────────────────────────────────
export function PortfolioView() {
  const { address, isConnected } = useAccount();

  if (!isConnected) {
    return (
      <div className="bg-surface rounded-2xl shadow-xl p-10 border border-orange-100/20 text-center max-w-2xl mx-auto">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-orange-500/10 flex items-center justify-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-orange-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
          </svg>
        </div>
        <h2 className="text-lg font-bold text-gray-800 mb-1">Connect Your Wallet</h2>
        <p className="text-gray-500 text-sm">Connect your wallet to view your portfolio</p>
      </div>
    );
  }

  return <PortfolioContent address={address!} />;
}

// ── Main portfolio content ────────────────────────────────────────────────────
function PortfolioContent({ address }: { address: string }) {
  const [ethPrice, setEthPrice] = useState(0);
  const gasPrice = useGasPrice();

  useEffect(() => {
    fetch('https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd')
      .then(r => r.json())
      .then(d => { if (d?.ethereum?.usd) setEthPrice(d.ethereum.usd); })
      .catch(() => {});
  }, []);

  // Balances
  const { data: ethBal } = useBalance({ address: address as `0x${string}` });
  const { data: erc20Results } = useReadContracts({
    contracts: [
      { address: TOKENS.WETH as `0x${string}`, abi: ERC20_BALANCE_ABI, functionName: 'balanceOf', args: [address as `0x${string}`] },
      { address: TOKENS.USDC as `0x${string}`, abi: ERC20_BALANCE_ABI, functionName: 'balanceOf', args: [address as `0x${string}`] },
      { address: TOKENS.DAI  as `0x${string}`, abi: ERC20_BALANCE_ABI, functionName: 'balanceOf', args: [address as `0x${string}`] },
      { address: TOKENS.USDT as `0x${string}`, abi: ERC20_BALANCE_ABI, functionName: 'balanceOf', args: [address as `0x${string}`] },
    ],
  });

  const rawValues: Record<string, bigint> = {
    ETH:  ethBal?.value ?? 0n,
    WETH: (erc20Results?.[0]?.result as bigint | undefined) ?? 0n,
    USDC: (erc20Results?.[1]?.result as bigint | undefined) ?? 0n,
    DAI:  (erc20Results?.[2]?.result as bigint | undefined) ?? 0n,
    USDT: (erc20Results?.[3]?.result as bigint | undefined) ?? 0n,
  };

  const tokenData = TOKEN_META.map((meta) => {
    const raw    = rawValues[meta.symbol] ?? 0n;
    const amount = raw > 0n ? parseFloat(formatUnits(raw, meta.decimals)) : 0;
    const price  = STABLE_PRICES[meta.symbol] ?? ethPrice;
    return { ...meta, amount, usdValue: amount * price };
  });

  const totalUsd     = tokenData.reduce((s, t) => s + t.usdValue, 0);
  const tokenCount   = tokenData.filter(t => t.amount > 0).length;
  const visibleTokens = tokenData.filter(t => t.amount > 0 && t.usdValue >= 0.005);

  return (
    <div className="max-w-4xl mx-auto space-y-3">

      {/* ── Top row: Total value card + Network info card ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">

        {/* Total portfolio value */}
        <div className="bg-surface rounded-2xl border border-orange-100/15 shadow-xl px-6 py-5 flex flex-col justify-between min-h-[180px]">
          <div>
            <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">
              Total Portfolio Value
            </p>
            <p className="text-4xl font-extrabold text-gray-800 tracking-tight">
              ${totalUsd.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
            <div className="flex items-center gap-1 mt-2">
              <span className="text-xs text-gray-500">~</span>
              <span className="text-xs text-gray-500">Estimated value</span>
            </div>
          </div>
          <MiniChart />
        </div>

        {/* Network info */}
        <div className="bg-surface rounded-2xl border border-orange-100/15 shadow-xl px-6 py-5">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4">
            Network Status
          </p>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500">Network</span>
              <span className="text-sm font-bold text-gray-800">Base Mainnet</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500">Gas Fee</span>
              <span className="text-sm font-bold text-gray-800">
                {gasPrice ? `${gasPrice} gwei` : '—'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500">Token Count</span>
              <span className="text-sm font-bold text-gray-800">{tokenCount}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500">Active Protocol</span>
              <span className="text-sm font-bold text-gray-800">Uniswap, PancakeSwap</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Asset list ── */}
      <div className="bg-surface rounded-2xl border border-orange-100/15 shadow-xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-orange-100/10">
          <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">Asset</span>
          <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">Value</span>
        </div>

        {/* Rows */}
        <div className="px-6">
          {visibleTokens.length === 0 ? (
            <div className="py-12 text-center">
              <p className="text-gray-500 text-sm">No tokens found in your wallet.</p>
              <a href="/" className="mt-3 inline-block text-sm font-medium text-orange-400 hover:text-orange-300 hover:underline">
                Start swapping →
              </a>
            </div>
          ) : (
            visibleTokens.map((token) => (
              <AssetRow
                key={token.symbol}
                symbol={token.symbol}
                name={token.name}
                logoUrl={token.logoUrl}
                fallback={token.fallback}
                amount={token.amount}
                usdValue={token.usdValue}
              />
            ))
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-orange-100/10">
          <button
            onClick={() => window.open(`https://basescan.org/address/${address}`, '_blank')}
            className="w-full flex items-center justify-center gap-2 text-sm font-semibold text-orange-400 hover:text-orange-300 transition-colors"
          >
            <span>View on BaseScan</span>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </button>
        </div>
      </div>

    </div>
  );
}
