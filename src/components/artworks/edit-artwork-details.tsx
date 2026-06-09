'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

export function EditArtworkDetails({
  listingId,
  currentPrice,
  currentDescription,
}: {
  listingId: string;
  currentPrice: number;
  currentDescription: string | null;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [price, setPrice] = useState(currentPrice.toFixed(2));
  const [description, setDescription] = useState(currentDescription ?? '');
  const [loading, setLoading] = useState(false);

  const save = async () => {
    const priceVal = Number(price.replace(',', '.'));
    if (isNaN(priceVal) || priceVal <= 0) {
      toast.error('Preço inválido');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/artworks/${listingId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          price_eur: priceVal,
          description: description.trim() || null,
        }),
      });
      if (!res.ok) throw new Error();
      toast.success('Obra atualizada');
      setOpen(false);
      router.refresh();
    } catch {
      toast.error('Erro ao guardar alterações');
    } finally {
      setLoading(false);
    }
  };

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="text-xs font-medium border border-border px-4 py-2 hover:border-foreground hover:bg-muted transition-colors"
      >
        Editar obra
      </button>
    );
  }

  return (
    <div className="border border-border bg-card p-6 space-y-5">
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium uppercase tracking-[0.15em]">Editar obra</p>
        <button
          onClick={() => setOpen(false)}
          className="text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          Cancelar
        </button>
      </div>

      <div className="space-y-2">
        <label className="text-xs text-muted-foreground uppercase tracking-wider">Preço (€)</label>
        <input
          type="number"
          min="0.01"
          step="0.01"
          value={price}
          onChange={e => setPrice(e.target.value)}
          className="w-full border border-border bg-background px-4 py-2 text-sm focus:outline-none focus:border-foreground transition-colors font-[inherit]"
        />
      </div>

      <div className="space-y-2">
        <label className="text-xs text-muted-foreground uppercase tracking-wider">Descrição</label>
        <textarea
          value={description}
          onChange={e => setDescription(e.target.value)}
          rows={4}
          placeholder="Descreve a tua obra..."
          className="w-full border border-border bg-background px-4 py-2 text-sm focus:outline-none focus:border-foreground transition-colors font-[inherit] resize-none"
        />
      </div>

      <button
        onClick={save}
        disabled={loading}
        className="w-full bg-foreground text-background py-2.5 text-sm font-medium hover:bg-foreground/85 transition-colors disabled:opacity-50"
      >
        {loading ? 'A guardar...' : 'Guardar alterações'}
      </button>
    </div>
  );
}
