'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

type ArtistProps = { role: 'artist'; bio: string; portfolioUrl: string };
type OngProps = { role: 'ong'; mission: string };
type Props = ArtistProps | OngProps;

export function EditProfileForm(props: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const [bio, setBio] = useState(props.role === 'artist' ? props.bio : '');
  const [portfolioUrl, setPortfolioUrl] = useState(props.role === 'artist' ? props.portfolioUrl : '');
  const [mission, setMission] = useState(props.role === 'ong' ? props.mission : '');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const body = props.role === 'artist'
        ? { bio, portfolio_url: portfolioUrl }
        : { mission };

      const res = await fetch('/api/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? 'Erro ao guardar');
      }

      toast.success('Perfil actualizado!');
      router.push('/dashboard');
      router.refresh();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {props.role === 'artist' && (
        <>
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Bio</label>
            <textarea
              rows={5}
              value={bio}
              onChange={e => setBio(e.target.value)}
              placeholder="Fala sobre o teu trabalho, inspirações e causas que apoias..."
              className="w-full border rounded-xl px-4 py-3 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-foreground resize-none"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Portfólio (opcional)</label>
            <input
              type="url"
              value={portfolioUrl}
              onChange={e => setPortfolioUrl(e.target.value)}
              placeholder="https://o-teu-site.com"
              className="w-full border rounded-xl px-4 py-3 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-foreground"
            />
          </div>
        </>
      )}

      {props.role === 'ong' && (
        <div className="space-y-1.5">
          <label className="text-sm font-medium">Missão da organização</label>
          <textarea
            rows={5}
            value={mission}
            onChange={e => setMission(e.target.value)}
            placeholder="Descreve a missão e o impacto da tua organização..."
            className="w-full border rounded-xl px-4 py-3 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-foreground resize-none"
          />
        </div>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-foreground text-background py-3 rounded-xl font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
      >
        {loading ? 'A guardar...' : 'Guardar alterações'}
      </button>
    </form>
  );
}
