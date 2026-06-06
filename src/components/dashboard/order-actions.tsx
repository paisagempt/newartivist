'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

type Props = {
  saleId: string;
  fulfillmentStatus: string;
  canOpenDispute: boolean;
  daysUntilDispute: number;
  disputeOpened: boolean;
};

export function OrderActions({ saleId, fulfillmentStatus, canOpenDispute, daysUntilDispute, disputeOpened }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState<'confirm' | 'dispute' | null>(null);
  const [disputeStep, setDisputeStep] = useState(false);
  const [reason, setReason] = useState('');

  async function handleConfirmDelivery() {
    if (!confirm('Confirmas que recebeste a encomenda? O pagamento ao artista será libertado.')) return;
    setLoading('confirm');
    try {
      const res = await fetch('/api/orders/confirm-delivery', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ saleId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Erro ao confirmar.');
      toast.success('Recebimento confirmado! Obrigado.');
      router.refresh();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(null);
    }
  }

  async function handleDispute() {
    if (!reason.trim()) return;
    setLoading('dispute');
    try {
      const res = await fetch('/api/orders/dispute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ saleId, reason }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Erro ao abrir disputa.');
      toast.success('Disputa aberta. A equipa Artivist irá contactar-te.');
      router.refresh();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(null);
      setDisputeStep(false);
    }
  }

  if (disputeOpened) return null;

  return (
    <section className="space-y-3">
      {fulfillmentStatus === 'shipped' && (
        <button
          className="w-full bg-foreground text-background py-3 text-sm font-medium uppercase tracking-widest hover:bg-foreground/85 transition-colors disabled:opacity-30"
          onClick={handleConfirmDelivery}
          disabled={loading !== null}
        >
          {loading === 'confirm' ? (
            <span className="flex items-center justify-center gap-2">
              <Loader2 className="size-3 animate-spin" />
              A confirmar...
            </span>
          ) : 'Confirmar recebimento'}
        </button>
      )}

      {canOpenDispute && !disputeStep && (
        <button
          className="w-full border border-border py-3 text-sm font-medium uppercase tracking-widest text-muted-foreground hover:border-foreground hover:text-foreground transition-colors disabled:opacity-30"
          onClick={() => setDisputeStep(true)}
          disabled={loading !== null}
        >
          Abrir disputa
        </button>
      )}

      {!canOpenDispute && !disputeOpened && daysUntilDispute > 0 && (
        <p className="text-xs text-center text-muted-foreground">
          Podes abrir disputa se a encomenda não for enviada em {daysUntilDispute} dia{daysUntilDispute !== 1 ? 's' : ''}.
        </p>
      )}

      {disputeStep && (
        <div className="border border-border bg-card p-5 space-y-4">
          <p className="text-xs font-medium uppercase tracking-[0.15em] text-muted-foreground">Descreve o problema</p>
          <textarea
            value={reason}
            onChange={e => setReason(e.target.value)}
            placeholder="Ex: Passaram 20 dias e não recebi a encomenda..."
            rows={3}
            className="w-full border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-foreground transition-colors resize-none placeholder:text-muted-foreground"
          />
          <div className="flex gap-2">
            <button
              className="flex-1 flex items-center justify-center gap-2 bg-destructive text-white py-2.5 text-xs font-medium uppercase tracking-widest hover:bg-destructive/90 transition-colors disabled:opacity-30"
              onClick={handleDispute}
              disabled={!reason.trim() || loading !== null}
            >
              {loading === 'dispute' && <Loader2 className="size-3 animate-spin" />}
              Confirmar disputa
            </button>
            <button
              className="px-4 border border-border py-2.5 text-xs font-medium uppercase tracking-widest hover:bg-muted transition-colors disabled:opacity-30"
              onClick={() => setDisputeStep(false)}
              disabled={loading !== null}
            >
              Cancelar
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
