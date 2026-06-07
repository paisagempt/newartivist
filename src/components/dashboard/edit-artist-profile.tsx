'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

type Props = {
  artistId: string;
  name: string | null;
  bio: string | null;
  portfolioUrl: string | null;
  avatarUrl: string | null;
};

export function EditArtistProfile({ artistId, name, bio, portfolioUrl, avatarUrl }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(avatarUrl);
  const fileRef = useRef<HTMLInputElement>(null);
  const [form, setForm] = useState({
    name: name ?? '',
    bio: bio ?? '',
    portfolio_url: portfolioUrl ?? '',
    avatar_url: avatarUrl ?? '',
  });

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      toast.error('Imagem demasiado grande. Máximo 2MB.');
      return;
    }
    setUploading(true);
    try {
      const supabase = createClient();
      const ext = file.name.split('.').pop();
      const path = `artists/${artistId}.${ext}`;
      const { error } = await supabase.storage.from('avatars').upload(path, file, { upsert: true });
      if (error) throw error;
      const { data } = supabase.storage.from('avatars').getPublicUrl(path);
      const url = `${data.publicUrl}?t=${Date.now()}`;
      setPreview(url);
      setForm(f => ({ ...f, avatar_url: data.publicUrl }));
      toast.success('Imagem carregada.');
    } catch (err: any) {
      toast.error('Erro ao carregar imagem.');
    } finally {
      setUploading(false);
    }
  };

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

      {/* Avatar */}
      <div className="space-y-2">
        <label className="text-xs text-muted-foreground">Foto de perfil</label>
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-muted overflow-hidden shrink-0">
            {preview ? (
              <img src={preview} alt="Avatar" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs">
                —
              </div>
            )}
          </div>
          <div>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleAvatarChange}
            />
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
            >
              {uploading && <Loader2 className="mr-2 size-4 animate-spin" />}
              {uploading ? 'A carregar...' : 'Escolher imagem'}
            </Button>
            <p className="text-xs text-muted-foreground mt-1">JPG, PNG ou WebP · máx. 2MB</p>
          </div>
        </div>
      </div>

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
