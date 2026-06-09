import { createClient, createAdminClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { BuyButton } from '@/components/artworks/buy-button';
import { NavHeader } from '@/components/layout/nav-header';
import { getLang, dict } from '@/lib/i18n';
import { EditArtworkDetails } from '@/components/artworks/edit-artwork-details';

export default async function ArtworkPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ purchased?: string }>;
}) {
  const { id } = await params;
  const { purchased: purchasedParam } = await searchParams;
  const lang = await getLang();
  const t = dict[lang].artwork;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const admin = createAdminClient();

  const { data: listing } = await admin
    .from('listings')
    .select('*, ongs(name, mission), artists(id, name, user_id)')
    .eq('id', id)
    .single();

  if (!listing) notFound();

  const isOwner = user && (listing.artists as any)?.user_id === user.id;
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
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">{t.purchase_ok}</p>
            <p className="font-semibold">
              {listing.type === 'digital' ? t.purchase_msg_digital : t.purchase_msg_physical}
            </p>
            <p className="text-sm text-muted-foreground">{t.purchase_thanks}</p>
            <a
              href="https://staging.crossmint.com/user/collection"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center bg-foreground text-background text-sm font-medium px-6 py-3 hover:bg-foreground/85 transition-colors"
            >
              {t.wallet_cta}
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
                {listing.type === 'digital' ? t.digital : t.physical} ·{' '}
                {available === 1 && listing.edition_size === 1
                  ? t.unique
                  : t.available(available, listing.edition_size)}
              </p>
              <h1 className="text-3xl font-bold leading-tight">{listing.title}</h1>
              {(listing.artists as any)?.id && (
                <Link
                  href={`/artistas/${(listing.artists as any).id}`}
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors mt-2 inline-block"
                >
                  {(listing.artists as any)?.name ?? t.view_artist}
                </Link>
              )}
              {listing.description && (
                <p className="text-sm text-muted-foreground mt-4 leading-relaxed">{listing.description}</p>
              )}
            </div>

            {/* Distribuição */}
            <div className="border border-border bg-card">
              <div className="px-5 py-4 border-b border-border">
                <p className="text-xs font-medium uppercase tracking-[0.15em] text-muted-foreground">
                  {t.distribution(price.toFixed(2))}
                </p>
              </div>
              <div className="divide-y divide-border">
                <div className="px-5 py-3 flex justify-between text-sm">
                  <span>{t.artist}</span>
                  <span className="font-medium">€{(price * artistPercentage / 100).toFixed(2)} <span className="text-muted-foreground font-normal">({artistPercentage}%)</span></span>
                </div>
                <div className="px-5 py-3 flex justify-between text-sm">
                  <span>{listing.ongs?.name ?? 'ONG'}</span>
                  <span className="font-medium">€{(price * listing.ong_percentage / 100).toFixed(2)} <span className="text-muted-foreground font-normal">({listing.ong_percentage}%)</span></span>
                </div>
                <div className="px-5 py-3 flex justify-between text-sm text-muted-foreground">
                  <span>{t.platform}</span>
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
              {isOwner ? (
                <EditArtworkDetails
                  listingId={id}
                  currentPrice={price}
                  currentDescription={listing.description ?? null}
                />
              ) : (
                <>
                  <BuyButton
                    listingId={id}
                    price={price}
                    available={available}
                    type={listing.type}
                    userEmail={user?.email ?? null}
                  />
                  {listing.status === 'active' && available > 0 && (
                    <p className="text-xs text-muted-foreground">
                      {t.payment_note} · {listing.type === 'digital' ? t.digital_note : t.physical_note}
                    </p>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
