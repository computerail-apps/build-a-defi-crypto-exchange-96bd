import { useQuery } from '@tanstack/react-query';
import { TrendingUp, TrendingDown, AlertTriangle, RefreshCw } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/lib/ui/Card';
import { Button } from '@/lib/ui/Button';
import { Alert, AlertTitle, AlertDescription } from '@/lib/ui/Alert';
import { CenteredSpinner } from '@/lib/ui/Spinner';
import { TOKENS } from '@/lib/tokens';
import { getMarketPrices } from '@/lib/coingecko';
import { TokenIcon } from '@/components/TokenSelect';

function formatUsd(n: number): string {
  if (n >= 1000) return n.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });
  return n.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 4 });
}

function formatCompact(n: number): string {
  return new Intl.NumberFormat('en-US', { notation: 'compact', maximumFractionDigits: 2 }).format(n);
}

export function MarketsTable() {
  const { data, isLoading, error, refetch, isFetching } = useQuery({
    queryKey: ['markets'],
    queryFn: getMarketPrices,
    staleTime: 30_000,
    refetchOnWindowFocus: false,
  });

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Markets</CardTitle>
          <CardDescription>Live prices from CoinGecko for all supported swap tokens.</CardDescription>
        </div>
        <Button variant="ghost" size="sm" onClick={() => refetch()} disabled={isFetching}>
          <RefreshCw size={14} className={isFetching ? 'animate-spin' : ''} />
          Refresh
        </Button>
      </CardHeader>
      <CardContent className="p-0">
        {isLoading ? (
          <div className="py-12">
            <CenteredSpinner label="Loading market data" />
          </div>
        ) : error ? (
          <div className="px-6 pb-6">
            <Alert variant="destructive">
              <AlertTriangle size={16} />
              <AlertTitle>Couldn't load market data</AlertTitle>
              <AlertDescription>{(error as Error).message}</AlertDescription>
            </Alert>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-border text-left text-micro uppercase tracking-wide text-muted-foreground">
                  <th className="px-6 py-3 font-medium">Token</th>
                  <th className="px-6 py-3 font-medium">Price</th>
                  <th className="px-6 py-3 font-medium">24h</th>
                  <th className="px-6 py-3 font-medium">Market cap</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {TOKENS.map((t) => {
                  const m = data?.[t.coingeckoId];
                  const change = m?.usd_24h_change ?? 0;
                  const positive = change >= 0;
                  return (
                    <tr key={t.symbol} className="transition-colors duration-150 hover:bg-surface">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <TokenIcon symbol={t.symbol} />
                          <div>
                            <div className="text-body font-medium text-foreground">{t.symbol}</div>
                            <div className="text-micro text-muted-foreground">{t.name}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 font-mono tabular-nums text-foreground">
                        {m ? formatUsd(m.usd) : '—'}
                      </td>
                      <td className="px-6 py-4">
                        {m ? (
                          <span
                            className={`inline-flex items-center gap-1 font-mono tabular-nums ${
                              positive ? 'text-success' : 'text-destructive'
                            }`}
                          >
                            {positive ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                            {Math.abs(change).toFixed(2)}%
                          </span>
                        ) : (
                          '—'
                        )}
                      </td>
                      <td className="px-6 py-4 font-mono tabular-nums text-muted-foreground">
                        {m ? formatCompact(m.usd_market_cap) : '—'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
