import { useState, useRef, useEffect } from 'react';
import { Settings2 } from 'lucide-react';
import { cn } from '@/lib/cn';

const PRESETS = [0.1, 0.5, 1.0];

interface SlippageSettingsProps {
  value: number;
  onChange: (v: number) => void;
}

export function SlippageSettings({ value, onChange }: SlippageSettingsProps) {
  const [open, setOpen] = useState(false);
  const [custom, setCustom] = useState('');
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface px-3 py-1 text-micro font-medium text-muted-foreground transition-colors duration-150 hover:text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
      >
        <Settings2 size={12} />
        {value.toFixed(2)}% slippage
      </button>
      {open && (
        <div className="absolute right-0 top-full z-20 mt-2 w-60 rounded-xl border border-border bg-surface-elevated p-3 shadow-elev-4 animate-in">
          <div className="mb-2 text-micro font-medium text-muted-foreground">Slippage tolerance</div>
          <div className="flex items-center gap-2">
            {PRESETS.map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => {
                  onChange(p);
                  setCustom('');
                }}
                className={cn(
                  'flex-1 rounded-lg border px-2 py-1.5 text-small font-medium transition-colors duration-150',
                  value === p && custom === ''
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-border text-muted-foreground hover:text-foreground'
                )}
              >
                {p}%
              </button>
            ))}
            <input
              value={custom}
              onChange={(e) => {
                const v = e.target.value.replace(/[^0-9.]/g, '');
                setCustom(v);
                const num = parseFloat(v);
                if (!isNaN(num) && num > 0 && num <= 50) onChange(num);
              }}
              placeholder="Custom"
              inputMode="decimal"
              className="w-16 rounded-lg border border-border bg-surface px-2 py-1.5 text-small text-foreground outline-none focus:border-primary"
            />
          </div>
        </div>
      )}
    </div>
  );
}
