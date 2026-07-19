import { WalletClient, encodeFunctionData, Address } from 'viem';
import { RouteInfo, NATIVE_ETH, WETH_ADDRESS } from './contracts';
import { getDeadline } from './routing';
import SwapRouter02ABI from './abis/SwapRouter02.json';
import PancakeSwapV3RouterABI from './abis/PancakeSwapV3Router.json';
import WETH9ABI from './abis/WETH9.json';

// Builder code is handled at wagmi config level via dataSuffix
// No manual concat needed here

export async function executeSwap(
  walletClient: WalletClient,
  route: RouteInfo,
  tokenIn: Address,
  tokenOut: Address,
  amountIn: bigint,
  minAmountOut: bigint,
  userAddress: Address
): Promise<`0x${string}`> {
  const deadline = getDeadline(20);

  // ETH ↔ WETH
  if (route.dex === 'weth-wrap') {
    const isWrap = tokenIn.toLowerCase() === NATIVE_ETH.toLowerCase();
    if (isWrap) {
      return walletClient.writeContract({
        address: WETH_ADDRESS as `0x${string}`,
        abi: WETH9ABI,
        functionName: 'deposit',
        value: amountIn,
      } as any);
    } else {
      return walletClient.writeContract({
        address: WETH_ADDRESS as `0x${string}`,
        abi: WETH9ABI,
        functionName: 'withdraw',
        args: [amountIn],
      } as any);
    }
  }

  const isEthIn  = tokenIn.toLowerCase()  === NATIVE_ETH.toLowerCase();
  const isEthOut = tokenOut.toLowerCase() === NATIVE_ETH.toLowerCase();
  const actualIn  = isEthIn  ? WETH_ADDRESS : tokenIn;
  const actualOut = isEthOut ? WETH_ADDRESS : tokenOut;

  switch (route.dex) {
    case 'uniswap-v3': {
      const router = route.routerAddress as `0x${string}`;
      if (isEthOut) {
        const swapData = encodeFunctionData({
          abi: SwapRouter02ABI, functionName: 'exactInputSingle',
          args: [{ tokenIn: actualIn, tokenOut: actualOut, fee: route.feeTier!, recipient: router, amountIn, amountOutMinimum: minAmountOut, sqrtPriceLimitX96: 0n }],
        });
        const unwrapData = encodeFunctionData({
          abi: SwapRouter02ABI, functionName: 'unwrapWETH9',
          args: [minAmountOut, userAddress],
        });
        return walletClient.writeContract({
          address: router, abi: SwapRouter02ABI, functionName: 'multicall',
          args: [[swapData, unwrapData]], value: isEthIn ? amountIn : 0n,
        } as any);
      }
      return walletClient.writeContract({
        address: router, abi: SwapRouter02ABI, functionName: 'exactInputSingle',
        args: [{ tokenIn: actualIn, tokenOut: actualOut, fee: route.feeTier!, recipient: userAddress, amountIn, amountOutMinimum: minAmountOut, sqrtPriceLimitX96: 0n }],
        value: isEthIn ? amountIn : 0n,
      } as any);
    }

    case 'pancakeswap-v3': {
      const router = route.routerAddress as `0x${string}`;
      if (isEthOut) {
        const swapData = encodeFunctionData({
          abi: PancakeSwapV3RouterABI, functionName: 'exactInputSingle',
          args: [{ tokenIn: actualIn, tokenOut: actualOut, fee: route.feeTier!, recipient: router, deadline, amountIn, amountOutMinimum: minAmountOut, sqrtPriceLimitX96: 0n }],
        });
        const unwrapData = encodeFunctionData({
          abi: PancakeSwapV3RouterABI, functionName: 'unwrapWETH9',
          args: [minAmountOut, userAddress],
        });
        return walletClient.writeContract({
          address: router, abi: PancakeSwapV3RouterABI, functionName: 'multicall',
          args: [[swapData, unwrapData]], value: isEthIn ? amountIn : 0n,
        } as any);
      }
      return walletClient.writeContract({
        address: router, abi: PancakeSwapV3RouterABI, functionName: 'exactInputSingle',
        args: [{ tokenIn: actualIn, tokenOut: actualOut, fee: route.feeTier!, recipient: userAddress, deadline, amountIn, amountOutMinimum: minAmountOut, sqrtPriceLimitX96: 0n }],
        value: isEthIn ? amountIn : 0n,
      } as any);
    }

    default:
      throw new Error(`Unsupported DEX: ${route.dex}`);
  }
}
