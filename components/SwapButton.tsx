'use client';

import { useState } from 'react';
import { useAccount, usePublicClient } from 'wagmi';
import { useWriteContract, useSendTransaction } from 'wagmi';
import { parseUnits, maxUint256, encodeFunctionData, concat } from 'viem';
import { calculateMinAmountOut } from '@/lib/routing';
import { NATIVE_ETH, WETH_ADDRESS, UNISWAP_V3, PANCAKESWAP_V3, RouteInfo } from '@/lib/contracts';
import { getDeadline } from '@/lib/routing';
import ERC20ABI from '@/lib/abis/ERC20.json';
import SwapRouter02ABI from '@/lib/abis/SwapRouter02.json';
import PancakeSwapV3RouterABI from '@/lib/abis/PancakeSwapV3Router.json';
import WETH9ABI from '@/lib/abis/WETH9.json';
import { saveSwap } from '@/lib/history';

// ── ERC-8021 Builder Code Attribution ────────────────────────────────────────
// Format: 8021 + builder_code + 8021 (UTF-8 encoded as hex)
// Produces: "8021bc_ri4d72mx8021" in calldata — readable in Basescan Input Data → UTF-8
const BUILDER_CODE_SUFFIX: `0x${string}` = `0x${Buffer.from('8021bc_ri4d72mx8021', 'utf8').toString('hex')}`;

function appendBuilderCode(data: `0x${string}`): `0x${string}` {
  return concat([data, BUILDER_CODE_SUFFIX]);
}

