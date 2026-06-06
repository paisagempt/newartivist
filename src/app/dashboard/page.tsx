import { createClient, createAdminClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { ArtworkImage } from '@/components/artworks/artwork-image';
import { NavHeader } from '@/components/layout/nav-header';
import Link from 'next/link';

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  const admin = createAdminClient();

  const { data: profile } = await admin
    .from('users')
    .select('role, wallet_address')
    .eq('id', user.id)
    .single();

  const role = profile?.role;

  if (role === 'admin') redirect('/admin');

  // Criar wallet se ainda não existe
  if (!profile?.wallet_address) {
    try {
      const crossmintRes = await fetch('https://staging.crossmint.com/api/v1-alpha2/wallets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-KEY': process.env.CROSSMINT_SERVER_KEY!,
        },
        body: JSON.stringify({
          type: 'solana-smart-wallet',
          linkedUser: `email:${user.email}`,
          config: { adminSigner: { type: 'solana-keypair', address: process.env.ARTIVIST_PLATFORM_WALLET } },
        }),
      });
      const walletData = await crossmintRes.json();
      const walletAddress = walletData.address ?? null;
      if (walletAddress) {
        await admin.from('users').update({ wallet_address: walletAddress }).eq('id', user.id);
      }
    } catch (err) {
      console.error('[dashboard] wallet creation error:', err);
    }
  }

  let artistProfile = null;
  let ongProfile = null;

  let artistListings: any[] = [];
  let buyerPurchases: any[] = [];
  let buyerImpactEur = 0;
  let buyerTotalSpent = 0;
  let ongListings: any[] = [];

  const PLATFORM_FEE = 10;

  if (role === 'artist') {
    const { data } = await admin
      .from('artists')
      .select('id, bio, portfolio_url, total_raised_eur')
      .eq('user_id', user.id)
      .single();
    if (!data) redirect('/onboarding');
    artistProfile = data;

    const { data: listings } = await admin
      .from('listings')
      .select('id, title, type, price_eur, edition_size, editions_sold, ong_percentage, status, cover_image_url')
      .eq('artist_id', data.id)
      .order('created_at', { ascending: false });
    artistListings = listings ?? [];
  }

  if (role === 'buyer') {
    const { data: sales } = await admin
      .from('sales')
      .select('id, amount_eur, ong_amount_eur, created_at, listing_id, listings(title, type, cover_image_url)')
      .eq('buyer_email', user.email!)
      .order('created_at', { ascending: false });
    buyerPurchases = sales ?? [];
    buyerImpactEur = buyerPurchases.reduce((sum: number, s: any) => sum + Number(s.ong_amount_eur ?? 0), 0);
    buyerTotalSpent = buyerPurchases.reduce((sum: number, s: any) => sum + Number(s.amount_eur ?? 0), 0);
  }

  if (role === 'ong') {
    const { data } = await admin
      .from('ongs')
      .select('id, name, mission, registration_number, country, verified, total_received_eur')
      .eq('user_id', user.id)
      .single();
    if (!data) redirect('/onboarding');
    ongProfile = data;

    if (data.verified) {
      const { data: listings } = await admin
        .from('listings')
        .select('id, title, type, price_eur, edition_size, editions_sold, status, cover_image_url')
        .eq('ong_id', data.id)
        .order('created_at', { ascending: false });
      ongListings = listings ?? [];
    }
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black">
      <NavHeader />
      <div className="max-w-2xl mx-auto px-6 py-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold">
          {role === 'artist' && 'Dashboard — Artista'}
          {role === 'ong' && 'Dashboard — ONG'}
          {role === 'buyer' && 'Dashboard — Comprador'}
        </h1>
        <div className="flex items-center gap-2">
          {(role === 'artist' || role === 'ong') && (
            <Link
              href="/dashboard/payments"
              className="text-sm font-medium border px-4 py-2 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors"
            >
              Pagamentos
            </Link>
          )}
          <a
            href="https://staging.crossmint.com/user/collection"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm font-medium bg-foreground text-background px-4 py-2 rounded-lg hover:opacity-90 transition-opacity"
          >
            Ver wallet →
          </a>
        </div>
      </div>

      {role === 'artist' && artistProfile && (() => {
        const artistEarnings = artistListings.reduce((sum: number, l: any) => {
          const share = 100 - PLATFORM_FEE - Number(l.ong_percentage ?? 0);
          return sum + Number(l.price_eur) * l.editions_sold * share / 100;
        }, 0);
        const activeListings = artistListings.filter((l: any) => l.status === 'active').length;
        return (
          <div className="space-y-6">
            {/* Stats */}
            <div className="grid grid-cols-3 gap-3">
              <div className="rounded-xl border bg-white dark:bg-zinc-900 p-4 text-center">
                <p className="text-2xl font-bold">€{artistEarnings.toFixed(2)}</p>
                <p className="text-xs text-muted-foreground mt-1">Os meus ganhos</p>
              </div>
              <div className="rounded-xl border bg-white dark:bg-zinc-900 p-4 text-center">
                <p className="text-2xl font-bold text-green-600">€{Number(artistProfile.total_raised_eur).toFixed(0)}</p>
                <p className="text-xs text-muted-foreground mt-1">Doado a causas</p>
              </div>
              <div className="rounded-xl border bg-white dark:bg-zinc-900 p-4 text-center">
                <p className="text-2xl font-bold">{activeListings}</p>
                <p className="text-xs text-muted-foreground mt-1">Obras ativas</p>
              </div>
            </div>

            {/* Perfil */}
            <div className="rounded-xl border bg-white dark:bg-zinc-900 p-5 space-y-2 text-sm">
              <p><span className="font-medium">Email:</span> {user.email}</p>
              {artistProfile.bio && <p><span className="font-medium">Bio:</span> {artistProfile.bio}</p>}
              {artistProfile.portfolio_url && (
                <p>
                  <span className="font-medium">Portfólio:</span>{' '}
                  <a href={artistProfile.portfolio_url} target="_blank" rel="noopener noreferrer" className="text-primary underline underline-offset-2">
                    {artistProfile.portfolio_url}
                  </a>
                </p>
              )}
            </div>

            {/* Obras */}
            <div className="flex items-center justify-between">
              <h2 className="font-semibold">As minhas obras</h2>
              <Link href="/artworks/new" className="text-sm font-medium text-primary hover:underline">
                + Nova obra
              </Link>
            </div>
            {artistListings.length === 0 ? (
              <div className="rounded-xl border border-dashed p-6 text-center text-muted-foreground text-sm">
                Ainda não tens obras listadas.{' '}
                <Link href="/artworks/new" className="text-primary underline underline-offset-2">
                  Lista a tua primeira obra
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {artistListings.map((listing: any) => {
                  const artistShare = 100 - PLATFORM_FEE - Number(listing.ong_percentage ?? 0);
                  const earned = Number(listing.price_eur) * listing.editions_sold * artistShare / 100;
                  return (
                    <Link key={listing.id} href={`/artworks/${listing.id}`} className="rounded-xl border bg-white dark:bg-zinc-900 p-4 flex items-center gap-4 text-sm hover:border-zinc-400 transition-colors">
                      {listing.cover_image_url && (
                        <ArtworkImage src={listing.cover_image_url} alt={listing.title} />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{listing.title}</p>
                        <p className="text-muted-foreground">
                          {listing.editions_sold}/{listing.edition_size} vendidas · €{Number(listing.price_eur).toFixed(2)} un.
                        </p>
                        {listing.editions_sold > 0 && (
                          <p className="text-green-700 dark:text-green-400">Ganhou €{earned.toFixed(2)}</p>
                        )}
                      </div>
                      <span className={`shrink-0 text-xs font-medium px-2 py-1 rounded-full ${
                        listing.status === 'active' ? 'bg-green-100 text-green-700' :
                        listing.status === 'sold' ? 'bg-zinc-100 text-zinc-600' :
                        'bg-yellow-100 text-yellow-700'
                      }`}>
                        {listing.status === 'active' ? 'Activa' : listing.status === 'sold' ? 'Vendida' : listing.status}
                      </span>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        );
      })()}

      {role === 'ong' && ongProfile && (
        <div className="space-y-6">
          {/* Stats */}
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl border bg-white dark:bg-zinc-900 p-4 text-center">
              <p className="text-2xl font-bold text-green-600">€{Number(ongProfile.total_received_eur).toFixed(0)}</p>
              <p className="text-xs text-muted-foreground mt-1">Recebido via Artivist</p>
            </div>
            <div className="rounded-xl border bg-white dark:bg-zinc-900 p-4 text-center">
              <p className="text-2xl font-bold">{ongListings.length}</p>
              <p className="text-xs text-muted-foreground mt-1">Obras de parceiros</p>
            </div>
          </div>

          {/* Perfil */}
          <div className="rounded-xl border bg-white dark:bg-zinc-900 p-5 space-y-2 text-sm">
            <p><span className="font-medium">Organização:</span> {ongProfile.name}</p>
            <p><span className="font-medium">Email:</span> {user.email}</p>
            {ongProfile.mission && <p><span className="font-medium">Missão:</span> {ongProfile.mission}</p>}
            <p><span className="font-medium">Nº de registo:</span> {ongProfile.registration_number}</p>
            <p><span className="font-medium">País:</span> {ongProfile.country}</p>
            <p>
              <span className="font-medium">Estado:</span>{' '}
              <span className={ongProfile.verified ? 'text-green-600 font-medium' : 'text-yellow-600'}>
                {ongProfile.verified ? 'Verificada' : 'A aguardar verificação'}
              </span>
            </p>
          </div>

          {/* Obras associadas */}
          {!ongProfile.verified ? (
            <div className="rounded-xl border border-dashed p-6 text-center text-muted-foreground text-sm">
              As obras de artistas parceiros aparecerão aqui após a verificação da tua conta.
            </div>
          ) : ongListings.length === 0 ? (
            <div className="rounded-xl border border-dashed p-6 text-center text-muted-foreground text-sm">
              Ainda não há artistas a apoiar a tua causa. Partilha o Artivist com artistas!
            </div>
          ) : (
            <>
              <h2 className="font-semibold">Obras que apoiam a tua causa</h2>
              <div className="space-y-3">
                {ongListings.map((listing: any) => (
                  <Link key={listing.id} href={`/artworks/${listing.id}`} className="rounded-xl border bg-white dark:bg-zinc-900 p-4 flex items-center gap-4 text-sm hover:border-zinc-400 transition-colors">
                    {listing.cover_image_url && (
                      <ArtworkImage src={listing.cover_image_url} alt={listing.title} />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{listing.title}</p>
                      <p className="text-muted-foreground">
                        {listing.editions_sold}/{listing.edition_size} vendidas · €{Number(listing.price_eur).toFixed(2)} un.
                      </p>
                    </div>
                    <span className={`shrink-0 text-xs font-medium px-2 py-1 rounded-full ${
                      listing.status === 'active' ? 'bg-green-100 text-green-700' :
                      listing.status === 'sold' ? 'bg-zinc-100 text-zinc-600' :
                      'bg-yellow-100 text-yellow-700'
                    }`}>
                      {listing.status === 'active' ? 'Activa' : listing.status === 'sold' ? 'Vendida' : listing.status}
                    </span>
                  </Link>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {role === 'buyer' && (
        <div className="space-y-6">
          {/* Stats */}
          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-xl border bg-white dark:bg-zinc-900 p-4 text-center">
              <p className="text-2xl font-bold">{buyerPurchases.length}</p>
              <p className="text-xs text-muted-foreground mt-1">Obras na coleção</p>
            </div>
            <div className="rounded-xl border bg-white dark:bg-zinc-900 p-4 text-center">
              <p className="text-2xl font-bold">€{buyerTotalSpent.toFixed(0)}</p>
              <p className="text-xs text-muted-foreground mt-1">Total investido</p>
            </div>
            <div className="rounded-xl border bg-white dark:bg-zinc-900 p-4 text-center">
              <p className="text-2xl font-bold text-green-600">€{buyerImpactEur.toFixed(0)}</p>
              <p className="text-xs text-muted-foreground mt-1">Doado a causas</p>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <h2 className="font-semibold">A minha coleção</h2>
            <Link href="/marketplace" className="text-sm text-muted-foreground hover:text-foreground">
              Explorar marketplace →
            </Link>
          </div>
          {buyerPurchases.length === 0 ? (
            <div className="rounded-xl border border-dashed p-6 text-center text-muted-foreground text-sm">
              Ainda não tens obras na tua coleção.{' '}
              <Link href="/marketplace" className="text-primary underline underline-offset-2">
                Explora o marketplace
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {buyerPurchases.map((sale: any) => {
                const listing = sale.listings as any;
                return (
                  <Link key={sale.id} href={`/artworks/${sale.listing_id}`} className="rounded-xl border bg-white dark:bg-zinc-900 p-4 flex items-center gap-4 text-sm hover:border-zinc-400 transition-colors">
                    {listing?.cover_image_url && (
                      <ArtworkImage src={listing.cover_image_url} alt={listing.title ?? ''} />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{listing?.title ?? '—'}</p>
                      <p className="text-muted-foreground">
                        €{Number(sale.amount_eur).toFixed(2)} ·{' '}
                        {listing?.type === 'digital' ? 'Digital' : listing?.type === 'physical' ? 'Física' : 'Ambas'}
                      </p>
                      {Number(sale.ong_amount_eur) > 0 && (
                        <p className="text-green-600">€{Number(sale.ong_amount_eur).toFixed(2)} doados para causa</p>
                      )}
                    </div>
                    <span className="shrink-0 text-xs font-medium px-2 py-1 rounded-full bg-green-100 text-green-700">
                      Confirmada
                    </span>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      )}
      </div>
    </div>
  );
}
