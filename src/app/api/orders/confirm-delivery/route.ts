import { createClient, createAdminClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { sendDeliveryConfirmedEmail } from '@/lib/email';

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });

  const { saleId } = await request.json();
  if (!saleId) return NextResponse.json({ error: 'saleId obrigatório' }, { status: 400 });

  const admin = createAdminClient();

  const { data: sale } = await admin
    .from('sales')
    .select('id, buyer_email, amount_eur, crossmint_order_id, fulfillment_status, listings(title, artist_id, artists(user_id))')
    .eq('id', saleId)
    .single();

  if (!sale || sale.buyer_email !== user.email) {
    return NextResponse.json({ error: 'Sem permissão' }, { status: 403 });
  }

  if (sale.fulfillment_status !== 'shipped') {
    return NextResponse.json({ error: 'Encomenda ainda não foi enviada.' }, { status: 400 });
  }

  const { error: saleError } = await admin
    .from('sales')
    .update({ fulfillment_status: 'delivered', delivered_at: new Date().toISOString() })
    .eq('id', saleId);

  if (saleError) return NextResponse.json({ error: saleError.message }, { status: 500 });

  // Libertar distribuições imediatamente
  if (sale.crossmint_order_id) {
    await admin
      .from('distributions')
      .update({ on_hold: false, hold_release_at: null })
      .eq('crossmint_order_id', sale.crossmint_order_id)
      .eq('on_hold', true);
  }

  // Email ao artista
  const artistUserId = (sale.listings as any)?.artists?.user_id;
  if (artistUserId) {
    admin.auth.admin.getUserById(artistUserId).then(({ data }) => {
      const artistEmail = data.user?.email;
      if (artistEmail) {
        sendDeliveryConfirmedEmail({
          to: artistEmail,
          listingTitle: (sale.listings as any)?.title ?? 'Obra',
          amountEur: Number(sale.amount_eur ?? 0),
        }).catch(() => {});
      }
    }).catch(() => {});
  }

  return NextResponse.json({ ok: true });
}
