import { Container } from '@/lib/ui/Container';
import { SwapCard } from '@/components/SwapCard';

export function SwapPage() {
  return (
    <Container className="max-w-xl">
      <div className="mb-8 space-y-2 text-center">
        <h1 className="text-display text-foreground">Swap tokens instantly</h1>
        <p className="text-body text-muted-foreground">
          Live on-chain quotes from Uniswap V3, executed directly from your own wallet.
        </p>
      </div>
      <SwapCard />
    </Container>
  );
}
