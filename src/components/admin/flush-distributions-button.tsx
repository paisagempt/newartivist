'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

export function FlushDistributionsButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleFlush = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/flush-distributions', { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Erro ao enviar.');
      if (data.skipped) {
        toast.warning(`Não enviado: ${data.skipped}`);
      } else {
        toast.success(`${data.sent} distribuiç${data.sent === 1 ? 'ão enviada' : 'ões enviadas'} com sucesso.`);
      }
      router.refresh();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button size="sm" onClick={handleFlush} disabled={loading}>
      {loading && <Loader2 className="mr-2 size-4 animate-spin" />}
      Tentar enviar agora
    </Button>
  );
}
