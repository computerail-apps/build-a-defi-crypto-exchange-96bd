import { createPublicClient, http, parseUnits, formatUnits, encodeFunctionData, type WalletClient } from 'viem';
import { mainnet } from 'viem/chains';
import { getToken } from '@/lib/tokens';
import { getUsdPrice } from '@/lib/coingecko';

const RPC_URL = 'https://ethereum.publicnode.com';

export const publicClient = createPublicClient({
  chain: mainnet,
  transport: http(RPC_URL),
});

export const QUOTER_V2 = '0x61fFE014bA17989E743c5F6cB21bF9697530B21e' as const;
export const SWAP_ROUTER_02 = '0x68b3465833fb72A70ecDF485E0e4C7bD8665Fc45' as const;
export const UNISWAP_V3_FACTORY = '0x1F98431c8aD98523631AE4a59f267346ea31F984' as const;
export const WETH9 = '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2' as const;

const FEE_TIERS = [500, 3000, 10000] as const;

export const ERC20_ABI = [
  { type: 'function', name: 'balanceOf', stateMutability: 'view', inputs: [{ name: 'account', type: 'address' }], outputs: [{ name: '', type: 'uint256' }] },
  { type: 'function', name: 'allowance', stateMutability: 'view', inputs: [{ name: 'owner', type: 'address' }, { name: 'spender', type: 'address' }], outputs: [{ name: '', type: 'uint256' }] },
  { type: 'function', name: 'approve', stateMutability: 'nonpayable', inputs: [{ name: 'spender', type: 'address' }, { name: 'amount', type: 'uint256' }], outputs: [{ name: '', type: 'bool' }] },
] as const;

const QUOTER_V2_ABI = [
  {
    type: 'function',
    name: 'quoteExactInputSingle',
    stateMutability: 'nonpayable',
    inputs: [
      {
        name: 'params',
        type: 'tuple',
        components: [
          { name: 'tokenIn', type: 'address' },
          { name: 'tokenOut', type: 'address' },
          { name: 'amountIn', type: 'uint256' },
          { name: 'fee', type: 'uint24' },
          { name: 'sqrtPriceLimitX96', type: 'uint160' },
        ],
      },
    ],
    outputs: [
      { name: 'amountOut', type: 'uint256' },
      { name: 'sqrtPriceX96After', type: 'uint160' },
      { name: 'initializedTicksCrossed', type: 'uint32' },
      { name: 'gasEstimate', type: 'uint256' },
    ],
  },
] as const;

const FACTORY_ABI = [
  { type: 'function', name: 'getPool', stateMutability: 'view', inputs: [{ name: 'tokenA', type: 'address' }, { name: 'tokenB', type: 'address' }, { name: 'fee', type: 'uint24' }], outputs: [{ name: 'pool', type: 'address' }] },
] as const;

const POOL_ABI = [
  {
    type: 'function',
    name: 'slot0',
    stateMutability: 'view',
    inputs: [],
    outputs: [
      { name: 'sqrtPriceX96', type: 'uint160' },
      { name: 'tick', type: 'int24' },
      { name: 'observationIndex', type: 'uint16' },
      { name: 'observationCardinality', type: 'uint16' },
      { name: 'observationCardinalityNext', type: 'uint16' },
      { name: 'feeProtocol', type: 'uint8' },
      { name: 'unlocked', type: 'bool' },
    ],
  },
] as const;

export const SWAP_ROUTER_02_ABI = [
  {
    type: 'function',
    name: 'exactInputSingle',
    stateMutability: 'payable',
    inputs: [
      {
        name: 'params',
        type: 'tuple',
        components: [
          { name: 'tokenIn', type: 'address' },
          { name: 'tokenOut', type: 'address' },
          { name: 'fee', type: 'uint24' },
          { name: 'recipient', type: 'address' },
          { name: 'amountIn', type: 'uint256' },
          { name: 'amountOutMinimum', type: 'uint256' },
          { name: 'sqrtPriceLimitX96', type: 'uint160' },
        ],
      },
    ],
    outputs: [{ name: 'amountOut', type: 'uint256' }],
  },
  { type: 'function', name: 'unwrapWETH9', stateMutability: 'payable', inputs: [{ name: 'amountMinimum', type: 'uint256' }, { name: 'recipient', type: 'address' }], outputs: [] },
  { type: 'function', name: 'multicall', stateMutability: 'payable', inputs: [{ name: 'data', type: 'bytes[]' }], outputs: [{ name: 'results', type: 'bytes[]' }] },
] as const;

function resolveAddress(symbol: string): `0x${string}` {
  if (symbol === 'ETH') return WETH9;
  return getToken(symbol).address as `0x${string}`;
}

export interface QuoteResult {
  toAmount: number;
  rate: number;
  priceImpactPct: number;
  minReceived: number;
  gasEstimateUsd: number;
  fee: number;
}

