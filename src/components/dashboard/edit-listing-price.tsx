'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

export function EditListingPrice({
  listingId,
  currentPrice,
}: {
  listingId: string;
  currentPrice: number;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [price, setPrice] = useState(currentPrice.toFixed(2));
  const [loading, setLoading] = useState(false);

  const save = async () => {
    const value = Number(price.replace(',', '.'));
    if (isNaN(value) || value <= 0) {
      toast.error('Preço inválido');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/artworks/${listingId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ price_eur: value }),
      });
      if (!res.ok) throw new Error();
      toast.success('Preço atualizado');
      setOpen(false);
      router.refresh();
    } catch {
      toast.error('Erro ao atualizar preço');
    } finally {
      setLoading(false);
    }
  };

  if (!open) {
    return (
      <button
        onClick={e => { e.preventDefault(); e.stopPropagation(); setOpen(true); }}
        className="text-[10px] text-muted-foreground hover:text-foreground transition-colors underline underline-offset-2 shrink-0"
      >
        editar
      </button>
    );
  }

  return (
    <div
      className="flex items-center gap-1 shrink-0"
      onClick={e => { e.preventDefault(); e.stopPropagation(); }}
    >
      <span className="text-xs text-muted-foreground">€</span>
      <input
        type="number"
        min="0.01"
        step="0.01"
        value={price}
        onChange={e => setPrice(e.target.value)}
        onKeyDown={e => { if (e.key === 'Enter') save(); if (e.key === 'Escape') setOpen(false); }}
        autoFocus
        className="w-20 border border-border bg-background px-2 py-0.5 text-xs focus:outline-none focus:border-foreground font-[inherit]"
      />
      <button
        onClick={save}
        disabled={loading}
        className="text-[10px] font-medium bg-foreground text-background px-2 py-1 hover:bg-foreground/85 transition-colors disabled:opacity-50"
      >
        {loading ? '...' : 'Ok'}
      </button>
      <button
        onClick={() => setOpen(false)}
        className="text-[10px] text-muted-foreground hover:text-foreground transition-colors px-1"
      >
        ✕
      </button>
    </div>
  );
}
