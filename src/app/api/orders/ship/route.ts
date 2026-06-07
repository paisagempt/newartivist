import { createClient, createAdminClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { sendOrderShippedEmail } from '@/lib/email';

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });

  const { saleId, trackingNumber } = await request.json();
  if (!saleId) return NextResponse.json({ error: 'saleId obrigatório' }, { status: 400 });

  const admin = createAdminClient();

  const { data: sale } = await admin
    .from('sales')
    .select('id, buyer_email, listing_id, crossmint_order_id, listings(title, artist_id, artists(user_id))')
    .eq('id', saleId)
    .single();

  const artistUserId = (sale?.listings as any)?.artists?.user_id;
  if (!sale || artistUserId !== user.id) {
    return NextResponse.json({ error: 'Sem permissão' }, { status: 403 });
  }

  const shippedAt = new Date();
  const holdReleaseAt = new Date(shippedAt.getTime() + 20 * 24 * 60 * 60 * 1000);

  const { error: saleError } = await admin
    .from('sales')
    .update({
      fulfillment_status: 'shipped',
      tracking_number: trackingNumber ?? null,
      shipped_at: shippedAt.toISOString(),
    })
    .eq('id', saleId);

  if (saleError) return NextResponse.json({ error: saleError.message }, { status: 500 });

  // Após 20 dias sem disputa, o repasse é libertado automaticamente
  if (sale.crossmint_order_id) {
    await admin
      .from('distributions')
      .update({ hold_release_at: holdReleaseAt.toISOString() })
      .eq('crossmint_order_id', sale.crossmint_order_id)
      .eq('on_hold', true);
  }

  // Email ao comprador
  if (sale.buyer_email) {
    sendOrderShippedEmail({
      to: sale.buyer_email,
      listingTitle: (sale.listings as any)?.title ?? 'Obra',
      trackingNumber: trackingNumber ?? null,
      saleId,
    }).catch(() => {});
  }

  return NextResponse.json({ ok: true });
}
