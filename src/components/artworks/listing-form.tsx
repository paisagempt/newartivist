'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { Loader2, Upload, X } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

type Ong = { id: string; name: string };

export function ListingForm({ ongs }: { ongs: Ong[] }) {
  const router = useRouter();
  const supabase = createClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<'digital' | 'physical'>('digital');
  const [priceEur, setPriceEur] = useState('');
  const [editionSize, setEditionSize] = useState('1');
  const [ongId, setOngId] = useState(ongs[0]?.id ?? '');
  const [ongPercentage, setOngPercentage] = useState(20);
  const [royaltyPercentage, setRoyaltyPercentage] = useState(10);
  const [coverImageUrl, setCoverImageUrl] = useState('');
  const [imagePreview, setImagePreview] = useState('');

  const PLATFORM_FEE = 10;
  const price = Number(priceEur) || 0;
  const artistPercentage = 100 - PLATFORM_FEE - ongPercentage;
  const ongAmount = ((price * ongPercentage) / 100).toFixed(2);
  const platformAmount = ((price * PLATFORM_FEE) / 100).toFixed(2);
  const artistAmount = ((price * artistPercentage) / 100).toFixed(2);

  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      toast.error('Imagem demasiado grande. Máximo 10MB.');
      return;
    }

    setIsUploading(true);
    try {
      // Preview local
      const reader = new FileReader();
      reader.onload = (ev) => setImagePreview(ev.target?.result as string);
      reader.readAsDataURL(file);

      // Upload para Supabase Storage
      const ext = file.name.split('.').pop();
      const filename = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const { error } = await supabase.storage.from('artworks').upload(filename, file);
      if (error) throw error;

      const { data: { publicUrl } } = supabase.storage.from('artworks').getPublicUrl(filename);
      setCoverImageUrl(publicUrl);
      toast.success('Imagem carregada.');
    } catch (err: any) {
      toast.error('Erro ao carregar imagem: ' + err.message);
      setImagePreview('');
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemoveImage = () => {
    setCoverImageUrl('');
    setImagePreview('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ongId) {
      toast.error('Selecciona uma ONG para beneficiar.');
      return;
    }
    if (!coverImageUrl) {
      toast.error('Faz o upload da imagem da obra.');
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
          cover_image_url: coverImageUrl,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erro ao criar listagem.');
      toast.success('Obra publicada e certificado digital criado!');
      router.push('/dashboard');
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-xl w-full">

      {/* Imagem */}
      <Card>
        <CardHeader><CardTitle className="text-base">Imagem da obra *</CardTitle></CardHeader>
        <CardContent>
          {imagePreview ? (
            <div className="relative">
              <img src={imagePreview} alt="Preview" className="w-full rounded-lg object-cover max-h-64" />
              <button
                type="button"
                onClick={handleRemoveImage}
                className="absolute top-2 right-2 bg-black/60 text-white rounded-full p-1 hover:bg-black/80"
              >
                <X className="size-4" />
              </button>
              {isUploading && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-lg">
                  <Loader2 className="size-6 text-white animate-spin" />
                </div>
              )}
            </div>
          ) : (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className="w-full border-2 border-dashed border-border rounded-lg p-8 flex flex-col items-center gap-2 text-muted-foreground hover:border-primary/50 hover:text-foreground transition-colors"
            >
              {isUploading ? <Loader2 className="size-6 animate-spin" /> : <Upload className="size-6" />}
              <span className="text-sm">{isUploading ? 'A carregar...' : 'Clica para fazer upload'}</span>
              <span className="text-xs">PNG, JPG, GIF — máx. 10MB</span>
            </button>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleImageSelect}
            className="hidden"
          />
          <p className="text-xs text-muted-foreground mt-2">Esta imagem representa a obra no certificado digital emitido na blockchain.</p>
        </CardContent>
      </Card>

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
            <Label>Tipo de obra</Label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setType('digital')}
                className={`flex-1 rounded-lg border-2 py-3 px-4 text-left text-sm transition-colors ${
                  type === 'digital' ? 'border-primary bg-primary/5' : 'border-border text-muted-foreground hover:border-primary/50'
                }`}
              >
                <p className="font-medium">Digital</p>
                <p className="text-xs text-muted-foreground mt-0.5">Ficheiro digital · arte digital na blockchain</p>
              </button>
              <button
                type="button"
                onClick={() => setType('physical')}
                className={`flex-1 rounded-lg border-2 py-3 px-4 text-left text-sm transition-colors ${
                  type === 'physical' ? 'border-primary bg-primary/5' : 'border-border text-muted-foreground hover:border-primary/50'
                }`}
              >
                <p className="font-medium">Física</p>
                <p className="text-xs text-muted-foreground mt-0.5">Entrega física · certificado digital na blockchain</p>
              </button>
            </div>
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
          <p className="text-xs text-muted-foreground">
            {Number(editionSize) === 1 ? 'Obra única (1/1)' : `Edição limitada de ${editionSize} exemplares`}
          </p>
        </CardContent>
      </Card>

      {/* Split */}
      <Card>
        <CardHeader><CardTitle className="text-base">Distribuição da receita</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          {ongs.length === 0 ? (
            <p className="text-sm text-yellow-600">Ainda não há ONGs verificadas. Aguarda a verificação de uma ONG para poderes publicar obras.</p>
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
                <input type="range" min={10} max={90} value={ongPercentage} onChange={e => setOngPercentage(Number(e.target.value))} className="w-full accent-primary" />
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
        <CardContent className="space-y-2">
          <div className="flex justify-between">
            <Label>% de royalty em revendas</Label>
            <span className="text-sm font-medium">{royaltyPercentage}%</span>
          </div>
          <input type="range" min={0} max={20} value={royaltyPercentage} onChange={e => setRoyaltyPercentage(Number(e.target.value))} className="w-full accent-primary" />
          <p className="text-xs text-muted-foreground">Recebes {royaltyPercentage}% automaticamente em cada revenda desta obra.</p>
        </CardContent>
      </Card>

      <Button type="submit" className="w-full" disabled={isLoading || isUploading || ongs.length === 0}>
        {isLoading && <Loader2 className="mr-2 size-4 animate-spin" />}
        Publicar obra
      </Button>
    </form>
  );
}
