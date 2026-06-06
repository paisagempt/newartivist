import { createAdminClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { Resend } from 'resend';
import { flushPendingDistributions } from '@/lib/solana-distributions';

const PLATFORM_FEE = 10; // %

async function eurToUsdc(eurAmount: number): Promise<number> {
  try {
    const res = await fetch(
      'https://api.coingecko.com/api/v3/simple/price?ids=usd-coin&vs_currencies=eur',
      { cache: 'no-store' }
    );
    const data = await res.json();
    const eurPerUsdc: number = data['usd-coin']?.eur ?? 0.92;
    return Number((eurAmount / eurPerUsdc).toFixed(6));
  } catch {
    return Number((eurAmount * 1.08).toFixed(6));
  }
}

async function recordDistributions({
  crossmintOrderId,
  listingId,
  amountEur,
  artistWallet,
  ongWallet,
  artistUserId,
  ongUserId,
  artistShare,
  ongShare,
}: {
  crossmintOrderId: string;
  listingId: string;
  amountEur: number;
  artistWallet: string | null;
  ongWallet: string | null;
  artistUserId: string | null;
  ongUserId: string | null;
  artistShare: number;
  ongShare: number;
}) {
  const admin = createAdminClient();
  const totalUsdc = await eurToUsdc(amountEur);
  const rows = [];

  if (artistShare > 0 && artistUserId) {
    rows.push({
      crossmint_order_id: crossmintOrderId,
      listing_id: listingId,
      recipient_type: 'artist',
      wallet_address: artistWallet,
      user_id: artistUserId,
      amount_eur: Number(((amountEur * artistShare) / 100).toFixed(2)),
      amount_usdc: Number(((totalUsdc * artistShare) / 100).toFixed(6)),
    });
  }

  if (ongShare > 0 && ongUserId) {
    rows.push({
      crossmint_order_id: crossmintOrderId,
      listing_id: listingId,
      recipient_type: 'ong',
      wallet_address: ongWallet,
      user_id: ongUserId,
      amount_eur: Number(((amountEur * ongShare) / 100).toFixed(2)),
      amount_usdc: Number(((totalUsdc * ongShare) / 100).toFixed(6)),
    });
  }

  if (rows.length === 0) {
    console.log('[webhook] no distributions to record');
    return;
  }

  const { error } = await admin.from('distributions').insert(rows);
  if (error) {
    console.error('[webhook] error recording distributions:', error.message);
  } else {
    console.log('[webhook] distributions recorded:', rows.map(r => `${r.recipient_type} €${r.amount_eur}`).join(', '));
  }
}

export async function POST(request: Request) {
  let body: any;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'invalid json' }, { status: 400 });
  }

  const eventType: string = body?.type ?? body?.eventType ?? '';
  const isComplete =
    eventType === 'orders.payment.succeeded' ||
    eventType === 'order.completed' ||
    eventType === 'orders.completed' ||
    eventType === 'orders.delivery.completed';

  if (!isComplete) {
    return NextResponse.json({ ok: true, skipped: eventType });
  }

  const order = body?.data ?? body?.payload ?? body;
  const orderId: string | null = order?.orderId ?? body?.orderId ?? null;
  const nftMintHash: string | null =
    order?.lineItems?.[0]?.delivery?.nft?.mintHash ??
    order?.lineItems?.[0]?.executionState?.nft?.mintHash ??
    order?.lineItems?.[0]?.nft?.mintHash ??
    order?.nft?.mintHash ??
    body?.nft?.mintHash ??
    null;

  console.log('[webhook] order keys:', JSON.stringify(Object.keys(order ?? {})));
  console.log('[webhook] lineItems[0]:', JSON.stringify(order?.lineItems?.[0]));

  const admin = createAdminClient();

  await admin.from('webhook_logs').insert({
    event_type: eventType,
    crossmint_order_id: orderId,
    raw: JSON.stringify(body).slice(0, 2000),
  }).then(({ error }) => {
    if (error && error.code !== '42P01') {
      console.error('[webhook] log error:', error.message);
    }
  });

  if (!orderId) {
    return NextResponse.json({ ok: true, warn: 'no orderId' });
  }

  // Idempotência: ignorar se esta ordem já foi processada
  const { data: existingSale } = await admin
    .from('sales')
    .select('id')
    .eq('crossmint_order_id', orderId)
    .maybeSingle();

  if (existingSale) {
    return NextResponse.json({ ok: true, skipped: 'already processed', orderId });
  }

  const { data: pending, error: pendingError } = await admin
    .from('pending_orders')
    .select('listing_id, buyer_email, amount_eur')
    .eq('crossmint_order_id', orderId)
    .single();

  if (pendingError || !pending?.listing_id) {
    return NextResponse.json({ ok: true, warn: 'pending_order not found', orderId, pendingError: pendingError?.message });
  }

  const { data: listing, error: listingError } = await admin
    .from('listings')
    .select('id, title, type, cover_image_url, edition_size, editions_sold, price_eur, ong_percentage, artist_id, ong_id')
    .eq('id', pending.listing_id)
    .single();

  if (listingError || !listing) {
    return NextResponse.json({ ok: true, warn: 'listing not found', listingError: listingError?.message });
  }

  const newSold = listing.editions_sold + 1;
  const newStatus = newSold >= listing.edition_size ? 'sold' : 'active';

  const { error: updateError } = await admin
    .from('listings')
    .update({ editions_sold: newSold, status: newStatus })
    .eq('id', listing.id);

  const amount = Number(pending.amount_eur ?? listing.price_eur);
  const { error: saleError } = await admin.from('sales').insert({
    listing_id: listing.id,
    buyer_email: pending.buyer_email,
    crossmint_order_id: orderId,
    amount_eur: amount,
    price_eur: amount,
  });

  // Buscar wallets para distribuição USDC
  const ongPct = Number(listing.ong_percentage ?? 0);
  const artistPct = 100 - PLATFORM_FEE - ongPct;

  let artistWallet: string | null = null;
  let ongWallet: string | null = null;
  let artistUserId: string | null = null;
  let ongUserId: string | null = null;

  if (listing.artist_id) {
    const { data: artistRow } = await admin
      .from('artists')
      .select('user_id')
      .eq('id', listing.artist_id)
      .single();
    if (artistRow?.user_id) {
      artistUserId = artistRow.user_id;
      const { data: artistUser } = await admin
        .from('users')
        .select('wallet_address')
        .eq('id', artistRow.user_id)
        .single();
      artistWallet = artistUser?.wallet_address ?? null;
    }
  }

  if (listing.ong_id) {
    const { data: ongRow } = await admin
      .from('ongs')
      .select('user_id')
      .eq('id', listing.ong_id)
      .single();
    if (ongRow?.user_id) {
      ongUserId = ongRow.user_id;
      const { data: ongUser } = await admin
        .from('users')
        .select('wallet_address')
        .eq('id', ongRow.user_id)
        .single();
      ongWallet = ongUser?.wallet_address ?? null;
    }
  }

  // Buscar nome da ONG para o email
  let ongName: string | null = null;
  if (listing.ong_id) {
    const { data: ongRow } = await admin.from('ongs').select('name').eq('id', listing.ong_id).single();
    ongName = ongRow?.name ?? null;
  }

  // Enviar email de confirmação ao comprador
  if (process.env.RESEND_API_KEY && pending.buyer_email) {
    try {
      const resend = new Resend(process.env.RESEND_API_KEY);
      const ongPctNum = Number(listing.ong_percentage ?? 0);
      const ongAmount = ((amount * ongPctNum) / 100).toFixed(2);
      const artLabel = listing.type === 'physical' ? 'certificado digital' : 'arte digital';
      const nftExplorerUrl = nftMintHash
        ? `https://explorer.solana.com/address/${nftMintHash}?cluster=devnet`
        : null;

      await resend.emails.send({
        from: process.env.RESEND_FROM_EMAIL ?? 'Artivist <noreply@artivist.art>',
        to: pending.buyer_email,
        subject: `Compra confirmada — ${listing.title}`,
        html: `
<!DOCTYPE html>
<html lang="pt">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f9f9f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9f9f9;padding:40px 0">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 1px 4px rgba(0,0,0,0.08)">
        <!-- Header -->
        <tr><td style="background:#000;padding:28px 40px">
          <p style="margin:0;color:#fff;font-size:20px;font-weight:700;letter-spacing:-0.5px">Artivist</p>
          <p style="margin:4px 0 0;color:#888;font-size:13px">Arte com impacto</p>
        </td></tr>
        <!-- Body -->
        <tr><td style="padding:40px">
          <h1 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#111">Compra confirmada!</h1>
          <p style="margin:0 0 32px;color:#555;font-size:15px">Obrigado por apoiares a arte com impacto, ${pending.buyer_email}.</p>

          ${listing.cover_image_url ? `
          <div style="margin-bottom:24px;border-radius:12px;overflow:hidden;background:#f5f5f5">
            <img src="${listing.cover_image_url}" alt="${listing.title}" width="100%" style="display:block;max-height:300px;object-fit:cover">
          </div>` : ''}

          <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:32px">
            <tr>
              <td style="padding:16px;background:#f5f5f5;border-radius:12px">
                <p style="margin:0 0 4px;font-size:18px;font-weight:700;color:#111">${listing.title}</p>
                <p style="margin:0;color:#666;font-size:14px">${artLabel} · €${Number(amount).toFixed(2)}</p>
              </td>
            </tr>
          </table>

          ${ongName && ongPctNum > 0 ? `
          <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:32px">
            <tr>
              <td style="padding:16px;background:#f0fdf4;border-radius:12px;border:1px solid #bbf7d0">
                <p style="margin:0 0 4px;font-size:13px;font-weight:600;color:#16a34a;text-transform:uppercase;letter-spacing:0.5px">Impacto gerado</p>
                <p style="margin:0;font-size:15px;color:#111">€${ongAmount} foram doados para <strong>${ongName}</strong></p>
              </td>
            </tr>
          </table>` : ''}

          <!-- NFT info -->
          <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:${nftExplorerUrl ? '16px' : '32px'}">
            <tr>
              <td style="padding:16px;background:#fafafa;border-radius:12px;border:1px solid #e5e5e5">
                <p style="margin:0 0 6px;font-size:13px;font-weight:600;color:#555;text-transform:uppercase;letter-spacing:0.5px">A tua arte digital</p>
                <p style="margin:0;font-size:14px;color:#555;line-height:1.6">A tua obra foi registada na blockchain Solana — um certificado digital único e inviolável que prova a tua propriedade.<br><br>
                ${nftMintHash ? `Endereço da tua arte digital na rede Solana:<br><code style="font-size:12px;color:#333;word-break:break-all">${nftMintHash}</code>` : 'O endereço da tua arte digital ficará disponível em breve.'}</p>
              </td>
            </tr>
          </table>

          ${nftExplorerUrl ? `
          <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:32px">
            <tr>
              <td align="center">
                <a href="${nftExplorerUrl}" style="display:inline-block;color:#555;text-decoration:underline;font-size:13px">
                  Ver na blockchain Solana
                </a>
              </td>
            </tr>
          </table>` : '<div style="margin-bottom:32px"></div>'}

          <!-- Wallet CTA -->
          <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:12px">
            <tr>
              <td>
                <p style="margin:0;font-size:15px;color:#555;line-height:1.6;text-align:center">Verifique sua arte digital, transfira ou revenda noutras plataformas acessando sua wallet</p>
              </td>
            </tr>
          </table>
          <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:32px">
            <tr>
              <td align="center">
                <a href="https://staging.crossmint.com/user/collection" style="display:inline-block;background:#000;color:#fff;text-decoration:none;padding:14px 32px;border-radius:10px;font-size:15px;font-weight:600">
                  Aceder à minha wallet
                </a>
              </td>
            </tr>
          </table>
        </td></tr>
        <!-- Footer -->
        <tr><td style="padding:24px 40px;border-top:1px solid #f0f0f0;text-align:center">
          <p style="margin:0;font-size:12px;color:#aaa">Artivist · arte com impacto social<br>Tens dúvidas? Responde a este email.</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`,
      });
      console.log('[webhook] email de confirmação enviado para', pending.buyer_email);
    } catch (emailErr) {
      console.error('[webhook] erro ao enviar email:', emailErr);
    }
  }

  // Registar distribuições e tentar enviar imediatamente se a treasury tiver saldo
  await recordDistributions({
    crossmintOrderId: orderId,
    listingId: listing.id,
    amountEur: amount,
    artistWallet,
    ongWallet,
    artistUserId,
    ongUserId,
    artistShare: artistPct,
    ongShare: ongPct,
  });

  flushPendingDistributions().catch(err => console.error('[webhook] flush error:', err));

  return NextResponse.json({
    ok: true,
    updated: !updateError,
    saleCreated: !saleError,
    updateError: updateError?.message,
    saleError: saleError?.message,
    newSold,
    newStatus,
  });
}
