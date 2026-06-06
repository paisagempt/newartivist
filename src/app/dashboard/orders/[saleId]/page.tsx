import { createClient, createAdminClient } from '@/lib/supabase/server';
import { redirect, notFound } from 'next/navigation';
import { NavHeader } from '@/components/layout/nav-header';
import { OrderActions } from '@/components/dashboard/order-actions';
import Link from 'next/link';

export default async function OrderTrackingPage({
  params,
}: {
  params: Promise<{ saleId: string }>;
}) {
  const { saleId } = await params;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const admin = createAdminClient();

  const { data: sale } = await admin
    .from('sales')
    .select('*, listings(title, cover_image_url, type, artist_id, artists(user_id))')
    .eq('id', saleId)
    .single();

  if (!sale) notFound();

  const isBuyer = sale.buyer_email === user.email;
  const artistUserId = (sale.listings as any)?.artists?.user_id;
  const isArtist = artistUserId === user.id;

  if (!isBuyer && !isArtist) redirect('/dashboard');

  const listing = sale.listings as any;
  const addr = sale.shipping_address as any;

  const statusSteps = [
    { key: 'pending', label: 'Encomenda recebida', done: true },
    { key: 'shipped', label: 'Enviado', done: !!sale.shipped_at },
    { key: 'delivered', label: 'Entregue', done: sale.fulfillment_status === 'delivered' },
  ];

  const daysSincePurchase = (Date.now() - new Date(sale.created_at).getTime()) / (1000 * 60 * 60 * 24);
  const canOpenDispute = !sale.dispute_opened_at && (sale.fulfillment_status === 'shipped' || daysSincePurchase >= 20);
  const daysUntilDispute = Math.max(0, Math.ceil(20 - daysSincePurchase));

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black">
      <NavHeader />
      <main className="max-w-xl mx-auto px-6 py-10 space-y-8">
        <div>
          <Link href="/dashboard" className="text-sm text-muted-foreground hover:text-foreground">← Dashboard</Link>
          <h1 className="text-2xl font-bold mt-3">Acompanhamento de encomenda</h1>
          {listing?.title && <p className="text-muted-foreground mt-1">{listing.title}</p>}
        </div>

        {/* Timeline */}
        <section className="rounded-2xl border bg-white dark:bg-zinc-900 p-6 space-y-5">
          {statusSteps.map((step, i) => (
            <div key={step.key} className="flex items-start gap-4">
              <div className="flex flex-col items-center">
                <div className={`w-4 h-4 rounded-full border-2 mt-0.5 ${step.done ? 'bg-green-500 border-green-500' : 'bg-background border-zinc-300'}`} />
                {i < statusSteps.length - 1 && (
                  <div className={`w-0.5 h-6 mt-1 ${statusSteps[i + 1].done ? 'bg-green-500' : 'bg-zinc-200 dark:bg-zinc-700'}`} />
                )}
              </div>
              <div>
                <p className={`text-sm font-medium ${step.done ? '' : 'text-muted-foreground'}`}>{step.label}</p>
                {step.key === 'pending' && (
                  <p className="text-xs text-muted-foreground">{new Date(sale.created_at).toLocaleDateString('pt-PT')}</p>
                )}
                {step.key === 'shipped' && sale.shipped_at && (
                  <p className="text-xs text-muted-foreground">{new Date(sale.shipped_at).toLocaleDateString('pt-PT')}</p>
                )}
                {step.key === 'delivered' && sale.delivered_at && (
                  <p className="text-xs text-muted-foreground">{new Date(sale.delivered_at).toLocaleDateString('pt-PT')}</p>
                )}
              </div>
            </div>
          ))}
        </section>

        {/* Tracking */}
        {sale.tracking_number && (
          <section className="rounded-2xl border bg-white dark:bg-zinc-900 p-6 space-y-2">
            <p className="text-sm font-semibold">Código de rastreio</p>
            <p className="font-mono text-sm bg-zinc-50 dark:bg-zinc-800 px-4 py-3 rounded-xl break-all">
              {sale.tracking_number}
            </p>
            <p className="text-xs text-muted-foreground">
              Usa este código no site da transportadora para acompanhar a entrega.
            </p>
          </section>
        )}

        {/* Morada */}
        {addr && (
          <section className="rounded-2xl border bg-white dark:bg-zinc-900 p-6 space-y-1 text-sm">
            <p className="font-semibold mb-2">Morada de entrega</p>
            <p>{addr.name}</p>
            <p>{addr.line1}</p>
            <p>{addr.postal_code} {addr.city}</p>
            <p>{addr.country}</p>
          </section>
        )}

        {/* Disputa activa */}
        {sale.dispute_opened_at && (
          <section className="rounded-2xl border border-red-200 bg-red-50 dark:bg-red-950 dark:border-red-800 p-6 space-y-1 text-sm">
            <p className="font-semibold text-red-800 dark:text-red-200">Disputa aberta</p>
            <p className="text-red-700 dark:text-red-300">{sale.dispute_reason}</p>
            <p className="text-xs text-red-600 dark:text-red-400 mt-2">
              Aberta em {new Date(sale.dispute_opened_at).toLocaleDateString('pt-PT')} · A equipa Artivist irá contactar-te em breve.
            </p>
          </section>
        )}

        {/* Acções do comprador */}
        {isBuyer && (
          <OrderActions
            saleId={saleId}
            fulfillmentStatus={sale.fulfillment_status}
            canOpenDispute={canOpenDispute}
            daysUntilDispute={daysUntilDispute}
            disputeOpened={!!sale.dispute_opened_at}
          />
        )}

        {/* Info repasse (artista) */}
        {isArtist && (
          <section className="rounded-2xl border bg-white dark:bg-zinc-900 p-5 text-sm space-y-1">
            <p className="font-semibold">Estado do repasse</p>
            {sale.dispute_opened_at ? (
              <p className="text-red-600">Suspenso — disputa em curso</p>
            ) : sale.fulfillment_status === 'delivered' ? (
              <p className="text-green-600">Libertado — encomenda confirmada pelo comprador</p>
            ) : sale.shipped_at ? (
              <p className="text-muted-foreground">
                Libertação automática em {new Date(new Date(sale.shipped_at).getTime() + 20 * 24 * 60 * 60 * 1000).toLocaleDateString('pt-PT')} (20 dias após envio)
              </p>
            ) : (
              <p className="text-yellow-600">Em espera — encomenda ainda não enviada</p>
            )}
          </section>
        )}
      </main>
    </div>
  );
}
