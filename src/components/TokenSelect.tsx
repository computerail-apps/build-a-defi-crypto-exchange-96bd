import { useState } from 'react';
import { ChevronDown, Check } from 'lucide-react';
import { TOKENS } from '@/lib/tokens';
import { cn } from '@/lib/cn';

interface TokenSelectProps {
  value: string;
  onChange: (symbol: string) => void;
  exclude?: string;
}

export function TokenSelect({ value, onChange, exclude }: TokenSelectProps) {
  const [open, setOpen] = useState(false);
  const options = TOKENS.filter((t) => t.symbol !== exclude);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 rounded-full border border-border bg-surface-elevated px-3 py-1.5 text-body font-medium text-foreground transition-colors duration-150 ease-out hover:bg-muted focus:outline-none focus:ring-2 focus:ring-primary"
      >
        <TokenIcon symbol={value} />
        {value}
        <ChevronDown size={14} className="text-muted-foreground" />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute left-0 top-full z-50 mt-2 w-48 rounded-lg border border-border bg-surface-elevated p-1 shadow-elev-3 animate-in">
            {options.map((t) => (
              <button
                key={t.symbol}
                type="button"
                onClick={() => {
                  onChange(t.symbol);
                  setOpen(false);
                }}
                className={cn(
                  'flex w-full items-center gap-2 rounded-md px-2 py-2 text-left text-small transition-colors duration-150 ease-out hover:bg-muted',
                )}
              >
                <TokenIcon symbol={t.symbol} />
                <span className="flex-1">
                  <span className="block font-medium text-foreground">{t.symbol}</span>
                  <span className="block text-micro text-muted-foreground">{t.name}</span>
                </span>
                {t.symbol === value && <Check size={14} className="text-primary" />}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

const TOKEN_COLORS: Record<string, string> = {
  ETH: 'bg-indigo-500/20 text-indigo-300',
  USDC: 'bg-blue-500/20 text-blue-300',
  USDT: 'bg-emerald-500/20 text-emerald-300',
  DAI: 'bg-amber-500/20 text-amber-300',
  WBTC: 'bg-orange-500/20 text-orange-300',
};

export function TokenIcon({ symbol }: { symbol: string }) {
  return (
    <span
      className={cn(
        'flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-micro font-semibold',
        TOKEN_COLORS[symbol] ?? 'bg-muted text-muted-foreground',
      )}
    >
      {symbol.slice(0, 1)}
    </span>
  );
}
