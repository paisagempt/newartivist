import { createClient, createAdminClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });

  const { saleId, reason } = await request.json();
  if (!saleId || !reason?.trim()) {
    return NextResponse.json({ error: 'saleId e motivo são obrigatórios' }, { status: 400 });
  }

  const admin = createAdminClient();

  const { data: sale } = await admin
    .from('sales')
    .select('id, buyer_email, crossmint_order_id, fulfillment_status, dispute_opened_at, shipped_at, created_at')
    .eq('id', saleId)
    .single();

  if (!sale || sale.buyer_email !== user.email) {
    return NextResponse.json({ error: 'Sem permissão' }, { status: 403 });
  }

  if (sale.dispute_opened_at) {
    return NextResponse.json({ error: 'Disputa já foi aberta para esta encomenda.' }, { status: 400 });
  }

  // Validar elegibilidade: 20 dias sem envio OU encomenda enviada
  const daysSincePurchase = (Date.now() - new Date(sale.created_at).getTime()) / (1000 * 60 * 60 * 24);
  const canDispute = sale.fulfillment_status === 'shipped' || daysSincePurchase >= 20;

  if (!canDispute) {
    const daysLeft = Math.ceil(20 - daysSincePurchase);
    return NextResponse.json({
      error: `Podes abrir disputa se a encomenda não for enviada em ${daysLeft} dia${daysLeft !== 1 ? 's' : ''}, ou após receberes o envio.`
    }, { status: 400 });
  }

  const { error: saleError } = await admin
    .from('sales')
    .update({ dispute_opened_at: new Date().toISOString(), dispute_reason: reason.trim() })
    .eq('id', saleId);

  if (saleError) return NextResponse.json({ error: saleError.message }, { status: 500 });

  // Bloquear libertação automática das distribuições enquanto disputa estiver aberta
  if (sale.crossmint_order_id) {
    await admin
      .from('distributions')
      .update({ hold_release_at: null })
      .eq('crossmint_order_id', sale.crossmint_order_id)
      .eq('on_hold', true);
  }

  return NextResponse.json({ ok: true });
}
