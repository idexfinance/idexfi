'use client';

import { useState } from 'react';
import { useAccount, usePublicClient, useWalletClient } from 'wagmi';
import { parseUnits, maxUint256, encodeFunctionData, concat } from 'viem';
import { Attribution } from 'ox/erc8021';
import { calculateMinAmountOut } from '@/lib/routing';
import { executeSwap } from '@/lib/swap-executor';
import { NATIVE_ETH, RouteInfo } from '@/lib/contracts';
import ERC20ABI from '@/lib/abis/ERC20.json';
import { saveSwap } from '@/lib/history';

// Builder code suffix for approve transactions
const BUILDER_CODE_SUFFIX = Attribution.toDataSuffix({
  codes: ['bc_ri4d72mx'],
}) as `0x${string}`;

interface SwapButtonProps {
  tokenIn: string;
  tokenOut: string;
  tokenInSymbol: string;
  tokenOutSymbol: string;
  amountIn: string;
  amountOut: string;
  decimalsIn: number;
  slippage: number;
  bestRoute: RouteInfo | null;
  disabled: boolean;
  onSwapSuccess?: () => void;
}

enum SwapStep {
  IDLE       = 'idle',
  APPROVING  = 'approving',
  SWAPPING   = 'swapping',
  CONFIRMING = 'confirming',
  SUCCESS    = 'success',
  ERROR      = 'error',
}

