import { createAdminClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { NavHeader } from '@/components/layout/nav-header';
import { ArtworkCard } from '@/components/artworks/artwork-card';
import { getLang, dict } from '@/lib/i18n';

export default async function ArtistProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const lang = await getLang();
  const t = dict[lang].artist;
  const admin = createAdminClient();

  const { data: artist } = await admin
    .from('artists')
    .select('id, name, bio, portfolio_url, avatar_url, total_raised_eur')
    .eq('id', id)
    .single();

  if (!artist) notFound();

  const { data: listings } = await admin
    .from('listings')
    .select('id, title, type, price_eur, edition_size, editions_sold, ong_percentage, cover_image_url, ongs(name)')
    .eq('artist_id', id)
    .eq('status', 'active')
    .order('created_at', { ascending: false });

  const activeListings = listings ?? [];
  const totalSold = activeListings.reduce((sum, l) => sum + l.editions_sold, 0);
  const displayName = artist.name ?? 'Artista';

  return (
    <div className="min-h-screen bg-background">
      <NavHeader backLink={{ href: '/marketplace', label: 'Marketplace' }} />

      <main className="max-w-5xl mx-auto px-6 py-12 space-y-14">

        {/* Header */}
        <div className="border-b border-border pb-10 space-y-6">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-[0.2em]">{t.tag}</p>
          <div className="flex items-center gap-6">
            {artist.avatar_url && (
              <div className="w-20 h-20 overflow-hidden shrink-0 bg-muted">
                <img src={artist.avatar_url} alt={displayName} className="w-full h-full object-cover" />
              </div>
            )}
            <h1 className="text-4xl font-bold">{displayName}</h1>
          </div>

          {artist.bio && (
            <p className="text-sm text-muted-foreground max-w-xl leading-relaxed">{artist.bio}</p>
          )}

          <div className="flex flex-wrap items-center gap-4">
            {/* Stats */}
            <div className="flex divide-x divide-border border border-border">
              <div className="px-6 py-3 text-center">
                <p className="text-lg font-bold">€{Number(artist.total_raised_eur ?? 0).toFixed(0)}</p>
                <p className="text-[10px] text-muted-foreground uppercase tracking-widest mt-0.5">{t.stat_ongs}</p>
              </div>
              <div className="px-6 py-3 text-center">
                <p className="text-lg font-bold">{totalSold}</p>
                <p className="text-[10px] text-muted-foreground uppercase tracking-widest mt-0.5">{t.stat_sold}</p>
              </div>
              <div className="px-6 py-3 text-center">
                <p className="text-lg font-bold">{activeListings.length}</p>
                <p className="text-[10px] text-muted-foreground uppercase tracking-widest mt-0.5">{t.stat_works}</p>
              </div>
            </div>

            {artist.portfolio_url && (
              <a
                href={artist.portfolio_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm font-medium border border-border px-4 py-2 hover:border-foreground hover:bg-muted transition-colors"
              >
                {t.portfolio}
              </a>
            )}
          </div>
        </div>

        {/* Obras */}
        <section>
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-[0.2em] mb-8">
            {t.works_available(activeListings.length)}
          </p>

          {activeListings.length === 0 ? (
            <div className="border border-dashed border-border p-16 text-center text-sm text-muted-foreground">
              {t.empty}{' '}
              <Link href="/marketplace" className="underline underline-offset-2 hover:text-foreground">
                {t.explore}
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-px bg-border">
              {activeListings.map(listing => (
                <div key={listing.id} className="bg-background">
                  <ArtworkCard listing={listing as any} />
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
