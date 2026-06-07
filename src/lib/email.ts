import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM = process.env.RESEND_FROM_EMAIL ?? 'Artivist <noreply@artivist.art>';
const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL ?? 'http://localhost:3000';

function emailWrapper(content: string) {
  return `<!DOCTYPE html>
<html lang="pt">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f9f9f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9f9f9;padding:40px 0">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;overflow:hidden;box-shadow:0 1px 4px rgba(0,0,0,0.08)">
        <tr><td style="background:#000;padding:24px 40px">
          <p style="margin:0;color:#fff;font-size:18px;font-weight:700;letter-spacing:2px;text-transform:uppercase">Artivist</p>
        </td></tr>
        <tr><td style="padding:40px">
          ${content}
        </td></tr>
        <tr><td style="padding:20px 40px;border-top:1px solid #f0f0f0;text-align:center">
          <p style="margin:0;font-size:12px;color:#aaa">Artivist · arte com impacto social</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

function ctaButton(href: string, label: string) {
  return `<a href="${href}" style="display:inline-block;background:#000;color:#fff;text-decoration:none;padding:12px 28px;font-size:14px;font-weight:600;letter-spacing:0.5px">${label}</a>`;
}

function infoRow(label: string, value: string) {
  return `<tr>
    <td style="padding:10px 0;border-bottom:1px solid #f0f0f0;font-size:13px;color:#888;width:140px">${label}</td>
    <td style="padding:10px 0;border-bottom:1px solid #f0f0f0;font-size:13px;color:#111;font-weight:500">${value}</td>
  </tr>`;
}

// ── 1. Encomenda enviada → comprador ─────────────────────────
export async function sendOrderShippedEmail({
  to,
  listingTitle,
  trackingNumber,
  saleId,
}: {
  to: string;
  listingTitle: string;
  trackingNumber?: string | null;
  saleId: string;
}) {
  if (!process.env.RESEND_API_KEY) return;

  const orderUrl = `${BASE_URL}/dashboard/orders/${saleId}`;

  const content = `
    <h1 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#111">A tua encomenda foi enviada!</h1>
    <p style="margin:0 0 32px;color:#555;font-size:15px;line-height:1.6">A tua obra está a caminho. Podes acompanhar o estado da entrega no teu dashboard.</p>

    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:32px">
      ${infoRow('Obra', listingTitle)}
      ${trackingNumber ? infoRow('Tracking', trackingNumber) : ''}
    </table>

    <p style="margin:0 0 16px;font-size:13px;color:#555">Após receberes a obra, confirma a entrega no dashboard para libertar o pagamento ao artista.</p>

    ${ctaButton(orderUrl, 'Acompanhar encomenda →')}
  `;

  try {
    await resend.emails.send({
      from: FROM,
      to,
      subject: `Encomenda enviada — ${listingTitle}`,
      html: emailWrapper(content),
    });
  } catch (err) {
    console.error('[email] sendOrderShippedEmail error:', err);
  }
}

// ── 2. Disputa aberta → artista ──────────────────────────────
export async function sendDisputeOpenedEmail({
  to,
  listingTitle,
  buyerEmail,
  reason,
}: {
  to: string;
  listingTitle: string;
  buyerEmail: string;
  reason: string;
}) {
  if (!process.env.RESEND_API_KEY) return;

  const dashboardUrl = `${BASE_URL}/dashboard`;

  const content = `
    <h1 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#111">Disputa aberta</h1>
    <p style="margin:0 0 32px;color:#555;font-size:15px;line-height:1.6">O comprador abriu uma disputa numa das tuas encomendas. O pagamento ficará retido até resolução.</p>

    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:32px">
      ${infoRow('Obra', listingTitle)}
      ${infoRow('Comprador', buyerEmail)}
      ${infoRow('Motivo', reason)}
    </table>

    <p style="margin:0 0 24px;font-size:13px;color:#555">A nossa equipa irá analisar a situação e entrar em contacto em breve.</p>

    ${ctaButton(dashboardUrl, 'Ver dashboard →')}
  `;

  try {
    await resend.emails.send({
      from: FROM,
      to,
      subject: `Disputa aberta — ${listingTitle}`,
      html: emailWrapper(content),
    });
  } catch (err) {
    console.error('[email] sendDisputeOpenedEmail error:', err);
  }
}

// ── 3. Entrega confirmada → artista ─────────────────────────
export async function sendDeliveryConfirmedEmail({
  to,
  listingTitle,
  amountEur,
}: {
  to: string;
  listingTitle: string;
  amountEur: number;
}) {
  if (!process.env.RESEND_API_KEY) return;

  const paymentsUrl = `${BASE_URL}/dashboard/payments`;

  const content = `
    <h1 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#111">Entrega confirmada!</h1>
    <p style="margin:0 0 32px;color:#555;font-size:15px;line-height:1.6">O comprador confirmou a receção da obra. O teu pagamento foi libertado e está disponível.</p>

    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:32px">
      ${infoRow('Obra', listingTitle)}
      ${infoRow('Valor libertado', `€${Number(amountEur).toFixed(2)}`)}
    </table>

    ${ctaButton(paymentsUrl, 'Ver pagamentos →')}
  `;

  try {
    await resend.emails.send({
      from: FROM,
      to,
      subject: `Pagamento libertado — ${listingTitle}`,
      html: emailWrapper(content),
    });
  } catch (err) {
    console.error('[email] sendDeliveryConfirmedEmail error:', err);
  }
}
