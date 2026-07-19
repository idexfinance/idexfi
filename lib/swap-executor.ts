import { WalletClient, encodeFunctionData, concat, Address, Hex } from 'viem';
import { Attribution } from 'ox/erc8021';
import { RouteInfo, NATIVE_ETH, WETH_ADDRESS } from './contracts';
import { getDeadline } from './routing';
import SwapRouter02ABI from './abis/SwapRouter02.json';
import PancakeSwapV3RouterABI from './abis/PancakeSwapV3Router.json';
import WETH9ABI from './abis/WETH9.json';

// ── Builder Code Attribution (ERC-8021) ───────────────────────────────────────
// Generates the 8021...8021 suffix that Base indexers read for attribution
const BUILDER_SUFFIX = Attribution.toDataSuffix({
  codes: ['bc_ri4d72mx'],
}) as Hex;

/**
 * Appends iDEX builder code suffix to calldata hex string.
 * Result: [original calldata][8021bc_ri4d72mx8021]
 */
function withBuilderSuffix(data: Hex): Hex {
  return concat([data, BUILDER_SUFFIX]) as Hex;
}

/**
 * Core helper: encodes calldata from ABI, appends builder suffix,
 * then sends as a raw sendTransaction (NOT writeContract).
 *
 * Why sendTransaction and not writeContract?
 * wagmi/viem's writeContract re-encodes data internally and strips
 * any custom appended bytes. sendTransaction sends data as-is.
 */
async function sendWithBuilderCode(
  walletClient: WalletClient,
  userAddress: Address,
  params: {
    to: `0x${string}`;
    abi: readonly unknown[];
    functionName: string;
    args?: readonly unknown[];
    value?: bigint;
    gas?: bigint;
  }
): Promise<`0x${string}`> {
  // Step 1: encode function calldata
  const encoded = encodeFunctionData({
    abi: params.abi,
    functionName: params.functionName,
    args: params.args ?? [],
  });

  // Step 2: append builder code suffix
  const data = withBuilderSuffix(encoded);

  // Step 3: send raw tx — data is preserved exactly as-is
  return walletClient.sendTransaction({
    account: userAddress,
    to: params.to,
    data,
    value: params.value ?? 0n,
    ...(params.gas ? { gas: params.gas } : {}),
    chain: null,
  } as any);
}

// ── Main export ───────────────────────────────────────────────────────────────
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

  // ── ETH ↔ WETH wrap / unwrap ──────────────────────────────────────────────
  if (route.dex === 'weth-wrap') {
    const isWrap = tokenIn.toLowerCase() === NATIVE_ETH.toLowerCase();
    return sendWithBuilderCode(walletClient, userAddress, isWrap
      ? {
          to: WETH_ADDRESS as `0x${string}`,
          abi: WETH9ABI,
          functionName: 'deposit',
          value: amountIn,
          gas: 60000n,
        }
      : {
          to: WETH_ADDRESS as `0x${string}`,
          abi: WETH9ABI,
          functionName: 'withdraw',
          args: [amountIn],
          gas: 60000n,
        }
    );
  }

  const isEthIn  = tokenIn.toLowerCase()  === NATIVE_ETH.toLowerCase();
  const isEthOut = tokenOut.toLowerCase() === NATIVE_ETH.toLowerCase();

  switch (route.dex) {
    case 'uniswap-v3':
      return executeV3Swap(
        walletClient, userAddress,
        route.routerAddress as `0x${string}`,
        SwapRouter02ABI,
        tokenIn, tokenOut, route.feeTier!,
        amountIn, minAmountOut,
        deadline, isEthIn, isEthOut, false
      );

    case 'pancakeswap-v3':
      return executeV3Swap(
        walletClient, userAddress,
        route.routerAddress as `0x${string}`,
        PancakeSwapV3RouterABI,
        tokenIn, tokenOut, route.feeTier!,
        amountIn, minAmountOut,
        deadline, isEthIn, isEthOut,
        true // PancakeSwap V3 needs deadline inside params struct
      );

    default:
      throw new Error(`Unsupported DEX: ${route.dex}`);
  }
}

// ── V3 swap (Uniswap & PancakeSwap) ──────────────────────────────────────────
async function executeV3Swap(
  walletClient: WalletClient,
  userAddress: Address,
  routerAddress: `0x${string}`,
  abi: typeof SwapRouter02ABI,
  tokenIn: Address,
  tokenOut: Address,
  fee: number,
  amountIn: bigint,
  amountOutMinimum: bigint,
  deadline: bigint,
  isEthIn: boolean,
  isEthOut: boolean,
  isPancake: boolean
): Promise<`0x${string}`> {
  const actualTokenIn  = isEthIn  ? WETH_ADDRESS : tokenIn;
  const actualTokenOut = isEthOut ? WETH_ADDRESS : tokenOut;

  const buildParams = (overrideRecipient: Address) =>
    isPancake
      ? { tokenIn: actualTokenIn, tokenOut: actualTokenOut, fee, recipient: overrideRecipient, deadline, amountIn, amountOutMinimum, sqrtPriceLimitX96: 0n }
      : { tokenIn: actualTokenIn, tokenOut: actualTokenOut, fee, recipient: overrideRecipient, amountIn, amountOutMinimum, sqrtPriceLimitX96: 0n };

  // ETH output path: swap → WETH, then unwrap in same multicall tx
  if (isEthOut) {
    // Inner calldatas are NOT builder-suffixed — only the outer multicall gets it
    const swapCalldata = encodeFunctionData({
      abi,
      functionName: 'exactInputSingle',
      args: [buildParams(routerAddress)],
    });
    const unwrapCalldata = encodeFunctionData({
      abi,
      functionName: 'unwrapWETH9',
      args: [amountOutMinimum, userAddress],
    });

    return sendWithBuilderCode(walletClient, userAddress, {
      to: routerAddress,
      abi,
      functionName: 'multicall',
      args: [[swapCalldata, unwrapCalldata]],
      value: isEthIn ? amountIn : 0n,
    });
  }

  // Standard single-hop swap
  return sendWithBuilderCode(walletClient, userAddress, {
    to: routerAddress,
    abi,
    functionName: 'exactInputSingle',
    args: [buildParams(userAddress)],
    value: isEthIn ? amountIn : 0n,
  });
}
