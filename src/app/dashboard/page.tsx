import { createClient, createAdminClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { ArtworkImage } from '@/components/artworks/artwork-image';
import { NavHeader } from '@/components/layout/nav-header';
import { FulfillOrderButton } from '@/components/dashboard/fulfill-order-button';
import { EditArtistProfile } from '@/components/dashboard/edit-artist-profile';
import { EditOngProfile } from '@/components/dashboard/edit-ong-profile';
import { EditListingPrice } from '@/components/dashboard/edit-listing-price';
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
  let artistPhysicalSales: any[] = [];
  let myPurchases: any[] = [];
  let buyerTotalSpent = 0;
  let ongListings: any[] = [];

  const PLATFORM_FEE = 10;

  if (role === 'artist') {
    const { data } = await admin
      .from('artists')
      .select('id, name, bio, portfolio_url, avatar_url, total_raised_eur')
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

    const physicalListingIds = artistListings
      .filter((l: any) => l.type === 'physical' || l.type === 'both')
      .map((l: any) => l.id);
    if (physicalListingIds.length > 0) {
      const { data: physSales } = await admin
        .from('sales')
        .select('id, buyer_email, amount_eur, fulfillment_status, tracking_number, shipped_at, created_at, shipping_address, listing_id, listings(title, cover_image_url)')
        .in('listing_id', physicalListingIds)
        .not('fulfillment_status', 'is', null)
        .order('created_at', { ascending: false });
      artistPhysicalSales = physSales ?? [];
    }
  }

  const { data: purchases } = await admin
    .from('sales')
    .select('id, amount_eur, fulfillment_status, tracking_number, shipped_at, created_at, listing_id, listings(title, type, cover_image_url)')
    .eq('buyer_email', user.email!)
    .order('created_at', { ascending: false });
  myPurchases = purchases ?? [];

  if (role === 'buyer') {
    buyerTotalSpent = myPurchases.reduce((sum: number, s: any) => sum + Number(s.amount_eur ?? 0), 0);
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

  const roleLabel: Record<string, string> = {
    artist: 'Artista',
    ong: 'ONG',
    buyer: 'Comprador',
  };

  return (
    <div className="min-h-screen bg-background">
      <NavHeader />
      <div className="max-w-2xl mx-auto px-6 py-10">

        {/* Header */}
        <div className="flex items-center justify-between mb-10 pb-6 border-b border-border">
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-[0.2em] mb-1">Dashboard</p>
            <h1 className="text-2xl font-bold">{roleLabel[role ?? ''] ?? ''}</h1>
          </div>
          <div className="flex items-center gap-3">
            {(role === 'artist' || role === 'ong') && (
              <Link
                href="/dashboard/payments"
                className="text-sm font-medium border border-border px-4 py-2 hover:border-foreground hover:bg-muted transition-colors"
              >
                Pagamentos
              </Link>
            )}
            <a
              href="https://staging.crossmint.com/user/collection"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm font-medium bg-foreground text-background px-4 py-2 hover:bg-foreground/85 transition-colors"
            >
              Wallet →
            </a>
          </div>
        </div>

        {/* ── ARTISTA ── */}
        {role === 'artist' && artistProfile && (() => {
          const artistEarnings = artistListings.reduce((sum: number, l: any) => {
            const share = 100 - PLATFORM_FEE - Number(l.ong_percentage ?? 0);
            return sum + Number(l.price_eur) * l.editions_sold * share / 100;
          }, 0);
          const ongDonated = artistListings.reduce((sum: number, l: any) => {
            return sum + Number(l.price_eur) * l.editions_sold * Number(l.ong_percentage ?? 0) / 100;
          }, 0);
          const activeListings = artistListings.filter((l: any) => l.status === 'active').length;
          const pendingShipments = artistPhysicalSales.filter((s: any) =>
            s.fulfillment_status === 'pending' || s.fulfillment_status === 'processing'
          );

          return (
            <div className="space-y-10">

              {/* Encomendas urgentes */}
              {pendingShipments.length > 0 && (
                <section className="border-l-4 border-amber-500 pl-5 space-y-5">
                  <div className="flex items-center gap-3">
                    <span className="w-2 h-2 bg-amber-500 animate-pulse shrink-0" />
                    <p className="text-sm font-semibold">
                      {pendingShipments.length} encomenda{pendingShipments.length !== 1 ? 's' : ''} por enviar
                    </p>
                  </div>
                  <div className="space-y-4">
                    {pendingShipments.map((sale: any) => {
                      const addr = sale.shipping_address as any;
                      return (
                        <div key={sale.id} className="border border-amber-200 dark:border-amber-800 bg-card p-5 space-y-4">
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <p className="font-medium text-sm">{(sale.listings as any)?.title ?? '—'}</p>
                              <p className="text-xs text-muted-foreground mt-1">
                                {sale.buyer_email} · €{Number(sale.amount_eur).toFixed(2)}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                Compra: {new Date(sale.created_at).toLocaleDateString('pt-PT')}
                              </p>
                            </div>
                            <Link
                              href={`/dashboard/orders/${sale.id}`}
                              className="text-xs text-muted-foreground hover:text-foreground transition-colors shrink-0 underline underline-offset-2"
                            >
                              Ver detalhes
                            </Link>
                          </div>
                          {addr && (
                            <div className="bg-muted px-4 py-3 text-xs space-y-0.5">
                              <p className="font-medium text-foreground">Morada de entrega</p>
                              <p className="text-muted-foreground">{addr.name}</p>
                              <p className="text-muted-foreground">{addr.line1}, {addr.postal_code} {addr.city}, {addr.country}</p>
                            </div>
                          )}
                          <FulfillOrderButton saleId={sale.id} />
                        </div>
                      );
                    })}
                  </div>
                </section>
              )}

              {/* Stats */}
              <div className="grid grid-cols-3 divide-x divide-border border border-border">
                <div className="p-5 text-center">
                  <p className="text-2xl font-bold">€{artistEarnings.toFixed(0)}</p>
                  <p className="text-xs text-muted-foreground mt-1 uppercase tracking-widest">Ganhos</p>
                </div>
                <div className="p-5 text-center">
                  <p className="text-2xl font-bold">€{ongDonated.toFixed(0)}</p>
                  <p className="text-xs text-muted-foreground mt-1 uppercase tracking-widest">Doado</p>
                </div>
                <div className="p-5 text-center">
                  <p className="text-2xl font-bold">{activeListings}</p>
                  <p className="text-xs text-muted-foreground mt-1 uppercase tracking-widest">Obras</p>
                </div>
              </div>

              {/* Perfil */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-medium uppercase tracking-[0.15em]">Perfil</p>
                  <div className="flex items-center gap-3">
                    <Link
                      href={`/artistas/${artistProfile.id}`}
                      className="text-xs text-muted-foreground hover:text-foreground transition-colors underline underline-offset-2"
                      target="_blank"
                    >
                      Ver perfil público →
                    </Link>
                    <EditArtistProfile
                      artistId={artistProfile.id}
                      name={artistProfile.name ?? null}
                      bio={artistProfile.bio ?? null}
                      portfolioUrl={artistProfile.portfolio_url ?? null}
                      avatarUrl={artistProfile.avatar_url ?? null}
                    />
                  </div>
                </div>
                <div className="border border-border divide-y divide-border text-sm">
                  <div className="px-4 py-3 flex gap-4">
                    <span className="text-muted-foreground w-24 shrink-0">Email</span>
                    <span>{user.email}</span>
                  </div>
                  {artistProfile.name && (
                    <div className="px-4 py-3 flex gap-4">
                      <span className="text-muted-foreground w-24 shrink-0">Nome</span>
                      <span>{artistProfile.name}</span>
                    </div>
                  )}
                  {artistProfile.bio && (
                    <div className="px-4 py-3 flex gap-4">
                      <span className="text-muted-foreground w-24 shrink-0">Bio</span>
                      <span>{artistProfile.bio}</span>
                    </div>
                  )}
                  {artistProfile.portfolio_url && (
                    <div className="px-4 py-3 flex gap-4">
                      <span className="text-muted-foreground w-24 shrink-0">Portfólio</span>
                      <a
                        href={artistProfile.portfolio_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="underline underline-offset-2 hover:text-muted-foreground transition-colors truncate"
                      >
                        {artistProfile.portfolio_url}
                      </a>
                    </div>
                  )}
                </div>
              </div>

              {/* Obras */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-sm font-semibold uppercase tracking-[0.15em]">As minhas obras</h2>
                  <Link
                    href="/artworks/new"
                    className="text-xs font-medium bg-foreground text-background px-4 py-2 hover:bg-foreground/85 transition-colors"
                  >
                    + Nova obra
                  </Link>
                </div>
                {artistListings.length === 0 ? (
                  <div className="border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
                    Ainda não tens obras listadas.{' '}
                    <Link href="/artworks/new" className="underline underline-offset-2 hover:text-foreground">
                      Lista a tua primeira obra
                    </Link>
                  </div>
                ) : (
                  <div className="divide-y divide-border border border-border">
                    {artistListings.map((listing: any) => {
                      const artistShare = 100 - PLATFORM_FEE - Number(listing.ong_percentage ?? 0);
                      const earned = Number(listing.price_eur) * listing.editions_sold * artistShare / 100;
                      const statusLabel: Record<string, string> = { active: 'Activa', sold: 'Vendida', draft: 'Rascunho' };
                      return (
                        <div key={listing.id} className="flex items-center gap-4 px-4 py-3 hover:bg-muted transition-colors">
                          <Link href={`/artworks/${listing.id}`} className="flex items-center gap-4 flex-1 min-w-0">
                            {listing.cover_image_url && (
                              <ArtworkImage src={listing.cover_image_url} alt={listing.title} />
                            )}
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate">{listing.title}</p>
                              <p className="text-xs text-muted-foreground mt-0.5">
                                {listing.editions_sold}/{listing.edition_size} vendidas · €{Number(listing.price_eur).toFixed(2)}
                              </p>
                              {listing.editions_sold > 0 && (
                                <p className="text-xs text-muted-foreground">Ganhou €{earned.toFixed(2)}</p>
                              )}
                            </div>
                          </Link>
                          <div className="flex items-center gap-3 shrink-0">
                            <EditListingPrice listingId={listing.id} currentPrice={Number(listing.price_eur)} />
                            <StatusChip status={listing.status} label={statusLabel[listing.status] ?? listing.status} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Encomendas enviadas */}
              {artistPhysicalSales.filter((s: any) => s.fulfillment_status === 'shipped' || s.fulfillment_status === 'delivered').length > 0 && (
                <div>
                  <h2 className="text-sm font-semibold uppercase tracking-[0.15em] mb-4">Encomendas enviadas</h2>
                  <div className="divide-y divide-border border border-border">
                    {artistPhysicalSales
                      .filter((s: any) => s.fulfillment_status === 'shipped' || s.fulfillment_status === 'delivered')
                      .map((sale: any) => {
                        const statusLabel: Record<string, string> = { shipped: 'Em trânsito', delivered: 'Entregue' };
                        return (
                          <Link
                            key={sale.id}
                            href={`/dashboard/orders/${sale.id}`}
                            className="flex items-center gap-4 px-4 py-3 hover:bg-muted transition-colors"
                          >
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate">{(sale.listings as any)?.title ?? '—'}</p>
                              <p className="text-xs text-muted-foreground mt-0.5">
                                {sale.buyer_email} · €{Number(sale.amount_eur).toFixed(2)}
                              </p>
                              {sale.tracking_number && (
                                <p className="text-xs font-mono text-muted-foreground mt-0.5">{sale.tracking_number}</p>
                              )}
                            </div>
                            <StatusChip status={sale.fulfillment_status} label={statusLabel[sale.fulfillment_status] ?? sale.fulfillment_status} />
                          </Link>
                        );
                      })}
                  </div>
                </div>
              )}

              {/* Compras */}
              {myPurchases.length > 0 && (
                <div>
                  <h2 className="text-sm font-semibold uppercase tracking-[0.15em] mb-4">As minhas compras</h2>
                  <PurchaseListInline purchases={myPurchases} />
                </div>
              )}
            </div>
          );
        })()}

        {/* ── ONG ── */}
        {role === 'ong' && ongProfile && (
          <div className="space-y-10">

            {/* Stats */}
            <div className="grid grid-cols-2 divide-x divide-border border border-border">
              <div className="p-5 text-center">
                <p className="text-2xl font-bold">€{Number(ongProfile.total_received_eur).toFixed(0)}</p>
                <p className="text-xs text-muted-foreground mt-1 uppercase tracking-widest">Recebido</p>
              </div>
              <div className="p-5 text-center">
                <p className="text-2xl font-bold">{ongListings.length}</p>
                <p className="text-xs text-muted-foreground mt-1 uppercase tracking-widest">Obras parceiras</p>
              </div>
            </div>

            {/* Perfil */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-xs font-medium uppercase tracking-[0.15em]">Perfil</p>
                <EditOngProfile mission={ongProfile.mission ?? null} />
              </div>
              <div className="border border-border divide-y divide-border text-sm">
                {[
                  { label: 'Organização', value: ongProfile.name },
                  { label: 'Email', value: user.email },
                  ongProfile.mission && { label: 'Missão', value: ongProfile.mission },
                  { label: 'Nº de registo', value: ongProfile.registration_number },
                  { label: 'País', value: ongProfile.country },
                  { label: 'Estado', value: ongProfile.verified ? 'Verificada' : 'A aguardar verificação', highlight: true },
                ].filter(Boolean).map((row: any) => (
                  <div key={row.label} className="px-4 py-3 flex gap-4">
                    <span className="text-muted-foreground w-28 shrink-0">{row.label}</span>
                    <span className={row.highlight ? (ongProfile.verified ? 'font-medium' : 'text-muted-foreground') : ''}>
                      {row.value}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Obras associadas */}
            {!ongProfile.verified ? (
              <div className="border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
                As obras de artistas parceiros aparecerão aqui após a verificação da tua conta.
              </div>
            ) : ongListings.length === 0 ? (
              <div className="border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
                Ainda não há artistas a apoiar a tua causa. Partilha o Artivist!
              </div>
            ) : (
              <div>
                <h2 className="text-sm font-semibold uppercase tracking-[0.15em] mb-4">Obras que apoiam a tua causa</h2>
                <div className="divide-y divide-border border border-border">
                  {ongListings.map((listing: any) => (
                    <Link
                      key={listing.id}
                      href={`/artworks/${listing.id}`}
                      className="flex items-center gap-4 px-4 py-3 hover:bg-muted transition-colors"
                    >
                      {listing.cover_image_url && (
                        <ArtworkImage src={listing.cover_image_url} alt={listing.title} />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{listing.title}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {listing.editions_sold}/{listing.edition_size} vendidas · €{Number(listing.price_eur).toFixed(2)}
                        </p>
                      </div>
                      <StatusChip status={listing.status} label={listing.status === 'active' ? 'Activa' : listing.status === 'sold' ? 'Vendida' : listing.status} />
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {myPurchases.length > 0 && (
              <div>
                <h2 className="text-sm font-semibold uppercase tracking-[0.15em] mb-4">As minhas compras</h2>
                <PurchaseListInline purchases={myPurchases} />
              </div>
            )}
          </div>
        )}

        {/* ── COMPRADOR ── */}
        {role === 'buyer' && (
          <div className="space-y-10">

            {/* Stats */}
            <div className="grid grid-cols-2 divide-x divide-border border border-border">
              <div className="p-5 text-center">
                <p className="text-2xl font-bold">{myPurchases.length}</p>
                <p className="text-xs text-muted-foreground mt-1 uppercase tracking-widest">Obras</p>
              </div>
              <div className="p-5 text-center">
                <p className="text-2xl font-bold">€{buyerTotalSpent.toFixed(0)}</p>
                <p className="text-xs text-muted-foreground mt-1 uppercase tracking-widest">Investido</p>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold uppercase tracking-[0.15em]">A minha coleção</h2>
              <Link href="/marketplace" className="text-xs text-muted-foreground hover:text-foreground transition-colors">
                Explorar marketplace →
              </Link>
            </div>

            {myPurchases.length === 0 ? (
              <div className="border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
                Ainda não tens obras na tua coleção.{' '}
                <Link href="/marketplace" className="underline underline-offset-2 hover:text-foreground">
                  Explora o marketplace
                </Link>
              </div>
            ) : (
              <PurchaseListInline purchases={myPurchases} />
            )}
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Status chip — sem border-radius ─────────────────────── */
function StatusChip({ status, label }: { status: string; label: string }) {
  const map: Record<string, string> = {
    active:    'bg-foreground text-background',
    sold:      'bg-muted text-muted-foreground',
    shipped:   'bg-muted text-foreground',
    delivered: 'bg-foreground text-background',
    pending:   'border border-border text-muted-foreground',
    processing:'border border-border text-muted-foreground',
    draft:     'border border-border text-muted-foreground',
  };
  return (
    <span className={`shrink-0 text-[10px] font-medium px-2.5 py-1 uppercase tracking-[0.1em] ${map[status] ?? 'border border-border text-muted-foreground'}`}>
      {label}
    </span>
  );
}

/* ── Lista de compras ─────────────────────────────────────── */
function PurchaseListInline({ purchases }: { purchases: any[] }) {
  const statusLabel: Record<string, string> = {
    pending: 'Por enviar', processing: 'Em preparação',
    shipped: 'Em trânsito', delivered: 'Entregue',
  };
  return (
    <div className="divide-y divide-border border border-border">
      {purchases.map((sale: any) => {
        const listing = sale.listings as any;
        const isPhysical = listing?.type === 'physical' || listing?.type === 'both';
        const status = sale.fulfillment_status;
        const href = isPhysical ? `/dashboard/orders/${sale.id}` : `/artworks/${sale.listing_id}`;
        return (
          <Link
            key={sale.id}
            href={href}
            className="flex items-center gap-4 px-4 py-3 hover:bg-muted transition-colors"
          >
            {listing?.cover_image_url && (
              <ArtworkImage src={listing.cover_image_url} alt={listing.title ?? ''} />
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{listing?.title ?? '—'}</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                €{Number(sale.amount_eur).toFixed(2)} ·{' '}
                {listing?.type === 'digital' ? 'Digital' : listing?.type === 'physical' ? 'Física' : 'Ambas'}
              </p>
              {isPhysical && sale.tracking_number && (
                <p className="text-xs text-muted-foreground font-mono mt-0.5">{sale.tracking_number}</p>
              )}
            </div>
            <StatusChip
              status={isPhysical && status ? status : 'delivered'}
              label={isPhysical && status ? (statusLabel[status] ?? status) : 'Confirmada'}
            />
          </Link>
        );
      })}
    </div>
  );
}
