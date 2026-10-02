import { useMemo, useState } from 'react';
import { ArrowDown, Loader2, AlertTriangle, Wallet, Fuel, CheckCircle2, ExternalLink } from 'lucide-react';
import { Card, CardContent } from '@/lib/ui/Card';
import { Button } from '@/lib/ui/Button';
import { Alert, AlertTitle, AlertDescription } from '@/lib/ui/Alert';
import { useAppData } from '@/lib/data';
import { useWallet } from '@/lib/wallet-context';
import { TOKENS } from '@/lib/tokens';
import { getUsdPrice } from '@/lib/coingecko';
import { getSwapQuote, getTokenBalance, executeSwap, publicClient, type QuoteResult } from '@/lib/uniswap';
import { supabase } from '@/lib/supabase';
import { TokenSelect, TokenIcon } from '@/components/TokenSelect';
import { SlippageSettings } from '@/components/SlippageSettings';

function formatAmount(n: number, maxDecimals = 6): string {
  if (!isFinite(n)) return '0';
  return n.toLocaleString('en-US', { maximumFractionDigits: maxDecimals });
}

export function SwapCard() {
  const { connected, connect, address, walletClient, isWrongNetwork, error: walletError } = useWallet();
  const [fromSymbol, setFromSymbol] = useState('ETH');
  const [toSymbol, setToSymbol] = useState('USDC');
  const [fromAmount, setFromAmount] = useState('1.0');
  const [slippage, setSlippage] = useState(0.5);
  const [submitted, setSubmitted] = useState<{ hash: string; message: string } | null>(null);
  const [executeError, setExecuteError] = useState<string | null>(null);

  const parsedAmount = parseFloat(fromAmount) || 0;

  const {
    data: quote,
    isLoading: quoteLoading,
    error: quoteError,
  } = useAppData<QuoteResult | null>({
    key: `quote:${fromSymbol}:${toSymbol}:${parsedAmount}:${slippage}`,
    mock: null,
    fetchLive: async () => {
      if (parsedAmount <= 0) throw new Error('Enter an amount to swap');
      return getSwapQuote({ fromSymbol, toSymbol, amountIn: parsedAmount, slippagePct: slippage });
    },
  });

  // Wallet token balance for the currently selected "from" asset, read live from RPC.
  const { data: walletBalance } = useAppData<number | null>({
    key: `balance:${address ?? 'none'}:${fromSymbol}`,
    mock: null,
    fetchLive: async () => {
      if (!address) return null;
      return getTokenBalance(fromSymbol, address);
    },
  });

  const { data: fromUsdPrice } = useAppData<number | null>({
    key: `usd:${fromSymbol}`,
    mock: null,
    fetchLive: () => getUsdPrice(fromSymbol),
  });
  const { data: toUsdPrice } = useAppData<number | null>({
    key: `usd:${toSymbol}`,
    mock: null,
    fetchLive: () => getUsdPrice(toSymbol),
  });

  const fromUsd = parsedAmount * (fromUsdPrice ?? 0);
  const toUsd = (quote?.toAmount ?? 0) * (toUsdPrice ?? 0);

  const disabledReason = useMemo(() => {
    if (!connected) return 'Connect your wallet to swap';
    if (isWrongNetwork) return 'Switch your wallet to Ethereum Mainnet';
    if (parsedAmount <= 0) return 'Enter an amount to swap';
    if (walletBalance !== null && walletBalance !== undefined && parsedAmount > walletBalance) return `Insufficient ${fromSymbol} balance`;
    if (quoteLoading) return 'Fetching live quote…';
    if (quoteError) return 'No live quote available';
    if (!quote) return 'No live quote available';
    return null;
  }, [connected, isWrongNetwork, parsedAmount, walletBalance, fromSymbol, quoteLoading, quoteError, quote]);

  const [executing, setExecuting] = useState(false);

  function handleFlip() {
    setFromSymbol(toSymbol);
    setToSymbol(fromSymbol);
    setSubmitted(null);
    setExecuteError(null);
  }

  async function handleSwap() {
    if (disabledReason || !quote || !walletClient || !address) return;
    setExecuting(true);
    setSubmitted(null);
    setExecuteError(null);
    try {
      const hash = await executeSwap({
        walletClient,
        account: address,
        fromSymbol,
        toSymbol,
        amountIn: parsedAmount,
        minAmountOut: quote.minReceived,
        fee: quote.fee,
      });

      await supabase.from('swap_history').insert({
        tx_hash: hash,
        from_token: fromSymbol,
        to_token: toSymbol,
        from_amount: parsedAmount,
        to_amount: quote.toAmount,
        status: 'pending',
        wallet_address: address,
      });

      setSubmitted({ hash, message: `${fromAmount} ${fromSymbol} → ${formatAmount(quote.toAmount)} ${toSymbol}` });

      publicClient
        .waitForTransactionReceipt({ hash: hash as `0x${string}` })
        .then(async (receipt) => {
          await supabase
            .from('swap_history')
            .update({ status: receipt.status === 'success' ? 'confirmed' : 'failed' })
            .eq('tx_hash', hash);
        })
        .catch(async () => {
          await supabase.from('swap_history').update({ status: 'failed' }).eq('tx_hash', hash);
        });
    } catch (err) {
      setExecuteError(err instanceof Error ? err.message : 'Swap failed');
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
            {connected && walletBalance !== null && walletBalance !== undefined && (
              <button
                type="button"
                className="transition-colors duration-150 hover:text-foreground"
                onClick={() => setFromAmount(String(walletBalance))}
              >
                Balance: <span className="font-mono tabular-nums">{formatAmount(walletBalance)}</span>
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

        {quoteError && parsedAmount > 0 && (
          <Alert variant="destructive">
            <AlertTriangle size={16} />
            <AlertTitle>Quote unavailable</AlertTitle>
            <AlertDescription>{(quoteError as Error).message}</AlertDescription>
          </Alert>
        )}

        {executeError && (
          <Alert variant="destructive">
            <AlertTriangle size={16} />
            <AlertTitle>Swap failed</AlertTitle>
            <AlertDescription>{executeError}</AlertDescription>
          </Alert>
        )}

        {walletError && (
          <Alert variant="destructive">
            <AlertTriangle size={16} />
            <AlertTitle>Wallet error</AlertTitle>
            <AlertDescription>{walletError}</AlertDescription>
          </Alert>
        )}

        {submitted && (
          <Alert variant="default" className="border-success/40 bg-success/10">
            <CheckCircle2 size={16} />
            <AlertTitle>Transaction submitted</AlertTitle>
            <AlertDescription>
              <div className="flex flex-col gap-1">
                <span>{submitted.message}</span>
                <a
                  href={`https://etherscan.io/tx/${submitted.hash}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 font-mono text-micro text-primary transition-colors duration-150 hover:underline"
                >
                  {submitted.hash.slice(0, 10)}…{submitted.hash.slice(-8)}
                  <ExternalLink size={12} />
                </a>
              </div>
            </AlertDescription>
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
