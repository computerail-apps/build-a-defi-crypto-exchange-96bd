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
