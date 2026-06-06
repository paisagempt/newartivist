'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

export function MarkSentButton({ distributionId }: { distributionId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleMarkSent = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/mark-distribution-sent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ distributionId }),
      });
      if (!res.ok) throw new Error('Erro ao marcar como enviado.');
      toast.success('Marcado como enviado.');
      router.refresh();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button size="sm" variant="outline" onClick={handleMarkSent} disabled={loading}>
      {loading && <Loader2 className="mr-2 size-4 animate-spin" />}
      Marcar como enviado
    </Button>
  );
}
