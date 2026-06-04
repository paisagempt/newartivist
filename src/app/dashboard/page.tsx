import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { LogoutButton } from '@/components/logout-button';

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  const { data: profile } = await supabase
    .from('users')
    .select('role, wallet_address')
    .eq('id', user.id)
    .single();

  const role = profile?.role;

  let artistProfile = null;
  let ongProfile = null;

  if (role === 'artist') {
    const { data } = await supabase
      .from('artists')
      .select('bio, portfolio_url, verified, total_raised_eur')
      .eq('user_id', user.id)
      .single();
    if (!data) redirect('/onboarding');
    artistProfile = data;
  }

  if (role === 'ong') {
    const { data } = await supabase
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
          <div className="rounded-xl border border-dashed p-6 text-center text-muted-foreground text-sm">
            As tuas obras aparecerão aqui. Em breve poderás listar a tua primeira obra.
          </div>
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