export async function getSwapQuote(params: {
  fromSymbol: string;
  toSymbol: string;
  amountIn: number;
  slippagePct: number;
}): Promise<QuoteResult> {
  const { fromSymbol, toSymbol, amountIn, slippagePct } = params;
  if (amountIn <= 0) throw new Error('Enter an amount to swap');

  const fromToken = getToken(fromSymbol);
  const toToken = getToken(toSymbol);
  const tokenIn = resolveAddress(fromSymbol);
  const tokenOut = resolveAddress(toSymbol);
  const amountInWei = parseUnits(amountIn.toString(), fromToken.decimals);

  let best: { fee: number; amountOut: bigint; sqrtPriceX96After: bigint; gasEstimate: bigint } | null = null;

  for (const fee of FEE_TIERS) {
    try {
      const { result } = await publicClient.simulateContract({
        address: QUOTER_V2,
        abi: QUOTER_V2_ABI,
        functionName: 'quoteExactInputSingle',
        args: [{ tokenIn, tokenOut, amountIn: amountInWei, fee, sqrtPriceLimitX96: 0n }],
      });
      const [amountOut, sqrtPriceX96After, , gasEstimate] = result as unknown as [bigint, bigint, number, bigint];
      if (!best || amountOut > best.amountOut) {
        best = { fee, amountOut, sqrtPriceX96After, gasEstimate };
      }
    } catch {
      // No initialized pool at this fee tier - try the next one.
    }
  }

  if (!best) throw new Error('No Uniswap V3 pool with liquidity found for this pair');

  const toAmount = Number(formatUnits(best.amountOut, toToken.decimals));
  const rate = amountIn > 0 ? toAmount / amountIn : 0;

  let priceImpactPct = 0;
  try {
    const poolAddress = (await publicClient.readContract({
      address: UNISWAP_V3_FACTORY,
      abi: FACTORY_ABI,
      functionName: 'getPool',
      args: [tokenIn, tokenOut, best.fee],
    })) as `0x${string}`;
    if (poolAddress && poolAddress !== '0x0000000000000000000000000000000000000000') {
      const slot0 = (await publicClient.readContract({
        address: poolAddress,
        abi: POOL_ABI,
        functionName: 'slot0',
      })) as unknown as [bigint, number, number, number, number, number, boolean];
      const sqrtBefore = slot0[0];
      if (sqrtBefore > 0n) {
        const ratio = Number(best.sqrtPriceX96After) / Number(sqrtBefore);
        priceImpactPct = Math.abs(1 - ratio * ratio) * 100;
      }
    }
  } catch {
    priceImpactPct = 0;
  }

  let gasEstimateUsd = 0;
  try {
    const [gasPrice, ethUsd] = await Promise.all([publicClient.getGasPrice(), getUsdPrice('ETH')]);
    const gasCostEth = Number(formatUnits(best.gasEstimate * gasPrice, 18));
    gasEstimateUsd = gasCostEth * ethUsd;
  } catch {
    gasEstimateUsd = 0;
  }

  const minReceived = toAmount * (1 - slippagePct / 100);

  return { toAmount, rate, priceImpactPct, minReceived, gasEstimateUsd, fee: best.fee };
}

export async function getTokenBalance(symbol: string, address: `0x${string}`): Promise<number> {
  const token = getToken(symbol);
  if (symbol === 'ETH') {
    const bal = await publicClient.getBalance({ address });
    return Number(formatUnits(bal, 18));
  }
  const bal = (await publicClient.readContract({
    address: token.address as `0x${string}`,
    abi: ERC20_ABI,
    functionName: 'balanceOf',
    args: [address],
  })) as bigint;
  return Number(formatUnits(bal, token.decimals));
}

export interface ExecuteSwapParams {
  walletClient: WalletClient;
  account: `0x${string}`;
  fromSymbol: string;
  toSymbol: string;
  amountIn: number;
  minAmountOut: number;
  fee: number;
}

export async function executeSwap(params: ExecuteSwapParams): Promise<`0x${string}`> {
  const { walletClient, account, fromSymbol, toSymbol, amountIn, minAmountOut, fee } = params;
  const fromToken = getToken(fromSymbol);
  const toToken = getToken(toSymbol);
  const tokenIn = resolveAddress(fromSymbol);
  const tokenOut = resolveAddress(toSymbol);
  const amountInWei = parseUnits(amountIn.toString(), fromToken.decimals);
  const safeMinOut = Math.max(minAmountOut, 0);
  const amountOutMinWei = parseUnits(safeMinOut.toFixed(toToken.decimals), toToken.decimals);

  if (fromSymbol !== 'ETH') {
    const allowance = (await publicClient.readContract({
      address: tokenIn,
      abi: ERC20_ABI,
      functionName: 'allowance',
      args: [account, SWAP_ROUTER_02],
    })) as bigint;
    if (allowance < amountInWei) {
      const approveHash = await walletClient.writeContract({
        address: tokenIn,
        abi: ERC20_ABI,
        functionName: 'approve',
        args: [SWAP_ROUTER_02, amountInWei],
        account,
        chain: mainnet,
      });
      await publicClient.waitForTransactionReceipt({ hash: approveHash });
    }
  }

  if (toSymbol === 'ETH') {
    const swapCalldata = encodeFunctionData({
      abi: SWAP_ROUTER_02_ABI,
      functionName: 'exactInputSingle',
      args: [{ tokenIn, tokenOut, fee, recipient: SWAP_ROUTER_02, amountIn: amountInWei, amountOutMinimum: amountOutMinWei, sqrtPriceLimitX96: 0n }],
    });
    const unwrapCalldata = encodeFunctionData({
      abi: SWAP_ROUTER_02_ABI,
      functionName: 'unwrapWETH9',
      args: [amountOutMinWei, account],
    });
    const hash = await walletClient.writeContract({
      address: SWAP_ROUTER_02,
      abi: SWAP_ROUTER_02_ABI,
      functionName: 'multicall',
      args: [[swapCalldata, unwrapCalldata]],
      account,
      chain: mainnet,
      value: 0n,
    });
    return hash;
  }

  const hash = await walletClient.writeContract({
    address: SWAP_ROUTER_02,
    abi: SWAP_ROUTER_02_ABI,
    functionName: 'exactInputSingle',
    args: [{ tokenIn, tokenOut, fee, recipient: account, amountIn: amountInWei, amountOutMinimum: amountOutMinWei, sqrtPriceLimitX96: 0n }],
    account,
    chain: mainnet,
    value: fromSymbol === 'ETH' ? amountInWei : 0n,
  });
  return hash;
}
