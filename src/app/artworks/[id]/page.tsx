import { createClient, createAdminClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { BuyButton } from '@/components/artworks/buy-button';
import { NavHeader } from '@/components/layout/nav-header';

export default async function ArtworkPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ purchased?: string }>;
}) {
  const { id } = await params;
  const { purchased: purchasedParam } = await searchParams;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const admin = createAdminClient();

  const { data: listing } = await admin
    .from('listings')
    .select('*, ongs(name, mission)')
    .eq('id', id)
    .single();

  if (!listing) notFound();

  const PLATFORM_FEE = 10;
  const artistPercentage = 100 - PLATFORM_FEE - listing.ong_percentage;
  const price = Number(listing.price_eur);
  const available = listing.edition_size - listing.editions_sold;
  const purchased = purchasedParam === 'true';

  return (
    <div className="min-h-screen bg-background">
      <NavHeader backLink={{ href: '/marketplace', label: 'Marketplace' }} />

      <main className="max-w-5xl mx-auto px-6 py-12">

        {/* Confirmação de compra */}
        {purchased && (
          <div className="mb-12 border border-border bg-card p-8 space-y-4">
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">Compra concluída</p>
            <p className="font-semibold">
              {listing.type === 'digital' ? 'A tua arte digital foi entregue no teu email.' : 'O teu certificado digital foi enviado para o teu email.'}
            </p>
            <p className="text-sm text-muted-foreground">Obrigado por apoiares a arte com impacto.</p>
            <a
              href="https://staging.crossmint.com/user/collection"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center bg-foreground text-background text-sm font-medium px-6 py-3 hover:bg-foreground/85 transition-colors"
            >
              Ver na minha wallet →
            </a>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-16">
          {/* Imagem — sem border-radius, bleed */}
          <div className="bg-muted overflow-hidden aspect-square">
            {listing.cover_image_url ? (
              <img
                src={listing.cover_image_url}
                alt={listing.title}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs uppercase tracking-widest">
                Sem imagem
              </div>
            )}
          </div>

          {/* Info */}
          <div className="flex flex-col gap-8 py-2">
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-[0.15em] mb-3">
                {listing.type === 'digital' ? 'Arte digital' : 'Arte física'} ·{' '}
                {available === 1 && listing.edition_size === 1
                  ? 'Obra única (1/1)'
                  : `${available} de ${listing.edition_size} disponíveis`}
              </p>
              <h1 className="text-3xl font-bold leading-tight">{listing.title}</h1>
              {listing.description && (
                <p className="text-sm text-muted-foreground mt-4 leading-relaxed">{listing.description}</p>
              )}
            </div>

            {/* Distribuição */}
            <div className="border border-border bg-card">
              <div className="px-5 py-4 border-b border-border">
                <p className="text-xs font-medium uppercase tracking-[0.15em] text-muted-foreground">
                  Distribuição de €{price.toFixed(2)}
                </p>
              </div>
              <div className="divide-y divide-border">
                <div className="px-5 py-3 flex justify-between text-sm">
                  <span>Artista</span>
                  <span className="font-medium">€{(price * artistPercentage / 100).toFixed(2)} <span className="text-muted-foreground font-normal">({artistPercentage}%)</span></span>
                </div>
                <div className="px-5 py-3 flex justify-between text-sm">
                  <span>{listing.ongs?.name ?? 'ONG'}</span>
                  <span className="font-medium">€{(price * listing.ong_percentage / 100).toFixed(2)} <span className="text-muted-foreground font-normal">({listing.ong_percentage}%)</span></span>
                </div>
                <div className="px-5 py-3 flex justify-between text-sm text-muted-foreground">
                  <span>Plataforma Artivist</span>
                  <span>€{(price * PLATFORM_FEE / 100).toFixed(2)} ({PLATFORM_FEE}%)</span>
                </div>
              </div>
              {listing.ongs?.mission && (
                <div className="px-5 py-4 border-t border-border">
                  <p className="text-xs text-muted-foreground leading-relaxed">{listing.ongs.mission}</p>
                </div>
              )}
            </div>

            {/* Preço + comprar */}
            <div className="space-y-4">
              <p className="text-4xl font-bold">€{price.toFixed(2)}</p>
              <BuyButton
                listingId={id}
                price={price}
                available={available}
                type={listing.type}
                userEmail={user?.email ?? null}
              />
              {listing.status === 'active' && available > 0 && (
                <p className="text-xs text-muted-foreground">
                  Pagamento em euros · {listing.type === 'digital' ? 'Arte digital' : 'Certificado digital'} entregue automaticamente · Seguro por blockchain
                </p>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
