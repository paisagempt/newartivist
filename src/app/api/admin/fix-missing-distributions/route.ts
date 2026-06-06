import { createClient, createAdminClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

const PLATFORM_FEE = 10;

async function eurToUsdc(eurAmount: number): Promise<number> {
  try {
    const res = await fetch(
      'https://api.coingecko.com/api/v3/simple/price?ids=usd-coin&vs_currencies=eur',
      { cache: 'no-store' }
    );
    const data = await res.json();
    const eurPerUsdc: number = data['usd-coin']?.eur ?? 0.92;
    return Number((eurAmount / eurPerUsdc).toFixed(6));
  } catch {
    return Number((eurAmount * 1.08).toFixed(6));
  }
}

export async function POST() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });

  const admin = createAdminClient();
  const { data: profile } = await admin.from('users').select('role').eq('id', user.id).single();
  if (profile?.role !== 'admin') return NextResponse.json({ error: 'Sem permissão' }, { status: 403 });

  const { data: sales } = await admin
    .from('sales')
    .select('id, crossmint_order_id, listing_id, amount_eur');

  if (!sales || sales.length === 0) {
    return NextResponse.json({ fixed: [], skipped: [], message: 'Sem vendas' });
  }

  const fixed: any[] = [];
  const skipped: any[] = [];

  for (const sale of sales) {
    const { data: existing } = await admin
      .from('distributions')
      .select('id, recipient_type')
      .eq('crossmint_order_id', sale.crossmint_order_id);

    const hasArtist = existing?.some(d => d.recipient_type === 'artist');
    const hasOng = existing?.some(d => d.recipient_type === 'ong');

    const { data: listing } = await admin
      .from('listings')
      .select('id, ong_percentage, artist_id, ong_id')
      .eq('id', sale.listing_id)
      .single();

    if (!listing) {
      skipped.push({ orderId: sale.crossmint_order_id, reason: 'listing not found' });
      continue;
    }

    const ongPct = Number(listing.ong_percentage ?? 0);
    const artistPct = 100 - PLATFORM_FEE - ongPct;
    const amount = Number(sale.amount_eur);
    const totalUsdc = await eurToUsdc(amount);
    const rows: any[] = [];

    if (!hasArtist && artistPct > 0 && listing.artist_id) {
      const { data: artistRow } = await admin
        .from('artists')
        .select('user_id')
        .eq('id', listing.artist_id)
        .single();

      if (artistRow?.user_id) {
        const { data: artistUser } = await admin
          .from('users')
          .select('wallet_address')
          .eq('id', artistRow.user_id)
          .single();

        rows.push({
          crossmint_order_id: sale.crossmint_order_id,
          listing_id: sale.listing_id,
          recipient_type: 'artist',
          wallet_address: artistUser?.wallet_address ?? null,
          user_id: artistRow.user_id,
          amount_eur: Number(((amount * artistPct) / 100).toFixed(2)),
          amount_usdc: Number(((totalUsdc * artistPct) / 100).toFixed(6)),
        });
      }
    }

    if (!hasOng && ongPct > 0 && listing.ong_id) {
      const { data: ongRow } = await admin
        .from('ongs')
        .select('user_id')
        .eq('id', listing.ong_id)
        .single();

      if (ongRow?.user_id) {
        const { data: ongUser } = await admin
          .from('users')
          .select('wallet_address')
          .eq('id', ongRow.user_id)
          .single();

        rows.push({
          crossmint_order_id: sale.crossmint_order_id,
          listing_id: sale.listing_id,
          recipient_type: 'ong',
          wallet_address: ongUser?.wallet_address ?? null,
          user_id: ongRow.user_id,
          amount_eur: Number(((amount * ongPct) / 100).toFixed(2)),
          amount_usdc: Number(((totalUsdc * ongPct) / 100).toFixed(6)),
        });
      }
    }

    if (rows.length > 0) {
      const { error } = await admin.from('distributions').insert(rows);
      if (error) {
        skipped.push({ orderId: sale.crossmint_order_id, reason: error.message });
      } else {
        fixed.push({
          orderId: sale.crossmint_order_id,
          created: rows.map(r => `${r.recipient_type} €${r.amount_eur}`),
        });
      }
    } else {
      skipped.push({ orderId: sale.crossmint_order_id, reason: 'já completo ou sem destinatários' });
    }
  }

  return NextResponse.json({ fixed, skipped });
}
