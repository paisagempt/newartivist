import { Connection, Keypair, PublicKey, Transaction } from '@solana/web3.js';
import {
  getAssociatedTokenAddress,
  createAssociatedTokenAccountInstruction,
  createTransferInstruction,
  getAccount,
} from '@solana/spl-token';
import { createAdminClient } from './supabase/server';

const USDC_MINT = new PublicKey('4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU');
const SOLANA_RPC = 'https://api.devnet.solana.com';

export async function flushPendingDistributions(): Promise<{ sent: number; skipped: string | null }> {
  const keypairHex = process.env.ARTIVIST_TREASURY_KEYPAIR_HEX;
  if (!keypairHex) {
    console.log('[distributions] no treasury keypair — skipping');
    return { sent: 0, skipped: 'no treasury keypair' };
  }

  const admin = createAdminClient();

  const { data: pending } = await admin
    .from('distributions')
    .select('id, wallet_address, amount_usdc')
    .eq('status', 'pending')
    .not('wallet_address', 'is', null);

  if (!pending || pending.length === 0) {
    console.log('[distributions] nothing pending');
    return { sent: 0, skipped: null };
  }

  const totalUsdc = pending.reduce((sum, d) => sum + Number(d.amount_usdc ?? 0), 0);

  const connection = new Connection(SOLANA_RPC, 'confirmed');
  const treasuryKeypair = Keypair.fromSecretKey(Buffer.from(keypairHex, 'hex'));
  const treasuryPubkey = treasuryKeypair.publicKey;
  const fromATA = await getAssociatedTokenAddress(USDC_MINT, treasuryPubkey);

  // Verificar saldo da treasury
  let balance = 0;
  try {
    const account = await getAccount(connection, fromATA);
    balance = Number(account.amount) / 1_000_000;
  } catch {
    console.log('[distributions] treasury sem conta USDC — precisa de ser carregada');
    return { sent: 0, skipped: 'treasury sem saldo USDC' };
  }

  if (balance < totalUsdc) {
    console.log(`[distributions] saldo ${balance.toFixed(4)} USDC < necessário ${totalUsdc.toFixed(4)} USDC — aguardando recarga`);
    return { sent: 0, skipped: `saldo insuficiente: ${balance.toFixed(4)} USDC disponível, ${totalUsdc.toFixed(4)} necessário` };
  }

  console.log(`[distributions] treasury com ${balance.toFixed(4)} USDC, enviando ${totalUsdc.toFixed(4)} para ${pending.length} destinatários`);

  const { blockhash } = await connection.getLatestBlockhash();
  const tx = new Transaction({ recentBlockhash: blockhash, feePayer: treasuryPubkey });

  for (const d of pending) {
    const toPubkey = new PublicKey(d.wallet_address!);
    const toATA = await getAssociatedTokenAddress(USDC_MINT, toPubkey, true);

    const toATAInfo = await connection.getAccountInfo(toATA);
    if (!toATAInfo) {
      tx.add(createAssociatedTokenAccountInstruction(
        treasuryPubkey, toATA, toPubkey, USDC_MINT
      ));
    }

    tx.add(createTransferInstruction(
      fromATA, toATA, treasuryPubkey,
      Math.round(Number(d.amount_usdc) * 1_000_000)
    ));
  }

  tx.sign(treasuryKeypair);
  const signature = await connection.sendRawTransaction(tx.serialize());
  await connection.confirmTransaction(signature, 'confirmed');

  console.log('[distributions] tx confirmada:', signature);

  await admin
    .from('distributions')
    .update({ status: 'sent', sent_at: new Date().toISOString(), tx_signature: signature })
    .in('id', pending.map(d => d.id));

  console.log(`[distributions] ${pending.length} distribuições marcadas como enviadas`);
  return { sent: pending.length, skipped: null };
}
