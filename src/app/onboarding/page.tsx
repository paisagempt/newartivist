import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { ArtistForm } from '@/components/onboarding/artist-form';
import { OngForm } from '@/components/onboarding/ong-form';
import { LogoutButton } from '@/components/logout-button';

export default async function OnboardingPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  const { data: profile } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single();

  const role = profile?.role;

  // Buyers não precisam de onboarding
  if (role === 'buyer') redirect('/dashboard');

  // Verificar se já completou o onboarding
  if (role === 'artist') {
    const { data: artistProfile } = await supabase
      .from('artists')
      .select('id')
      .eq('user_id', user.id)
      .single();
    if (artistProfile) redirect('/dashboard');
  }

  if (role === 'ong') {
    const { data: ongProfile } = await supabase
      .from('ongs')
      .select('id')
      .eq('user_id', user.id)
      .single();
    if (ongProfile) redirect('/dashboard');
  }

  return (
    <div className="min-h-screen flex flex-col bg-zinc-50 dark:bg-black">
      <div className="flex justify-end p-4">
        <LogoutButton />
      </div>
      <div className="flex flex-1 items-center justify-center p-4">
        {role === 'artist' && <ArtistForm />}
        {role === 'ong' && <OngForm />}
      </div>
    </div>
  );
}
