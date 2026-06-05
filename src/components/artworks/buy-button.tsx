'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

type Props = {
  listingId: string;
  price: number;
  available: number;
  type: 'digital' | 'physical';
};

export function BuyButton({ listingId, price, available, type }: Props) {
  const artLabel = type === 'digital' ? 'arte digital' : 'certificado digital';
  const router = useRouter();
  const [step, setStep] = useState<'idle' | 'email' | 'loading'>('idle');
  const [email, setEmail] = useState('');

  async function handleCheckout() {
    if (!email) {
      toast.error(`Introduz o teu email para receber a ${artLabel}`);
      return;
    }
    setStep('loading');
    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ listingId, buyerEmail: email }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? 'Erro ao criar ordem de pagamento');
        setStep('email');
        return;
      }
      router.push(`/checkout/${data.orderId}`);
    } catch {
      toast.error('Erro de ligação. Tenta novamente.');
      setStep('email');
    }
  }

  if (available <= 0) {
    return (
      <button disabled className="w-full bg-muted text-muted-foreground py-3 rounded-xl font-medium cursor-not-allowed">
        Esgotado
      </button>
    );
  }

  if (step === 'idle') {
    return (
      <button
        onClick={() => setStep('email')}
        className="w-full bg-foreground text-background py-3 rounded-xl font-medium hover:opacity-90 transition-opacity"
      >
        Comprar obra
      </button>
    );
  }

  return (
    <div className="space-y-3">
      <div className="space-y-1.5">
        <label className="text-sm font-medium">Email para receber a {artLabel}</label>
        <input
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          placeholder="o-teu@email.com"
          autoFocus
          disabled={step === 'loading'}
          className="w-full border rounded-xl px-4 py-3 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-foreground disabled:opacity-60"
          onKeyDown={e => e.key === 'Enter' && email && handleCheckout()}
        />
        <p className="text-xs text-muted-foreground">
          A {artLabel} e o recibo serão enviados para este endereço.
        </p>
      </div>
      <button
        onClick={handleCheckout}
        disabled={step === 'loading' || !email}
        className="w-full bg-foreground text-background py-3 rounded-xl font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
      >
        {step === 'loading' ? 'A criar ordem...' : `Continuar para pagamento`}
      </button>
      <button
        onClick={() => setStep('idle')}
        disabled={step === 'loading'}
        className="w-full text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        Cancelar
      </button>
    </div>
  );
}
