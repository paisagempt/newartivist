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
    .select('stripe_account_id, role')
    .eq('id', user.id)
    .single();

  if (!['artist', 'ong'].includes(profile?.role ?? '')) {
    return NextResponse.json({ error: 'Apenas artistas e ONGs podem ligar conta bancária' }, { status: 403 });
  }

  try {
    let accountId = profile?.stripe_account_id;

    // Criar conta Express se ainda não existir
    if (!accountId) {
      const account = await stripe.accounts.create({
        type: 'express',
        email: user.email,
        capabilities: { transfers: { requested: true } },
        metadata: { user_id: user.id },
      });
      accountId = account.id;
      await admin.from('users').update({ stripe_account_id: accountId }).eq('id', user.id);
    }

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? 'http://localhost:3000';
    const accountLink = await stripe.accountLinks.create({
      account: accountId,
      refresh_url: `${baseUrl}/dashboard/payments?stripe=refresh`,
      return_url: `${baseUrl}/dashboard/payments?stripe=success`,
      type: 'account_onboarding',
    });

    return NextResponse.json({ url: accountLink.url });
  } catch (err: any) {
    console.error('[stripe/connect] error:', err?.message ?? err);
    return NextResponse.json(
      { error: err?.message ?? 'Erro ao ligar conta Stripe' },
      { status: 500 }
    );
  }
}
