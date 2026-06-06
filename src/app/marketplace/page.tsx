import Link from 'next/link';
import { createAdminClient } from '@/lib/supabase/server';
import { ArtworkCard } from '@/components/artworks/artwork-card';
import { NavHeader } from '@/components/layout/nav-header';

export default async function MarketplacePage() {
  const admin = createAdminClient();

  const { data: listings } = await admin
    .from('listings')
    .select('id, title, type, price_eur, edition_size, editions_sold, ong_percentage, cover_image_url, ongs(name)')
    .eq('status', 'active')
    .order('created_at', { ascending: false });

  return (
    <div className="min-h-screen bg-background">
      <NavHeader />

      {/* Header */}
      <section className="px-6 py-16 border-b border-border">
        <div className="max-w-5xl mx-auto">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-[0.2em] mb-4">
            Marketplace
          </p>
          <h1 className="text-4xl font-bold tracking-tight">Arte que gera impacto</h1>
        </div>
      </section>

      {/* Grid */}
      <main className="max-w-5xl mx-auto px-6 py-12">
        {(!listings || listings.length === 0) ? (
          <div className="py-24 text-center space-y-3">
            <p className="text-muted-foreground">Ainda não há obras disponíveis.</p>
            <Link
              href="/register"
              className="text-sm font-medium underline underline-offset-4 hover:text-muted-foreground transition-colors"
            >
              Sê o primeiro artista a publicar
            </Link>
          </div>
        ) : (
          <>
            <p className="text-xs text-muted-foreground mb-8 uppercase tracking-widest">
              {listings.length} {listings.length === 1 ? 'obra' : 'obras'}
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
