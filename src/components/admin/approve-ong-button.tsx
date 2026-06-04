'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

export function ApproveOngButton({ ongId }: { ongId: string }) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const handleApprove = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/admin/approve-ong', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ongId }),
      });
      if (!res.ok) throw new Error('Erro ao aprovar ONG.');
      toast.success('ONG verificada!');
      router.refresh();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button size="sm" onClick={handleApprove} disabled={isLoading}>
      {isLoading && <Loader2 className="mr-2 size-4 animate-spin" />}
      Aprovar
    </Button>
  );
}
