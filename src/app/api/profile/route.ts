import { createClient, createAdminClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function PATCH(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });

  const body = await request.json();
  const admin = createAdminClient();

  const { data: profile } = await admin.from('users').select('role').eq('id', user.id).single();

  // Actualizar wallet_address (disponível para todos os roles)
  if (body.wallet_address !== undefined) {
    const { error } = await admin
      .from('users')
      .update({ wallet_address: body.wallet_address })
      .eq('id', user.id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  }

  if (profile?.role === 'artist') {
    const { name, bio, portfolio_url, avatar_url } = body;
    const { error } = await admin
      .from('artists')
      .update({ name, bio, portfolio_url, avatar_url })
      .eq('user_id', user.id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  }

  if (profile?.role === 'ong') {
    const { mission } = body;
    const { error } = await admin
      .from('ongs')
      .update({ mission })
      .eq('user_id', user.id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: 'Role sem perfil editável' }, { status: 400 });
}
