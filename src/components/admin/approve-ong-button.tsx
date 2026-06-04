'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

export function ApproveOngButton({ ongId }: { ongId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState<'approve' | 'reject' | null>(null);

  const handleApprove = async () => {
    setLoading('approve');
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
      setLoading(null);
    }
  };

  const handleReject = async () => {
    if (!confirm('Tens a certeza que queres recusar este registo? A ONG terá de submeter novamente.')) return;
    setLoading('reject');
    try {
      const res = await fetch('/api/admin/reject-ong', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ongId }),
      });
      if (!res.ok) throw new Error('Erro ao recusar ONG.');
      toast.success('Registo recusado.');
      router.refresh();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="flex gap-2 shrink-0">
      <Button size="sm" onClick={handleApprove} disabled={loading !== null}>
        {loading === 'approve' && <Loader2 className="mr-2 size-4 animate-spin" />}
        Aprovar
      </Button>
      <Button size="sm" variant="outline" onClick={handleReject} disabled={loading !== null}>
        {loading === 'reject' && <Loader2 className="mr-2 size-4 animate-spin" />}
        Recusar
      </Button>
    </div>
  );
}
