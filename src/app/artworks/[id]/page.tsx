import { createAdminClient } from '@/lib/supabase/server';
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
    <div className="min-h-screen bg-zinc-50 dark:bg-black">
      <NavHeader backLink={{ href: '/marketplace', label: 'Marketplace' }} />

      <main className="max-w-4xl mx-auto px-6 py-12">
        {purchased && (
          <div className="mb-8 rounded-xl bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 p-5 text-center space-y-3">
            <p className="font-semibold text-green-800 dark:text-green-200">Compra concluída!</p>
            <p className="text-sm text-green-700 dark:text-green-300">
              {listing.type === 'digital' ? 'A tua arte digital foi' : 'O teu certificado digital foi'} entregue no teu email. Obrigado por apoiares a arte com impacto.
            </p>
            <a
              href="https://staging.crossmint.com/user/collection"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block bg-green-800 dark:bg-green-200 text-white dark:text-green-900 text-sm font-medium px-5 py-2.5 rounded-lg hover:opacity-90 transition-opacity"
            >
              Ver na minha wallet →
            </a>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          {/* Imagem */}
          <div className="rounded-2xl overflow-hidden bg-zinc-100 dark:bg-zinc-800 aspect-square">
            {listing.cover_image_url ? (
              <img src={listing.cover_image_url} alt={listing.title} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-muted-foreground">Sem imagem</div>
            )}
          </div>

          {/* Info */}
          <div className="flex flex-col gap-6">
            <div>
              <p className="text-sm text-muted-foreground mb-1">
                {listing.type === 'digital' ? 'Arte digital' : 'Arte física'} · {available === 1 && listing.edition_size === 1 ? 'Obra única (1/1)' : `${available} de ${listing.edition_size} disponíveis`}
              </p>
              <h1 className="text-3xl font-bold">{listing.title}</h1>
              {listing.description && (
                <p className="text-muted-foreground mt-3 leading-relaxed">{listing.description}</p>
              )}
            </div>

            {/* Split */}
            <div className="rounded-xl bg-white dark:bg-zinc-900 border p-5 space-y-3 text-sm">
              <p className="font-semibold">Distribuição de €{price.toFixed(2)}</p>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Artista</span>
                  <span className="font-medium text-green-600">€{(price * artistPercentage / 100).toFixed(2)} ({artistPercentage}%)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-blue-600">{listing.ongs?.name ?? 'ONG'}</span>
                  <span className="font-medium text-blue-600">€{(price * listing.ong_percentage / 100).toFixed(2)} ({listing.ong_percentage}%)</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>Plataforma Artivist</span>
                  <span>€{(price * PLATFORM_FEE / 100).toFixed(2)} ({PLATFORM_FEE}%)</span>
                </div>
              </div>
              {listing.ongs?.mission && (
                <p className="text-xs text-muted-foreground border-t pt-3 mt-3">{listing.ongs.mission}</p>
              )}
            </div>

            {/* Preço + comprar */}
            <div className="space-y-3">
              <p className="text-3xl font-bold">€{price.toFixed(2)}</p>
              <BuyButton listingId={id} price={price} available={available} type={listing.type} />
              {listing.status === 'active' && available > 0 && (
                <p className="text-xs text-center text-muted-foreground">
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
