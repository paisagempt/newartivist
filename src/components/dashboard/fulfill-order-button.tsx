'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

export function FulfillOrderButton({ saleId }: { saleId: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [tracking, setTracking] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleShip() {
    setLoading(true);
    try {
      const res = await fetch('/api/orders/ship', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ saleId, trackingNumber: tracking || undefined }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Erro ao actualizar');
      toast.success('Encomenda marcada como enviada.');
      router.refresh();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
      setOpen(false);
    }
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="w-full border border-border bg-background py-2.5 text-xs font-medium uppercase tracking-widest hover:bg-muted hover:border-foreground transition-colors"
      >
        Registar envio
      </button>
    );
  }

  return (
    <div className="border border-border bg-background p-4 space-y-3">
      <div className="space-y-1.5">
        <label className="block text-xs text-muted-foreground uppercase tracking-[0.15em]">
          Código de rastreio
        </label>
        <input
          type="text"
          value={tracking}
          onChange={e => setTracking(e.target.value)}
          placeholder="Ex: PT123456789PT"
          autoFocus
          className="w-full border border-border bg-background px-3 py-2.5 text-sm font-mono outline-none focus:border-foreground transition-colors placeholder:text-muted-foreground"
          onKeyDown={e => e.key === 'Enter' && handleShip()}
        />
        <p className="text-xs text-muted-foreground">
          Opcional — o comprador poderá acompanhar o envio.
        </p>
      </div>
      <div className="flex gap-2">
        <button
          onClick={handleShip}
          disabled={loading}
          className="flex-1 flex items-center justify-center gap-2 bg-foreground text-background py-2.5 text-xs font-medium uppercase tracking-widest hover:bg-foreground/85 transition-colors disabled:opacity-30"
        >
          {loading && <Loader2 className="size-3 animate-spin" />}
          Confirmar envio
        </button>
        <button
          onClick={() => setOpen(false)}
          disabled={loading}
          className="px-4 border border-border py-2.5 text-xs font-medium uppercase tracking-widest hover:bg-muted transition-colors disabled:opacity-30"
        >
          Cancelar
        </button>
      </div>
    </div>
  );
}
