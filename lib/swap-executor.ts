import { WalletClient, encodeFunctionData, concat, Address } from 'viem';
import { Attribution } from 'ox/erc8021';
import { RouteInfo, NATIVE_ETH, WETH_ADDRESS } from './contracts';
import { getDeadline } from './routing';
import SwapRouter02ABI from './abis/SwapRouter02.json';
import PancakeSwapV3RouterABI from './abis/PancakeSwapV3Router.json';
import WETH9ABI from './abis/WETH9.json';

// ── Builder Code Attribution (ERC-8021) ───────────────────────────────────────
const BUILDER_CODE_SUFFIX = Attribution.toDataSuffix({
  codes: ['bc_ri4d72mx'],
}) as `0x${string}`;

/**
 * Appends the iDEX builder code suffix to any calldata.
 * This attributes every transaction to iDEX on Base's onchain analytics.
 */
function appendBuilderCode(data: `0x${string}`): `0x${string}` {
  return concat([data, BUILDER_CODE_SUFFIX]);
}

/**
 * Sends a raw transaction with builder code appended to the calldata.
 * Uses walletClient.sendTransaction instead of writeContract because
 * writeContract encodes data internally and doesn't allow custom data injection.
 */
async function sendWithBuilderCode(
  walletClient: WalletClient,
  params: {
    address: `0x${string}`;
    abi: readonly unknown[];
    functionName: string;
    args?: readonly unknown[];
    value?: bigint;
    gas?: bigint;
  }
): Promise<`0x${string}`> {
  // 1. Encode calldata from ABI
  const data = encodeFunctionData({
    abi: params.abi,
    functionName: params.functionName,
    args: params.args ?? [],
  });

  // 2. Append builder code suffix
  const dataWithBuilder = appendBuilderCode(data);

  // 3. Send as raw transaction
  return walletClient.sendTransaction({
    to: params.address,
    data: dataWithBuilder,
    value: params.value ?? 0n,
    gas: params.gas,
  } as any);
}

// ── Main export ───────────────────────────────────────────────────────────────
/**
 * Execute swap on the best route with native ETH support + builder attribution
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
      return sendWithBuilderCode(walletClient, {
        address: WETH_ADDRESS as `0x${string}`,
        abi: WETH9ABI,
        functionName: 'deposit',
        value: amountIn,
        gas: 60000n,
      });
    } else {
      return sendWithBuilderCode(walletClient, {
        address: WETH_ADDRESS as `0x${string}`,
        abi: WETH9ABI,
        functionName: 'withdraw',
        args: [amountIn],
        gas: 60000n,
      });
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
        true // PancakeSwap V3 requires deadline inside params struct
      );

    default:
      throw new Error(`Unsupported DEX: ${route.dex}`);
  }
}

/**
 * Execute Uniswap V3 / PancakeSwap V3 exactInputSingle with builder attribution.
 * isPancake=true adds deadline inside the params struct (PancakeSwap V3 requirement).
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

  // ETH output: swap to WETH then unwrap via multicall
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

    // Builder code goes on the outer multicall calldata
    return sendWithBuilderCode(walletClient, {
      address: routerAddress,
      abi,
      functionName: 'multicall',
      args: [[swapCalldata, unwrapCalldata]],
      value: isEthIn ? amountIn : 0n,
    });
  }

  // Normal single-hop swap
  return sendWithBuilderCode(walletClient, {
    address: routerAddress,
    abi,
    functionName: 'exactInputSingle',
    args: [buildParams(recipient)],
    value: isEthIn ? amountIn : 0n,
  });
}
