import { createClient, createAdminClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

async function createCrossmintCollection({
  title,
  description,
  imageUrl,
  editionSize,
}: {
  title: string;
  description: string;
  imageUrl: string;
  editionSize: number;
}) {
  const res = await fetch('https://staging.crossmint.com/api/2022-06-09/collections/', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-API-KEY': process.env.CROSSMINT_SERVER_KEY!,
    },
    body: JSON.stringify({
      chain: 'solana',
      metadata: {
        name: title,
        description: description || title,
        imageUrl,
      },
      fungibility: 'non-fungible',
      supplyLimit: editionSize,
    }),
  });
  const data = await res.json();
  console.log('[crossmint] collection response:', JSON.stringify(data));
  return data;
}

export async function POST(request: Request) {
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

  // Criar listagem
  const admin = createAdminClient();
  const { data: listing, error } = await admin.from('listings').insert({
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

  // Criar collection no Crossmint
  let crossmintCollectionId: string | null = null;
  try {
    const crossmintData = await createCrossmintCollection({
      title,
      description: description ?? '',
      imageUrl: cover_image_url,
      editionSize: Number(edition_size),
    });
    crossmintCollectionId = crossmintData.id ?? crossmintData.collectionId ?? null;

    if (crossmintCollectionId) {
      await admin
        .from('listings')
        .update({ crossmint_collection_id: crossmintCollectionId })
        .eq('id', listing.id);
    }
  } catch (err) {
    console.error('[artworks] Crossmint error:', err);
    // Não bloqueia — a listagem já foi criada
  }

  return NextResponse.json({ id: listing.id, crossmint_collection_id: crossmintCollectionId });
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

  if (!artist) return NextResponse.json({ listings: [] });

  const { data: listings } = await supabase
    .from('listings')
    .select('id, title, type, price_eur, edition_size, editions_sold, ong_percentage, status, cover_image_url, crossmint_collection_id, created_at')
    .eq('artist_id', artist.id)
    .order('created_at', { ascending: false });

  return NextResponse.json({ listings: listings ?? [] });
}
