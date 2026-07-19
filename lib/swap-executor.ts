import { WalletClient, encodeFunctionData, Address } from 'viem';
import { RouteInfo, NATIVE_ETH, WETH_ADDRESS } from './contracts';
import { getDeadline } from './routing';
import SwapRouter02ABI from './abis/SwapRouter02.json';
import PancakeSwapV3RouterABI from './abis/PancakeSwapV3Router.json';
import WETH9ABI from './abis/WETH9.json';

/**
 * Execute swap on the best route with native ETH support
 */
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

  // Special case: ETH ↔ WETH wrap/unwrap
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

  switch (route.dex) {
    case 'uniswap-v3':
      return executeV3Swap(
        walletClient,
        route.routerAddress as `0x${string}`,
        SwapRouter02ABI,
        tokenIn,
        tokenOut,
        route.feeTier!,
        amountIn,
        minAmountOut,
        userAddress,
        deadline,
        isEthIn,
        isEthOut,
        false
      );

    case 'pancakeswap-v3':
      return executeV3Swap(
        walletClient,
        route.routerAddress as `0x${string}`,
        PancakeSwapV3RouterABI,
        tokenIn,
        tokenOut,
        route.feeTier!,
        amountIn,
        minAmountOut,
        userAddress,
        deadline,
        isEthIn,
        isEthOut,
        true // PancakeSwap V3 requires deadline in the params struct
      );

    default:
      throw new Error(`Unsupported DEX: ${route.dex}`);
  }
}

/**
 * Execute Uniswap V3 / PancakeSwap V3 swap
 * isPancake=true adds deadline inside the params struct (PancakeSwap V3 requirement)
 */
async function executeV3Swap(
  walletClient: WalletClient,
  routerAddress: `0x${string}`,
  abi: typeof SwapRouter02ABI,
  tokenIn: Address,
  tokenOut: Address,
  fee: number,
  amountIn: bigint,
  amountOutMinimum: bigint,
  recipient: Address,
  deadline: bigint,
  isEthIn: boolean,
  isEthOut: boolean,
  isPancake: boolean = false
): Promise<`0x${string}`> {
  const actualTokenIn  = isEthIn  ? WETH_ADDRESS : tokenIn;
  const actualTokenOut = isEthOut ? WETH_ADDRESS : tokenOut;

  const buildParams = (overrideRecipient: Address) =>
    isPancake
      ? { tokenIn: actualTokenIn, tokenOut: actualTokenOut, fee, recipient: overrideRecipient, deadline, amountIn, amountOutMinimum, sqrtPriceLimitX96: 0n }
      : { tokenIn: actualTokenIn, tokenOut: actualTokenOut, fee, recipient: overrideRecipient, amountIn, amountOutMinimum, sqrtPriceLimitX96: 0n };

  // ETH output: swap to WETH then unwrap
  if (isEthOut) {
    const swapCalldata = encodeFunctionData({
      abi,
      functionName: 'exactInputSingle',
      args: [buildParams(routerAddress)],
    });

    const unwrapCalldata = encodeFunctionData({
      abi,
      functionName: 'unwrapWETH9',
      args: [amountOutMinimum, recipient],
    });

    return walletClient.writeContract({
      address: routerAddress,
      abi,
      functionName: 'multicall',
      args: [[swapCalldata, unwrapCalldata]],
      value: isEthIn ? amountIn : 0n,
    } as any);
  }

  // Normal swap
  return walletClient.writeContract({
    address: routerAddress,
    abi,
    functionName: 'exactInputSingle',
    args: [buildParams(recipient)],
    value: isEthIn ? amountIn : 0n,
  } as any);
}
