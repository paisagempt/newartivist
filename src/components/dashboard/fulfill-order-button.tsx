'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

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
      <Button onClick={() => setOpen(true)} className="w-full">
        Registar envio
      </Button>
    );
  }

  return (
    <div className="border rounded-xl p-4 space-y-3 bg-zinc-50 dark:bg-zinc-800">
      <div className="space-y-1">
        <label className="text-sm font-medium">Código de rastreio</label>
        <input
          type="text"
          value={tracking}
          onChange={e => setTracking(e.target.value)}
          placeholder="Ex: PT123456789PT"
          autoFocus
          className="w-full border rounded-lg px-3 py-2.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-foreground font-mono"
          onKeyDown={e => e.key === 'Enter' && handleShip()}
        />
        <p className="text-xs text-muted-foreground">
          Opcional mas recomendado — o comprador poderá acompanhar o envio.
        </p>
      </div>
      <div className="flex gap-2">
        <Button onClick={handleShip} disabled={loading} className="flex-1">
          {loading && <Loader2 className="mr-2 size-4 animate-spin" />}
          Confirmar envio
        </Button>
        <Button variant="outline" onClick={() => setOpen(false)} disabled={loading}>
          Cancelar
        </Button>
      </div>
    </div>
  );
}
