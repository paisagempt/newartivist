'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

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
        <Button
          className="w-full"
          onClick={handleConfirmDelivery}
          disabled={loading !== null}
        >
          {loading === 'confirm' && <Loader2 className="mr-2 size-4 animate-spin" />}
          Confirmar recebimento
        </Button>
      )}

      {canOpenDispute && !disputeStep && (
        <Button
          variant="outline"
          className="w-full border-red-200 text-red-600 hover:bg-red-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-950"
          onClick={() => setDisputeStep(true)}
          disabled={loading !== null}
        >
          Abrir disputa
        </Button>
      )}

      {!canOpenDispute && !disputeOpened && daysUntilDispute > 0 && (
        <p className="text-xs text-center text-muted-foreground">
          Podes abrir disputa se a encomenda não for enviada em {daysUntilDispute} dia{daysUntilDispute !== 1 ? 's' : ''}.
        </p>
      )}

      {disputeStep && (
        <div className="rounded-xl border border-red-200 dark:border-red-800 p-4 space-y-3">
          <p className="text-sm font-medium">Descreve o problema</p>
          <textarea
            value={reason}
            onChange={e => setReason(e.target.value)}
            placeholder="Ex: Passaram 20 dias e não recebi a encomenda..."
            rows={3}
            className="w-full border rounded-xl px-3 py-2.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-foreground resize-none"
          />
          <div className="flex gap-2">
            <Button
              variant="destructive"
              className="flex-1"
              onClick={handleDispute}
              disabled={!reason.trim() || loading !== null}
            >
              {loading === 'dispute' && <Loader2 className="mr-2 size-4 animate-spin" />}
              Confirmar disputa
            </Button>
            <Button variant="outline" onClick={() => setDisputeStep(false)} disabled={loading !== null}>
              Cancelar
            </Button>
          </div>
        </div>
      )}
    </section>
  );
}
