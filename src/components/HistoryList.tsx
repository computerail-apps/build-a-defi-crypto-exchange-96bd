import { useQuery } from '@tanstack/react-query';
import { ExternalLink, History as HistoryIcon, AlertTriangle, Wallet } from 'lucide-react';
import { Card, CardContent } from '@/lib/ui/Card';
import { Badge } from '@/lib/ui/Badge';
import { EmptyState } from '@/lib/ui/EmptyState';
import { CenteredSpinner } from '@/lib/ui/Spinner';
import { Alert, AlertTitle, AlertDescription } from '@/lib/ui/Alert';
import { useWallet } from '@/lib/wallet-context';
import { supabase, type SwapHistoryRow } from '@/lib/supabase';

const statusVariant: Record<string, 'default' | 'success' | 'warning' | 'destructive'> = {
  pending: 'warning',
  confirmed: 'success',
  failed: 'destructive',
};

function formatAmount(n: number): string {
  return Number(n).toLocaleString('en-US', { maximumFractionDigits: 6 });
}

function relTime(iso: string): string {
  const s = Math.floor((Date.now() - Date.parse(iso)) / 1000);
  if (s < 60) return s + 's ago';
  if (s < 3600) return Math.floor(s / 60) + 'm ago';
  if (s < 86400) return Math.floor(s / 3600) + 'h ago';
  return Math.floor(s / 86400) + 'd ago';
}

export function HistoryList() {
  const { address, connected, connect } = useWallet();

  const { data, isLoading, error } = useQuery({
    queryKey: ['swap_history', address],
    enabled: !!address,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('swap_history')
        .select('id,tx_hash,from_token,to_token,from_amount,to_amount,status,wallet_address,created_at')
        .eq('wallet_address', address)
        .order('created_at', { ascending: false })
        .limit(50);
      if (error) throw error;
      return (data ?? []) as SwapHistoryRow[];
    },
  });

  if (!connected) {
    return (
      <Card>
        <CardContent className="py-12">
          <EmptyState
            icon={<Wallet size={20} />}
            title="Connect your wallet"
            description="Connect a wallet to view your real swap history."
            action={
              <button
                onClick={connect}
                className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-small font-medium text-primary-foreground transition-colors duration-150 hover:opacity-90"
              >
                <Wallet size={16} />
                Connect Wallet
              </button>
            }
          />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-0">
        {isLoading ? (
          <div className="py-12">
            <CenteredSpinner label="Loading swap history" />
          </div>
        ) : error ? (
          <div className="px-6 py-6">
            <Alert variant="destructive">
              <AlertTriangle size={16} />
              <AlertTitle>Couldn't load history</AlertTitle>
              <AlertDescription>{(error as Error).message}</AlertDescription>
            </Alert>
          </div>
        ) : !data || data.length === 0 ? (
          <div className="px-6 py-6">
            <EmptyState
              icon={<HistoryIcon size={20} />}
              title="No swaps yet"
              description="Your completed swaps will show up here with real transaction hashes."
            />
          </div>
        ) : (
          <ul className="divide-y divide-border">
            {data.map((h) => (
              <li key={h.id} className="flex flex-wrap items-center gap-4 px-6 py-4">
                <Badge variant={statusVariant[h.status] ?? 'default'}>{h.status}</Badge>
                <div className="font-mono text-small tabular-nums text-foreground">
                  {formatAmount(h.from_amount)} {h.from_token} → {formatAmount(h.to_amount)} {h.to_token}
                </div>
                <a
                  href={`https://etherscan.io/tx/${h.tx_hash}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 font-mono text-micro text-primary transition-colors duration-150 hover:underline"
                >
                  {h.tx_hash.slice(0, 10)}…{h.tx_hash.slice(-8)}
                  <ExternalLink size={12} />
                </a>
                <span className="ml-auto text-small text-muted-foreground">{relTime(h.created_at)}</span>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
