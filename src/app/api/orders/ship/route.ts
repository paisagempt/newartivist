import { createClient, createAdminClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });

  const { saleId, trackingNumber } = await request.json();
  if (!saleId) return NextResponse.json({ error: 'saleId obrigatório' }, { status: 400 });

  const admin = createAdminClient();

  // Verificar que a sale pertence a uma obra do artista autenticado
  const { data: sale } = await admin
    .from('sales')
    .select('id, listing_id, listings(artist_id, artists(user_id))')
    .eq('id', saleId)
    .single();

  const artistUserId = (sale?.listings as any)?.artists?.user_id;
  if (!sale || artistUserId !== user.id) {
    return NextResponse.json({ error: 'Sem permissão' }, { status: 403 });
  }

  const { error } = await admin
    .from('sales')
    .update({
      fulfillment_status: 'shipped',
      tracking_number: trackingNumber ?? null,
      shipped_at: new Date().toISOString(),
    })
    .eq('id', saleId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
