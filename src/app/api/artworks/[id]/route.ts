import { createClient, createAdminClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
  }

  const admin = createAdminClient();

  // Verificar que a obra pertence ao artista autenticado
  const { data: artist } = await admin
    .from('artists')
    .select('id')
    .eq('user_id', user.id)
    .single();

  if (!artist) {
    return NextResponse.json({ error: 'Perfil de artista não encontrado' }, { status: 403 });
  }

  const { data: listing } = await admin
    .from('listings')
    .select('id')
    .eq('id', id)
    .eq('artist_id', artist.id)
    .single();

  if (!listing) {
    return NextResponse.json({ error: 'Obra não encontrada' }, { status: 404 });
  }

  const body = await request.json();
  const updates: Record<string, unknown> = {};

  if (body.price_eur !== undefined) {
    const price = Number(body.price_eur);
    if (isNaN(price) || price <= 0) {
      return NextResponse.json({ error: 'Preço inválido' }, { status: 400 });
    }
    updates.price_eur = price;
  }

  if (body.description !== undefined) {
    updates.description = body.description ?? null;
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: 'Nenhum campo para actualizar' }, { status: 400 });
  }

  const { error } = await admin
    .from('listings')
    .update(updates)
    .eq('id', id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
