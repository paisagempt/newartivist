import { createClient, createAdminClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

// Converte EUR para USDC usando taxa de câmbio em tempo real
async function eurToUsdc(eurAmount: number): Promise<number> {
  try {
    const res = await fetch(
      'https://api.coingecko.com/api/v3/simple/price?ids=usd-coin&vs_currencies=eur',
      { next: { revalidate: 300 } } // cache 5 min
    );
    const data = await res.json();
    const eurPerUsdc: number = data['usd-coin']?.eur ?? 0.92;
    return Number((eurAmount / eurPerUsdc).toFixed(2));
  } catch {
    // Fallback: EUR ≈ USD (taxa aproximada)
    return Number((eurAmount * 1.08).toFixed(2));
  }
}

async function createCrossmintCollection({
  title,
  description,
  imageUrl,
  editionSize,
  priceEur,
  artistWallet,
  ongWallet,
  artistShare,
  ongShare,
  platformShare,
  royaltyPercentage,
}: {
  title: string;
  description: string;
  imageUrl: string;
  editionSize: number;
  priceEur: number;
  artistWallet: string | null;
  ongWallet: string | null;
  artistShare: number;
  ongShare: number;
  platformShare: number;
  royaltyPercentage: number;
}) {
  const platformWallet = process.env.ARTIVIST_TREASURY_WALLET ?? process.env.ARTIVIST_PLATFORM_WALLET;
  const priceUsdc = await eurToUsdc(priceEur);

  console.log(`[crossmint] price: €${priceEur} EUR → ${priceUsdc} USDC`);

  // Construir creators para royalties on-chain (Metaplex)
  const creators: { address: string; share: number }[] = [];
  if (artistWallet) creators.push({ address: artistWallet, share: artistShare });
  if (ongWallet) creators.push({ address: ongWallet, share: ongShare });
  if (platformWallet) creators.push({ address: platformWallet, share: platformShare });

  // Normalizar shares para 100 se alguma wallet faltar
  const totalShare = creators.reduce((sum, c) => sum + c.share, 0);
  if (totalShare !== 100 && creators.length > 0) {
    creators[creators.length - 1].share += 100 - totalShare;
  }

  const body: Record<string, unknown> = {
    chain: 'solana',
    metadata: {
      name: title,
      description: description || title,
      imageUrl,
      ...(creators.length > 0 && {
        sellerFeeBasisPoints: Math.round(royaltyPercentage * 100),
        creators,
      }),
    },
    fungibility: 'non-fungible',
    supplyLimit: editionSize,
    payments: {
      price: String(priceUsdc),
      currency: 'usdc',
      ...(platformWallet ? { recipientAddress: platformWallet } : {}),
    },
  };

  const res = await fetch('https://staging.crossmint.com/api/2022-06-09/collections/', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-API-KEY': process.env.CROSSMINT_SERVER_KEY!,
    },
    body: JSON.stringify(body),
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

  // Buscar wallets para o split on-chain
  const PLATFORM_FEE = 10;
  const artistShare = 100 - PLATFORM_FEE - Number(ong_percentage);

  const { data: artistUser } = await admin
    .from('users')
    .select('wallet_address')
    .eq('id', user.id)
    .single();

  const { data: ongUser } = await admin
    .from('ongs')
    .select('user_id')
    .eq('id', ong_id)
    .single();

  let ongWallet: string | null = null;
  if (ongUser?.user_id) {
    const { data: ongUserData } = await admin
      .from('users')
      .select('wallet_address')
      .eq('id', ongUser.user_id)
      .single();
    ongWallet = ongUserData?.wallet_address ?? null;
  }

  // Criar collection no Crossmint
  let crossmintCollectionId: string | null = null;
  try {
    const crossmintData = await createCrossmintCollection({
      title,
      description: description ?? '',
      imageUrl: cover_image_url,
      editionSize: Number(edition_size),
      priceEur: Number(price_eur),
      artistWallet: artistUser?.wallet_address ?? null,
      ongWallet,
      artistShare,
      ongShare: Number(ong_percentage),
      platformShare: PLATFORM_FEE,
      royaltyPercentage: Number(royalty_percentage),
    });
    crossmintCollectionId = crossmintData.id ?? crossmintData.collectionId ?? null;

    if (crossmintCollectionId) {
      await admin
        .from('listings')
        .update({ crossmint_collection_id: crossmintCollectionId })
        .eq('id', listing.id);

      // Criar template (define o NFT a mintar quando alguém compra — não consome supply)
      try {
        const tplRes = await fetch(
          `https://staging.crossmint.com/api/2022-06-09/collections/${crossmintCollectionId}/templates`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'X-API-KEY': process.env.CROSSMINT_SERVER_KEY!,
            },
            body: JSON.stringify({
              metadata: {
                name: title,
                description: description || title,
                image: cover_image_url,
              },
            }),
          }
        );
        const tplData = await tplRes.json();
        console.log('[crossmint] template response:', JSON.stringify(tplData));
      } catch (tplErr) {
        console.error('[artworks] Crossmint template error:', tplErr);
      }
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
