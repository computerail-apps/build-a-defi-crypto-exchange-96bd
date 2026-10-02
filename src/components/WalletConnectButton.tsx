import { Wallet, LogOut, AlertTriangle } from 'lucide-react';
import { Button } from '@/lib/ui/Button';
import { useWallet } from '@/lib/wallet-context';

function shortAddress(addr: string): string {
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}

export function WalletConnectButton() {
  const { address, connected, connecting, connect, disconnect, isWrongNetwork } = useWallet();

  if (!connected) {
    return (
      <Button size="sm" onClick={connect} disabled={connecting}>
        <Wallet size={16} />
        {connecting ? 'Connecting…' : 'Connect Wallet'}
      </Button>
    );
  }

  return (
    <div className="flex items-center gap-2">
      {isWrongNetwork && (
        <span className="inline-flex items-center gap-1 rounded-full border border-destructive/40 bg-destructive/10 px-2 py-1 text-micro text-destructive">
          <AlertTriangle size={12} />
          Wrong network
        </span>
      )}
      <Button variant="outline" size="sm" onClick={disconnect}>
        <span className="font-mono tabular-nums">{shortAddress(address!)}</span>
        <LogOut size={14} />
      </Button>
    </div>
  );
}