export function SwapButton({
  tokenIn,
  tokenOut,
  tokenInSymbol,
  tokenOutSymbol,
  amountIn,
  amountOut,
  decimalsIn,
  slippage,
  bestRoute,
  disabled,
  onSwapSuccess,
}: SwapButtonProps) {
  const { address, isConnected } = useAccount();
  const publicClient = usePublicClient();
  const { data: walletClient } = useWalletClient();

  const [step, setStep]     = useState<SwapStep>(SwapStep.IDLE);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [error, setError]   = useState<string | null>(null);

  const isNativeETH = tokenIn.toLowerCase() === NATIVE_ETH.toLowerCase();

  const handleSwap = async () => {
    if (!publicClient || !walletClient || !address || !bestRoute) return;

    // Clear only error/previous state, don't reset to IDLE yet
    setError(null);
    setTxHash(null);
    setStep(SwapStep.APPROVING); // show first step immediately

    try {
      const amount = parseUnits(amountIn, decimalsIn);

      // 1. Approve if needed
      if (!isNativeETH && bestRoute.dex !== 'weth-wrap') {
        const allowance = await publicClient.readContract({
          address: tokenIn as `0x${string}`,
          abi: ERC20ABI,
          functionName: 'allowance',
          args: [address, bestRoute.routerAddress as `0x${string}`],
        }) as bigint;

        if (allowance < amount) {
          setStep(SwapStep.APPROVING);
          const approveData = encodeFunctionData({
            abi: ERC20ABI,
            functionName: 'approve',
            args: [bestRoute.routerAddress as `0x${string}`, maxUint256],
          });
          const approveDataWithBuilder = concat([approveData, BUILDER_CODE_SUFFIX]) as `0x${string}`;
          const approveHash = await walletClient.sendTransaction({
            to: tokenIn as `0x${string}`,
            data: approveDataWithBuilder,
          } as any);
          await publicClient.waitForTransactionReceipt({ hash: approveHash });
        }
      }

      // 2. Execute swap
      const minAmountOut = calculateMinAmountOut(bestRoute.amountOut, slippage);
      setStep(SwapStep.SWAPPING);

      const swapHash = await executeSwap(
        walletClient,
        bestRoute,
        tokenIn as `0x${string}`,
        tokenOut as `0x${string}`,
        amount,
        minAmountOut,
        address
      );

      setTxHash(swapHash);
      setStep(SwapStep.CONFIRMING);

      // 3. Wait for on-chain confirmation
      await publicClient.waitForTransactionReceipt({ hash: swapHash });

      setStep(SwapStep.SUCCESS);

      // Save to localStorage + Supabase
      await saveSwap(address, {
        hash: swapHash,
        tokenIn: tokenInSymbol,
        tokenOut: tokenOutSymbol,
        amountIn,
        amountOut,
        timestamp: Date.now(),
      });
      // Notify history page
      window.dispatchEvent(new Event('idex_swap_completed'));

      // Reset UI after 2.5s — let toast be visible
      setTimeout(() => {
        onSwapSuccess?.();
      }, 2500);

    } catch (err) {
      console.error('Swap error:', err);
      setError(humanizeError(err instanceof Error ? err.message : String(err)));
      setStep(SwapStep.ERROR);
    }
  };

  const humanizeError = (msg: string): string => {
    if (msg.includes('insufficient funds'))   return 'Insufficient ETH for gas.';
    if (msg.includes('User rejected') || msg.includes('User denied')) return 'Transaction rejected in wallet.';
    if (msg.includes('execution reverted'))   return 'Swap reverted — try increasing slippage.';
    if (msg.includes('deadline'))             return 'Transaction expired. Please try again.';
    return msg.length > 80 ? msg.slice(0, 80) + '…' : msg;
  };

  const isProcessing = step === SwapStep.APPROVING || step === SwapStep.SWAPPING || step === SwapStep.CONFIRMING;

  if (!isConnected) {
    return (
      <button disabled className="w-full py-4 bg-gray-100/10 text-gray-500 rounded-full font-bold text-base cursor-not-allowed border border-gray-100/10">
        Connect Wallet
      </button>
    );
  }

  if (disabled) {
    return (
      <button disabled className="w-full py-4 bg-gray-100/10 text-gray-500 rounded-full font-bold text-base cursor-not-allowed border border-gray-100/10">
        {!amountIn || parseFloat(amountIn) <= 0 ? 'Enter an amount' : 'Finding best route…'}
      </button>
    );
  }

  return (
    <>
      <button
        onClick={handleSwap}
        disabled={isProcessing}
        className="w-full py-4 rounded-full font-bold text-base transition-all disabled:opacity-60 disabled:cursor-not-allowed bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white shadow-lg shadow-orange-500/20"
      >
        {isProcessing ? (
          <span className="flex items-center justify-center gap-2">
            <span className="h-4 w-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
            {step === SwapStep.APPROVING  ? 'Approving…'
              : step === SwapStep.SWAPPING   ? 'Confirm in wallet…'
              : 'Confirming…'}
          </span>
        ) : 'Swap'}
      </button>

      {/* ── Fixed toasts ── */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3 w-80 pointer-events-none">

        {/* Transaction in progress */}
        {isProcessing && (
          <div className="pointer-events-auto flex items-center gap-3 bg-[#1E2038] border border-orange-400/30 shadow-2xl rounded-2xl px-4 py-3.5">
            <span className="h-5 w-5 rounded-full border-2 border-orange-400 border-t-transparent animate-spin shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-800">
                {step === SwapStep.APPROVING  && 'Approving token…'}
                {step === SwapStep.SWAPPING   && 'Confirm in wallet…'}
                {step === SwapStep.CONFIRMING && 'Confirming on-chain…'}
              </p>
              <p className="text-xs text-gray-500 mt-0.5">Please wait</p>
            </div>
          </div>
        )}

        {/* Success */}
        {step === SwapStep.SUCCESS && txHash && (
          <div className="pointer-events-auto flex items-start gap-3 bg-[#1E2038] border border-green-500/40 shadow-2xl rounded-2xl px-4 py-3.5">
            <div className="shrink-0 w-9 h-9 rounded-full bg-green-500/15 border border-green-500/30 flex items-center justify-center mt-0.5">
              <svg className="w-4 h-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-gray-800">Swap Confirmed ✓</p>
              <a
                href={`https://basescan.org/tx/${txHash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-orange-400 hover:text-orange-300 font-medium mt-1 flex items-center gap-1"
              >
                View on BaseScan
                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </a>
            </div>
            <button
              onClick={() => { setStep(SwapStep.IDLE); setTxHash(null); }}
              className="text-gray-600 hover:text-gray-400 shrink-0 mt-0.5"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}

        {/* Error / Rejected */}
        {step === SwapStep.ERROR && error && (
          <div className="pointer-events-auto flex items-start gap-3 bg-[#1E2038] border border-red-500/40 shadow-2xl rounded-2xl px-4 py-3.5">
            <div className="shrink-0 w-9 h-9 rounded-full bg-red-500/15 border border-red-500/30 flex items-center justify-center mt-0.5">
              <svg className="w-4 h-4 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-gray-800">Transaction Failed ✗</p>
              <p className="text-xs text-gray-500 mt-0.5 break-words">{error}</p>
              <button
                onClick={() => { setError(null); setStep(SwapStep.IDLE); }}
                className="text-xs text-orange-400 hover:text-orange-300 font-medium mt-1"
              >
                Try again
              </button>
            </div>
            <button
              onClick={() => { setError(null); setStep(SwapStep.IDLE); }}
              className="text-gray-600 hover:text-gray-400 shrink-0 mt-0.5"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}
      </div>
    </>
  );
}
