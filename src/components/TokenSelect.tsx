import { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';
import { TOKENS } from '@/lib/tokens';
import { cn } from '@/lib/cn';

const TOKEN_COLORS: Record<string, string> = {
  ETH: 'bg-[#627EEA]/20 text-[#8CA2F0]',
  USDC: 'bg-[#2775CA]/20 text-[#6AA7E6]',
  USDT: 'bg-[#26A17B]/20 text-[#5FC7A6]',
  DAI: 'bg-[#F5AC37]/20 text-[#F5C978]',
  WBTC: 'bg-[#F7931A]/20 text-[#F9B355]',
};

export function TokenIcon({ symbol }: { symbol: string }) {
  const cls = TOKEN_COLORS[symbol] ?? 'bg-muted text-muted-foreground';
  return (
    <div className={cn('flex h-7 w-7 items-center justify-center rounded-full text-micro font-semibold', cls)}>
      {symbol.slice(0, 1)}
    </div>
  );
}

interface TokenSelectProps {
  value: string;
  onChange: (symbol: string) => void;
  exclude?: string;
}

export function TokenSelect({ value, onChange, exclude }: TokenSelectProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  const options = TOKENS.filter((t) => t.symbol !== exclude);

  return (
    <div className="relative shrink-0" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 rounded-full border border-border bg-surface-elevated py-1.5 pl-1.5 pr-3 text-body font-medium text-foreground shadow-elev-1 transition-colors duration-150 hover:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary"
      >
        <TokenIcon symbol={value} />
        {value}
        <ChevronDown size={14} className="text-muted-foreground" />
      </button>
      {open && (
        <div className="absolute right-0 top-full z-20 mt-2 w-56 overflow-hidden rounded-xl border border-border bg-surface-elevated shadow-elev-4 animate-in">
          {options.map((t) => (
            <button
              key={t.symbol}
              type="button"
              onClick={() => {
                onChange(t.symbol);
                setOpen(false);
              }}
              className="flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors duration-150 hover:bg-surface"
            >
              <TokenIcon symbol={t.symbol} />
              <div className="flex-1">
                <div className="text-body text-foreground">{t.symbol}</div>
                <div className="text-micro text-muted-foreground">{t.name}</div>
              </div>
              {t.symbol === value && <Check size={14} className="text-primary" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
