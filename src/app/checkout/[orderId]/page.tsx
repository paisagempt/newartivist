import { createAdminClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { StripeCheckoutForm } from '@/components/checkout/stripe-payment-form';

async function getCrossmintOrder(orderId: string) {
  const res = await fetch(`https://staging.crossmint.com/api/2022-06-09/orders/${orderId}`, {
    headers: { 'X-API-KEY': process.env.CROSSMINT_SERVER_KEY! },
    cache: 'no-store',
  });
  if (!res.ok) return null;
  return res.json();
}

export default async function CheckoutPage({
  params,
}: {
  params: Promise<{ orderId: string }>;
}) {
  const { orderId } = await params;

  const [orderData, admin] = await Promise.all([
    getCrossmintOrder(orderId),
    Promise.resolve(createAdminClient()),
  ]);

  if (!orderData) notFound();

  console.log('[checkout page] orderData:', JSON.stringify(orderData).slice(0, 1000));

  // Se a ordem ainda precisa de recipient, adicionamos via PATCH
  const needsRecipient = orderData.lineItems?.some(
    (item: any) => item?.quote?.status === 'requires-recipient'
  );

  if (needsRecipient) {
    const { data: pendingForPatch } = await admin
      .from('pending_orders')
      .select('buyer_email')
      .eq('crossmint_order_id', orderId)
      .single();

    if (pendingForPatch?.buyer_email) {
      await fetch(`https://staging.crossmint.com/api/2022-06-09/orders/${orderId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'X-API-KEY': process.env.CROSSMINT_SERVER_KEY!,
        },
        body: JSON.stringify({
          recipient: { email: pendingForPatch.buyer_email },
        }),
      });
      // Re-fetch com recipient actualizado
      const updated = await getCrossmintOrder(orderId);
      if (updated) Object.assign(orderData, updated);
      console.log('[checkout page] after PATCH:', JSON.stringify(orderData).slice(0, 500));
    }
  }

  const { data: pending } = await admin
    .from('pending_orders')
    .select('listing_id, buyer_email, amount_eur, title, listings(type)')
    .eq('crossmint_order_id', orderId)
    .single();

  const artType = (pending?.listings as any)?.type === 'physical' ? 'physical' : 'digital';
  const artLabel = artType === 'digital' ? 'arte digital' : 'certificado digital';

  const payment = orderData.order?.payment ?? orderData.payment ?? null;
  const preparation = payment?.preparation ?? null;

  console.log('[checkout page] preparation keys:', Object.keys(preparation ?? {}));

  const clientSecret =
    preparation?.stripeClientSecret ??
    preparation?.paymentIntentClientSecret ??
    preparation?.clientSecret ??
    payment?.clientSecret ??
    null;

  const stripePublishableKey =
    preparation?.stripePublishableKey ??
    payment?.stripePublishableKey ??
    null;

  console.log('[checkout page] clientSecret found:', !!clientSecret, '| stripeKey found:', !!stripePublishableKey, '| key:', stripePublishableKey?.slice(0, 20));

  if (!clientSecret || !stripePublishableKey) {
    return (
      <div className="min-h-screen flex items-center justify-center p-8">
        <div className="text-center space-y-4 max-w-md">
          <p className="text-lg font-semibold">Ordem não disponível para pagamento</p>
          <p className="text-sm text-muted-foreground">
            Estado: {payment?.status ?? 'desconhecido'}
          </p>
          <pre className="text-xs text-left bg-zinc-100 dark:bg-zinc-800 p-4 rounded-lg overflow-auto max-h-60">
            {JSON.stringify(orderData, null, 2).slice(0, 800)}
          </pre>
          <Link href="/marketplace" className="text-sm text-primary underline">
            Voltar ao marketplace
          </Link>
        </div>
      </div>
    );
  }

  const returnUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/artworks/${pending?.listing_id}?purchased=true`;

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black">
      <header className="border-b bg-white dark:bg-zinc-900 px-6 py-4 flex items-center justify-between">
        <Link href="/" className="text-xl font-bold tracking-tight">Artivist</Link>
        <Link href="/marketplace" className="text-sm text-muted-foreground hover:text-foreground">
          ← Cancelar
        </Link>
      </header>

      <main className="max-w-md mx-auto px-6 py-12 space-y-8">
        <div>
          <h1 className="text-2xl font-bold">Finalizar compra</h1>
          {pending && (
            <p className="text-muted-foreground mt-1">
              {pending.title} · €{Number(pending.amount_eur).toFixed(2)}
            </p>
          )}
        </div>

        <div className="rounded-xl bg-white dark:bg-zinc-900 border p-6 space-y-2 text-sm">
          <p className="font-medium">A comprar como</p>
          <p className="text-muted-foreground">{pending?.buyer_email ?? '—'}</p>
          <p className="text-xs text-muted-foreground pt-1">
            A {artLabel} será entregue automaticamente no email acima.
          </p>
        </div>

        <StripeCheckoutForm
          clientSecret={clientSecret}
          stripePublishableKey={stripePublishableKey}
          returnUrl={returnUrl}
          amountEur={pending?.amount_eur ?? 0}
          artType={artType}
        />
      </main>
    </div>
  );
}
