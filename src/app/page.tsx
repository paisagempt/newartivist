import Link from 'next/link';
import { NavHeader } from '@/components/layout/nav-header';
import { createAdminClient } from '@/lib/supabase/server';

export default async function HomePage() {
  const admin = createAdminClient();
  const { count } = await admin.from('listings').select('*', { count: 'exact', head: true }).eq('status', 'active');
  const { count: artistCount } = await admin.from('artists').select('*', { count: 'exact', head: true });

  return (
    <div className="min-h-screen bg-white dark:bg-black">
      <NavHeader />

      {/* Hero */}
      <section className="max-w-3xl mx-auto px-6 py-24 text-center">
        <p className="text-sm font-medium text-muted-foreground uppercase tracking-widest mb-4">Arte com impacto social</p>
        <h1 className="text-5xl font-bold tracking-tight mb-6 leading-tight">
          Compra arte.<br />Apoia causas.<br />Deixa marca.
        </h1>
        <p className="text-lg text-muted-foreground mb-10 max-w-xl mx-auto">
          Cada obra vendida distribui automaticamente uma parte para uma causa social — verificado na blockchain Solana.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/marketplace"
            className="bg-foreground text-background px-8 py-3.5 rounded-full font-medium hover:opacity-90 transition-opacity text-sm"
          >
            Explorar obras
          </Link>
          <Link
            href="/register"
            className="border px-8 py-3.5 rounded-full font-medium hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors text-sm"
          >
            Sou artista →
          </Link>
        </div>
        {(count || artistCount) ? (
          <p className="text-xs text-muted-foreground mt-8">
            {artistCount ?? 0} artistas · {count ?? 0} obras disponíveis
          </p>
        ) : null}
      </section>

      {/* Como funciona */}
      <section className="border-t bg-zinc-50 dark:bg-zinc-950 px-6 py-20">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-center mb-12">Como funciona</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
            <div className="text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-foreground text-background flex items-center justify-center text-lg font-bold mx-auto">1</div>
              <h3 className="font-semibold">Escolhe uma obra</h3>
              <p className="text-sm text-muted-foreground">Explora o marketplace e descobre arte de artistas comprometidos com causas sociais.</p>
            </div>
            <div className="text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-foreground text-background flex items-center justify-center text-lg font-bold mx-auto">2</div>
              <h3 className="font-semibold">Compra com impacto</h3>
              <p className="text-sm text-muted-foreground">Pagamento seguro via Stripe. Uma parte vai directamente para a ONG parceira do artista.</p>
            </div>
            <div className="text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-foreground text-background flex items-center justify-center text-lg font-bold mx-auto">3</div>
              <h3 className="font-semibold">Recebe na blockchain</h3>
              <p className="text-sm text-muted-foreground">A tua arte digital é entregue por email como NFT na Solana — certificado único e inviolável.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Para artistas */}
      <section className="px-6 py-20 max-w-4xl mx-auto">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-12 items-center">
          <div>
            <p className="text-sm font-medium text-muted-foreground uppercase tracking-widest mb-3">Para artistas</p>
            <h2 className="text-3xl font-bold mb-4">Vende a tua arte.<br />Apoia uma causa.</h2>
            <p className="text-muted-foreground mb-6">
              Define a percentagem que vai para a ONG parceira. Recebe o teu quinhão em USDC directamente na tua wallet. A Artivist trata de tudo o resto.
            </p>
            <Link
              href="/register"
              className="inline-block bg-foreground text-background px-6 py-3 rounded-full font-medium hover:opacity-90 transition-opacity text-sm"
            >
              Criar conta como artista
            </Link>
          </div>
          <div className="rounded-2xl border bg-zinc-50 dark:bg-zinc-900 p-6 space-y-4 text-sm">
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Artista</span>
              <span className="font-semibold text-green-600">80%</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">ONG parceira</span>
              <span className="font-semibold text-blue-600">10%</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Plataforma Artivist</span>
              <span className="font-semibold">10%</span>
            </div>
            <p className="text-xs text-muted-foreground pt-2 border-t">Distribuição automática via blockchain após cada venda.</p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t px-6 py-8 text-center">
        <p className="text-sm font-bold tracking-tight mb-2">Artivist</p>
        <p className="text-xs text-muted-foreground">Arte com impacto social · <Link href="/marketplace" className="underline underline-offset-2">Marketplace</Link> · <Link href="/register" className="underline underline-offset-2">Criar conta</Link></p>
      </footer>
    </div>
  );
}
