'use client';

import { useState } from 'react';

// ── Shared UI helpers ─────────────────────────────────────────────────────────
function Info({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex gap-3 bg-blue-50 border border-blue-200 rounded-xl p-4 my-4 text-sm text-blue-800">
      <span className="shrink-0">ℹ️</span><div>{children}</div>
    </div>
  );
}
function Warning({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex gap-3 bg-amber-50 border border-amber-200 rounded-xl p-4 my-4 text-sm text-amber-800">
      <span className="shrink-0">⚠️</span><div>{children}</div>
    </div>
  );
}
function Danger({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex gap-3 bg-red-50 border border-red-200 rounded-xl p-4 my-4 text-sm text-red-800">
      <span className="shrink-0">🚨</span><div>{children}</div>
    </div>
  );
}
function Code({ children }: { children: React.ReactNode }) {
  return (
    <code className="bg-orange-50 border border-orange-100 text-orange-700 rounded px-1.5 py-0.5 text-xs font-mono">
      {children}
    </code>
  );
}
function CodeBlock({ children }: { children: string }) {
  return (
    <pre className="bg-gray-900 text-gray-100 rounded-xl p-4 my-4 text-xs font-mono overflow-x-auto leading-relaxed">
      <code>{children}</code>
    </pre>
  );
}
function H2({ id, children }: { id: string; children: React.ReactNode }) {
  return (
    <h2 id={id} className="text-2xl font-bold text-gray-900 mt-10 mb-3 scroll-mt-24 border-b border-orange-100 pb-2">
      {children}
    </h2>
  );
}
function H3({ id, children }: { id?: string; children: React.ReactNode }) {
  return (
    <h3 id={id} className="text-lg font-bold text-gray-800 mt-6 mb-2 scroll-mt-24">
      {children}
    </h3>
  );
}
function Table({ headers, rows }: { headers: string[]; rows: string[][] }) {
  return (
    <div className="overflow-x-auto my-4 rounded-xl border border-orange-100">
      <table className="w-full text-sm">
        <thead className="bg-orange-50 border-b border-orange-100">
          <tr>{headers.map((h) => <th key={h} className="px-4 py-2.5 text-left font-semibold text-gray-700">{h}</th>)}</tr>
        </thead>
        <tbody className="divide-y divide-orange-50 bg-surface">
          {rows.map((row, i) => (
            <tr key={i} className="hover:bg-orange-50/40 transition-colors">
              {row.map((cell, j) => (
                <td key={j} className="px-4 py-2.5 text-gray-700 text-xs font-mono">{cell}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ── Step visual component ─────────────────────────────────────────────────────
function Steps({ items }: { items: { title: string; desc: string }[] }) {
  return (
    <div className="my-6 space-y-0">
      {items.map((item, i) => (
        <div key={i} className="flex gap-4">
          <div className="flex flex-col items-center">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center text-white text-xs font-bold shrink-0">
              {i + 1}
            </div>
            {i < items.length - 1 && <div className="w-px flex-1 bg-orange-200 my-1" />}
          </div>
          <div className="pb-6 flex-1 min-w-0">
            <p className="font-semibold text-gray-800 text-sm mb-0.5">{item.title}</p>
            <p className="text-sm text-gray-500 leading-relaxed">{item.desc}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Feature card grid ─────────────────────────────────────────────────────────
function FeatureGrid({ items }: { items: { icon: string; title: string; desc: string }[] }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 my-6">
      {items.map((item) => (
        <div key={item.title} className="bg-orange-50/60 border border-orange-100 rounded-2xl p-4 flex gap-3">
          <span className="text-2xl shrink-0">{item.icon}</span>
          <div>
            <p className="font-semibold text-gray-800 text-sm mb-0.5">{item.title}</p>
            <p className="text-xs text-gray-500 leading-relaxed">{item.desc}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Callout ───────────────────────────────────────────────────────────────────
function Callout({ icon, title, children }: { icon: string; title: string; children: React.ReactNode }) {
  return (
    <div className="border border-orange-200 bg-gradient-to-br from-orange-50 to-amber-50 rounded-2xl p-5 my-6">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-xl">{icon}</span>
        <p className="font-bold text-gray-800 text-sm">{title}</p>
      </div>
      <div className="text-sm text-gray-600 leading-relaxed">{children}</div>
    </div>
  );
}

// ── PAGE: What is iDEX ────────────────────────────────────────────────────────
const whatIsIDEX = (
  <div>
    <p className="text-gray-600 text-lg leading-relaxed mb-4">
      <strong>iDEX Finance</strong> is a non-custodial token swap interface built on{' '}
      <a href="https://base.org" target="_blank" rel="noopener noreferrer" className="text-orange-500 hover:underline font-medium">
        Base Mainnet
      </a>
      . It finds the best available price across multiple DEXs and executes the swap
      directly through the winning protocol's router — without any intermediary contract,
      without custody of your funds, and without hidden fees.
    </p>

    <Callout icon="🎯" title="The Core Idea">
      iDEX doesn't own any liquidity. Instead it reads prices from Uniswap V3 and
      PancakeSwap V3 simultaneously, picks the route that gives you the most tokens out,
      and sends your transaction straight to that DEX's own audited router.
      You interact with battle-tested contracts — not a new one.
    </Callout>

    <H2 id="key-features">Key Features</H2>
    <FeatureGrid items={[
      { icon: '🔀', title: 'Multi-DEX Price Comparison', desc: 'Queries Uniswap V3 and PancakeSwap V3 across all four fee tiers in parallel. The best amountOut wins, regardless of which DEX it comes from.' },
      { icon: '⚡', title: 'Native ETH Support', desc: 'Swap ETH directly — no manual wrapping needed. iDEX handles the WETH conversion internally during routing and execution.' },
      { icon: '🔒', title: 'No Intermediary Contract', desc: 'Your funds go directly from your wallet to the DEX router. iDEX has no smart contract of its own in the transaction path.' },
      { icon: '📊', title: 'Portfolio Tracking', desc: 'Real-time balances for ETH, WETH, USDC, DAI and USDT with live USD valuations powered by the CoinGecko API.' },
      { icon: '📜', title: 'Persistent History', desc: 'Every swap is saved to Supabase and mirrored in localStorage as an offline cache. Access your history from any device.' },
      { icon: '👤', title: 'On-Chain Identity', desc: 'Set a username and avatar tied to your wallet address. Track your swap count, volume, and active trading days over time.' },
    ]} />

    <H2 id="how-it-fits">Where iDEX Sits in the Stack</H2>
    <p className="text-gray-600 text-sm leading-relaxed mb-4">
      iDEX is a pure <strong>presentation and routing layer</strong> — it sits between your
      wallet and the DEX protocols, doing price discovery and route selection so you don't have to.
    </p>
    <div className="bg-gray-900 rounded-2xl p-5 my-4 font-mono text-xs space-y-2 leading-relaxed">
      <div className="text-gray-400">// Simplified execution path</div>
      <div><span className="text-amber-400">User Wallet</span></div>
      <div className="pl-4 text-gray-400">↓  signs transaction</div>
      <div className="pl-4"><span className="text-orange-400">iDEX Frontend</span><span className="text-gray-500">  ← price comparison + route selection (off-chain)</span></div>
      <div className="pl-8 text-gray-400">↓  submits tx directly to winning router</div>
      <div className="pl-8"><span className="text-green-400">Uniswap V3 Router</span><span className="text-gray-500">  OR</span></div>
      <div className="pl-8"><span className="text-blue-400">PancakeSwap V3 Router</span></div>
      <div className="pl-12 text-gray-400">↓  tokens arrive in your wallet</div>
      <div className="pl-12"><span className="text-amber-400">User Wallet</span><span className="text-gray-500">  (receives output tokens)</span></div>
    </div>

    <H2 id="modules">App Modules</H2>
    <Table
      headers={['Page', 'What it does']}
      rows={[
        ['Swap', 'Find the best route and execute token swaps across Uniswap V3 and PancakeSwap V3'],
        ['Portfolio', 'View live balances and USD values for all supported tokens in your wallet'],
        ['History', 'Browse your past swaps with pagination and BaseScan links'],
        ['Profile', 'Set a username and avatar; view your swap stats and trading volume'],
        ['Docs', 'Full technical and user reference — you are here'],
      ]}
    />

    <Info>
      iDEX Finance runs exclusively on <strong>Base Mainnet</strong> (Chain ID: <Code>8453</Code>).
      Your wallet must be connected to this network to use any feature.
    </Info>
  </div>
);

// ── PAGE: Getting Started ─────────────────────────────────────────────────────
const gettingStarted = (
  <div>
    <p className="text-gray-600 text-lg leading-relaxed mb-6">
      From zero to your first swap in under two minutes.
    </p>

    <H2 id="connect-wallet">Connect Your Wallet</H2>
    <Steps items={[
      { title: 'Click "Connect Wallet"', desc: 'Find the orange button in the top-right corner of any page. iDEX supports MetaMask, Coinbase Wallet, Rabby, Rainbow, and any WalletConnect-compatible wallet.' },
      { title: 'Approve the connection', desc: 'Your wallet will prompt you to approve the connection to iDEX Finance. No signing or transaction is required at this step.' },
      { title: 'Confirm you\'re on Base Mainnet', desc: 'If your wallet is on a different network, a "⚠️ Wrong Network" button appears. Click it to switch to Base Mainnet (Chain ID: 8453) automatically.' },
    ]} />

    <H2 id="wallet-menu">Wallet Menu</H2>
    <p className="text-gray-600 text-sm leading-relaxed mb-3">
      Once connected, click your address in the header to open the wallet dropdown:
    </p>
    <div className="bg-surface border border-orange-100 rounded-2xl p-4 my-4 space-y-2">
      {[
        ['📋 Copy Address', 'Copies your full wallet address to clipboard. Button turns green with a checkmark for 2 seconds.'],
        ['🔗 View on BaseScan', 'Opens your address on basescan.org in a new tab.'],
        ['🚪 Disconnect', 'Disconnects your wallet from iDEX. Shown in red.'],
      ].map(([label, desc]) => (
        <div key={String(label)} className="flex items-start gap-3 text-sm">
          <span className="font-semibold text-gray-800 shrink-0 w-36">{label}</span>
          <span className="text-gray-500">{desc}</span>
        </div>
      ))}
    </div>

    <H2 id="first-swap">Your First Swap</H2>
    <Steps items={[
      { title: 'Select the token you want to sell', desc: 'In the Sell block, click the token pill on the right. A modal opens — pick from ETH, WETH, USDC, DAI, or USDT, or paste any ERC-20 address.' },
      { title: 'Enter the amount', desc: 'Type a number, or use the 25% / 50% / 75% / MAX shortcut buttons to fill from your wallet balance.' },
      { title: 'Select the token you want to buy', desc: 'In the Buy block, click its token pill and pick the destination token.' },
      { title: 'Review the route and rate', desc: 'iDEX automatically fetches quotes and shows the best exchange rate (e.g. 1 ETH ≈ 3,412 USDC) and which DEX won.' },
      { title: 'Adjust slippage if needed', desc: 'Click ⚙ in the top-right of the swap card. Default is 0.5%. For volatile pairs, try 1%.' },
      { title: 'Click Swap and confirm', desc: 'If this is a new ERC-20 token, your wallet will first request an Approve transaction. Then confirm the swap transaction. Both steps are shown with a live progress toast.' },
    ]} />

    <H2 id="slippage-guide">Understanding Slippage</H2>
    <p className="text-gray-600 text-sm leading-relaxed mb-3">
      Slippage tolerance sets how much the price can move between when you click Swap and when
      the transaction is confirmed on-chain. iDEX calculates <Code>amountOutMinimum</Code> from
      this percentage and includes it in every swap call.
    </p>
    <div className="grid grid-cols-3 gap-3 my-4">
      {[
        { label: '0.1%', color: 'blue', title: 'Very tight', desc: 'Best for stable pairs (USDC/USDT). May revert on any token.' },
        { label: '0.5%', color: 'green', title: 'Recommended', desc: 'Works well for most ETH/stablecoin pairs under normal conditions.' },
        { label: '1%+', color: 'orange', title: 'Volatile pairs', desc: 'Use for newer or lower-liquidity tokens to avoid reverts.' },
      ].map(({ label, title, desc }) => (
        <div key={label} className="bg-orange-50/50 border border-orange-100 rounded-xl p-3 text-center">
          <p className="text-lg font-extrabold text-orange-500 mb-1">{label}</p>
          <p className="text-xs font-semibold text-gray-700 mb-1">{title}</p>
          <p className="text-xs text-gray-400 leading-snug">{desc}</p>
        </div>
      ))}
    </div>
    <Warning>
      Setting slippage above <Code>5%</Code> significantly increases sandwich attack risk on
      public mempools. Only use high slippage for tokens with very thin liquidity when you
      understand the risk.
    </Warning>
  </div>
);

// ── PAGE: Swap ────────────────────────────────────────────────────────────────
const swapDocs = (
  <div>
    <p className="text-gray-600 text-lg leading-relaxed mb-4">
      The Swap page is the heart of iDEX Finance. This section covers exactly how
      price discovery works, how the execution is structured, and what happens at each
      step when you click Swap.
    </p>

    <H2 id="price-discovery">How Price Discovery Works</H2>
    <p className="text-gray-600 text-sm leading-relaxed mb-3">
      When you finish typing an amount, iDEX waits <Code>500ms</Code> (debounce) and then
      fires <strong>eight parallel</strong> <Code>quoteExactInputSingle</Code> calls —
      four fee tiers on Uniswap V3 and four on PancakeSwap V3.
    </p>
    <CodeBlock>{`// lib/routing.ts (simplified)
const feeTiers = [100, 500, 3000, 10000]; // 0.01% · 0.05% · 0.30% · 1.00%

const uniswapQuotes = feeTiers.map(fee =>
  client.readContract({
    address: UNISWAP_V3.QuoterV2,
    functionName: 'quoteExactInputSingle',
    args: [{ tokenIn, tokenOut, amountIn, fee, sqrtPriceLimitX96: 0n }],
  })
);

const pancakeQuotes = feeTiers.map(fee =>
  client.readContract({
    address: PANCAKESWAP_V3.QuoterV2,
    functionName: 'quoteExactInputSingle',
    args: [{ tokenIn, tokenOut, amountIn, fee, sqrtPriceLimitX96: 0n }],
  })
);

await Promise.all([...uniswapQuotes, ...pancakeQuotes]);
// → pick route with highest amountOut`}</CodeBlock>
    <p className="text-gray-600 text-sm leading-relaxed mb-3">
      Calls that fail (no pool at that fee tier, pool paused, zero liquidity) are silently
      skipped. The route with the highest <Code>amountOut</Code> becomes the best route.
      If all eight calls fail or return zero, a "No liquidity found" message is shown.
      The engine retries up to <strong>3 times</strong> on network errors before giving up.
    </p>

    <H2 id="fee-tiers">Fee Tier Reference</H2>
    <Table
      headers={['Fee Tier', 'Basis Points', 'Typical Use Case']}
      rows={[
        ['0.01%', '1 bps', 'Stablecoin ↔ stablecoin (USDC/USDT, USDC/DAI)'],
        ['0.05%', '5 bps', 'Correlated pairs (ETH/WETH, major stables)'],
        ['0.30%', '30 bps', 'Standard volatile pairs (ETH/USDC, ETH/DAI)'],
        ['1.00%', '100 bps', 'Exotic or low-liquidity pairs'],
      ]}
    />

    <H2 id="native-eth">Native ETH Handling</H2>
    <p className="text-gray-600 text-sm leading-relaxed mb-3">
      DEX pools don't hold native ETH — they use WETH. iDEX handles this invisibly:
    </p>
    <div className="space-y-2 my-4">
      {[
        { case: 'ETH → ERC-20', how: 'Sends ETH as msg.value. Router wraps it to WETH internally and swaps.' },
        { case: 'ERC-20 → ETH', how: 'Swaps to WETH, then multicalls unwrapWETH9 in the same transaction. One confirmation, ETH arrives.' },
        { case: 'ETH ↔ WETH', how: 'Calls deposit() or withdraw() on WETH9 directly. Zero DEX fee, no pool needed.' },
      ].map(({ case: c, how }) => (
        <div key={c} className="flex gap-3 bg-orange-50/50 border border-orange-100 rounded-xl p-3 text-sm">
          <span className="font-bold text-orange-600 shrink-0 w-32">{c}</span>
          <span className="text-gray-600">{how}</span>
        </div>
      ))}
    </div>

    <H2 id="execution-steps">Execution Steps</H2>
    <Steps items={[
      { title: 'Approve (ERC-20 only)', desc: 'iDEX checks the current allowance via allowance(user, router). If it\'s below the swap amount, it requests approve(router, maxUint256) — a one-time cost per token per router. Native ETH skips this step entirely.' },
      { title: 'Build swap params', desc: 'Constructs the exactInputSingle params struct: tokenIn, tokenOut, fee, recipient, amountIn, amountOutMinimum (from slippage), sqrtPriceLimitX96: 0, and a 20-minute deadline.' },
      { title: 'Submit transaction', desc: 'Calls exactInputSingle on the winning router (Uniswap SwapRouter02 or PancakeSwap SmartRouter) with ETH value attached if tokenIn is native ETH.' },
      { title: 'Wait for receipt', desc: 'Polls waitForTransactionReceipt. The UI shows a "Confirming on-chain…" state during this phase.' },
      { title: 'Save record', desc: 'On success, the swap is written to localStorage immediately and upserted to Supabase asynchronously. The idex_swap_completed event fires to update the History page live.' },
    ]} />

    <H2 id="error-messages">Error Messages Decoded</H2>
    <Table
      headers={['Error', 'What it means', 'Fix']}
      rows={[
        ['Insufficient ETH for gas', 'Your ETH balance can\'t cover the gas cost', 'Add more ETH to your wallet'],
        ['Transaction rejected in wallet', 'You dismissed the wallet popup', 'Click Swap again and confirm in your wallet'],
        ['Swap reverted — try increasing slippage', 'Price moved past your slippage limit', 'Raise slippage to 1% or higher'],
        ['Transaction expired. Please try again', 'The 20-min deadline passed before confirmation', 'Click Swap again — it\'s safe to retry'],
        ['No liquidity found for this pair', 'None of the 8 fee tiers have a pool', 'Try a different token pair or check token address'],
      ]}
    />
  </div>
);

// ── PAGE: Portfolio ───────────────────────────────────────────────────────────
const portfolioDocs = (
  <div>
    <p className="text-gray-600 text-lg leading-relaxed mb-4">
      The Portfolio page is a live snapshot of your Base Mainnet holdings.
      No transactions, no approvals — purely read-only on-chain data.
    </p>

    <H2 id="balance-fetching">How Balances Are Fetched</H2>
    <p className="text-gray-600 text-sm leading-relaxed mb-3">
      iDEX uses wagmi's <Code>useBalance</Code> hook for native ETH and a batched
      <Code>useReadContracts</Code> call for all ERC-20 tokens simultaneously.
      This means only two RPC round-trips are needed to populate the entire asset list.
    </p>
    <CodeBlock>{`// One batched call for all ERC-20 balances
useReadContracts({
  contracts: [
    { address: TOKENS.WETH, abi: ERC20_ABI, functionName: 'balanceOf', args: [address] },
    { address: TOKENS.USDC, abi: ERC20_ABI, functionName: 'balanceOf', args: [address] },
    { address: TOKENS.DAI,  abi: ERC20_ABI, functionName: 'balanceOf', args: [address] },
    { address: TOKENS.USDT, abi: ERC20_ABI, functionName: 'balanceOf', args: [address] },
  ],
});`}</CodeBlock>

    <H2 id="usd-pricing">USD Pricing Logic</H2>
    <div className="space-y-2 my-4">
      {[
        { token: 'ETH & WETH', method: 'CoinGecko /simple/price API — fetched once on mount. Both use the same ETH price.' },
        { token: 'USDC', method: 'Hard-coded at $1.00' },
        { token: 'DAI', method: 'Hard-coded at $1.00' },
        { token: 'USDT', method: 'Hard-coded at $1.00' },
      ].map(({ token, method }) => (
        <div key={token} className="flex gap-3 bg-orange-50/50 border border-orange-100 rounded-xl p-3 text-sm">
          <span className="font-bold text-orange-600 shrink-0 w-24">{token}</span>
          <span className="text-gray-600">{method}</span>
        </div>
      ))}
    </div>
    <p className="text-gray-500 text-xs mt-2">
      Tokens with a calculated USD value below $0.005 are hidden from the asset list to reduce noise.
    </p>

    <H2 id="portfolio-cards">Dashboard Cards</H2>
    <FeatureGrid items={[
      { icon: '💰', title: 'Total Portfolio Value', desc: 'Sum of all visible token holdings in USD. Displayed with a decorative sparkline curve.' },
      { icon: '🌐', title: 'Network Status', desc: 'Live gas price in gwei, total token count, active protocols, and current network (Base Mainnet).' },
      { icon: '📋', title: 'Asset List', desc: 'Each token row shows its logo, full name, balance formatted to 6 decimal places, and USD value.' },
      { icon: '🔗', title: 'View on BaseScan', desc: 'One-click button at the bottom of the asset list to open your address on basescan.org.' },
    ]} />

    <H2 id="supported-tokens">Supported Tokens</H2>
    <Table
      headers={['Token', 'Symbol', 'Decimals', 'Address']}
      rows={[
        ['Ethereum (native)', 'ETH', '18', '0xEeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee'],
        ['Wrapped Ether', 'WETH', '18', '0x4200000000000000000000000000000000000006'],
        ['USD Coin', 'USDC', '6',  '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913'],
        ['Dai Stablecoin', 'DAI', '18', '0x50c5725949A6F0c72E6C4a641F24049A917DB0Cb'],
        ['Tether USD', 'USDT', '6',  '0xfde4C96c8593536E31F229EA8f37b2ADa2699bb2'],
      ]}
    />
    <Info>
      All balances are fetched live from the blockchain on every page load.
      Refresh the page to get the latest values after a swap.
    </Info>
  </div>
);

// ── PAGE: History ─────────────────────────────────────────────────────────────
const historyDocs = (
  <div>
    <p className="text-gray-600 text-lg leading-relaxed mb-4">
      Every swap you make through iDEX is automatically recorded and visible on the History page —
      with pagination, relative timestamps, and direct BaseScan links.
    </p>

    <H2 id="storage-strategy">Two-Layer Storage</H2>
    <p className="text-gray-600 text-sm leading-relaxed mb-3">
      iDEX persists swap records in two places simultaneously so your history is always available,
      even without an internet connection:
    </p>
    <div className="space-y-3 my-4">
      {[
        { layer: 'Supabase', badge: 'Primary', color: 'green', desc: 'PostgreSQL database. Records are upserted immediately after each swap using the transaction hash as the unique key. Fetches up to 200 records ordered by timestamp descending.' },
        { layer: 'localStorage', badge: 'Fallback / Cache', color: 'orange', desc: 'Browser storage, keyed by wallet address. Used when Supabase is unreachable. Always refreshed after a successful Supabase fetch. Capped at the latest 100 records.' },
      ].map(({ layer, badge, desc }) => (
        <div key={layer} className="bg-orange-50/50 border border-orange-100 rounded-xl p-4 text-sm">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-bold text-gray-800">{layer}</span>
            <span className="text-xs bg-orange-500/15 text-orange-600 border border-orange-200 px-2 py-0.5 rounded-full font-medium">{badge}</span>
          </div>
          <p className="text-gray-500 leading-relaxed">{desc}</p>
        </div>
      ))}
    </div>

    <H2 id="record-schema">Record Schema</H2>
    <CodeBlock>{`interface SwapRecord {
  hash:      string;   // 0x… on-chain tx hash (unique key)
  tokenIn:   string;   // e.g. "ETH"
  tokenOut:  string;   // e.g. "USDC"
  amountIn:  string;   // human-readable, e.g. "0.5"
  amountOut: string;   // human-readable, e.g. "1723.41"
  timestamp: number;   // Unix ms, e.g. 1720000000000
}`}</CodeBlock>

    <H2 id="live-updates">Live Updates</H2>
    <p className="text-gray-600 text-sm leading-relaxed mb-3">
      The History page listens to a custom browser event fired by the Swap component the moment
      a transaction is confirmed. New swaps appear in the list instantly — no refresh needed.
    </p>
    <CodeBlock>{`// SwapButton.tsx — fires after confirmation
window.dispatchEvent(new Event('idex_swap_completed'));

// SwapHistory.tsx — reloads data on that event
window.addEventListener('idex_swap_completed', reload);`}</CodeBlock>

    <H2 id="history-pagination">Pagination</H2>
    <p className="text-gray-600 text-sm leading-relaxed mb-3">
      The history list shows <Code>10</Code> records per page. Page controls appear only when
      there are more than 10 records. The header shows the total count and current page position
      (e.g. <Code>34 transactions · Page 2/4</Code>).
    </p>

    <Info>
      History is wallet-scoped. Only records matching the currently connected wallet address
      are fetched and displayed.
    </Info>
  </div>
);

// ── PAGE: Profile ─────────────────────────────────────────────────────────────
const profileDocs = (
  <div>
    <p className="text-gray-600 text-lg leading-relaxed mb-4">
      The Profile page lets you build a persistent on-chain identity tied to your wallet address
      and track your iDEX activity over time — all stored locally, no sign-up required.
    </p>

    <H2 id="profile-setup">Setting Up Your Profile</H2>
    <Steps items={[
      { title: 'Connect your wallet', desc: 'Profile data is keyed to your wallet address. Each address has its own independent profile.' },
      { title: 'Click ✏️ Edit', desc: 'Opens the edit modal from the profile card.' },
      { title: 'Choose an avatar', desc: 'Pick from 12 emoji avatars: 🦊 🐺 🦁 🐯 🐻 🦝 🐼 🦄 🐉 🤖 👾 🎭' },
      { title: 'Set a username', desc: 'Up to 32 characters. Press Enter or click Save to confirm. Defaults to "iDEX User".' },
    ]} />

    <H2 id="profile-storage">Where Profile Data Lives</H2>
    <p className="text-gray-600 text-sm leading-relaxed mb-3">
      Profile data (username + avatar) is stored in localStorage only — no server involved.
      The storage key is wallet-specific:
    </p>
    <CodeBlock>{`// Storage key format
\`idex_profile_\${address.toLowerCase()}\`

// Stored value
{ username: "CryptoWolf", avatar: "🐺" }`}</CodeBlock>
    <p className="text-gray-600 text-sm leading-relaxed">
      This means your profile is private to your browser. Clearing browser data will reset it.
    </p>

    <H2 id="profile-stats">Statistics Breakdown</H2>
    <Table
      headers={['Stat', "How it's calculated"]}
      rows={[
        ['Total Swaps', 'Count of all records in your swap history'],
        ['Volume (USD)', 'Sum of amountOut where tokenOut is USDC/USDT/DAI, or amountIn where tokenIn is a stablecoin. Shown as $XK for values over $1,000.'],
        ['Active Days', 'Number of unique calendar days (by UTC date string) on which at least one swap occurred'],
        ['First Transaction', 'The minimum timestamp across all history records, formatted as a full date in en-US locale'],
      ]}
    />

    <Callout icon="📌" title="Stats are derived from local history">
      Profile statistics are computed from the same history data shown on the History page.
      They update automatically each time you visit the Profile page or complete a new swap.
      If Supabase is unavailable, stats fall back to whatever is cached in localStorage.
    </Callout>
  </div>
);

// ── PAGE: Architecture ────────────────────────────────────────────────────────
const architectureDocs = (
  <div>
    <p className="text-gray-600 text-lg leading-relaxed mb-4">
      A complete technical overview of how iDEX Finance is built — stack, data flow,
      RPC strategy, and the deliberate decision to operate without a proprietary smart contract.
    </p>

    <H2 id="tech-stack">Tech Stack</H2>
    <Table
      headers={['Layer', 'Technology', 'Version']}
      rows={[
        ['Framework',        'Next.js (App Router, SSR enabled)',         '16.2.10'],
        ['Language',         'TypeScript',                                 '5.x'],
        ['Styling',          'Tailwind CSS v4',                           '4.x'],
        ['Blockchain reads', 'viem',                                       '2.x'],
        ['Wallet / hooks',   'wagmi',                                      '2.x'],
        ['Wallet UI',        'RainbowKit',                                 '2.x'],
        ['Server state',     'TanStack React Query',                       '5.x'],
        ['Database',         'Supabase (PostgreSQL)',                       '2.x'],
        ['RPC transport',    'viem fallback() — 4 public Base endpoints',  '—'],
      ]}
    />

    <H2 id="rpc-fallback">RPC Fallback Chain</H2>
    <p className="text-gray-600 text-sm leading-relaxed mb-3">
      All on-chain reads and transaction submissions use a <Code>viem fallback()</Code> transport
      that automatically retries on the next endpoint if the current one is rate-limited or down:
    </p>
    <CodeBlock>{`// lib/wagmi.ts
const baseTransport = fallback([
  http('https://base.llamarpc.com'),       // 1st — primary
  http('https://base-rpc.publicnode.com'), // 2nd
  http('https://1rpc.io/base'),            // 3rd
  http('https://mainnet.base.org'),        // 4th — last resort
]);`}</CodeBlock>
    <p className="text-gray-500 text-xs mt-1 mb-4">
      Failover is transparent to the user — they see no interruption if one endpoint goes down.
    </p>

    <H2 id="wallet-setup">Wallet & Provider Setup</H2>
    <p className="text-gray-600 text-sm leading-relaxed mb-3">
      The app is wrapped in a single <Code>Web3Provider</Code> component that composes wagmi,
      TanStack Query, and RainbowKit. The RainbowKit theme uses the iDEX orange accent
      (<Code>#f97316</Code>) and large border radius to match the app's design language.
    </p>
    <CodeBlock>{`// providers/Web3Provider.tsx
const idexTheme = lightTheme({
  accentColor: '#f97316',        // orange-500
  accentColorForeground: 'white',
  borderRadius: 'large',
  fontStack: 'system',
});`}</CodeBlock>

    <H2 id="no-contract">Why No Aggregator Contract?</H2>
    <p className="text-gray-600 text-sm leading-relaxed mb-4">
      Building and deploying a custom aggregator contract introduces audit requirements,
      upgrade complexity, and a new attack surface. iDEX deliberately avoids all of this:
    </p>
    <FeatureGrid items={[
      { icon: '✅', title: 'No audit required', desc: 'iDEX uses only Uniswap and PancakeSwap contracts — already audited by leading firms and battle-tested with billions in volume.' },
      { icon: '✅', title: 'No fund custody', desc: 'Tokens go directly wallet → DEX router → wallet. There is no intermediate address that could be drained.' },
      { icon: '✅', title: 'No upgrade risk', desc: 'No proxy contracts, no admin keys, no pausable functions. The routing logic lives entirely off-chain in the frontend.' },
      { icon: '⚠️', title: 'Trade-off: single-hop only', desc: 'The current architecture supports one DEX, one pool per swap. Multi-hop routes (e.g. TOKEN → ETH → USDC) require an aggregator contract and are not yet supported.' },
    ]} />
  </div>
);

// ── PAGE: Contract Addresses ──────────────────────────────────────────────────
const contractsDocs = (
  <div>
    <p className="text-gray-600 text-lg leading-relaxed mb-4">
      All on-chain addresses used by iDEX Finance. Every address is on <strong>Base Mainnet</strong> (Chain ID <Code>8453</Code>).
    </p>

    <Danger>
      These addresses are for <strong>Base Mainnet only</strong>. Never use testnet addresses in production —
      funds sent to the wrong network cannot be recovered.
    </Danger>

    <H2 id="tokens">Token Addresses</H2>
    <Table
      headers={['Token', 'Symbol', 'Decimals', 'Address']}
      rows={[
        ['Ethereum (native sentinel)', 'ETH',  '18', '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE'],
        ['Wrapped Ether',              'WETH', '18', '0x4200000000000000000000000000000000000006'],
        ['USD Coin',                   'USDC', '6',  '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913'],
        ['Dai Stablecoin',             'DAI',  '18', '0x50c5725949A6F0c72E6C4a641F24049A917DB0Cb'],
        ['Tether USD',                 'USDT', '6',  '0xfde4C96c8593536E31F229EA8f37b2ADa2699bb2'],
      ]}
    />
    <p className="text-xs text-gray-400 mb-6">
      The ETH sentinel address (<Code>0xEeee…EEEE</Code>) is never deployed on-chain.
      It's a convention used by iDEX to identify native ETH in routing and execution logic.
    </p>

    <H3>Uniswap V3 — Base Mainnet</H3>
    <Table
      headers={['Contract', 'Address']}
      rows={[
        ['SwapRouter02',  '0x2626664c2603336E57B271c5C0b26F421741e481'],
        ['QuoterV2',      '0x3d4e44Eb1374240CE5F1B871ab261CD16335B76a'],
        ['Factory',       '0x33128a8fC17869897dcE68Ed026d694621f6FDfD'],
      ]}
    />
    <p className="text-xs text-gray-400 mb-6">
      Fee tiers: <Code>100</Code> (0.01%) · <Code>500</Code> (0.05%) · <Code>3000</Code> (0.30%) · <Code>10000</Code> (1.00%)
    </p>

    <H3>PancakeSwap V3 — Base Mainnet</H3>
    <Table
      headers={['Contract', 'Address']}
      rows={[
        ['SmartRouter (V3)', '0x1b81D678ffb9C0263b24A97847620C99d213eB14'],
        ['QuoterV2',         '0xB048Bbc1Ee6b733FFfCFb9e9CeF7375518e25997'],
        ['Factory',          '0x0BFbCF9fa4f9C56B0F40a671Ad40E0805A091865'],
      ]}
    />
    <p className="text-xs text-gray-400 mb-6">
      Same fee tiers as Uniswap V3. PancakeSwap V3 requires the deadline inside the params struct — iDEX handles this automatically.
    </p>

    <H3>WETH9</H3>
    <Table
      headers={['Contract', 'Address']}
      rows={[
        ['WETH9 (deposit / withdraw)', '0x4200000000000000000000000000000000000006'],
      ]}
    />
    <p className="text-xs text-gray-400 mb-2">
      Used only for ETH ↔ WETH wrap/unwrap operations. The same address as WETH token.
    </p>

    <Info>
      You can verify any of these addresses on{' '}
      <a href="https://basescan.org" target="_blank" rel="noopener noreferrer" className="text-orange-500 hover:underline">basescan.org</a>{' '}
      or cross-reference with the official Uniswap and PancakeSwap deployment docs.
    </Info>
  </div>
);

// ── PAGE: Security ────────────────────────────────────────────────────────────
const securityDocs = (
  <div>
    <p className="text-gray-600 text-lg leading-relaxed mb-4">
      Security is embedded into iDEX's architecture at the design level — not bolted on afterward.
      Here's what protects you on every trade.
    </p>

    <H2 id="by-design">Built-In Protections</H2>
    <div className="space-y-3 my-4">
      {[
        { icon: '🔐', title: 'No proprietary smart contract', desc: 'iDEX deploys nothing on-chain. There is no aggregator contract, no fee vault, no proxy. Your funds are never routed through an address controlled by iDEX.' },
        { icon: '🎯', title: 'Direct DEX router execution', desc: 'Every transaction is sent directly to Uniswap\'s SwapRouter02 or PancakeSwap\'s SmartRouter — contracts that have processed billions of dollars and survived years of adversarial conditions.' },
        { icon: '🛡️', title: 'amountOutMinimum is always set', desc: 'Slippage protection is non-optional. iDEX calculates amountOutMinimum from your slippage setting and includes it in every swap. The router will revert rather than give you less than this amount.' },
        { icon: '⏱️', title: '20-minute deadline on every swap', desc: 'All swap transactions include a deadline of now + 20 minutes. If the tx sits in the mempool too long without confirmation, the router automatically rejects it when it does land.' },
        { icon: '🌐', title: 'Network guard', desc: 'The app verifies your wallet is on Base Mainnet (Chain ID 8453) before enabling any swap interaction. Wrong network = disabled UI.' },
      ].map(({ icon, title, desc }) => (
        <div key={title} className="flex gap-4 bg-orange-50/50 border border-orange-100 rounded-2xl p-4 text-sm">
          <span className="text-2xl shrink-0 mt-0.5">{icon}</span>
          <div>
            <p className="font-bold text-gray-800 mb-1">{title}</p>
            <p className="text-gray-500 leading-relaxed">{desc}</p>
          </div>
        </div>
      ))}
    </div>

    <H2 id="approval-model">Token Approval Model</H2>
    <p className="text-gray-600 text-sm leading-relaxed mb-3">
      iDEX requests <Code>approve(router, maxUint256)</Code> — infinite approval — the first time
      you swap an ERC-20 through a given router. This is the same model used by Uniswap's
      official interface and saves you paying approval gas on every swap.
    </p>
    <Warning>
      Infinite approval means that router contract could theoretically move all of that token
      from your wallet in the future. You are trusting Uniswap's and PancakeSwap's router contracts,
      not iDEX. To revoke approvals, use{' '}
      <a href="https://revoke.cash" target="_blank" rel="noopener noreferrer" className="underline font-medium">revoke.cash</a>.
    </Warning>

    <H2 id="user-responsibilities">Your Responsibilities</H2>
    <ul className="list-none space-y-2 my-4 text-sm text-gray-600">
      {[
        'Confirm you are on Base Mainnet before swapping. iDEX checks this but your wallet is the final guard.',
        'Research tokens before trading — iDEX applies no scam-token filter. Any ERC-20 address can be pasted into the token selector.',
        'Use sensible slippage — too high invites sandwich attacks, too low causes unnecessary reverts.',
        'Verify transaction details in your wallet popup before approving — amount, token, and recipient router address.',
      ].map((item) => (
        <li key={item} className="flex gap-2">
          <span className="text-orange-400 shrink-0 mt-0.5">•</span>
          <span>{item}</span>
        </li>
      ))}
    </ul>
  </div>
);

// ── PAGE: FAQ ─────────────────────────────────────────────────────────────────
const faqDocs = (
  <div>
    <p className="text-gray-600 text-lg leading-relaxed mb-6">
      Common questions about using iDEX Finance.
    </p>
    <div className="space-y-3">
      {[
        ['Is iDEX a DEX?',
          'No. iDEX is a DEX aggregator — it has no liquidity pools of its own. It reads prices from Uniswap V3 and PancakeSwap V3 and routes your swap to whichever offers the better rate.'],
        ['Does iDEX charge a fee?',
          'No. iDEX does not add any fee on top of the DEX\'s native swap fee. You pay only the pool fee (e.g. 0.05% or 0.30%) and Base network gas.'],
        ['Which wallets are supported?',
          'Any wallet compatible with RainbowKit: MetaMask, Coinbase Wallet, Rabby, Rainbow, Trust Wallet, and any WalletConnect v2 wallet.'],
        ['Why do I need to approve a token?',
          'DEX routers need ERC-20 approval before they can move tokens from your wallet. iDEX requests this once per token per router (infinite approval). Native ETH never needs approval.'],
        ['Can I swap any token?',
          'You can paste any ERC-20 address into the token selector. However, a route will only appear if Uniswap V3 or PancakeSwap V3 has a pool for that pair on Base. iDEX does not filter scam tokens — always research what you\'re buying.'],
        ['Why did my swap revert?',
          'Most common causes: (1) slippage too low — price moved between quote and execution, try 1%; (2) transaction deadline expired; (3) insufficient ETH for gas. Check History → BaseScan for the exact on-chain revert reason.'],
        ['Is multi-hop routing supported?',
          'Not yet. iDEX currently supports single-hop routes only — one pool on one DEX per swap. A swap like TOKEN → ETH → USDC in a single transaction requires an aggregator contract and is planned for a future version.'],
        ['Why is my Portfolio balance slightly different from BaseScan?',
          'ETH price is fetched from CoinGecko on page load and may be a few seconds stale. Stablecoin prices are fixed at $1.00 rather than fetched live. Refresh the page for the latest data.'],
        ['Is my profile data private?',
          'Yes. Your username and avatar are stored only in your browser\'s localStorage — nothing is sent to a server. Clearing browser storage will reset your profile.'],
        ['What happens if Supabase is down?',
          'iDEX falls back to localStorage automatically. Your recent swaps (up to 100) are always cached locally so history and profile stats continue to work offline.'],
      ].map(([q, a]) => (
        <details key={String(q)} className="group bg-surface border border-orange-100 rounded-2xl overflow-hidden">
          <summary className="flex items-center justify-between px-5 py-4 cursor-pointer font-semibold text-gray-800 text-sm hover:bg-orange-50 transition-colors list-none">
            {q}
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-orange-500 group-open:rotate-180 transition-transform shrink-0 ml-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </summary>
          <div className="px-5 pb-4 text-sm text-gray-600 leading-relaxed border-t border-orange-50 pt-3">{a}</div>
        </details>
      ))}
    </div>
  </div>
);

// ── Sidebar config ────────────────────────────────────────────────────────────
interface Section { id: string; title: string; }
interface DocPage { id: string; label: string; group: string; sections: Section[]; content: React.ReactNode; }

const PAGES: DocPage[] = [
  {
    id: 'what-is-idex', label: 'What is iDEX?', group: 'Overview',
    sections: [
      { id: 'key-features',   title: 'Key Features' },
      { id: 'how-it-fits',    title: 'How it Fits' },
      { id: 'modules',        title: 'App Modules' },
    ],
    content: whatIsIDEX,
  },
  {
    id: 'getting-started', label: 'Getting Started', group: 'Overview',
    sections: [
      { id: 'connect-wallet', title: 'Connect Wallet' },
      { id: 'wallet-menu',    title: 'Wallet Menu' },
      { id: 'first-swap',     title: 'First Swap' },
      { id: 'slippage-guide', title: 'Slippage Guide' },
    ],
    content: gettingStarted,
  },
  {
    id: 'swap', label: 'Swap', group: 'Features',
    sections: [
      { id: 'price-discovery',  title: 'Price Discovery' },
      { id: 'fee-tiers',        title: 'Fee Tiers' },
      { id: 'native-eth',       title: 'Native ETH' },
      { id: 'execution-steps',  title: 'Execution Steps' },
      { id: 'error-messages',   title: 'Error Messages' },
    ],
    content: swapDocs,
  },
  {
    id: 'portfolio', label: 'Portfolio', group: 'Features',
    sections: [
      { id: 'balance-fetching',  title: 'Balance Fetching' },
      { id: 'usd-pricing',       title: 'USD Pricing' },
      { id: 'portfolio-cards',   title: 'Dashboard Cards' },
      { id: 'supported-tokens',  title: 'Supported Tokens' },
    ],
    content: portfolioDocs,
  },
  {
    id: 'history', label: 'History', group: 'Features',
    sections: [
      { id: 'storage-strategy', title: 'Storage Strategy' },
      { id: 'record-schema',    title: 'Record Schema' },
      { id: 'live-updates',     title: 'Live Updates' },
      { id: 'history-pagination', title: 'Pagination' },
    ],
    content: historyDocs,
  },
  {
    id: 'profile', label: 'Profile', group: 'Features',
    sections: [
      { id: 'profile-setup',   title: 'Setting Up' },
      { id: 'profile-storage', title: 'Storage' },
      { id: 'profile-stats',   title: 'Statistics' },
    ],
    content: profileDocs,
  },
  {
    id: 'architecture', label: 'Architecture', group: 'Reference',
    sections: [
      { id: 'tech-stack',   title: 'Tech Stack' },
      { id: 'rpc-fallback', title: 'RPC Fallback' },
      { id: 'wallet-setup', title: 'Wallet Setup' },
      { id: 'no-contract',  title: 'No Contract Design' },
    ],
    content: architectureDocs,
  },
  {
    id: 'contracts', label: 'Contract Addresses', group: 'Reference',
    sections: [
      { id: 'tokens', title: 'Token Addresses' },
    ],
    content: contractsDocs,
  },
  {
    id: 'security', label: 'Security', group: 'Reference',
    sections: [
      { id: 'by-design',             title: 'Built-In Protections' },
      { id: 'approval-model',        title: 'Approval Model' },
      { id: 'user-responsibilities', title: 'Your Responsibilities' },
    ],
    content: securityDocs,
  },
  {
    id: 'faq', label: 'FAQ', group: 'Reference',
    sections: [],
    content: faqDocs,
  },
];

// ── Main Layout ───────────────────────────────────────────────────────────────
export function DocsLayout() {
  const [activePage, setActivePage] = useState('what-is-idex');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const page   = PAGES.find((p) => p.id === activePage) ?? PAGES[0];
  const groups = Array.from(new Set(PAGES.map((p) => p.group)));

  const goTo = (id: string) => {
    setActivePage(id);
    setSidebarOpen(false);
    window.scrollTo({ top: 0 });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex gap-8 relative">

        {/* Mobile toggle */}
        <button
          onClick={() => setSidebarOpen((v) => !v)}
          className="lg:hidden fixed bottom-6 left-6 z-40 bg-orange-500 text-white rounded-full px-4 py-2.5 text-sm font-semibold shadow-lg flex items-center gap-2"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" />
          </svg>
          Menu
        </button>

        {sidebarOpen && (
          <div className="fixed inset-0 bg-black/30 z-30 lg:hidden" onClick={() => setSidebarOpen(false)} />
        )}

        {/* Left sidebar */}
        <aside className={`fixed lg:sticky top-0 lg:top-20 left-0 h-screen lg:h-[calc(100vh-5rem)] w-56 shrink-0 z-40 lg:z-auto bg-surface lg:bg-transparent border-r lg:border-0 border-orange-100 overflow-y-auto transition-transform duration-300 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'} pt-16 lg:pt-0 px-4 lg:px-0`}>
          {groups.map((group) => (
            <div key={group} className="mb-5">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 px-2">{group}</p>
              {PAGES.filter((p) => p.group === group).map((p) => (
                <button
                  key={p.id}
                  onClick={() => goTo(p.id)}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-all mb-0.5 ${
                    activePage === p.id
                      ? 'bg-orange-100 text-orange-700 font-semibold'
                      : 'text-gray-600 hover:bg-orange-50 hover:text-orange-600'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          ))}
        </aside>

        {/* Main content */}
        <main className="flex-1 min-w-0">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">{page.label}</h1>
          <div className="w-12 h-1 bg-gradient-to-r from-orange-500 to-amber-500 rounded-full mb-6" />
          <div className="text-gray-600 leading-relaxed">{page.content}</div>

          {/* Prev / Next */}
          <div className="mt-12 pt-6 border-t border-orange-100 flex items-center justify-between">
            {(() => {
              const idx  = PAGES.findIndex((p) => p.id === activePage);
              const prev = PAGES[idx - 1];
              const next = PAGES[idx + 1];
              return (
                <>
                  {prev ? (
                    <button onClick={() => goTo(prev.id)} className="flex items-center gap-2 text-sm text-orange-600 hover:text-orange-700 font-semibold">
                      ← {prev.label}
                    </button>
                  ) : <div />}
                  {next ? (
                    <button onClick={() => goTo(next.id)} className="flex items-center gap-2 text-sm text-orange-600 hover:text-orange-700 font-semibold">
                      {next.label} →
                    </button>
                  ) : <div />}
                </>
              );
            })()}
          </div>
        </main>

        {/* Right "On this page" */}
        {page.sections.length > 0 && (
          <aside className="hidden xl:block w-44 shrink-0 sticky top-20 h-fit">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">On this page</p>
            <ul className="space-y-1.5">
              {page.sections.map((s) => (
                <li key={s.id}>
                  <button
                    onClick={() => document.getElementById(s.id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
                    className="text-xs text-gray-500 hover:text-orange-500 transition-colors text-left leading-snug"
                  >
                    {s.title}
                  </button>
                </li>
              ))}
            </ul>
          </aside>
        )}
      </div>
    </div>
  );
}
