import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const role = searchParams.get('role') ?? 'buyer';
  const next = searchParams.get('next') ?? '/dashboard';

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        // Criar carteira Crossmint
        let walletAddress: string | null = null;
        try {
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
          walletAddress = walletData.address ?? null;
        } catch (err) {
          console.error('[callback] Crossmint error:', err);
        }

        // Criar registo em public.users
        await supabase.from('users').upsert({
          id: user.id,
          email: user.email!,
          role,
          wallet_address: walletAddress,
        });
      }

      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth`);
}
