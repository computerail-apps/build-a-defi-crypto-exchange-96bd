import { TOKENS, getToken } from '@/lib/tokens';

export interface CoinGeckoMarket {
  usd: number;
  usd_24h_change: number;
  usd_market_cap: number;
}

let cache: { data: Record<string, CoinGeckoMarket>; ts: number } | null = null;
const TTL_MS = 30_000;
let inflight: Promise<Record<string, CoinGeckoMarket>> | null = null;

export async function getMarketPrices(): Promise<Record<string, CoinGeckoMarket>> {
  if (cache && Date.now() - cache.ts < TTL_MS) return cache.data;
  if (inflight) return inflight;

  const ids = TOKENS.map((t) => t.coingeckoId).join(',');
  const url = `https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=usd&include_24hr_change=true&include_market_cap=true`;

  inflight = fetch(url)
    .then(async (res) => {
      if (!res.ok) throw new Error(`CoinGecko request failed (${res.status})`);
      const json = (await res.json()) as Record<string, CoinGeckoMarket>;
      cache = { data: json, ts: Date.now() };
      return json;
    })
    .finally(() => {
      inflight = null;
    });

  return inflight;
}

export async function getUsdPrice(symbol: string): Promise<number> {
  const token = getToken(symbol);
  const prices = await getMarketPrices();
  return prices[token.coingeckoId]?.usd ?? 0;
}
