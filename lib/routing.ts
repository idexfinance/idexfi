import { PublicClient, parseUnits, Address } from 'viem';
import {
  UNISWAP_V3,
  PANCAKESWAP_V3,
  UNISWAP_V3_FEE_TIERS,
  RouteInfo,
  NATIVE_ETH,
  WETH_ADDRESS,
} from './contracts';

import QuoterV2ABI from './abis/QuoterV2.json';

/**
 * Fetches quotes in parallel from Uniswap V3 and PancakeSwap V3.
 * Converts native ETH → WETH for pool queries.
 */
export async function getAllQuotes(
  client: PublicClient,
  tokenIn: Address,
  tokenOut: Address,
  amountIn: string,
  decimalsIn: number = 18
): Promise<RouteInfo[]> {
  const amount = parseUnits(amountIn, decimalsIn);

  // ETH ↔ WETH: 1:1, no fee
  const isETHtoWETH =
    tokenIn.toLowerCase() === NATIVE_ETH.toLowerCase() &&
    tokenOut.toLowerCase() === WETH_ADDRESS.toLowerCase();
  const isWETHtoETH =
    tokenIn.toLowerCase() === WETH_ADDRESS.toLowerCase() &&
    tokenOut.toLowerCase() === NATIVE_ETH.toLowerCase();

  if (isETHtoWETH || isWETHtoETH) {
    return [{ dex: 'weth-wrap', amountOut: amount, routerAddress: WETH_ADDRESS }];
  }

  // Use WETH for pool queries when native ETH is involved
  const quoteTokenIn  = tokenIn.toLowerCase()  === NATIVE_ETH.toLowerCase() ? WETH_ADDRESS : tokenIn;
  const quoteTokenOut = tokenOut.toLowerCase() === NATIVE_ETH.toLowerCase() ? WETH_ADDRESS : tokenOut;

  const routes: RouteInfo[] = [];

  // 1. Uniswap V3 — 4 fee tiers in parallel
  const uniswapPromises = UNISWAP_V3_FEE_TIERS.map(async (feeTier) => {
    try {
      const result = await client.readContract({
        address: UNISWAP_V3.QuoterV2 as `0x${string}`,
        abi: QuoterV2ABI,
        functionName: 'quoteExactInputSingle',
        args: [{
          tokenIn: quoteTokenIn,
          tokenOut: quoteTokenOut,
          amountIn: amount,
          fee: feeTier,
          sqrtPriceLimitX96: 0n,
        }],
      });
      const [amountOut, , , gasEstimate] = result as [bigint, bigint, number, bigint];
      if (amountOut > 0n) {
        routes.push({
          dex: 'uniswap-v3',
          amountOut,
          routerAddress: UNISWAP_V3.SwapRouter02,
          quoterAddress: UNISWAP_V3.QuoterV2,
          feeTier,
          gasEstimate,
        });
      }
    } catch {
      console.debug(`Uniswap V3 fee ${feeTier} — no pool`);
    }
  });

  // 2. PancakeSwap V3 — 4 fee tiers in parallel
  const pancakePromises = UNISWAP_V3_FEE_TIERS.map(async (feeTier) => {
    try {
      const result = await client.readContract({
        address: PANCAKESWAP_V3.QuoterV2 as `0x${string}`,
        abi: QuoterV2ABI,
        functionName: 'quoteExactInputSingle',
        args: [{
          tokenIn: quoteTokenIn,
          tokenOut: quoteTokenOut,
          amountIn: amount,
          fee: feeTier,
          sqrtPriceLimitX96: 0n,
        }],
      });
      const [amountOut, , , gasEstimate] = result as [bigint, bigint, number, bigint];
      if (amountOut > 0n) {
        routes.push({
          dex: 'pancakeswap-v3',
          amountOut,
          routerAddress: PANCAKESWAP_V3.SwapRouter,
          quoterAddress: PANCAKESWAP_V3.QuoterV2,
          feeTier,
          gasEstimate,
        });
      }
    } catch {
      console.debug(`PancakeSwap V3 fee ${feeTier} — no pool`);
    }
  });

  await Promise.all([...uniswapPromises, ...pancakePromises]);

  return routes;
}

/**
 * Calculates minimum output amount based on slippage tolerance
 */
export function calculateMinAmountOut(amountOut: bigint, slippagePercent: number): bigint {
  const slippageBps = BigInt(Math.floor(slippagePercent * 100));
  return (amountOut * (10000n - slippageBps)) / 10000n;
}

/**
 * Deadline timestamp (now + minutes)
 */
export function getDeadline(minutesFromNow: number = 20): bigint {
  return BigInt(Math.floor(Date.now() / 1000) + minutesFromNow * 60);
}
