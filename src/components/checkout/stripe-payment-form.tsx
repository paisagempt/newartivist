'use client';

import { useMemo, useState } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js';

type Props = {
  clientSecret: string;
  stripePublishableKey: string;
  returnUrl: string;
  amountEur: number;
  artType?: 'digital' | 'physical';
};

function PaymentForm({ returnUrl, amountEur, artType }: { returnUrl: string; amountEur: number; artType?: string }) {
  const artLabel = artType === 'physical' ? 'certificado digital' : 'arte digital';
  const stripe = useStripe();
  const elements = useElements();
  const [ready, setReady] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!stripe || !elements || !ready) return;

    setLoading(true);
    setErrorMsg(null);

    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: { return_url: returnUrl },
    });

    if (error) {
      setErrorMsg(error.message ?? 'Erro no pagamento. Tenta novamente.');
      setLoading(false);
    }
    // Se não houver erro, o Stripe redireciona para returnUrl automaticamente
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <PaymentElement onReady={() => setReady(true)} />

      {!ready && (
        <p className="text-sm text-center text-muted-foreground animate-pulse">A carregar formulário de pagamento...</p>
      )}

      {errorMsg && (
        <p className="text-sm text-red-600 bg-red-50 dark:bg-red-950 rounded-lg px-4 py-3">
          {errorMsg}
        </p>
      )}

      <button
        type="submit"
        disabled={!stripe || !ready || loading}
        className="w-full bg-foreground text-background py-3 rounded-xl font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
      >
        {loading ? 'A processar...' : `Pagar €${Number(amountEur).toFixed(2)}`}
      </button>

      <p className="text-xs text-center text-muted-foreground">
        Pagamento seguro via Stripe · {artLabel} entregue automaticamente após confirmação
      </p>
    </form>
  );
}

export function StripeCheckoutForm({ clientSecret, stripePublishableKey, returnUrl, amountEur, artType }: Props) {
  // useMemo evita recriar a instância Stripe a cada render
  const stripePromise = useMemo(() => loadStripe(stripePublishableKey), [stripePublishableKey]);

  return (
    <Elements
      stripe={stripePromise}
      options={{
        clientSecret,
        appearance: {
          theme: 'stripe',
          variables: {
            colorPrimary: '#000000',
            borderRadius: '12px',
          },
        },
        locale: 'pt',
      }}
    >
      <PaymentForm returnUrl={returnUrl} amountEur={amountEur} artType={artType} />
    </Elements>
  );
}
