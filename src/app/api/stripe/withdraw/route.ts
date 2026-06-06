import { createClient, createAdminClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';

export async function POST() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });

  const admin = createAdminClient();
  const { data: profile } = await admin
    .from('users')
    .select('stripe_account_id')
    .eq('id', user.id)
    .single();

  if (!profile?.stripe_account_id) {
    return NextResponse.json({ error: 'Conta bancária não ligada. Liga primeiro a tua conta Stripe.' }, { status: 400 });
  }

  const { data: pending } = await admin
    .from('distributions')
    .select('id, amount_eur')
    .eq('status', 'pending')
    .eq('user_id', user.id);

  if (!pending || pending.length === 0) {
    return NextResponse.json({ error: 'Sem saldo pendente para levantar.' }, { status: 400 });
  }

  const totalEur = pending.reduce((sum, d) => sum + Number(d.amount_eur), 0);
  const amountCents = Math.round(totalEur * 100);

  if (amountCents < 100) {
    return NextResponse.json({ error: 'Mínimo de €1.00 para levantamento.' }, { status: 400 });
  }

  try {
    const transfer = await stripe.transfers.create({
      amount: amountCents,
      currency: 'eur',
      destination: profile.stripe_account_id,
      description: `Artivist payout — ${pending.length} venda(s)`,
      metadata: { user_id: user.id, distribution_ids: pending.map(d => d.id).join(',') },
    });

    await admin
      .from('distributions')
      .update({ status: 'sent', sent_at: new Date().toISOString(), tx_signature: transfer.id })
      .in('id', pending.map(d => d.id));

    return NextResponse.json({ ok: true, transferId: transfer.id, amountEur: totalEur });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
