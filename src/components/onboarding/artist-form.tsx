'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

export function ArtistForm() {
  const router = useRouter();
  const [bio, setBio] = useState('');
  const [portfolioUrl, setPortfolioUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const res = await fetch('/api/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: 'artist', bio, portfolio_url: portfolioUrl }),
      });
      if (!res.ok) throw new Error('Erro ao guardar perfil.');
      toast.success('Perfil criado!');
      router.push('/dashboard');
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl font-bold">O teu perfil de artista</CardTitle>
        <CardDescription>Conta-nos um pouco sobre o teu trabalho</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="bio">Bio</Label>
            <textarea
              id="bio"
              rows={4}
              placeholder="Fala sobre o teu trabalho, inspirações e causas que apoias..."
              value={bio}
              onChange={e => setBio(e.target.value)}
              className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 resize-none"
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="portfolio">Portfólio (opcional)</Label>
            <Input
              id="portfolio"
              type="url"
              placeholder="https://o-teu-site.com"
              value={portfolioUrl}
              onChange={e => setPortfolioUrl(e.target.value)}
            />
          </div>
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 size-4 animate-spin" />}
            Continuar
          </Button>
          <button
            type="button"
            onClick={() => router.push('/dashboard')}
            className="text-sm text-center text-muted-foreground hover:text-foreground"
          >
            Preencher mais tarde
          </button>
        </form>
      </CardContent>
    </Card>
  );
}
