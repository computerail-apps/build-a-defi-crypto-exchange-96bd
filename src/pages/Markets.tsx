import { Container } from '@/lib/ui/Container';
import { MarketsTable } from '@/components/MarketsTable';

export function MarketsPage() {
  return (
    <Container>
      <div className="mb-8 space-y-2">
        <h1 className="text-h1 text-foreground">Markets</h1>
        <p className="text-body text-muted-foreground">
          Live prices for every token supported by Veyra, sourced from CoinGecko.
        </p>
      </div>
      <MarketsTable />
    </Container>
  );
}
