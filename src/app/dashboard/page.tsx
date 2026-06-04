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

  // Verificar se onboarding está completo
  if (role === 'artist') {
    const { data: artistProfile } = await supabase
      .from('artists')
      .select('id')
      .eq('user_id', user.id)
      .single();
    if (!artistProfile) redirect('/onboarding');
  }

  if (role === 'ong') {
    const { data: ongProfile } = await supabase
      .from('ongs')
      .select('id')
      .eq('user_id', user.id)
      .single();
    if (!ongProfile) redirect('/onboarding');
  }

  return (
    <div className="min-h-screen p-8 max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-2">
        <h1 className="text-2xl font-bold">
          {role === 'artist' && 'Dashboard — Artista'}
          {role === 'ong' && 'Dashboard — ONG'}
          {role === 'buyer' && 'Dashboard — Comprador'}
        </h1>
        <LogoutButton />
      </div>
      <p className="text-muted-foreground mb-8">A plataforma está a ser construída. Mais em breve.</p>
      <div className="rounded-xl border p-6 space-y-3 text-sm">
        <p><span className="font-medium">Email:</span> {user.email}</p>
        <p><span className="font-medium">Papel:</span> {role ?? '—'}</p>
      </div>
    </div>
  );
}
