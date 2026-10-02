import { Container } from '@/lib/ui/Container';
import { HistoryList } from '@/components/HistoryList';

export function HistoryPage() {
  return (
    <Container>
      <div className="mb-8 space-y-2">
        <h1 className="text-h1 text-foreground">Swap history</h1>
        <p className="text-body text-muted-foreground">
          Every swap you've executed through Veyra, with live status from Ethereum.
        </p>
      </div>
      <HistoryList />
    </Container>
  );
}
