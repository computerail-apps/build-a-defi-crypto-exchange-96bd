import { Container } from '@/lib/ui/Container';
import { SwapCard } from '@/components/SwapCard';

export function Swap() {
  return (
    <Container>
      <div className="mx-auto max-w-md space-y-6">
        <div className="space-y-2 text-center">
          <h1 className="text-h1 text-foreground">Swap tokens instantly</h1>
          <p className="text-body text-muted-foreground">
            Live Uniswap V3 quotes, signed and executed directly from your own wallet.
          </p>
        </div>
        <SwapCard />
      </div>
    </Container>
  );
}
