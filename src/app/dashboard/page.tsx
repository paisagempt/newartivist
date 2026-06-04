import { createClient, createAdminClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { LogoutButton } from '@/components/logout-button';
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

  let artistProfile = null;
  let ongProfile = null;

  let artistListings: any[] = [];

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
      .select('id, title, type, price_eur, edition_size, editions_sold, status, cover_image_url')
      .eq('artist_id', data.id)
      .order('created_at', { ascending: false });
    artistListings = listings ?? [];
  }

  if (role === 'ong') {
    const { data } = await admin
      .from('ongs')
      .select('name, mission, registration_number, country, verified, total_received_eur')
      .eq('user_id', user.id)
      .single();
    if (!data) redirect('/onboarding');
    ongProfile = data;
  }

  return (
    <div className="min-h-screen p-8 max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold">
          {role === 'artist' && 'Dashboard — Artista'}
          {role === 'ong' && 'Dashboard — ONG'}
          {role === 'buyer' && 'Dashboard — Comprador'}
        </h1>
        <LogoutButton />
      </div>

      {role === 'artist' && artistProfile && (
        <div className="space-y-6">
          <div className="rounded-xl border p-6 space-y-3 text-sm">
            <p><span className="font-medium">Email:</span> {user.email}</p>
            <p><span className="font-medium">Bio:</span> {artistProfile.bio ?? '—'}</p>
            {artistProfile.portfolio_url && (
              <p>
                <span className="font-medium">Portfólio:</span>{' '}
                <a href={artistProfile.portfolio_url} target="_blank" rel="noopener noreferrer" className="text-primary underline underline-offset-2">
                  {artistProfile.portfolio_url}
                </a>
              </p>
            )}
            <p><span className="font-medium">Total angariado para causas:</span> €{Number(artistProfile.total_raised_eur).toFixed(2)}</p>
          </div>
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
              {artistListings.map((listing) => (
                <div key={listing.id} className="rounded-xl border p-4 flex items-center gap-4 text-sm">
                  {listing.cover_image_url && (
                    <img src={listing.cover_image_url} alt={listing.title} className="size-12 rounded-lg object-cover shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{listing.title}</p>
                    <p className="text-muted-foreground">
                      €{Number(listing.price_eur).toFixed(2)} · {listing.type === 'digital' ? 'Digital' : listing.type === 'physical' ? 'Física' : 'Ambas'} · {listing.editions_sold}/{listing.edition_size} vendidas
                    </p>
                  </div>
                  <span className={`shrink-0 text-xs font-medium px-2 py-1 rounded-full ${
                    listing.status === 'active' ? 'bg-green-100 text-green-700' :
                    listing.status === 'sold' ? 'bg-zinc-100 text-zinc-600' :
                    'bg-yellow-100 text-yellow-700'
                  }`}>
                    {listing.status === 'active' ? 'Activa' : listing.status === 'sold' ? 'Vendida' : listing.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {role === 'ong' && ongProfile && (
        <div className="space-y-6">
          <div className="rounded-xl border p-6 space-y-3 text-sm">
            <p><span className="font-medium">Organização:</span> {ongProfile.name}</p>
            <p><span className="font-medium">Email:</span> {user.email}</p>
            {ongProfile.mission && (
              <p><span className="font-medium">Missão:</span> {ongProfile.mission}</p>
            )}
            <p><span className="font-medium">Nº de registo:</span> {ongProfile.registration_number}</p>
            <p><span className="font-medium">País:</span> {ongProfile.country}</p>
            <p>
              <span className="font-medium">Estado:</span>{' '}
              <span className={ongProfile.verified ? 'text-green-600' : 'text-yellow-600'}>
                {ongProfile.verified ? 'Verificada' : 'A aguardar verificação'}
              </span>
            </p>
            <p><span className="font-medium">Total recebido via Artivist:</span> €{Number(ongProfile.total_received_eur).toFixed(2)}</p>
          </div>
          <div className="rounded-xl border border-dashed p-6 text-center text-muted-foreground text-sm">
            As obras de artistas parceiros aparecerão aqui após a verificação da tua conta.
          </div>
        </div>
      )}

      {role === 'buyer' && (
        <div className="space-y-6">
          <div className="rounded-xl border p-6 space-y-3 text-sm">
            <p><span className="font-medium">Email:</span> {user.email}</p>
            <p><span className="font-medium">Impacto gerado:</span> €0,00 doado para causas</p>
          </div>
          <div className="rounded-xl border border-dashed p-6 text-center text-muted-foreground text-sm">
            A tua coleção de obras aparecerá aqui. Em breve poderás comprar a tua primeira obra.
          </div>
        </div>
      )}
    </div>
  );
}