// ── Props ─────────────────────────────────────────────────────────────────────
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

  // wagmi hooks — sendTransactionAsync is used for all txs (builder code requires raw data)
  const { writeContractAsync } = useWriteContract();
  const { sendTransactionAsync } = useSendTransaction();

  const [step, setStep]     = useState<SwapStep>(SwapStep.IDLE);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [error, setError]   = useState<string | null>(null);

  // ── writeWithBuilderCode ─────────────────────────────────────────────────
  // Encodes calldata from ABI, appends builder suffix, sends as raw sendTransaction.
  // writeContractAsync is NOT used for swaps because wagmi re-encodes data
  // internally and strips any custom appended bytes.
  async function writeWithBuilderCode(params: {
    address: `0x${string}`;
    abi: readonly unknown[];
    functionName: string;
    args?: readonly unknown[];
    value?: bigint;
    gas?: bigint;
  }) {
    // Step 1 — encode calldata from ABI
    const data = encodeFunctionData({
      abi: params.abi,
      functionName: params.functionName,
      args: params.args ?? [],
    });

    // Step 2 — append builder code suffix
    const dataWithBuilder = appendBuilderCode(data);

    // Step 3 — send raw transaction (data is preserved exactly as-is)
    return sendTransactionAsync({
      to: params.address,
      data: dataWithBuilder,
      value: params.value ?? 0n,
      gas: params.gas,
    });
  }

  // ── Main swap handler ────────────────────────────────────────────────────
  const handleSwap = async () => {
    if (!publicClient || !address || !bestRoute) return;

    setError(null);
    setTxHash(null);
    setStep(SwapStep.APPROVING);

    try {
      const amount       = parseUnits(amountIn, decimalsIn);
      const minAmountOut = calculateMinAmountOut(bestRoute.amountOut, slippage);
      const deadline     = getDeadline(20);
      const isNativeETH  = tokenIn.toLowerCase() === NATIVE_ETH.toLowerCase();
      const isEthIn      = isNativeETH;
      const isEthOut     = tokenOut.toLowerCase() === NATIVE_ETH.toLowerCase();
      const actualIn     = isEthIn  ? WETH_ADDRESS : tokenIn;
      const actualOut    = isEthOut ? WETH_ADDRESS : tokenOut;

      // ── 1. Approve (ERC-20 only, not needed for native ETH or WETH wrap) ──
      if (!isNativeETH && bestRoute.dex !== 'weth-wrap') {
        const allowance = await publicClient.readContract({
          address: tokenIn as `0x${string}`,
          abi: ERC20ABI,
          functionName: 'allowance',
          args: [address, bestRoute.routerAddress as `0x${string}`],
        }) as bigint;

        if (allowance < amount) {
          setStep(SwapStep.APPROVING);
          // Approve also uses writeWithBuilderCode for attribution
          const approveHash = await writeWithBuilderCode({
            address: tokenIn as `0x${string}`,
            abi: ERC20ABI,
            functionName: 'approve',
            args: [bestRoute.routerAddress as `0x${string}`, maxUint256],
          });
          await publicClient.waitForTransactionReceipt({ hash: approveHash });
        }
      }

      // ── 2. Swap ───────────────────────────────────────────────────────────
      setStep(SwapStep.SWAPPING);
      let swapHash: `0x${string}`;

      // ── WETH wrap / unwrap ──
      if (bestRoute.dex === 'weth-wrap') {
        const isWrap = isNativeETH;
        swapHash = await writeWithBuilderCode(
          isWrap
            ? { address: WETH_ADDRESS as `0x${string}`, abi: WETH9ABI, functionName: 'deposit', value: amount, gas: 60000n }
            : { address: WETH_ADDRESS as `0x${string}`, abi: WETH9ABI, functionName: 'withdraw', args: [amount], gas: 60000n }
        );

      // ── Uniswap V3 ──
      } else if (bestRoute.dex === 'uniswap-v3') {
        const params = {
          tokenIn: actualIn,
          tokenOut: actualOut,
          fee: bestRoute.feeTier!,
          recipient: isEthOut ? bestRoute.routerAddress as `0x${string}` : address,
          amountIn: amount,
          amountOutMinimum: minAmountOut,
          sqrtPriceLimitX96: 0n,
        };

        if (isEthOut) {
          // multicall: exactInputSingle + unwrapWETH9
          const swapData = encodeFunctionData({
            abi: SwapRouter02ABI,
            functionName: 'exactInputSingle',
            args: [params],
          });
          const unwrapData = encodeFunctionData({
            abi: SwapRouter02ABI,
            functionName: 'unwrapWETH9',
            args: [minAmountOut, address],
          });
          swapHash = await writeWithBuilderCode({
            address: UNISWAP_V3.SwapRouter02 as `0x${string}`,
            abi: SwapRouter02ABI,
            functionName: 'multicall',
            args: [[swapData, unwrapData]],
            value: isEthIn ? amount : 0n,
          });
        } else {
          swapHash = await writeWithBuilderCode({
            address: UNISWAP_V3.SwapRouter02 as `0x${string}`,
            abi: SwapRouter02ABI,
            functionName: 'exactInputSingle',
            args: [params],
            value: isEthIn ? amount : 0n,
          });
        }

      // ── PancakeSwap V3 ──
      } else if (bestRoute.dex === 'pancakeswap-v3') {
        const params = {
          tokenIn: actualIn,
          tokenOut: actualOut,
          fee: bestRoute.feeTier!,
          recipient: isEthOut ? bestRoute.routerAddress as `0x${string}` : address,
          deadline,
          amountIn: amount,
          amountOutMinimum: minAmountOut,
          sqrtPriceLimitX96: 0n,
        };

        if (isEthOut) {
          const swapData = encodeFunctionData({
            abi: PancakeSwapV3RouterABI,
            functionName: 'exactInputSingle',
            args: [params],
          });
          const unwrapData = encodeFunctionData({
            abi: PancakeSwapV3RouterABI,
            functionName: 'unwrapWETH9',
            args: [minAmountOut, address],
          });
          swapHash = await writeWithBuilderCode({
            address: PANCAKESWAP_V3.SwapRouter as `0x${string}`,
            abi: PancakeSwapV3RouterABI,
            functionName: 'multicall',
            args: [[swapData, unwrapData]],
            value: isEthIn ? amount : 0n,
          });
        } else {
          swapHash = await writeWithBuilderCode({
            address: PANCAKESWAP_V3.SwapRouter as `0x${string}`,
            abi: PancakeSwapV3RouterABI,
            functionName: 'exactInputSingle',
            args: [params],
            value: isEthIn ? amount : 0n,
          });
        }

      } else {
        throw new Error(`Unsupported DEX: ${bestRoute.dex}`);
      }

      setTxHash(swapHash);
      setStep(SwapStep.CONFIRMING);

      // ── 3. Wait for confirmation ──
      await publicClient.waitForTransactionReceipt({ hash: swapHash });
      setStep(SwapStep.SUCCESS);

      // ── 4. Save record ──
      await saveSwap(address, {
        hash: swapHash,
        tokenIn: tokenInSymbol,
        tokenOut: tokenOutSymbol,
        amountIn,
        amountOut,
        timestamp: Date.now(),
      });
      window.dispatchEvent(new Event('idex_swap_completed'));

      setTimeout(() => { onSwapSuccess?.(); }, 2500);

    } catch (err) {
      console.error('Swap error:', err);
      setError(humanizeError(err instanceof Error ? err.message : String(err)));
      setStep(SwapStep.ERROR);
    }
  };

  const humanizeError = (msg: string): string => {
    if (msg.includes('insufficient funds'))                          return 'Insufficient ETH for gas.';
    if (msg.includes('User rejected') || msg.includes('User denied')) return 'Transaction rejected in wallet.';
    if (msg.includes('execution reverted'))                          return 'Swap reverted — try increasing slippage.';
    if (msg.includes('deadline'))                                    return 'Transaction expired. Please try again.';
    return msg.length > 80 ? msg.slice(0, 80) + '…' : msg;
  };

  const isProcessing = [SwapStep.APPROVING, SwapStep.SWAPPING, SwapStep.CONFIRMING].includes(step);

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

        {/* In progress */}
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
              <a href={`https://basescan.org/tx/${txHash}`} target="_blank" rel="noopener noreferrer"
                className="text-xs text-orange-400 hover:text-orange-300 font-medium mt-1 flex items-center gap-1">
                View on BaseScan
                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </a>
            </div>
            <button onClick={() => { setStep(SwapStep.IDLE); setTxHash(null); }} className="text-gray-600 hover:text-gray-400 shrink-0 mt-0.5">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}

        {/* Error */}
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
              <button onClick={() => { setError(null); setStep(SwapStep.IDLE); }} className="text-xs text-orange-400 hover:text-orange-300 font-medium mt-1">
                Try again
              </button>
            </div>
            <button onClick={() => { setError(null); setStep(SwapStep.IDLE); }} className="text-gray-600 hover:text-gray-400 shrink-0 mt-0.5">
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
