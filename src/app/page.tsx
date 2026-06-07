import Link from 'next/link';
import { NavHeader } from '@/components/layout/nav-header';
import { createAdminClient } from '@/lib/supabase/server';
import { HeroSlideshow } from '@/components/home/hero-slideshow';

export default async function HomePage() {
  const admin = createAdminClient();

  const [{ count }, { count: artistCount }, { data: featuredListings }] = await Promise.all([
    admin.from('listings').select('*', { count: 'exact', head: true }).eq('status', 'active'),
    admin.from('artists').select('*', { count: 'exact', head: true }),
    admin
      .from('listings')
      .select('id, title, cover_image_url, ongs(name)')
      .eq('status', 'active')
      .not('cover_image_url', 'is', null)
      .order('created_at', { ascending: false })
      .limit(8),
  ]);

  const artworkSlides = (featuredListings ?? []).map(l => ({
    src: l.cover_image_url!,
    label: l.title,
    sublabel: (l.ongs as any)?.name ? `Apoia ${(l.ongs as any).name}` : 'Arte com impacto',
  }));

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <NavHeader />

      {/* Hero — duas colunas */}
      <section className="max-w-5xl mx-auto w-full px-6 py-24 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
        {/* Esquerda — texto + CTAs */}
        <div>
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-[0.2em] mb-8">
            Arte com impacto social
          </p>
          <h1 className="text-5xl sm:text-6xl font-bold tracking-tight leading-[1.05] mb-8">
            Compra arte.<br />
            Apoia causas.<br />
            Deixa marca.
          </h1>
          <p className="text-base text-muted-foreground mb-10 max-w-md leading-relaxed">
            Cada obra vendida distribui automaticamente uma parte para uma causa social — verificado na blockchain Solana.
          </p>
          <div className="flex flex-col gap-2 max-w-sm">
            <div className="flex gap-2">
              <Link
                href="/register?role=artist"
                className="flex-1 inline-flex items-center justify-center whitespace-nowrap border border-border px-6 py-3 text-sm font-medium hover:border-foreground hover:bg-muted transition-colors"
              >
                Sou artista →
              </Link>
              <Link
                href="/register?role=ong"
                className="flex-1 inline-flex items-center justify-center whitespace-nowrap border border-border px-6 py-3 text-sm font-medium hover:border-foreground hover:bg-muted transition-colors"
              >
                Sou ONG →
              </Link>
            </div>
            <Link
              href="/marketplace"
              className="inline-flex items-center justify-center bg-foreground text-background py-3 text-sm font-medium hover:bg-foreground/85 transition-colors w-full"
            >
              Explorar obras
            </Link>
          </div>
          {(count || artistCount) ? (
            <p className="text-xs text-muted-foreground mt-10">
              {artistCount ?? 0} artistas · {count ?? 0} obras disponíveis
            </p>
          ) : null}
        </div>

        {/* Direita — slideshow enquadrado */}
        <div className="hidden lg:block">
          <div className="aspect-square overflow-hidden">
            <HeroSlideshow artworkSlides={artworkSlides} />
          </div>
        </div>
      </section>

      {/* Como funciona */}
      <section className="border-t border-border bg-muted px-6 py-20">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground mb-12">Como funciona</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-12">
            {[
              {
                n: '01',
                title: 'Escolhe uma obra',
                desc: 'Explora o marketplace e descobre arte digital ou física de artistas comprometidos com causas sociais.',
              },
              {
                n: '02',
                title: 'Compra com impacto',
                desc: 'Pagamento seguro. Uma parte vai directamente para a ONG parceira do artista — automático e transparente.',
              },
              {
                n: '03',
                title: 'Recebe a tua arte',
                desc: 'Arte digital entregue por email com certificado na blockchain Solana. Arte física enviada para a tua morada.',
              },
            ].map(step => (
              <div key={step.n} className="space-y-4">
                <p className="text-3xl font-bold text-border">{step.n}</p>
                <h3 className="text-sm font-semibold">{step.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Para artistas */}
      <section className="px-6 py-20 max-w-4xl mx-auto w-full">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-16 items-start">
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-[0.2em] mb-6">Para artistas</p>
            <h2 className="text-3xl font-bold mb-5 leading-tight">
              Vende a tua arte.<br />Apoia uma causa.
            </h2>
            <p className="text-sm text-muted-foreground mb-8 leading-relaxed">
              Define a percentagem que vai para a ONG parceira. Recebe o teu quinhão em USDC directamente na tua wallet. A Artivist trata de tudo o resto.
            </p>
            <Link
              href="/register?role=artist"
              className="inline-flex items-center bg-foreground text-background px-6 py-3 text-sm font-medium hover:bg-foreground/85 transition-colors"
            >
              Criar conta como artista
            </Link>
          </div>
          <div className="border border-border bg-card p-6 space-y-0 text-sm">
            <div className="flex justify-between items-center py-4 border-b border-border">
              <span className="text-muted-foreground">Artista</span>
              <span className="font-semibold">80%</span>
            </div>
            <div className="flex justify-between items-center py-4 border-b border-border">
              <span className="text-muted-foreground">ONG parceira</span>
              <span className="font-semibold">10%</span>
            </div>
            <div className="flex justify-between items-center py-4">
              <span className="text-muted-foreground">Plataforma Artivist</span>
              <span className="font-semibold">10%</span>
            </div>
            <p className="text-xs text-muted-foreground pt-4 border-t border-border">
              Distribuição automática via blockchain após cada venda.
            </p>
          </div>
        </div>
      </section>

      {/* Para ONGs */}
      <section className="px-6 py-20 border-t border-border bg-muted">
        <div className="max-w-4xl mx-auto grid grid-cols-1 sm:grid-cols-2 gap-16 items-start">
          <div className="border border-border bg-background p-6 space-y-0 text-sm">
            <div className="flex justify-between items-center py-4 border-b border-border">
              <span className="text-muted-foreground">Artistas parceiros</span>
              <span className="font-semibold">Ilimitados</span>
            </div>
            <div className="flex justify-between items-center py-4 border-b border-border">
              <span className="text-muted-foreground">Percentagem recebida</span>
              <span className="font-semibold">Definida pelo artista</span>
            </div>
            <div className="flex justify-between items-center py-4">
              <span className="text-muted-foreground">Transferências</span>
              <span className="font-semibold">Automáticas</span>
            </div>
            <p className="text-xs text-muted-foreground pt-4 border-t border-border">
              Cada venda gera uma transferência automática para a tua organização.
            </p>
          </div>
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-[0.2em] mb-6">Para ONGs</p>
            <h2 className="text-3xl font-bold mb-5 leading-tight">
              Recebe donativos.<br />Através da arte.
            </h2>
            <p className="text-sm text-muted-foreground mb-8 leading-relaxed">
              Regista a tua organização e torna-te parceira de artistas. Cada vez que uma obra for vendida, a tua causa recebe automaticamente a percentagem acordada. Sem intermediários, sem burocracia.
            </p>
            <Link
              href="/register?role=ong"
              className="inline-flex items-center bg-foreground text-background px-6 py-3 text-sm font-medium hover:bg-foreground/85 transition-colors"
            >
              Registar a minha ONG
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-foreground text-background px-6 py-10">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <p className="text-sm font-semibold tracking-widest uppercase">Artivist</p>
          <div className="flex items-center gap-6 text-xs text-background/60">
            <Link href="/marketplace" className="hover:text-background transition-colors">Marketplace</Link>
            <Link href="/register" className="hover:text-background transition-colors">Criar conta</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
