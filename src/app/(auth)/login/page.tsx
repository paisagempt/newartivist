'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [view, setView] = useState<'login' | 'forgot'>('login');
  const [resetSent, setResetSent] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      router.push('/dashboard');
    } catch (err: any) {
      toast.error(err.message || 'Email ou senha incorrectos.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgot = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/callback?next=/update-password`,
      });
      if (error) throw error;
      setResetSent(true);
    } catch (err: any) {
      toast.error(err.message || 'Erro ao enviar email.');
    } finally {
      setIsLoading(false);
    }
  };

  if (view === 'forgot') {
    return (
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">Artivist</CardTitle>
          <CardDescription>Recuperar senha</CardDescription>
        </CardHeader>
        <CardContent>
          {resetSent ? (
            <div className="flex flex-col gap-4 text-center">
              <p className="text-sm text-muted-foreground">
                Enviámos um link para <strong>{email}</strong>. Verifica a tua caixa de entrada.
              </p>
              <Button variant="outline" onClick={() => { setView('login'); setResetSent(false); }}>
                Voltar ao login
              </Button>
            </div>
          ) : (
            <form onSubmit={handleForgot} className="flex flex-col gap-4">
              <button type="button" onClick={() => setView('login')} className="text-sm text-muted-foreground hover:text-foreground text-left">
                ← Voltar
              </button>
              <div className="flex flex-col gap-2">
                <Label htmlFor="reset-email">Email da tua conta</Label>
                <Input
                  id="reset-email"
                  type="email"
                  placeholder="tu@exemplo.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                />
              </div>
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 size-4 animate-spin" />}
                Enviar link de recuperação
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl font-bold">Artivist</CardTitle>
        <CardDescription>Entra na tua conta</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleLogin} className="flex flex-col gap-4">
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
            <div className="flex justify-between items-center">
              <Label htmlFor="password">Senha</Label>
              <button
                type="button"
                onClick={() => setView('forgot')}
                className="text-xs text-muted-foreground hover:text-foreground"
              >
                Esqueci a senha
              </button>
            </div>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
            />
          </div>
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 size-4 animate-spin" />}
            Entrar
          </Button>
          <p className="text-center text-sm text-muted-foreground">
            Não tens conta?{' '}
            <Link href="/register" className="text-primary underline underline-offset-2">
              Registar
            </Link>
          </p>
        </form>
      </CardContent>
    </Card>
  );
}
