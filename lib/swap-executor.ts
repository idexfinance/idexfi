import { WalletClient, encodeFunctionData, concat, Address } from 'viem';
import { RouteInfo, NATIVE_ETH, WETH_ADDRESS } from './contracts';
import { getDeadline } from './routing';
import SwapRouter02ABI from './abis/SwapRouter02.json';
import PancakeSwapV3RouterABI from './abis/PancakeSwapV3Router.json';
import WETH9ABI from './abis/WETH9.json';

// ── ERC-8021 Builder Code Attribution ────────────────────────────────────────
// "8021bc_ri4d72mx8021" UTF-8 encoded as hex — static constant, no Buffer needed
// Verified: Buffer.from('8021bc_ri4d72mx8021','utf8').toString('hex')
const BUILDER_CODE_SUFFIX = '0x3830323162635f7269346437326d7838303231' as `0x${string}`;

// Appends builder code suffix to the outermost calldata — never to inner calls
function withAttribution(calldata: `0x${string}`): `0x${string}` {
  return concat([calldata, BUILDER_CODE_SUFFIX]);
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

    if (isWrap) {
      // ETH → WETH: deposit()
      const data = withAttribution(
        encodeFunctionData({ abi: WETH9ABI, functionName: 'deposit' })
      );
      return walletClient.sendTransaction({
        to: WETH_ADDRESS as `0x${string}`,
        data,
        value: amountIn,
        gas: 60000n,
      } as any);
    } else {
      // WETH → ETH: withdraw(amount)
      const data = withAttribution(
        encodeFunctionData({ abi: WETH9ABI, functionName: 'withdraw', args: [amountIn] })
      );
      return walletClient.sendTransaction({
        to: WETH_ADDRESS as `0x${string}`,
        data,
        gas: 60000n,
      } as any);
    }
  }

  const isEthIn  = tokenIn.toLowerCase()  === NATIVE_ETH.toLowerCase();
  const isEthOut = tokenOut.toLowerCase() === NATIVE_ETH.toLowerCase();
  const actualIn  = isEthIn  ? WETH_ADDRESS : tokenIn;
  const actualOut = isEthOut ? WETH_ADDRESS : tokenOut;

  switch (route.dex) {

    // ── Uniswap V3 ────────────────────────────────────────────────────────────
    case 'uniswap-v3': {
      const routerAddress = route.routerAddress as `0x${string}`;

      if (isEthOut) {
        // multicall: exactInputSingle → unwrapWETH9
        // withAttribution goes on the OUTER multicall only
        const swapData = encodeFunctionData({
          abi: SwapRouter02ABI,
          functionName: 'exactInputSingle',
          args: [{
            tokenIn: actualIn, tokenOut: actualOut,
            fee: route.feeTier!,
            recipient: routerAddress,
            amountIn, amountOutMinimum: minAmountOut,
            sqrtPriceLimitX96: 0n,
          }],
        });
        const unwrapData = encodeFunctionData({
          abi: SwapRouter02ABI,
          functionName: 'unwrapWETH9',
          args: [minAmountOut, userAddress],
        });
        const data = withAttribution(
          encodeFunctionData({
            abi: SwapRouter02ABI,
            functionName: 'multicall',
            args: [[swapData, unwrapData]],
          })
        );
        return walletClient.sendTransaction({
          to: routerAddress, data,
          value: isEthIn ? amountIn : 0n,
        } as any);
      }

      // Normal swap
      const data = withAttribution(
        encodeFunctionData({
          abi: SwapRouter02ABI,
          functionName: 'exactInputSingle',
          args: [{
            tokenIn: actualIn, tokenOut: actualOut,
            fee: route.feeTier!,
            recipient: userAddress,
            amountIn, amountOutMinimum: minAmountOut,
            sqrtPriceLimitX96: 0n,
          }],
        })
      );
      return walletClient.sendTransaction({
        to: routerAddress, data,
        value: isEthIn ? amountIn : 0n,
      } as any);
    }

    // ── PancakeSwap V3 ────────────────────────────────────────────────────────
    case 'pancakeswap-v3': {
      const routerAddress = route.routerAddress as `0x${string}`;

      if (isEthOut) {
        const swapData = encodeFunctionData({
          abi: PancakeSwapV3RouterABI,
          functionName: 'exactInputSingle',
          args: [{
            tokenIn: actualIn, tokenOut: actualOut,
            fee: route.feeTier!,
            recipient: routerAddress,
            deadline,
            amountIn, amountOutMinimum: minAmountOut,
            sqrtPriceLimitX96: 0n,
          }],
        });
        const unwrapData = encodeFunctionData({
          abi: PancakeSwapV3RouterABI,
          functionName: 'unwrapWETH9',
          args: [minAmountOut, userAddress],
        });
        const data = withAttribution(
          encodeFunctionData({
            abi: PancakeSwapV3RouterABI,
            functionName: 'multicall',
            args: [[swapData, unwrapData]],
          })
        );
        return walletClient.sendTransaction({
          to: routerAddress, data,
          value: isEthIn ? amountIn : 0n,
        } as any);
      }

      // Normal swap
      const data = withAttribution(
        encodeFunctionData({
          abi: PancakeSwapV3RouterABI,
          functionName: 'exactInputSingle',
          args: [{
            tokenIn: actualIn, tokenOut: actualOut,
            fee: route.feeTier!,
            recipient: userAddress,
            deadline,
            amountIn, amountOutMinimum: minAmountOut,
            sqrtPriceLimitX96: 0n,
          }],
        })
      );
      return walletClient.sendTransaction({
        to: routerAddress, data,
        value: isEthIn ? amountIn : 0n,
      } as any);
    }

    default:
      throw new Error(`Unsupported DEX: ${route.dex}`);
  }
}
