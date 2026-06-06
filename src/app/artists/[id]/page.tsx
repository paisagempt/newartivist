import { createAdminClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import { NavHeader } from '@/components/layout/nav-header';
import { ArtworkCard } from '@/components/artworks/artwork-card';
import Link from 'next/link';

export default async function ArtistProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const admin = createAdminClient();

  const { data: artist } = await admin
    .from('artists')
    .select('id, bio, portfolio_url, total_raised_eur, user_id')
    .eq('id', id)
    .single();

  if (!artist) notFound();

  const { data: userRow } = await admin
    .from('users')
    .select('email')
    .eq('id', artist.user_id)
    .single();

  const { data: listings } = await admin
    .from('listings')
    .select('id, title, type, price_eur, edition_size, editions_sold, ong_percentage, cover_image_url, ongs(name)')
    .eq('artist_id', id)
    .eq('status', 'active')
    .order('created_at', { ascending: false });

  const handle = userRow?.email?.split('@')[0] ?? 'Artista';

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black">
      <NavHeader />

      <main className="max-w-4xl mx-auto px-6 py-12">
        {/* Perfil */}
        <div className="flex flex-col sm:flex-row gap-6 items-start mb-12">
          <div className="w-16 h-16 rounded-full bg-zinc-200 dark:bg-zinc-700 flex items-center justify-center text-2xl font-bold shrink-0">
            {handle[0].toUpperCase()}
          </div>
          <div className="flex-1">
            <h1 className="text-2xl font-bold">{handle}</h1>
            {artist.bio && (
              <p className="text-muted-foreground mt-2 leading-relaxed max-w-xl">{artist.bio}</p>
            )}
            <div className="flex flex-wrap items-center gap-4 mt-3 text-sm">
              {artist.portfolio_url && (
                <a
                  href={artist.portfolio_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary underline underline-offset-2"
                >
                  Portfólio →
                </a>
              )}
              {Number(artist.total_raised_eur) > 0 && (
                <span className="text-green-600 font-medium">
                  €{Number(artist.total_raised_eur).toFixed(0)} doado para causas
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Obras */}
        <h2 className="text-lg font-semibold mb-4">Obras disponíveis</h2>
        {!listings || listings.length === 0 ? (
          <div className="rounded-xl border border-dashed p-10 text-center text-muted-foreground text-sm">
            Este artista ainda não tem obras disponíveis.{' '}
            <Link href="/marketplace" className="text-primary underline underline-offset-2">
              Ver outros artistas
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {listings.map(listing => (
              <ArtworkCard key={listing.id} listing={listing as any} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
