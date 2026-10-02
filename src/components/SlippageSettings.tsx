import { useState } from 'react';
import { Settings2 } from 'lucide-react';
import { Button } from '@/lib/ui/Button';
import { Badge } from '@/lib/ui/Badge';
import { cn } from '@/lib/cn';

const PRESETS = [0.1, 0.5, 1.0];

interface SlippageSettingsProps {
  value: number;
  onChange: (v: number) => void;
}

export function SlippageSettings({ value, onChange }: SlippageSettingsProps) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="transition-transform duration-150 ease-out hover:scale-[1.03]"
      >
        <Badge variant="outline" className="cursor-pointer gap-1">
          <Settings2 size={12} />
          {value}% slippage
        </Badge>
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full z-50 mt-2 w-64 rounded-lg border border-border bg-surface-elevated p-3 shadow-elev-3 animate-in">
            <div className="mb-2 text-small text-muted-foreground">Slippage tolerance</div>
            <div className="flex gap-2">
              {PRESETS.map((p) => (
                <Button
                  key={p}
                  size="sm"
                  variant={value === p ? 'default' : 'outline'}
                  className={cn('flex-1')}
                  onClick={() => onChange(p)}
                >
                  {p}%
                </Button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
