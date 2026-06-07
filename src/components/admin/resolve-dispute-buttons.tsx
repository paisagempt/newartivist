'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

export function ResolveDisputeButtons({ saleId }: { saleId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState<'artist' | 'buyer' | null>(null);

  const resolve = async (resolution: 'artist' | 'buyer') => {
    const label = resolution === 'artist' ? 'artista' : 'comprador';
    if (!confirm(`Resolver a favor do ${label}? Esta ação não pode ser desfeita.`)) return;

    setLoading(resolution);
    try {
      const res = await fetch('/api/admin/resolve-dispute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ saleId, resolution }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Erro ao resolver disputa');
      toast.success(`Disputa resolvida a favor do ${label}.`);
      router.refresh();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="flex gap-2 shrink-0">
      <Button size="sm" onClick={() => resolve('artist')} disabled={loading !== null}>
        {loading === 'artist' && <Loader2 className="mr-2 size-4 animate-spin" />}
        Favor do artista
      </Button>
      <Button size="sm" variant="outline" onClick={() => resolve('buyer')} disabled={loading !== null}>
        {loading === 'buyer' && <Loader2 className="mr-2 size-4 animate-spin" />}
        Favor do comprador
      </Button>
    </div>
  );
}
