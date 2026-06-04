'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

export function OngForm() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [mission, setMission] = useState('');
  const [registrationNumber, setRegistrationNumber] = useState('');
  const [country, setCountry] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const res = await fetch('/api/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          role: 'ong',
          name,
          mission,
          registration_number: registrationNumber,
          country,
        }),
      });
      if (!res.ok) throw new Error('Erro ao guardar perfil.');
      toast.success('Perfil criado! Aguarda a verificação da equipa Artivist.');
      router.push('/dashboard');
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl font-bold">Perfil da tua organização</CardTitle>
        <CardDescription>Após submissão, a equipa Artivist irá verificar o teu registo</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="name">Nome da organização *</Label>
            <Input
              id="name"
              placeholder="Nome oficial da ONG / associação"
              value={name}
              onChange={e => setName(e.target.value)}
              required
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="mission">Missão</Label>
            <textarea
              id="mission"
              rows={3}
              placeholder="Descreve a missão e o impacto da tua organização..."
              value={mission}
              onChange={e => setMission(e.target.value)}
              className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 resize-none"
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="registration">Número de registo legal *</Label>
            <Input
              id="registration"
              placeholder="Ex: NIPC 123456789 (Portugal)"
              value={registrationNumber}
              onChange={e => setRegistrationNumber(e.target.value)}
              required
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="country">País *</Label>
            <Input
              id="country"
              placeholder="Ex: Portugal"
              value={country}
              onChange={e => setCountry(e.target.value)}
              required
            />
          </div>
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 size-4 animate-spin" />}
            Submeter para verificação
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
