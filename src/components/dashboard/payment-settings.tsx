'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

type Props = {
  walletAddress: string | null;
  stripeConnected: boolean;
  totalPendingEur: number;
};

export function PaymentSettings({ walletAddress, stripeConnected, totalPendingEur }: Props) {
  const [customWallet, setCustomWallet] = useState('');
  const [savingWallet, setSavingWallet] = useState(false);
  const [loadingStripe, setLoadingStripe] = useState(false);
  const [loadingWithdraw, setLoadingWithdraw] = useState(false);

  async function handleSaveWallet() {
    if (!customWallet.trim()) return;
    setSavingWallet(true);
    try {
      const res = await fetch('/api/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ wallet_address: customWallet.trim() }),
      });
      if (!res.ok) throw new Error('Erro ao guardar carteira.');
      toast.success('Carteira actualizada! Os próximos pagamentos USDC vão para este endereço.');
      setCustomWallet('');
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSavingWallet(false);
    }
  }

  async function handleConnectStripe() {
    setLoadingStripe(true);
    try {
      const res = await fetch('/api/stripe/connect', { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Erro ao ligar conta.');
      window.location.href = data.url;
    } catch (err: any) {
      toast.error(err.message);
      setLoadingStripe(false);
    }
  }

  async function handleWithdraw() {
    if (!confirm(`Levantar €${totalPendingEur.toFixed(2)} para a tua conta bancária?`)) return;
    setLoadingWithdraw(true);
    try {
      const res = await fetch('/api/stripe/withdraw', { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Erro ao levantar.');
      toast.success(`€${data.amountEur.toFixed(2)} transferidos para a tua conta bancária.`);
      window.location.reload();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoadingWithdraw(false);
    }
  }

  return (
    <div className="space-y-4">
      {/* Opção 1: Levantar em euros */}
      <section className="rounded-2xl border bg-white dark:bg-zinc-900 p-6 space-y-4">
        <div>
          <h2 className="font-semibold">Levantar em euros</h2>
          <p className="text-sm text-muted-foreground mt-1">Recebe directamente na tua conta bancária via Stripe. Sem necessidade de carteira cripto.</p>
        </div>

        {stripeConnected ? (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm text-green-600">
              <span className="w-2 h-2 rounded-full bg-green-500 inline-block" />
              Conta bancária ligada
            </div>
            <Button
              onClick={handleWithdraw}
              disabled={loadingWithdraw || totalPendingEur < 1}
              className="w-full"
            >
              {loadingWithdraw && <Loader2 className="mr-2 size-4 animate-spin" />}
              {totalPendingEur >= 1
                ? `Levantar €${totalPendingEur.toFixed(2)}`
                : 'Sem saldo suficiente (mín. €1)'}
            </Button>
          </div>
        ) : (
          <Button onClick={handleConnectStripe} disabled={loadingStripe} variant="outline" className="w-full">
            {loadingStripe && <Loader2 className="mr-2 size-4 animate-spin" />}
            Ligar conta bancária
          </Button>
        )}
      </section>

      {/* Opção 2: Receber em USDC (carteira própria) */}
      <section className="rounded-2xl border bg-white dark:bg-zinc-900 p-6 space-y-4">
        <div>
          <h2 className="font-semibold">Receber em USDC (carteira própria)</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Liga a tua própria carteira Solana (Phantom, Backpack, etc.) para receber USDC directamente on-chain.
          </p>
        </div>

        {walletAddress && (
          <div className="rounded-lg bg-zinc-50 dark:bg-zinc-800 px-3 py-2 text-xs font-mono text-muted-foreground break-all">
            Carteira actual: {walletAddress}
          </div>
        )}

        <div className="flex gap-2">
          <input
            type="text"
            value={customWallet}
            onChange={e => setCustomWallet(e.target.value)}
            placeholder="Endereço Solana (ex: 4pBBm...)"
            className="flex-1 border rounded-xl px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-foreground font-mono"
          />
          <Button
            onClick={handleSaveWallet}
            disabled={savingWallet || !customWallet.trim()}
            variant="outline"
          >
            {savingWallet && <Loader2 className="mr-2 size-4 animate-spin" />}
            Guardar
          </Button>
        </div>
      </section>
    </div>
  );
}
