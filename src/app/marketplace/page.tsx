import Link from 'next/link';
import { createAdminClient } from '@/lib/supabase/server';
import { ArtworkCard } from '@/components/artworks/artwork-card';
import { NavHeader } from '@/components/layout/nav-header';
import { MarketplaceFilters } from '@/components/marketplace/filters';
import { Suspense } from 'react';
import { getLang, dict } from '@/lib/i18n';

export default async function MarketplacePage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; type?: string; sort?: string }>;
}) {
  const { q, type, sort } = await searchParams;
  const lang = await getLang();
  const t = dict[lang].marketplace;
  const admin = createAdminClient();

  let query = admin
    .from('listings')
    .select('id, title, type, price_eur, edition_size, editions_sold, ong_percentage, cover_image_url, ongs(name)')
    .eq('status', 'active');

  if (q?.trim()) {
    query = query.ilike('title', `%${q.trim()}%`);
  }

  if (type === 'digital' || type === 'physical') {
    query = query.eq('type', type);
  }

  if (sort === 'price_asc') {
    query = query.order('price_eur', { ascending: true });
  } else if (sort === 'price_desc') {
    query = query.order('price_eur', { ascending: false });
  } else {
    query = query.order('created_at', { ascending: false });
  }

  const { data: listings } = await query;
  const hasFilters = !!(q || type || sort);

  return (
    <div className="min-h-screen bg-background">
      <NavHeader />

      {/* Header */}
      <section className="px-6 py-16 border-b border-border">
        <div className="max-w-5xl mx-auto">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-[0.2em] mb-4">
            {t.tag}
          </p>
          <h1 className="text-4xl font-bold tracking-tight">{t.h1}</h1>
        </div>
      </section>

      <main className="max-w-5xl mx-auto px-6 py-12 space-y-8">
        {/* Filters */}
        <Suspense>
          <MarketplaceFilters t={t} />
        </Suspense>

        {/* Results */}
        {(!listings || listings.length === 0) ? (
          <div className="py-24 text-center space-y-3">
            <p className="text-muted-foreground">
              {hasFilters ? t.empty_filters : t.empty}
            </p>
            {hasFilters ? (
              <Link
                href="/marketplace"
                className="text-sm font-medium underline underline-offset-4 hover:text-muted-foreground transition-colors"
              >
                {t.clear_filters}
              </Link>
            ) : (
              <Link
                href="/register"
                className="text-sm font-medium underline underline-offset-4 hover:text-muted-foreground transition-colors"
              >
                {t.first_artist}
              </Link>
            )}
          </div>
        ) : (
          <>
            <p className="text-xs text-muted-foreground uppercase tracking-widest">
              {t.works(listings.length)}
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-px bg-border">
              {listings.map(listing => (
                <div key={listing.id} className="bg-background">
                  <ArtworkCard listing={listing as any} />
                </div>
              ))}
            </div>
          </>
        )}
      </main>
    </div>
  );
}
