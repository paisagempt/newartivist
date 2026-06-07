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

  const totalPendingEur = pendingDists.reduce((s, d) => s + Number(d.amount_eur), 0);
  const totalHeldEur = heldDists.reduce((s, d) => s + Number(d.amount_eur), 0);

  const { stripe: stripeParam } = await searchParams;
  const stripeConnected = !!profile?.stripe_account_id;

  return (
    <div className="min-h-screen bg-background">
      <NavHeader backLink={{ href: '/dashboard', label: 'Dashboard' }} />
      <main className="max-w-2xl mx-auto px-6 py-10 space-y-10">

        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm">
          <Link href="/dashboard" className="text-muted-foreground hover:text-foreground transition-colors">
            ← Dashboard
          </Link>
        </div>

        <div className="pb-6 border-b border-border">
          <p className="text-xs text-muted-foreground uppercase tracking-[0.2em] mb-1">Conta</p>
          <h1 className="text-2xl font-bold">Pagamentos</h1>
        </div>

        {stripeParam === 'success' && (
          <div className="border border-border bg-card px-5 py-4 text-sm">
            Conta bancária ligada com sucesso.
          </div>
        )}

        {/* Saldo disponível */}
        <section className="border border-border bg-card">
          <div className="px-6 py-5 border-b border-border">
            <p className="text-xs text-muted-foreground uppercase tracking-[0.15em]">Saldo disponível</p>
            <p className="text-4xl font-bold mt-2">€{totalPendingEur.toFixed(2)}</p>
          </div>
          {pendingDists.length > 0 && (
            <div className="divide-y divide-border">
              {pendingDists.map(d => (
                <div key={d.id} className="px-6 py-3 flex justify-between text-sm">
                  <span className="text-muted-foreground">{new Date(d.created_at).toLocaleDateString('pt-PT')}</span>
                  <span className="font-medium">€{Number(d.amount_eur).toFixed(2)}</span>
                </div>
              ))}
            </div>
          )}
          {pendingDists.length === 0 && (
            <div className="px-6 py-4 text-sm text-muted-foreground">
              Sem saldo disponível.
            </div>
          )}
        </section>

        {/* A aguardar entrega */}
        {heldDists.length > 0 && (
          <section className="border border-amber-300 dark:border-amber-700 bg-card">
            <div className="px-6 py-5 border-b border-amber-300 dark:border-amber-700 flex items-center gap-3">
              <span className="w-2 h-2 bg-amber-500 animate-pulse shrink-0" />
              <div>
                <p className="text-xs text-amber-700 dark:text-amber-300 uppercase tracking-[0.15em]">
                  A aguardar confirmação de entrega
                </p>
                <p className="text-4xl font-bold mt-2">€{totalHeldEur.toFixed(2)}</p>
              </div>
            </div>
            <div className="divide-y divide-amber-200 dark:divide-amber-800">
              {heldDists.map(d => (
                <div key={d.id} className="px-6 py-3 flex justify-between text-sm">
                  <span className="text-muted-foreground">{new Date(d.created_at).toLocaleDateString('pt-PT')}</span>
                  <span className="font-medium">€{Number(d.amount_eur).toFixed(2)}</span>
                </div>
              ))}
            </div>
            <div className="px-6 py-4 border-t border-amber-200 dark:border-amber-800">
              <p className="text-xs text-muted-foreground">
                Libertado quando o comprador confirmar a entrega, ou automaticamente 20 dias após envio.
              </p>
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
            <h2 className="text-xs font-medium uppercase tracking-[0.15em] text-muted-foreground">
              Histórico de pagamentos
            </h2>
            <div className="divide-y divide-border border border-border bg-card">
              {sentDists!.map(d => (
                <div key={d.id} className="px-5 py-3 flex justify-between items-center text-sm">
                  <div>
                    <p className="font-medium">€{Number(d.amount_eur).toFixed(2)}</p>
                    <p className="text-xs text-muted-foreground">{new Date(d.sent_at).toLocaleDateString('pt-PT')}</p>
                  </div>
                  {d.tx_signature && (
                    <span className="text-xs text-muted-foreground font-mono truncate max-w-[120px]">
                      {d.tx_signature.slice(0, 12)}…
                    </span>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
