import { createClient, createAdminClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { NavHeader } from '@/components/layout/nav-header';
import { EditProfileForm } from '@/components/profile/edit-form';
import Link from 'next/link';

export default async function EditProfilePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  const admin = createAdminClient();
  const { data: profile } = await admin.from('users').select('role').eq('id', user.id).single();
  const role = profile?.role;

  if (role === 'artist') {
    const { data: artist } = await admin
      .from('artists')
      .select('bio, portfolio_url')
      .eq('user_id', user.id)
      .single();

    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-black">
        <NavHeader />
        <div className="max-w-lg mx-auto px-6 py-10">
          <div className="mb-6">
            <Link href="/dashboard" className="text-sm text-muted-foreground hover:text-foreground">← Dashboard</Link>
            <h1 className="text-2xl font-bold mt-2">Editar perfil</h1>
          </div>
          <div className="rounded-2xl border bg-white dark:bg-zinc-900 p-6">
            <EditProfileForm
              role="artist"
              bio={artist?.bio ?? ''}
              portfolioUrl={artist?.portfolio_url ?? ''}
            />
          </div>
        </div>
      </div>
    );
  }

  if (role === 'ong') {
    const { data: ong } = await admin
      .from('ongs')
      .select('mission')
      .eq('user_id', user.id)
      .single();

    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-black">
        <NavHeader />
        <div className="max-w-lg mx-auto px-6 py-10">
          <div className="mb-6">
            <Link href="/dashboard" className="text-sm text-muted-foreground hover:text-foreground">← Dashboard</Link>
            <h1 className="text-2xl font-bold mt-2">Editar perfil</h1>
          </div>
          <div className="rounded-2xl border bg-white dark:bg-zinc-900 p-6">
            <EditProfileForm role="ong" mission={ong?.mission ?? ''} />
          </div>
        </div>
      </div>
    );
  }

  redirect('/dashboard');
}
