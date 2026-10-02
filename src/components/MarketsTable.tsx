import { TrendingUp, TrendingDown, LineChart } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/lib/ui/Card';
import { CenteredSpinner } from '@/lib/ui/Spinner';
import { Alert, AlertTitle, AlertDescription } from '@/lib/ui/Alert';
import { EmptyState } from '@/lib/ui/EmptyState';
import { useAppData } from '@/lib/data';
import { TOKENS, MOCK_USD_PRICES, MOCK_24H_CHANGE, MOCK_MARKET_CAP } from '@/lib/tokens';
import { TokenIcon } from '@/components/TokenSelect';

interface MarketRow {
  symbol: string;
  name: string;
  priceUsd: number;
  change24hPct: number;
  marketCapUsd: number;
}

function formatUsd(n: number): string {
  if (n >= 1_000_000_000) return `$${(n / 1_000_000_000).toFixed(2)}B`;
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`;
  return `$${n.toLocaleString('en-US', { maximumFractionDigits: 2 })}`;
}

export function MarketsTable() {
  const { data, isLoading, error } = useAppData<MarketRow[]>({
    key: 'markets:overview',
    mock: TOKENS.map((t) => ({
      symbol: t.symbol,
      name: t.name,
      priceUsd: MOCK_USD_PRICES[t.symbol],
      change24hPct: MOCK_24H_CHANGE[t.symbol],
      marketCapUsd: MOCK_MARKET_CAP[t.symbol],
    })),
    fetchLive: async () => {
      throw new Error('not wired yet');
    },
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Token prices</CardTitle>
        <CardDescription>Live USD prices and 24h change for every supported token.</CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        {isLoading ? (
          <div className="py-12">
            <CenteredSpinner label="Loading market data" />
          </div>
        ) : error ? (
          <div className="px-6 pb-6">
            <Alert variant="destructive">
              <AlertTitle>Couldn't load markets</AlertTitle>
              <AlertDescription>{(error as Error).message}</AlertDescription>
            </Alert>
          </div>
        ) : !data || data.length === 0 ? (
          <div className="px-6 pb-6">
            <EmptyState icon={<LineChart size={20} />} title="No market data" description="Check back shortly." />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[520px] text-left">
              <thead>
                <tr className="border-b border-border text-micro uppercase tracking-wide text-muted-foreground">
                  <th className="px-6 py-3 font-medium">Token</th>
                  <th className="px-6 py-3 font-medium">Price</th>
                  <th className="px-6 py-3 font-medium">24h</th>
                  <th className="px-6 py-3 font-medium">Market cap</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {data.map((row) => (
                  <tr key={row.symbol} className="transition-colors duration-150 hover:bg-muted/50">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <TokenIcon symbol={row.symbol} />
                        <div>
                          <div className="text-body font-medium text-foreground">{row.symbol}</div>
                          <div className="text-micro text-muted-foreground">{row.name}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-mono tabular-nums text-body text-foreground">
                      ${row.priceUsd.toLocaleString('en-US', { maximumFractionDigits: row.priceUsd < 10 ? 4 : 2 })}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={
                          'inline-flex items-center gap-1 font-mono text-small tabular-nums ' +
                          (row.change24hPct >= 0 ? 'text-success' : 'text-destructive')
                        }
                      >
                        {row.change24hPct >= 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                        {Math.abs(row.change24hPct).toFixed(2)}%
                      </span>
                    </td>
                    <td className="px-6 py-4 font-mono tabular-nums text-small text-muted-foreground">
                      {formatUsd(row.marketCapUsd)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
