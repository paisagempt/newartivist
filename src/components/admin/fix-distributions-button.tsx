'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

export function FixDistributionsButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleFix = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/fix-missing-distributions', { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Erro ao corrigir.');
      const count = data.fixed?.length ?? 0;
      if (count > 0) {
        toast.success(`${count} venda${count !== 1 ? 's' : ''} corrigida${count !== 1 ? 's' : ''} — distribuições criadas.`);
      } else {
        toast.info('Sem distribuições em falta.');
      }
      router.refresh();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button size="sm" variant="outline" onClick={handleFix} disabled={loading}>
      {loading && <Loader2 className="mr-2 size-4 animate-spin" />}
      Corrigir distribuições em falta
    </Button>
  );
}
