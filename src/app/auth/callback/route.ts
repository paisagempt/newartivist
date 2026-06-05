import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const role = searchParams.get('role') ?? 'buyer';
  const next = searchParams.get('next') ?? '/dashboard';

  if (code) {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error && data.user) {
      const user = data.user;

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
            type: 'solana-smart-wallet',
            linkedUser: `email:${user.email}`,
            config: { adminSigner: { type: 'solana-keypair', address: process.env.ARTIVIST_PLATFORM_WALLET } },
          }),
        });
        const walletData = await crossmintRes.json();
        walletAddress = walletData.address ?? null;
        console.log('[callback] Crossmint wallet:', walletAddress);
      } catch (err) {
        console.error('[callback] Crossmint error:', err);
      }

      // Verificar se utilizador já existe
      const { data: existingUser } = await supabase
        .from('users')
        .select('id, wallet_address')
        .eq('id', user.id)
        .maybeSingle();

      let upsertError;
      if (!existingUser) {
        // Novo utilizador — criar registo completo
        ({ error: upsertError } = await supabase.from('users').insert({
          id: user.id,
          email: user.email!,
          role,
          wallet_address: walletAddress,
        }));
      } else if (!existingUser.wallet_address && walletAddress) {
        // Utilizador existente sem wallet — actualizar só a wallet
        ({ error: upsertError } = await supabase
          .from('users')
          .update({ wallet_address: walletAddress })
          .eq('id', user.id));
      }

      if (upsertError) {
        console.error('[callback] upsert error:', upsertError);
      } else {
        console.log('[callback] user profile created:', user.id, role);
      }

      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth`);
}
