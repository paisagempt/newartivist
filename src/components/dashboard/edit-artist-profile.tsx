'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

type Props = {
  name: string | null;
  bio: string | null;
  portfolioUrl: string | null;
};

export function EditArtistProfile({ name, bio, portfolioUrl }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: name ?? '',
    bio: bio ?? '',
    portfolio_url: portfolioUrl ?? '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('/api/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error('Erro ao guardar perfil.');
      toast.success('Perfil actualizado.');
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
        Editar perfil
      </button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="border border-border p-5 space-y-4">
      <p className="text-xs font-medium uppercase tracking-[0.15em]">Editar perfil</p>

      <div className="space-y-1">
        <label className="text-xs text-muted-foreground">Nome artístico</label>
        <Input
          value={form.name}
          onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
          placeholder="O teu nome ou pseudónimo"
        />
      </div>

      <div className="space-y-1">
        <label className="text-xs text-muted-foreground">Bio</label>
        <textarea
          value={form.bio}
          onChange={e => setForm(f => ({ ...f, bio: e.target.value }))}
          placeholder="Fala sobre o teu trabalho..."
          rows={3}
          className="w-full border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:border-foreground transition-colors resize-none font-[inherit]"
        />
      </div>

      <div className="space-y-1">
        <label className="text-xs text-muted-foreground">Portfólio (opcional)</label>
        <Input
          type="url"
          value={form.portfolio_url}
          onChange={e => setForm(f => ({ ...f, portfolio_url: e.target.value }))}
          placeholder="https://o-teu-site.com"
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
