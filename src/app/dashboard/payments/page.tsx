import { createClient, createAdminClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { NavHeader } from '@/components/layout/nav-header';
import { PaymentSettings } from '@/components/dashboard/payment-settings';
import Link from 'next/link';

export default async function PaymentsPage({
  searchParams,
}: {
  searchParams: Promise<{ stripe?: string }>;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const admin = createAdminClient();
  const { data: profile } = await admin
    .from('users')
    .select('role, wallet_address, stripe_account_id')
    .eq('id', user.id)
    .single();

  if (!['artist', 'ong'].includes(profile?.role ?? '')) redirect('/dashboard');

  const { data: allPending } = await admin
    .from('distributions')
    .select('id, amount_eur, amount_usdc, recipient_type, created_at, on_hold, hold_release_at')
    .eq('status', 'pending')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  const pendingDists = (allPending ?? []).filter(d => !d.on_hold);
  const heldDists = (allPending ?? []).filter(d => d.on_hold);

  const { data: sentDists } = await admin
    .from('distributions')
    .select('id, amount_eur, tx_signature, sent_at')
    .eq('status', 'sent')
    .eq('user_id', user.id)
    .order('sent_at', { ascending: false })
    .limit(10);

  const totalPendingEur = (pendingDists ?? []).reduce((s, d) => s + Number(d.amount_eur), 0);

  const { stripe: stripeParam } = await searchParams;

  // Verificar se o Stripe Connect foi concluído
  let stripeConnected = !!profile?.stripe_account_id;

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black">
      <NavHeader />
      <main className="max-w-2xl mx-auto px-6 py-10 space-y-8">
        <div className="flex items-center gap-3">
          <Link href="/dashboard" className="text-sm text-muted-foreground hover:text-foreground">← Dashboard</Link>
        </div>
        <h1 className="text-2xl font-bold">Pagamentos</h1>

        {stripeParam === 'success' && (
          <div className="rounded-xl bg-green-50 border border-green-200 p-4 text-sm text-green-800 dark:bg-green-950 dark:border-green-800 dark:text-green-300">
            Conta bancária ligada com sucesso!
          </div>
        )}

        {/* Saldo pendente */}
        <section className="rounded-2xl border bg-white dark:bg-zinc-900 p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Saldo disponível</p>
              <p className="text-3xl font-bold mt-1">€{totalPendingEur.toFixed(2)}</p>
            </div>
          </div>

          {(pendingDists ?? []).length > 0 && (
            <div className="space-y-2 pt-2 border-t">
              {pendingDists!.map(d => (
                <div key={d.id} className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{new Date(d.created_at).toLocaleDateString('pt-PT')}</span>
                  <span className="font-medium">€{Number(d.amount_eur).toFixed(2)}</span>
                </div>
              ))}
            </div>
          )}

          {(pendingDists ?? []).length === 0 && (
            <p className="text-sm text-muted-foreground">Sem vendas pendentes.</p>
          )}
        </section>

        {/* Valores em espera (obras físicas) */}
        {heldDists.length > 0 && (
          <section className="rounded-2xl border border-amber-200 bg-amber-50 dark:bg-amber-950 dark:border-amber-800 p-6 space-y-4">
            <div>
              <p className="text-sm font-medium text-amber-800 dark:text-amber-200">A aguardar confirmação de entrega</p>
              <p className="text-3xl font-bold mt-1 text-amber-900 dark:text-amber-100">
                €{heldDists.reduce((s, d) => s + Number(d.amount_eur), 0).toFixed(2)}
              </p>
              <p className="text-xs text-amber-700 dark:text-amber-300 mt-1">
                Libertado automaticamente 20 dias após envio, ou quando o comprador confirmar a entrega.
              </p>
            </div>
            <div className="space-y-2 pt-2 border-t border-amber-200 dark:border-amber-800">
              {heldDists.map(d => (
                <div key={d.id} className="flex justify-between text-sm text-amber-800 dark:text-amber-200">
                  <span className="text-amber-600 dark:text-amber-400">{new Date(d.created_at).toLocaleDateString('pt-PT')}</span>
                  <span className="font-medium">€{Number(d.amount_eur).toFixed(2)}</span>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Configurações de levantamento */}
        <PaymentSettings
          walletAddress={profile?.wallet_address ?? null}
          stripeConnected={stripeConnected}
          totalPendingEur={totalPendingEur}
        />

        {/* Histórico */}
        {(sentDists ?? []).length > 0 && (
          <section className="space-y-3">
            <h2 className="text-base font-semibold">Histórico de pagamentos</h2>
            {sentDists!.map(d => (
              <div key={d.id} className="flex justify-between items-center rounded-xl border bg-white dark:bg-zinc-900 px-4 py-3 text-sm">
                <div>
                  <p className="font-medium">€{Number(d.amount_eur).toFixed(2)}</p>
                  <p className="text-xs text-muted-foreground">{new Date(d.sent_at).toLocaleDateString('pt-PT')}</p>
                </div>
                {d.tx_signature && (
                  <span className="text-xs text-muted-foreground font-mono truncate max-w-[120px]">{d.tx_signature.slice(0, 12)}…</span>
                )}
              </div>
            ))}
          </section>
        )}
      </main>
    </div>
  );
}
