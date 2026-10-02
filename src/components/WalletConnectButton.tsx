import { Button } from '@/lib/ui/Button';
import { Wallet, CircleCheck, LogOut } from 'lucide-react';
import { useState } from 'react';
import { useWallet, truncateAddress } from '@/lib/wallet-context';

export function WalletConnectButton() {
  const { connected, address, chainName, connect, disconnect } = useWallet();
  const [open, setOpen] = useState(false);

  if (!connected || !address) {
    return (
      <Button size="sm" onClick={connect}>
        <Wallet size={16} />
        Connect Wallet
      </Button>
    );
  }

  return (
    <div className="relative">
      <Button size="sm" variant="outline" onClick={() => setOpen((o) => !o)}>
        <CircleCheck size={16} className="text-success" />
        <span className="font-mono text-small">{truncateAddress(address)}</span>
      </Button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full z-50 mt-2 w-56 rounded-lg border border-border bg-surface-elevated p-3 shadow-elev-3 animate-in">
            <div className="mb-2 space-y-0.5">
              <div className="text-micro text-muted-foreground">{chainName}</div>
              <div className="font-mono text-small text-foreground">{truncateAddress(address)}</div>
            </div>
            <Button
              size="sm"
              variant="ghost"
              className="w-full justify-start"
              onClick={() => {
                disconnect();
                setOpen(false);
              }}
            >
              <LogOut size={14} />
              Disconnect
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
