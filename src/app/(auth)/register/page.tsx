'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { Loader2, Palette, Building2, ShoppingBag } from 'lucide-react';

type Role = 'artist' | 'ong' | 'buyer';

const roles: { value: Role; label: string; description: string; icon: React.ReactNode }[] = [
  {
    value: 'artist',
    label: 'Sou artista',
    description: 'Quero vender as minhas obras e apoiar causas sociais',
    icon: <Palette className="size-6" />,
  },
  {
    value: 'ong',
    label: 'Represento uma ONG',
    description: 'Quero receber donativos através da venda de arte',
    icon: <Building2 className="size-6" />,
  },
  {
    value: 'buyer',
    label: 'Quero descobrir arte',
    description: 'Quero comprar obras e gerar impacto social',
    icon: <ShoppingBag className="size-6" />,
  },
];

export default function RegisterPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();

  const preselectedRole = searchParams.get('role') as Role | null;
  const [step, setStep] = useState<'role' | 'details'>(preselectedRole ? 'details' : 'role');
  const [selectedRole, setSelectedRole] = useState<Role | null>(preselectedRole);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRole) return;
    setIsLoading(true);

    try {
      const { error } = await supabase.auth.signUp({ email, password });
      if (error) throw error;

      await fetch('/api/create-wallet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: selectedRole }),
      });

      toast.success('Conta criada com sucesso!');
      router.push('/onboarding');
    } catch (err: any) {
      toast.error(err.message || 'Erro ao criar conta.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl font-bold">Artivist</CardTitle>
        <CardDescription>
          {step === 'role' ? 'Como queres participar?' : 'Cria a tua conta'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {step === 'role' ? (
          <div className="flex flex-col gap-3">
            {roles.map(role => (
              <button
                key={role.value}
                onClick={() => { setSelectedRole(role.value); setStep('details'); }}
                className={`flex items-center gap-4 rounded-xl border-2 p-4 text-left transition-colors hover:border-primary hover:bg-primary/5 ${
                  selectedRole === role.value ? 'border-primary bg-primary/5' : 'border-border'
                }`}
              >
                <div className="shrink-0 text-primary">{role.icon}</div>
                <div>
                  <p className="font-semibold">{role.label}</p>
                  <p className="text-sm text-muted-foreground">{role.description}</p>
                </div>
              </button>
            ))}
            <p className="text-center text-sm text-muted-foreground mt-2">
              Já tens conta?{' '}
              <Link href="/login" className="text-primary underline underline-offset-2">
                Entrar
              </Link>
            </p>
          </div>
        ) : (
          <form onSubmit={handleRegister} className="flex flex-col gap-4">
            <button
              type="button"
              onClick={() => setStep('role')}
              className="text-sm text-muted-foreground hover:text-foreground text-left"
            >
              ← Voltar
            </button>
            <div className="flex flex-col gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="tu@exemplo.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="password">Senha</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                minLength={8}
              />
            </div>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 size-4 animate-spin" />}
              Criar conta
            </Button>
            <p className="text-xs text-center text-muted-foreground">
              Ao registares-te, aceitas os nossos Termos de Serviço e Política de Privacidade.
            </p>
          </form>
        )}
      </CardContent>
    </Card>
  );
}
