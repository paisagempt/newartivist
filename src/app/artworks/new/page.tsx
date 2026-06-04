import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { ListingForm } from '@/components/artworks/listing-form';
import { LogoutButton } from '@/components/logout-button';
import Link from 'next/link';

export default async function NewArtworkPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  const { data: profile } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single();

  if (profile?.role !== 'artist') redirect('/dashboard');

  // Buscar ONGs verificadas
  const { data: ongs } = await supabase
    .from('ongs')
    .select('id, name')
    .eq('verified', true)
    .order('name');

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black">
      <div className="max-w-xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <Link href="/dashboard" className="text-sm text-muted-foreground hover:text-foreground">
              ← Dashboard
            </Link>
            <h1 className="text-2xl font-bold mt-1">Nova obra</h1>
          </div>
          <LogoutButton />
        </div>
        <ListingForm ongs={ongs ?? []} />
      </div>
    </div>
  );
}
