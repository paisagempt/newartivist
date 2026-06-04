import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
  }

  // Obter o id do perfil de artista
  const { data: artist } = await supabase
    .from('artists')
    .select('id')
    .eq('user_id', user.id)
    .single();

  if (!artist) {
    return NextResponse.json({ error: 'Perfil de artista não encontrado' }, { status: 403 });
  }

  const body = await request.json();
  const {
    title,
    description,
    type,
    price_eur,
    edition_size,
    ong_id,
    ong_percentage,
    royalty_percentage,
    cover_image_url,
  } = body;

  const { data, error } = await supabase.from('listings').insert({
    artist_id: artist.id,
    ong_id,
    title,
    description: description ?? null,
    type,
    price_eur: Number(price_eur),
    edition_size: Number(edition_size),
    editions_sold: 0,
    ong_percentage: Number(ong_percentage),
    royalty_percentage: Number(royalty_percentage),
    cover_image_url: cover_image_url ?? null,
    status: 'active',
    is_campaign: false,
  }).select('id').single();

  if (error) {
    console.error('[artworks] insert error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ id: data.id });
}

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
  }

  const { data: artist } = await supabase
    .from('artists')
    .select('id')
    .eq('user_id', user.id)
    .single();

  if (!artist) {
    return NextResponse.json({ listings: [] });
  }

  const { data: listings } = await supabase
    .from('listings')
    .select('id, title, type, price_eur, edition_size, editions_sold, ong_percentage, status, cover_image_url, created_at')
    .eq('artist_id', artist.id)
    .order('created_at', { ascending: false });

  return NextResponse.json({ listings: listings ?? [] });
}
