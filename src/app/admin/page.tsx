import { createClient, createAdminClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { LogoutButton } from '@/components/logout-button';
import { ApproveOngButton } from '@/components/admin/approve-ong-button';
import { FlushDistributionsButton } from '@/components/admin/flush-distributions-button';
import { FixDistributionsButton } from '@/components/admin/fix-distributions-button';

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

  const [{ data: pendingOngs }, { data: distributions }] = await Promise.all([
    admin
      .from('ongs')
      .select('id, name, mission, registration_number, country, verified, created_at')
      .eq('verified', false)
      .order('created_at', { ascending: true }),
    admin
      .from('distributions')
      .select('id, recipient_type, wallet_address, amount_eur, amount_usdc, status, created_at, listings(title)')
      .order('created_at', { ascending: false })
      .limit(100),
  ]);

  const pending = distributions?.filter(d => d.status === 'pending') ?? [];
  const sent = distributions?.filter(d => d.status === 'sent') ?? [];
  const totalPendingEur = pending.reduce((sum, d) => sum + Number(d.amount_eur), 0);
  const totalPendingUsdc = pending.reduce((sum, d) => sum + Number(d.amount_usdc ?? 0), 0);

  return (
    <div className="min-h-screen p-8 max-w-4xl mx-auto space-y-12">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Admin</h1>
        <LogoutButton />
      </div>

      {/* Distribuições pendentes */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold">Distribuições USDC</h2>
            {pending.length > 0 && (
              <p className="text-sm text-muted-foreground mt-0.5">
                {pending.length} pendente{pending.length !== 1 ? 's' : ''} · €{totalPendingEur.toFixed(2)} · {totalPendingUsdc.toFixed(2)} USDC
              </p>
            )}
          </div>
          <div className="flex items-center gap-2">
            <FixDistributionsButton />
            {pending.length > 0 && <FlushDistributionsButton />}
          </div>
        </div>

        {pending.length === 0 ? (
          <div className="rounded-xl border border-dashed p-8 text-center text-muted-foreground text-sm">
            Sem distribuições pendentes.
          </div>
        ) : (
          <div className="space-y-3">
            {pending.map(d => (
              <div key={d.id} className="rounded-xl border p-4 flex items-center justify-between gap-4">
                <div className="space-y-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                      d.recipient_type === 'artist'
                        ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
                        : 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
                    }`}>
                      {d.recipient_type === 'artist' ? 'Artista' : 'ONG'}
                    </span>
                    <span className="text-sm font-medium">{(d.listings as any)?.title ?? '—'}</span>
                  </div>
                  <p className="text-xs text-muted-foreground font-mono truncate">{d.wallet_address ?? 'sem wallet'}</p>
                  <p className="text-xs text-muted-foreground">
                    €{Number(d.amount_eur).toFixed(2)} · {Number(d.amount_usdc ?? 0).toFixed(4)} USDC · {new Date(d.created_at).toLocaleDateString('pt-PT')}
                  </p>
                </div>
                <span className="text-xs text-muted-foreground shrink-0">
                  {d.wallet_address ? 'Com wallet' : 'Sem wallet'}
                </span>
              </div>
            ))}
          </div>
        )}

        {sent.length > 0 && (
          <details className="mt-4">
            <summary className="text-sm text-muted-foreground cursor-pointer hover:text-foreground">
              Ver {sent.length} já enviada{sent.length !== 1 ? 's' : ''}
            </summary>
            <div className="space-y-2 mt-3">
              {sent.map(d => (
                <div key={d.id} className="rounded-xl border p-4 opacity-60 flex items-center justify-between gap-4">
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">
                        {d.recipient_type === 'artist' ? 'Artista' : 'ONG'}
                      </span>
                      <span className="text-sm font-medium">{(d.listings as any)?.title ?? '—'}</span>
                    </div>
                    <p className="text-xs text-muted-foreground font-mono truncate">{d.wallet_address ?? '—'}</p>
                    <p className="text-xs text-muted-foreground">€{Number(d.amount_eur).toFixed(2)} · enviado</p>
                  </div>
                  <span className="text-xs text-green-600 font-medium shrink-0">Enviado ✓</span>
                </div>
              ))}
            </div>
          </details>
        )}
      </section>

      {/* ONGs pendentes */}
      <section>
        <h2 className="text-lg font-semibold mb-4">Verificação de ONGs</h2>
        {(!pendingOngs || pendingOngs.length === 0) ? (
          <div className="rounded-xl border border-dashed p-8 text-center text-muted-foreground text-sm">
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
      </section>
    </div>
  );
}
