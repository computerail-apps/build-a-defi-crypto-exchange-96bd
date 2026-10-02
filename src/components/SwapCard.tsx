import { useMemo, useState } from 'react';
import { ArrowDown, Loader2, AlertTriangle, Wallet, Fuel } from 'lucide-react';
import { Card, CardContent } from '@/lib/ui/Card';
import { Button } from '@/lib/ui/Button';
import { Alert, AlertTitle, AlertDescription } from '@/lib/ui/Alert';
import { useAppData } from '@/lib/data';
import { useWallet } from '@/lib/wallet-context';
import { TOKENS, MOCK_USD_PRICES, getToken } from '@/lib/tokens';
import { TokenSelect, TokenIcon } from '@/components/TokenSelect';
import { SlippageSettings } from '@/components/SlippageSettings';

interface QuoteResult {
  toAmount: number;
  rate: number;
  priceImpactPct: number;
  minReceived: number;
  gasEstimateUsd: number;
}

interface BalanceResult {
  balance: number;
}

function formatAmount(n: number, maxDecimals = 6): string {
  if (!isFinite(n)) return '0';
  return n.toLocaleString('en-US', { maximumFractionDigits: maxDecimals });
}

export function SwapCard() {
  const { connected, connect, address } = useWallet();
  const [fromSymbol, setFromSymbol] = useState('ETH');
  const [toSymbol, setToSymbol] = useState('USDC');
  const [fromAmount, setFromAmount] = useState('1.0');
  const [slippage, setSlippage] = useState(0.5);
  const [justSwapped, setJustSwapped] = useState<string | null>(null);

  const parsedAmount = parseFloat(fromAmount) || 0;

  const {
    data: quote,
    isLoading: quoteLoading,
    error: quoteError,
  } = useAppData<QuoteResult>({
    key: `quote:${fromSymbol}:${toSymbol}:${parsedAmount}`,
    mock: (() => {
      const fromPrice = MOCK_USD_PRICES[fromSymbol] ?? 1;
      const toPrice = MOCK_USD_PRICES[toSymbol] ?? 1;
      const rate = fromPrice / toPrice;
      const toAmount = parsedAmount * rate * 0.997; // simulate pool fee
      return {
        toAmount,
        rate,
        priceImpactPct: 0.04,
        minReceived: toAmount * (1 - slippage / 100),
        gasEstimateUsd: 4.86,
      };
    })(),
    fetchLive: async () => {
      throw new Error('not wired yet');
    },
  });

  const { data: balance } = useAppData<BalanceResult>({
    key: `balance:${address ?? 'none'}:${fromSymbol}`,
    mock: { balance: fromSymbol === 'ETH' ? 2.4821 : fromSymbol === 'WBTC' ? 0.0412 : 5230.18 },
    fetchLive: async () => {
      throw new Error('not wired yet');
    },
  });

  const fromUsd = parsedAmount * (MOCK_USD_PRICES[fromSymbol] ?? 0);
  const toUsd = (quote?.toAmount ?? 0) * (MOCK_USD_PRICES[toSymbol] ?? 0);

  const disabledReason = useMemo(() => {
    if (!connected) return 'Connect your wallet to swap';
    if (parsedAmount <= 0) return 'Enter an amount to swap';
    if (balance && parsedAmount > balance.balance) return `Insufficient ${fromSymbol} balance`;
    if (quoteLoading) return 'Fetching live quote…';
    if (quoteError) return 'No live quote available';
    if (!quote) return 'No live quote available';
    return null;
  }, [connected, parsedAmount, balance, fromSymbol, quoteLoading, quoteError, quote]);

  const [executing, setExecuting] = useState(false);

  function handleFlip() {
    setFromSymbol(toSymbol);
    setToSymbol(fromSymbol);
  }

  async function handleSwap() {
    if (disabledReason) return;
    setExecuting(true);
    setJustSwapped(null);
    try {
      // Phase 2 wires this to wagmi/viem: ERC-20 approve (if needed) then
      // SwapRouter02.exactInputSingle, followed by a Supabase insert into
      // swap_history once the receipt confirms.
      await new Promise((resolve) => setTimeout(resolve, 900));
      setJustSwapped(`Swap submitted: ${fromAmount} ${fromSymbol} → ${formatAmount(quote?.toAmount ?? 0)} ${toSymbol}`);
    } finally {
      setExecuting(false);
    }
  }

  return (
    <Card className="border-border/60 bg-surface-elevated/80 shadow-elev-3 backdrop-blur-xl">
      <CardContent className="space-y-2 p-4 md:p-5">
        <div className="flex items-center justify-between px-1 pb-1">
          <span className="text-small font-medium text-muted-foreground">Swap</span>
          <SlippageSettings value={slippage} onChange={setSlippage} />
        </div>

        {/* You pay */}
        <div className="rounded-2xl border border-border bg-surface p-4 transition-colors duration-150">
          <div className="mb-2 flex items-center justify-between text-micro text-muted-foreground">
            <span>You pay</span>
            {connected && balance && (
              <button
                type="button"
                className="transition-colors duration-150 hover:text-foreground"
                onClick={() => setFromAmount(String(balance.balance))}
              >
                Balance: <span className="font-mono tabular-nums">{formatAmount(balance.balance)}</span>
              </button>
            )}
          </div>
          <div className="flex items-center gap-3">
            <input
              value={fromAmount}
              onChange={(e) => setFromAmount(e.target.value.replace(/[^0-9.]/g, ''))}
              placeholder="0.0"
              inputMode="decimal"
              className="w-full bg-transparent font-mono text-h2 tabular-nums text-foreground outline-none placeholder:text-muted-foreground"
            />
            <TokenSelect value={fromSymbol} onChange={setFromSymbol} exclude={toSymbol} />
          </div>
          <div className="mt-1 text-micro text-muted-foreground">${formatAmount(fromUsd, 2)}</div>
        </div>

        {/* Flip button */}
        <div className="relative z-10 -my-3 flex justify-center">
          <button
            type="button"
            onClick={handleFlip}
            aria-label="Flip tokens"
            className="flex h-9 w-9 items-center justify-center rounded-full border border-border bg-surface-elevated text-muted-foreground shadow-elev-2 transition-all duration-150 ease-out hover:rotate-180 hover:text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <ArrowDown size={16} />
          </button>
        </div>

        {/* You receive */}
        <div className="rounded-2xl border border-border bg-surface p-4">
          <div className="mb-2 text-micro text-muted-foreground">You receive</div>
          <div className="flex items-center gap-3">
            <div className="w-full font-mono text-h2 tabular-nums text-foreground">
              {quoteLoading ? (
                <span className="inline-block h-8 w-32 animate-pulse-soft rounded skeleton" />
              ) : (
                formatAmount(quote?.toAmount ?? 0)
              )}
            </div>
            <TokenSelect value={toSymbol} onChange={setToSymbol} exclude={fromSymbol} />
          </div>
          <div className="mt-1 text-micro text-muted-foreground">${formatAmount(toUsd, 2)}</div>
        </div>

        {/* Rate summary */}
        {quote && !quoteError && (
          <div className="space-y-1.5 rounded-xl border border-border/60 bg-surface px-4 py-3 text-small animate-in">
            <Row
              label="Rate"
              value={`1 ${fromSymbol} = ${formatAmount(quote.rate, 6)} ${toSymbol}`}
            />
            <Row label="Price impact" value={`${quote.priceImpactPct.toFixed(2)}%`} />
            <Row label="Minimum received" value={`${formatAmount(quote.minReceived)} ${toSymbol}`} />
            <Row
              label={
                <span className="inline-flex items-center gap-1">
                  <Fuel size={12} /> Network fee
                </span>
              }
              value={`~$${quote.gasEstimateUsd.toFixed(2)}`}
            />
          </div>
        )}

        {quoteError && (
          <Alert variant="destructive">
            <AlertTriangle size={16} />
            <AlertTitle>Quote unavailable</AlertTitle>
            <AlertDescription>{(quoteError as Error).message}</AlertDescription>
          </Alert>
        )}

        {justSwapped && (
          <Alert variant="default" className="border-success/40 bg-success/10">
            <AlertTitle>Transaction submitted</AlertTitle>
            <AlertDescription>{justSwapped}</AlertDescription>
          </Alert>
        )}

        {!connected ? (
          <Button size="lg" className="w-full" onClick={connect}>
            <Wallet size={18} />
            Connect Wallet
          </Button>
        ) : (
          <Button
            size="lg"
            className="w-full"
            disabled={!!disabledReason || executing}
            onClick={handleSwap}
            title={disabledReason ?? undefined}
          >
            {executing ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                Confirm in wallet…
              </>
            ) : disabledReason ? (
              disabledReason
            ) : (
              'Swap'
            )}
          </Button>
        )}

        <div className="flex items-center justify-center gap-4 pt-1">
          {TOKENS.map((t) => (
            <div key={t.symbol} className="flex items-center gap-1 opacity-60">
              <TokenIcon symbol={t.symbol} />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function Row({ label, value }: { label: React.ReactNode; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-mono tabular-nums text-foreground">{value}</span>
    </div>
  );
}
