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
    <div className="min-h-screen bg-zinc-50 dark:bg-black">
      <NavHeader />

      {/* Hero */}
      <section className="px-6 py-16 text-center max-w-2xl mx-auto">
        <h1 className="text-4xl font-bold tracking-tight mb-4">Arte que gera impacto</h1>
        <p className="text-muted-foreground text-lg">
          Cada obra vendida distribui automaticamente uma parte para uma causa social. Compra arte, apoia o mundo.
        </p>
      </section>

      {/* Listagens */}
      <main className="max-w-5xl mx-auto px-6 pb-16">
        {(!listings || listings.length === 0) ? (
          <div className="text-center py-20 text-muted-foreground">
            <p className="text-lg">Ainda não há obras disponíveis.</p>
            <p className="text-sm mt-2">Sê o primeiro artista a publicar.</p>
            <Link href="/register" className="mt-4 inline-block text-sm font-medium text-primary underline underline-offset-2">
              Criar conta como artista
            </Link>
          </div>
        ) : (
          <>
            <p className="text-sm text-muted-foreground mb-6">{listings.length} {listings.length === 1 ? 'obra disponível' : 'obras disponíveis'}</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {listings.map(listing => (
                <ArtworkCard key={listing.id} listing={listing as any} />
              ))}
            </div>
          </>
        )}
      </main>
    </div>
  );
}
