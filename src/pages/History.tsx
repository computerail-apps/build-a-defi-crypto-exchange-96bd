import { Container } from '@/lib/ui/Container';
import { HistoryList } from '@/components/HistoryList';

export function History() {
  return (
    <Container>
      <div className="space-y-6">
        <div className="space-y-2">
          <h1 className="text-h1 text-foreground">Swap history</h1>
          <p className="text-body text-muted-foreground">
            Your completed swaps with real transaction hashes, linked to Etherscan.
          </p>
        </div>
        <HistoryList />
      </div>
    </Container>
  );
}
