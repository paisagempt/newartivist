'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

type Ong = { id: string; name: string };

export function ListingForm({ ongs }: { ongs: Ong[] }) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<'digital' | 'physical' | 'both'>('digital');
  const [priceEur, setPriceEur] = useState('');
  const [editionSize, setEditionSize] = useState('1');
  const [ongId, setOngId] = useState(ongs[0]?.id ?? '');
  const [ongPercentage, setOngPercentage] = useState(20);
  const [royaltyPercentage, setRoyaltyPercentage] = useState(10);
  const [coverImageUrl, setCoverImageUrl] = useState('');

  const PLATFORM_FEE = 10;
  const price = Number(priceEur) || 0;
  const artistPercentage = 100 - PLATFORM_FEE - ongPercentage;
  const ongAmount = ((price * ongPercentage) / 100).toFixed(2);
  const platformAmount = ((price * PLATFORM_FEE) / 100).toFixed(2);
  const artistAmount = ((price * artistPercentage) / 100).toFixed(2);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ongId) {
      toast.error('Selecciona uma ONG para beneficiar.');
      return;
    }
    setIsLoading(true);
    try {
      const res = await fetch('/api/artworks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          description,
          type,
          price_eur: priceEur,
          edition_size: editionSize,
          ong_id: ongId,
          ong_percentage: ongPercentage,
          royalty_percentage: royaltyPercentage,
          cover_image_url: coverImageUrl || null,
        }),
      });
      if (!res.ok) throw new Error('Erro ao criar listagem.');
      toast.success('Obra listada com sucesso!');
      router.push('/dashboard');
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-xl w-full">

      {/* Informações básicas */}
      <Card>
        <CardHeader><CardTitle className="text-base">Informações da obra</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="title">Título *</Label>
            <Input id="title" value={title} onChange={e => setTitle(e.target.value)} required placeholder="Nome da obra" />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="description">Descrição</Label>
            <textarea
              id="description"
              rows={3}
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Conta a história desta obra..."
              className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 resize-none"
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label>Tipo</Label>
            <div className="flex gap-2">
              {(['digital', 'physical', 'both'] as const).map(t => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setType(t)}
                  className={`flex-1 rounded-lg border-2 py-2 text-sm font-medium transition-colors ${
                    type === t ? 'border-primary bg-primary/5 text-primary' : 'border-border text-muted-foreground hover:border-primary/50'
                  }`}
                >
                  {t === 'digital' ? 'Digital' : t === 'physical' ? 'Física' : 'Ambas'}
                </button>
              ))}
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="cover">URL da imagem de capa (opcional)</Label>
            <Input id="cover" type="url" value={coverImageUrl} onChange={e => setCoverImageUrl(e.target.value)} placeholder="https://..." />
          </div>
        </CardContent>
      </Card>

      {/* Preço e tiragem */}
      <Card>
        <CardHeader><CardTitle className="text-base">Preço e tiragem</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4">
            <div className="flex flex-col gap-2 flex-1">
              <Label htmlFor="price">Preço (€) *</Label>
              <Input id="price" type="number" min="1" step="0.01" value={priceEur} onChange={e => setPriceEur(e.target.value)} required placeholder="0.00" />
            </div>
            <div className="flex flex-col gap-2 w-32">
              <Label htmlFor="edition">Tiragem *</Label>
              <Input id="edition" type="number" min="1" value={editionSize} onChange={e => setEditionSize(e.target.value)} required />
            </div>
          </div>
          {Number(editionSize) === 1 && <p className="text-xs text-muted-foreground">Obra única (1/1)</p>}
          {Number(editionSize) > 1 && <p className="text-xs text-muted-foreground">Edição limitada de {editionSize} exemplares</p>}
        </CardContent>
      </Card>

      {/* Split */}
      <Card>
        <CardHeader><CardTitle className="text-base">Distribuição da receita</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          {ongs.length === 0 ? (
            <p className="text-sm text-yellow-600">Ainda não há ONGs verificadas disponíveis. Aguarda que a equipa Artivist verifique uma ONG para poderes listar obras.</p>
          ) : (
            <>
              <div className="flex flex-col gap-2">
                <Label htmlFor="ong">ONG beneficiada *</Label>
                <select
                  id="ong"
                  value={ongId}
                  onChange={e => setOngId(e.target.value)}
                  required
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                >
                  {ongs.map(o => (
                    <option key={o.id} value={o.id}>{o.name}</option>
                  ))}
                </select>
              </div>
              <div className="flex flex-col gap-2">
                <div className="flex justify-between">
                  <Label>% para a ONG (mín. 10%)</Label>
                  <span className="text-sm font-medium">{ongPercentage}%</span>
                </div>
                <input
                  type="range"
                  min={10}
                  max={90}
                  value={ongPercentage}
                  onChange={e => setOngPercentage(Number(e.target.value))}
                  className="w-full accent-primary"
                />
              </div>
              {price > 0 && (
                <div className="rounded-lg bg-muted p-4 space-y-2 text-sm">
                  <p className="font-medium mb-3">Por cada venda de €{price.toFixed(2)}:</p>
                  <div className="flex justify-between">
                    <span>Tu (artista)</span>
                    <span className="font-medium text-green-600">€{artistAmount} ({artistPercentage}%)</span>
                  </div>
                  <div className="flex justify-between">
                    <span>{ongs.find(o => o.id === ongId)?.name ?? 'ONG'}</span>
                    <span className="font-medium text-blue-600">€{ongAmount} ({ongPercentage}%)</span>
                  </div>
                  <div className="flex justify-between text-muted-foreground">
                    <span>Plataforma Artivist</span>
                    <span>€{platformAmount} (10%)</span>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Royalties */}
      <Card>
        <CardHeader><CardTitle className="text-base">Royalties em revenda</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col gap-2">
            <div className="flex justify-between">
              <Label>% de royalty em revendas</Label>
              <span className="text-sm font-medium">{royaltyPercentage}%</span>
            </div>
            <input
              type="range"
              min={0}
              max={20}
              value={royaltyPercentage}
              onChange={e => setRoyaltyPercentage(Number(e.target.value))}
              className="w-full accent-primary"
            />
            <p className="text-xs text-muted-foreground">Cada vez que esta obra for revendida, recebes {royaltyPercentage}% do valor de revenda automaticamente.</p>
          </div>
        </CardContent>
      </Card>

      <Button type="submit" className="w-full" disabled={isLoading || ongs.length === 0}>
        {isLoading && <Loader2 className="mr-2 size-4 animate-spin" />}
        Publicar obra
      </Button>
    </form>
  );
}
