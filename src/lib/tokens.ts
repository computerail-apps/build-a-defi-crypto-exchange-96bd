export interface Token {
  symbol: string;
  name: string;
  decimals: number;
  address: string;
  coingeckoId: string;
}

export const TOKENS: Token[] = [
  {
    symbol: 'ETH',
    name: 'Ethereum',
    decimals: 18,
    address: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE',
    coingeckoId: 'ethereum',
  },
  {
    symbol: 'USDC',
    name: 'USD Coin',
    decimals: 6,
    address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
    coingeckoId: 'usd-coin',
  },
  {
    symbol: 'USDT',
    name: 'Tether USD',
    decimals: 6,
    address: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
    coingeckoId: 'tether',
  },
  {
    symbol: 'DAI',
    name: 'Dai Stablecoin',
    decimals: 18,
    address: '0x6B175474E89094C44Da98b954EedeAC495271d0F',
    coingeckoId: 'dai',
  },
  {
    symbol: 'WBTC',
    name: 'Wrapped Bitcoin',
    decimals: 8,
    address: '0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599',
    coingeckoId: 'wrapped-bitcoin',
  },
];

export function getToken(symbol: string): Token {
  const t = TOKENS.find((x) => x.symbol === symbol);
  if (!t) throw new Error(`Unknown token ${symbol}`);
  return t;
}

// Reference USD prices used to derive realistic mock quotes/markets data.
// Phase 2 replaces every consumer of this with live CoinGecko data.
export const MOCK_USD_PRICES: Record<string, number> = {
  ETH: 3450.32,
  USDC: 1.0,
  USDT: 1.0,
  DAI: 1.0,
  WBTC: 96200.15,
};

export const MOCK_24H_CHANGE: Record<string, number> = {
  ETH: 2.41,
  USDC: 0.01,
  USDT: -0.02,
  DAI: 0.0,
  WBTC: 1.83,
};

export const MOCK_MARKET_CAP: Record<string, number> = {
  ETH: 414_800_000_000,
  USDC: 34_200_000_000,
  USDT: 118_900_000_000,
  DAI: 5_320_000_000,
  WBTC: 14_760_000_000,
};
