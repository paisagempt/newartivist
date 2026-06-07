import { createAdminClient } from '@/lib/supabase/server';
import { flushPendingDistributions } from '@/lib/solana-distributions';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const admin = createAdminClient();

  const { data: toRelease, error } = await admin
    .from('distributions')
    .select('id, crossmint_order_id')
    .eq('on_hold', true)
    .not('hold_release_at', 'is', null)
    .lte('hold_release_at', new Date().toISOString());

  if (error) {
    console.error('[cron/release-holds] erro ao buscar distribuições:', error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!toRelease || toRelease.length === 0) {
    console.log('[cron/release-holds] nada a libertar');
    return NextResponse.json({ released: 0 });
  }

  const ids = toRelease.map((d) => d.id);

  const { error: updateError } = await admin
    .from('distributions')
    .update({ on_hold: false })
    .in('id', ids);

  if (updateError) {
    console.error('[cron/release-holds] erro ao libertar:', updateError.message);
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  console.log(`[cron/release-holds] ${ids.length} distribuições libertadas`);

  const flushResult = await flushPendingDistributions();
  console.log('[cron/release-holds] flush:', flushResult);

  return NextResponse.json({ released: ids.length, flush: flushResult });
}
