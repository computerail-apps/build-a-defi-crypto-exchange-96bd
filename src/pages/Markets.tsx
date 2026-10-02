import { Container } from '@/lib/ui/Container';
import { MarketsTable } from '@/components/MarketsTable';

export function Markets() {
  return (
    <Container>
      <div className="space-y-6">
        <div className="space-y-2">
          <h1 className="text-h1 text-foreground">Markets</h1>
          <p className="text-body text-muted-foreground">
            Live token prices, 24h change, and market cap from CoinGecko.
          </p>
        </div>
        <MarketsTable />
      </div>
    </Container>
  );
}
