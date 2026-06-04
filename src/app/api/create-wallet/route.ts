import { createClient, createAdminClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
  }

  const { role } = await request.json();

  try {
    // Criar carteira Crossmint Embedded Wallet
    const crossmintRes = await fetch('https://staging.crossmint.com/api/v1-alpha2/wallets', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-KEY': process.env.CROSSMINT_SERVER_KEY!,
      },
      body: JSON.stringify({
        type: 'solana-mpc-wallet',
        linkedUser: `email:${user.email}:${process.env.NEXT_PUBLIC_CROSSMINT_CLIENT_KEY}`,
      }),
    });

    const walletData = await crossmintRes.json();
    const walletAddress = walletData.address ?? null;

    // Criar registo em public.users
    const admin = createAdminClient();
    const { error } = await admin.from('users').upsert({
      id: user.id,
      email: user.email!,
      role: role ?? 'buyer',
      wallet_address: walletAddress,
    });

    if (error) throw error;

    return NextResponse.json({ walletAddress });
  } catch (err: any) {
    console.error('[create-wallet]', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
