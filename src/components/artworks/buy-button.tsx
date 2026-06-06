'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

type Props = {
  listingId: string;
  price: number;
  available: number;
  type: 'digital' | 'physical' | 'both';
  userEmail: string | null;
};

type Address = {
  name: string;
  line1: string;
  city: string;
  postal_code: string;
  country: string;
};

const emptyAddress: Address = { name: '', line1: '', city: '', postal_code: '', country: '' };

const inputClass =
  'w-full border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-foreground transition-colors placeholder:text-muted-foreground';

export function BuyButton({ listingId, price, available, type, userEmail }: Props) {
  const isPhysical = type === 'physical' || type === 'both';
  const artLabel = type === 'digital' ? 'arte digital' : 'certificado digital';
  const router = useRouter();
  const [step, setStep] = useState<'idle' | 'email' | 'address' | 'loading'>('idle');
  const [email, setEmail] = useState(userEmail ?? '');
  const [address, setAddress] = useState<Address>(emptyAddress);

  function setAddr(field: keyof Address, value: string) {
    setAddress(prev => ({ ...prev, [field]: value }));
  }

  function addressValid() {
    return address.name.trim() && address.line1.trim() && address.city.trim() &&
      address.postal_code.trim() && address.country.trim();
  }

  async function handleCheckout() {
    setStep('loading');
    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          listingId,
          buyerEmail: email,
          shippingAddress: isPhysical ? address : undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? 'Erro ao criar ordem de pagamento');
        setStep(isPhysical ? 'address' : 'email');
        return;
      }
      router.push(`/checkout/${data.orderId}`);
    } catch {
      toast.error('Erro de ligação. Tenta novamente.');
      setStep(isPhysical ? 'address' : 'email');
    }
  }

  if (available <= 0) {
    return (
      <button
        disabled
        className="w-full bg-muted text-muted-foreground py-3 text-sm font-medium cursor-not-allowed uppercase tracking-widest"
      >
        Esgotado
      </button>
    );
  }

  if (step === 'idle') {
    return (
      <button
        onClick={() => setStep('email')}
        className="w-full bg-foreground text-background py-3 text-sm font-medium hover:bg-foreground/85 transition-colors uppercase tracking-widest"
      >
        Comprar obra
      </button>
    );
  }

  if (step === 'email') {
    const locked = !!userEmail;
    return (
      <div className="space-y-3 border border-border p-5 bg-card">
        <p className="text-xs font-medium uppercase tracking-[0.15em] text-muted-foreground mb-4">
          Email para receber a {artLabel}
        </p>
        <input
          type="email"
          value={email}
          onChange={e => !locked && setEmail(e.target.value)}
          placeholder="o-teu@email.com"
          autoFocus={!locked}
          readOnly={locked}
          className={`${inputClass} ${locked ? 'opacity-60 cursor-default bg-muted' : ''}`}
          onKeyDown={e => e.key === 'Enter' && email && (isPhysical ? setStep('address') : handleCheckout())}
        />
        <p className="text-xs text-muted-foreground">
          {locked
            ? 'Email da tua conta.'
            : isPhysical
            ? 'O recibo e certificado digital serão enviados para este email.'
            : `A ${artLabel} e o recibo serão enviados para este endereço.`}
        </p>
        <button
          onClick={() => isPhysical ? setStep('address') : handleCheckout()}
          disabled={!email}
          className="w-full bg-foreground text-background py-3 text-sm font-medium hover:bg-foreground/85 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
        >
          {isPhysical ? 'Continuar →' : 'Continuar para pagamento'}
        </button>
        <button
          onClick={() => setStep('idle')}
          className="w-full text-xs text-muted-foreground hover:text-foreground transition-colors py-1"
        >
          Cancelar
        </button>
      </div>
    );
  }

  if (step === 'address') {
    return (
      <div className="space-y-4 border border-border p-5 bg-card">
        <p className="text-xs font-medium uppercase tracking-[0.15em] text-muted-foreground">
          Morada de entrega
        </p>
        <div className="space-y-2">
          {([
            { field: 'name', label: 'Nome completo', placeholder: 'Ana Silva' },
            { field: 'line1', label: 'Morada', placeholder: 'Rua das Flores, 12' },
            { field: 'city', label: 'Cidade', placeholder: 'Lisboa' },
            { field: 'postal_code', label: 'Código postal', placeholder: '1000-001' },
            { field: 'country', label: 'País', placeholder: 'Portugal' },
          ] as const).map(({ field, label, placeholder }) => (
            <div key={field}>
              <label className="block text-xs text-muted-foreground mb-1">{label}</label>
              <input
                type="text"
                value={address[field]}
                onChange={e => setAddr(field, e.target.value)}
                placeholder={placeholder}
                className={inputClass}
              />
            </div>
          ))}
        </div>
        <button
          onClick={handleCheckout}
          disabled={!addressValid()}
          className="w-full bg-foreground text-background py-3 text-sm font-medium hover:bg-foreground/85 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
        >
          Continuar para pagamento
        </button>
        <button
          onClick={() => setStep('email')}
          className="w-full text-xs text-muted-foreground hover:text-foreground transition-colors py-1"
        >
          ← Voltar
        </button>
      </div>
    );
  }

  return (
    <button
      disabled
      className="w-full bg-foreground text-background py-3 text-sm font-medium opacity-50 cursor-not-allowed"
    >
      A criar ordem...
    </button>
  );
}
