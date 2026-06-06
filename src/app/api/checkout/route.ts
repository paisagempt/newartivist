import { createAdminClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  const { listingId, buyerEmail, shippingAddress } = await request.json();

  if (!buyerEmail || !listingId) {
    return NextResponse.json({ error: 'Dados incompletos' }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data: listing } = await admin
    .from('listings')
    .select('id, title, price_eur, edition_size, editions_sold, crossmint_collection_id, status')
    .eq('id', listingId)
    .eq('status', 'active')
    .single();

  if (!listing) {
    return NextResponse.json({ error: 'Obra não encontrada ou indisponível' }, { status: 404 });
  }

  if (listing.editions_sold >= listing.edition_size) {
    return NextResponse.json({ error: 'Obra esgotada' }, { status: 400 });
  }

  if (!listing.crossmint_collection_id) {
    return NextResponse.json({ error: 'Certificado digital ainda não disponível para esta obra' }, { status: 400 });
  }

  const res = await fetch('https://staging.crossmint.com/api/2022-06-09/orders', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-API-KEY': process.env.CROSSMINT_SERVER_KEY!,
    },
    body: JSON.stringify({
      payment: {
        method: 'stripe-payment-element',
        currency: 'eur',
        receiptEmail: buyerEmail,
      },
      lineItems: [
        {
          collectionLocator: `crossmint:${listing.crossmint_collection_id}`,
          callData: {
            quantity: 1,
          },
        },
      ],
      recipient: {
        email: buyerEmail,
      },
    }),
  });

  const data = await res.json();
  console.log('[checkout] crossmint order response:', JSON.stringify(data).slice(0, 500));

  if (!res.ok) {
    return NextResponse.json(
      { error: data.message ?? data.error ?? 'Erro ao criar ordem' },
      { status: 500 }
    );
  }

  const orderId = data.order?.orderId ?? data.orderId;

  if (!orderId) {
    return NextResponse.json({ error: 'Ordem sem ID', raw: data }, { status: 500 });
  }

  // Guardar metadata da ordem para exibição na página de checkout
  await admin.from('pending_orders').upsert({
    crossmint_order_id: orderId,
    listing_id: listingId,
    buyer_email: buyerEmail,
    amount_eur: Number(listing.price_eur),
    title: listing.title,
    ...(shippingAddress ? { shipping_address: shippingAddress } : {}),
  }, { onConflict: 'crossmint_order_id' });

  return NextResponse.json({ orderId });
}
