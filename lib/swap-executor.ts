import { WalletClient, encodeFunctionData, concat, Address } from 'viem';
import { Attribution } from 'ox/erc8021';
import { RouteInfo, NATIVE_ETH, WETH_ADDRESS, BUILDER_CODE } from './contracts';
import { getDeadline } from './routing';
import SwapRouter02ABI from './abis/SwapRouter02.json';
import PancakeSwapV3RouterABI from './abis/PancakeSwapV3Router.json';
import WETH9ABI from './abis/WETH9.json';

// ERC-8021 Builder Code Attribution
// Suffix modül seviyesinde bir kez oluşturulur, her swap'ta yeniden üretilmez
const BUILDER_CODE_SUFFIX = Attribution.toDataSuffix({
  codes: [BUILDER_CODE],
}) as `0x${string}`;

// Her calldata'nın sonuna ERC-8021 suffix ekler
function withAttribution(calldata: `0x${string}`): `0x${string}` {
  return concat([calldata, BUILDER_CODE_SUFFIX]);
}

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

  // ETH ↔ WETH wrap/unwrap
  if (route.dex === 'weth-wrap') {
    const isWrap = tokenIn.toLowerCase() === NATIVE_ETH.toLowerCase();

    if (isWrap) {
      // ETH → WETH (deposit)
      const data = withAttribution(
        encodeFunctionData({
          abi: WETH9ABI,
          functionName: 'deposit',
        })
      );
      return walletClient.sendTransaction({
        to: WETH_ADDRESS as `0x${string}`,
        data,
        value: amountIn,
        account: userAddress,
        chain: null,
      });
    } else {
      // WETH → ETH (withdraw)
      const data = withAttribution(
        encodeFunctionData({
          abi: WETH9ABI,
          functionName: 'withdraw',
          args: [amountIn],
        })
      );
      return walletClient.sendTransaction({
        to: WETH_ADDRESS as `0x${string}`,
        data,
        account: userAddress,
        chain: null,
      });
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
        // ETH output: multicall(exactInputSingle + unwrapWETH9)
        // Attribution en dışa — sadece multicall calldata'sına eklenir
        const swapData = encodeFunctionData({
          abi: SwapRouter02ABI,
          functionName: 'exactInputSingle',
          args: [{
            tokenIn: actualIn,
            tokenOut: actualOut,
            fee: route.feeTier!,
            recipient: router,
            amountIn,
            amountOutMinimum: minAmountOut,
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
          to: router,
          data,
          value: isEthIn ? amountIn : 0n,
          account: userAddress,
          chain: null,
        });
      }

      // Standard ERC-20 veya ETH-in swap
      const data = withAttribution(
        encodeFunctionData({
          abi: SwapRouter02ABI,
          functionName: 'exactInputSingle',
          args: [{
            tokenIn: actualIn,
            tokenOut: actualOut,
            fee: route.feeTier!,
            recipient: userAddress,
            amountIn,
            amountOutMinimum: minAmountOut,
            sqrtPriceLimitX96: 0n,
          }],
        })
      );
      return walletClient.sendTransaction({
        to: router,
        data,
        value: isEthIn ? amountIn : 0n,
        account: userAddress,
        chain: null,
      });
    }

    case 'pancakeswap-v3': {
      const router = route.routerAddress as `0x${string}`;

      if (isEthOut) {
        // ETH output: multicall(exactInputSingle + unwrapWETH9)
        // Attribution en dışa — sadece multicall calldata'sına eklenir
        const swapData = encodeFunctionData({
          abi: PancakeSwapV3RouterABI,
          functionName: 'exactInputSingle',
          args: [{
            tokenIn: actualIn,
            tokenOut: actualOut,
            fee: route.feeTier!,
            recipient: router,
            deadline,
            amountIn,
            amountOutMinimum: minAmountOut,
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
          to: router,
          data,
          value: isEthIn ? amountIn : 0n,
          account: userAddress,
          chain: null,
        });
      }

      // Standard ERC-20 veya ETH-in swap
      const data = withAttribution(
        encodeFunctionData({
          abi: PancakeSwapV3RouterABI,
          functionName: 'exactInputSingle',
          args: [{
            tokenIn: actualIn,
            tokenOut: actualOut,
            fee: route.feeTier!,
            recipient: userAddress,
            deadline,
            amountIn,
            amountOutMinimum: minAmountOut,
            sqrtPriceLimitX96: 0n,
          }],
        })
      );
      return walletClient.sendTransaction({
        to: router,
        data,
        value: isEthIn ? amountIn : 0n,
        account: userAddress,
        chain: null,
      });
    }

    default:
      throw new Error(`Unsupported DEX: ${route.dex}`);
  }
}
