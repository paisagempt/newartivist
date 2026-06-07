import { createClient, createAdminClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });

  const admin = createAdminClient();
  const { data: profile } = await admin.from('users').select('role').eq('id', user.id).single();
  if (profile?.role !== 'admin') return NextResponse.json({ error: 'Sem permissão' }, { status: 403 });

  const { saleId, resolution } = await request.json();
  if (!saleId || !['artist', 'buyer'].includes(resolution)) {
    return NextResponse.json({ error: 'saleId e resolution (artist|buyer) são obrigatórios' }, { status: 400 });
  }

  const { data: sale } = await admin
    .from('sales')
    .select('id, crossmint_order_id, dispute_opened_at, dispute_resolved_at')
    .eq('id', saleId)
    .single();

  if (!sale) return NextResponse.json({ error: 'Venda não encontrada' }, { status: 404 });
  if (!sale.dispute_opened_at) return NextResponse.json({ error: 'Esta venda não tem disputa aberta' }, { status: 400 });
  if (sale.dispute_resolved_at) return NextResponse.json({ error: 'Disputa já foi resolvida' }, { status: 400 });

  // Atualizar a venda
  const { error: saleError } = await admin
    .from('sales')
    .update({
      dispute_resolved_at: new Date().toISOString(),
      dispute_resolution: resolution,
    })
    .eq('id', saleId);

  if (saleError) return NextResponse.json({ error: saleError.message }, { status: 500 });

  // Favor do artista → libertar distribuições
  // Favor do comprador → distribuições ficam bloqueadas (on_hold = true, hold_release_at = null)
  if (resolution === 'artist' && sale.crossmint_order_id) {
    await admin
      .from('distributions')
      .update({ on_hold: false })
      .eq('crossmint_order_id', sale.crossmint_order_id)
      .eq('on_hold', true);
  }

  return NextResponse.json({ ok: true });
}
