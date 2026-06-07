'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

type Props = {
  mission: string | null;
};

export function EditOngProfile({ mission }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [value, setValue] = useState(mission ?? '');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('/api/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mission: value }),
      });
      if (!res.ok) throw new Error('Erro ao guardar perfil.');
      toast.success('Missão actualizada.');
      setOpen(false);
      router.refresh();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="text-xs text-muted-foreground hover:text-foreground transition-colors underline underline-offset-2"
      >
        Editar missão
      </button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="border border-border p-5 space-y-4">
      <p className="text-xs font-medium uppercase tracking-[0.15em]">Editar missão</p>

      <div className="space-y-1">
        <label className="text-xs text-muted-foreground">Missão da organização</label>
        <textarea
          value={value}
          onChange={e => setValue(e.target.value)}
          placeholder="Descreve a missão e impacto da tua organização..."
          rows={4}
          className="w-full border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:border-foreground transition-colors resize-none font-[inherit]"
        />
      </div>

      <div className="flex gap-2">
        <Button type="submit" size="sm" disabled={loading}>
          {loading && <Loader2 className="mr-2 size-4 animate-spin" />}
          Guardar
        </Button>
        <Button type="button" size="sm" variant="outline" onClick={() => setOpen(false)} disabled={loading}>
          Cancelar
        </Button>
      </div>
    </form>
  );
}
