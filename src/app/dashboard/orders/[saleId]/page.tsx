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
    <div className="min-h-screen bg-background">
      <NavHeader backLink={{ href: '/dashboard', label: 'Dashboard' }} />
      <main className="max-w-xl mx-auto px-6 py-10 space-y-8">

        {/* Header */}
        <div>
          <Link href="/dashboard" className="text-xs text-muted-foreground hover:text-foreground transition-colors uppercase tracking-widest">
            ← Dashboard
          </Link>
          <h1 className="text-2xl font-bold mt-4">Acompanhamento</h1>
          {listing?.title && (
            <p className="text-muted-foreground mt-1 text-sm">{listing.title}</p>
          )}
        </div>

        {/* Timeline */}
        <section className="border border-border bg-card">
          <div className="px-6 py-5 border-b border-border">
            <p className="text-xs text-muted-foreground uppercase tracking-[0.15em]">Estado da encomenda</p>
          </div>
          <div className="px-6 py-5 space-y-6">
            {statusSteps.map((step, i) => (
              <div key={step.key} className="flex items-start gap-4">
                <div className="flex flex-col items-center shrink-0">
                  <div className={`w-3 h-3 border-2 mt-0.5 ${step.done ? 'bg-foreground border-foreground' : 'bg-background border-border'}`} />
                  {i < statusSteps.length - 1 && (
                    <div className={`w-px h-6 mt-1 ${statusSteps[i + 1].done ? 'bg-foreground' : 'bg-border'}`} />
                  )}
                </div>
                <div>
                  <p className={`text-sm font-medium ${step.done ? '' : 'text-muted-foreground'}`}>{step.label}</p>
                  {step.key === 'pending' && (
                    <p className="text-xs text-muted-foreground mt-0.5">{new Date(sale.created_at).toLocaleDateString('pt-PT')}</p>
                  )}
                  {step.key === 'shipped' && sale.shipped_at && (
                    <p className="text-xs text-muted-foreground mt-0.5">{new Date(sale.shipped_at).toLocaleDateString('pt-PT')}</p>
                  )}
                  {step.key === 'delivered' && sale.delivered_at && (
                    <p className="text-xs text-muted-foreground mt-0.5">{new Date(sale.delivered_at).toLocaleDateString('pt-PT')}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Tracking */}
        {sale.tracking_number && (
          <section className="border border-border bg-card">
            <div className="px-5 py-4 border-b border-border">
              <p className="text-xs text-muted-foreground uppercase tracking-[0.15em]">Código de rastreio</p>
            </div>
            <div className="px-5 py-4">
              <p className="font-mono text-sm bg-muted px-4 py-3 break-all">
                {sale.tracking_number}
              </p>
              <p className="text-xs text-muted-foreground mt-3">
                Usa este código no site da transportadora para acompanhar a entrega.
              </p>
            </div>
          </section>
        )}

        {/* Morada */}
        {addr && (
          <section className="border border-border bg-card divide-y divide-border text-sm">
            <div className="px-5 py-4">
              <p className="text-xs text-muted-foreground uppercase tracking-[0.15em]">Morada de entrega</p>
            </div>
            <div className="px-5 py-4 space-y-0.5 text-sm">
              <p className="font-medium">{addr.name}</p>
              <p className="text-muted-foreground">{addr.line1}</p>
              <p className="text-muted-foreground">{addr.postal_code} {addr.city}</p>
              <p className="text-muted-foreground">{addr.country}</p>
            </div>
          </section>
        )}

        {/* Disputa activa */}
        {sale.dispute_opened_at && (
          <section className="border border-border bg-card">
            <div className="px-5 py-4 border-b border-border">
              <p className="text-xs text-muted-foreground uppercase tracking-[0.15em]">Disputa aberta</p>
            </div>
            <div className="px-5 py-4 space-y-2 text-sm">
              <p>{sale.dispute_reason}</p>
              <p className="text-xs text-muted-foreground">
                Aberta em {new Date(sale.dispute_opened_at).toLocaleDateString('pt-PT')} · A equipa Artivist irá contactar-te em breve.
              </p>
            </div>
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

        {/* Estado do repasse (artista) */}
        {isArtist && (
          <section className="border border-border bg-card divide-y divide-border text-sm">
            <div className="px-5 py-4">
              <p className="text-xs text-muted-foreground uppercase tracking-[0.15em]">Estado do repasse</p>
            </div>
            <div className="px-5 py-4">
              {sale.dispute_opened_at ? (
                <p className="text-muted-foreground">Suspenso — disputa em curso</p>
              ) : sale.fulfillment_status === 'delivered' ? (
                <p>Libertado — encomenda confirmada pelo comprador</p>
              ) : sale.shipped_at ? (
                <p className="text-muted-foreground">
                  Libertação automática em{' '}
                  {new Date(new Date(sale.shipped_at).getTime() + 20 * 24 * 60 * 60 * 1000).toLocaleDateString('pt-PT')}{' '}
                  (20 dias após envio)
                </p>
              ) : (
                <p className="text-muted-foreground">Em espera — encomenda ainda não enviada</p>
              )}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
