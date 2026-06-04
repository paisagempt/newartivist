import { createClient, createAdminClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { LogoutButton } from '@/components/logout-button';
import { ApproveOngButton } from '@/components/admin/approve-ong-button';

export default async function AdminPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const admin = createAdminClient();

  const { data: profile } = await admin
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single();

  if (profile?.role !== 'admin') redirect('/dashboard');

  const { data: pendingOngs } = await admin
    .from('ongs')
    .select('id, name, mission, registration_number, country, verified, created_at')
    .eq('verified', false)
    .order('created_at', { ascending: true });

  return (
    <div className="min-h-screen p-8 max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold">Admin — Verificação de ONGs</h1>
        <LogoutButton />
      </div>

      {(!pendingOngs || pendingOngs.length === 0) ? (
        <div className="rounded-xl border border-dashed p-8 text-center text-muted-foreground">
          Sem ONGs pendentes de verificação.
        </div>
      ) : (
        <div className="space-y-4">
          {pendingOngs.map(ong => (
            <div key={ong.id} className="rounded-xl border p-5 space-y-3">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="font-semibold text-base">{ong.name}</p>
                  <p className="text-sm text-muted-foreground">{ong.country} · Nº {ong.registration_number}</p>
                </div>
                <ApproveOngButton ongId={ong.id} />
              </div>
              {ong.mission && (
                <p className="text-sm text-muted-foreground">{ong.mission}</p>
              )}
              <p className="text-xs text-muted-foreground">
                Submetida em {new Date(ong.created_at).toLocaleDateString('pt-PT')}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
