import { ExternalLink, History as HistoryIcon, ArrowRight } from 'lucide-react';
import { Card, CardContent } from '@/lib/ui/Card';
import { Badge } from '@/lib/ui/Badge';
import { CenteredSpinner } from '@/lib/ui/Spinner';
import { Alert, AlertTitle, AlertDescription } from '@/lib/ui/Alert';
import { EmptyState } from '@/lib/ui/EmptyState';
import { useAppData } from '@/lib/data';
import { useWallet, truncateAddress } from '@/lib/wallet-context';
import { TokenIcon } from '@/components/TokenSelect';

type SwapStatus = 'confirmed' | 'pending' | 'failed';

interface SwapHistoryItem {
  txHash: string;
  fromToken: string;
  toToken: string;
  fromAmount: number;
  toAmount: number;
  status: SwapStatus;
  createdAt: string;
}

const statusVariant: Record<SwapStatus, 'success' | 'warning' | 'destructive'> = {
  confirmed: 'success',
  pending: 'warning',
  failed: 'destructive',
};

function relTime(iso: string): string {
  const s = Math.floor((Date.now() - Date.parse(iso)) / 1000);
  if (s < 60) return `${s}s ago`;
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

const MOCK_HISTORY: SwapHistoryItem[] = [
  {
    txHash: '0x8f2a3c9e1b4d7a6f0c5e2d9b8a7c6f1e3d4b5a6c7e8f9a0b1c2d3e4f5a6b7c8d',
    fromToken: 'ETH',
    toToken: 'USDC',
    fromAmount: 1.5,
    toAmount: 5160.42,
    status: 'confirmed',
    createdAt: new Date(Date.now() - 1000 * 60 * 12).toISOString(),
  },
  {
    txHash: '0x1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e',
    fromToken: 'USDC',
    toToken: 'WBTC',
    fromAmount: 2500,
    toAmount: 0.026,
    status: 'confirmed',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(),
  },
  {
    txHash: '0x3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b',
    fromToken: 'DAI',
    toToken: 'ETH',
    fromAmount: 1000,
    toAmount: 0.2898,
    status: 'pending',
    createdAt: new Date(Date.now() - 1000 * 60 * 2).toISOString(),
  },
  {
    txHash: '0x5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f',
    fromToken: 'WBTC',
    toToken: 'USDT',
    fromAmount: 0.05,
    toAmount: 4810.0,
    status: 'failed',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 26).toISOString(),
  },
];

export function HistoryList() {
  const { address, connected } = useWallet();

  const { data, isLoading, error } = useAppData<SwapHistoryItem[]>({
    key: `history:${address ?? 'anon'}`,
    mock: connected ? MOCK_HISTORY : [],
    fetchLive: async () => {
      throw new Error('not wired yet');
    },
  });

  if (!connected) {
    return (
      <Card>
        <CardContent className="py-12">
          <EmptyState
            icon={<HistoryIcon size={20} />}
            title="Connect your wallet"
            description="Connect your wallet to view your past swaps."
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
              <AlertTitle>Couldn't load history</AlertTitle>
              <AlertDescription>{(error as Error).message}</AlertDescription>
            </Alert>
          </div>
        ) : !data || data.length === 0 ? (
          <div className="px-6 py-6">
            <EmptyState
              icon={<HistoryIcon size={20} />}
              title="No swaps yet"
              description="Your completed swaps will show up here with their transaction hash."
            />
          </div>
        ) : (
          <ul className="divide-y divide-border">
            {data.map((item) => (
              <li key={item.txHash} className="flex flex-col gap-3 px-6 py-4 md:flex-row md:items-center md:gap-4">
                <div className="flex items-center gap-2">
                  <Badge variant={statusVariant[item.status]} className="capitalize">
                    {item.status}
                  </Badge>
                </div>
                <div className="flex flex-1 items-center gap-2 text-body">
                  <TokenIcon symbol={item.fromToken} />
                  <span className="font-mono tabular-nums">{item.fromAmount}</span>
                  <span className="text-muted-foreground">{item.fromToken}</span>
                  <ArrowRight size={14} className="mx-1 text-muted-foreground" />
                  <TokenIcon symbol={item.toToken} />
                  <span className="font-mono tabular-nums">{item.toAmount}</span>
                  <span className="text-muted-foreground">{item.toToken}</span>
                </div>
                <div className="flex items-center gap-4 text-small text-muted-foreground">
                  <span className="tabular-nums">{relTime(item.createdAt)}</span>
                  <a
                    href={`https://etherscan.io/tx/${item.txHash}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 font-mono text-small text-primary transition-colors duration-150 hover:text-primary/80"
                  >
                    {truncateAddress(item.txHash)}
                    <ExternalLink size={12} />
                  </a>
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
