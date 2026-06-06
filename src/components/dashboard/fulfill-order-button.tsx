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
      <Button size="sm" variant="outline" onClick={() => setOpen(true)}>
        Marcar como enviado
      </Button>
    );
  }

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <input
        type="text"
        value={tracking}
        onChange={e => setTracking(e.target.value)}
        placeholder="Nº tracking (opcional)"
        className="border rounded-lg px-3 py-1.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-foreground w-44"
      />
      <Button size="sm" onClick={handleShip} disabled={loading}>
        {loading && <Loader2 className="mr-1 size-3 animate-spin" />}
        Confirmar
      </Button>
      <button onClick={() => setOpen(false)} className="text-xs text-muted-foreground hover:text-foreground">
        Cancelar
      </button>
    </div>
  );
}
