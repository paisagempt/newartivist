import Link from 'next/link';
import { NavHeader } from '@/components/layout/nav-header';
import { createAdminClient } from '@/lib/supabase/server';
import { HeroSlideshow } from '@/components/home/hero-slideshow';
import { getLang, dict } from '@/lib/i18n';

export default async function HomePage() {
  const admin = createAdminClient();
  const lang = await getLang();
  const t = dict[lang].home;

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
            {t.tag}
          </p>
          <h1 className="text-5xl sm:text-6xl font-bold tracking-tight leading-[1.05] mb-8">
            {t.h1[0]}<br />
            {t.h1[1]}<br />
            {t.h1[2]}
          </h1>
          <p className="text-base text-muted-foreground mb-10 max-w-md leading-relaxed">
            {t.desc}
          </p>
          <div className="flex flex-col gap-2 max-w-sm">
            <div className="flex gap-2">
              <Link
                href="/register?role=artist"
                className="flex-1 inline-flex items-center justify-center whitespace-nowrap border border-border px-6 py-3 text-sm font-medium hover:border-foreground hover:bg-muted transition-colors"
              >
                {t.cta_artist}
              </Link>
              <Link
                href="/register?role=ong"
                className="flex-1 inline-flex items-center justify-center whitespace-nowrap border border-border px-6 py-3 text-sm font-medium hover:border-foreground hover:bg-muted transition-colors"
              >
                {t.cta_ong}
              </Link>
            </div>
            <Link
              href="/marketplace"
              className="inline-flex items-center justify-center bg-foreground text-background py-3 text-sm font-medium hover:bg-foreground/85 transition-colors w-full"
            >
              {t.cta_explore}
            </Link>
          </div>
          {(count || artistCount) ? (
            <p className="text-xs text-muted-foreground mt-10">
              {t.stats(artistCount ?? 0, count ?? 0)}
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
          <h2 className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground mb-12">{t.how_title}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-12">
            {t.steps.map(step => (
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
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-[0.2em] mb-6">{t.for_artists_tag}</p>
            <h2 className="text-3xl font-bold mb-5 leading-tight">
              {t.for_artists_h2[0]}<br />{t.for_artists_h2[1]}
            </h2>
            <p className="text-sm text-muted-foreground mb-8 leading-relaxed">
              {t.for_artists_desc}
            </p>
            <Link
              href="/register?role=artist"
              className="inline-flex items-center bg-foreground text-background px-6 py-3 text-sm font-medium hover:bg-foreground/85 transition-colors"
            >
              {t.for_artists_cta}
            </Link>
          </div>
          <div className="border border-border bg-card p-6 space-y-0 text-sm">
            <div className="flex justify-between items-center py-4 border-b border-border">
              <span className="text-muted-foreground">{t.table_artists}</span>
              <span className="font-semibold">80%</span>
            </div>
            <div className="flex justify-between items-center py-4 border-b border-border">
              <span className="text-muted-foreground">{t.table_ong}</span>
              <span className="font-semibold">10%</span>
            </div>
            <div className="flex justify-between items-center py-4">
              <span className="text-muted-foreground">{t.table_platform}</span>
              <span className="font-semibold">10%</span>
            </div>
            <p className="text-xs text-muted-foreground pt-4 border-t border-border">
              {t.table_footer}
            </p>
          </div>
        </div>
      </section>

      {/* Para ONGs */}
      <section className="px-6 py-20 border-t border-border bg-muted">
        <div className="max-w-4xl mx-auto grid grid-cols-1 sm:grid-cols-2 gap-16 items-start">
          <div className="border border-border bg-background p-6 space-y-0 text-sm">
            <div className="flex justify-between items-center py-4 border-b border-border">
              <span className="text-muted-foreground">{t.ong_table_partners}</span>
              <span className="font-semibold">{t.ong_table_unlimited}</span>
            </div>
            <div className="flex justify-between items-center py-4 border-b border-border">
              <span className="text-muted-foreground">{t.ong_table_pct}</span>
              <span className="font-semibold">{t.ong_table_defined}</span>
            </div>
            <div className="flex justify-between items-center py-4">
              <span className="text-muted-foreground">{t.ong_table_transfers}</span>
              <span className="font-semibold">{t.ong_table_auto}</span>
            </div>
            <p className="text-xs text-muted-foreground pt-4 border-t border-border">
              {t.ong_table_footer}
            </p>
          </div>
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-[0.2em] mb-6">{t.for_ongs_tag}</p>
            <h2 className="text-3xl font-bold mb-5 leading-tight">
              {t.for_ongs_h2[0]}<br />{t.for_ongs_h2[1]}
            </h2>
            <p className="text-sm text-muted-foreground mb-8 leading-relaxed">
              {t.for_ongs_desc}
            </p>
            <Link
              href="/register?role=ong"
              className="inline-flex items-center bg-foreground text-background px-6 py-3 text-sm font-medium hover:bg-foreground/85 transition-colors"
            >
              {t.for_ongs_cta}
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-foreground text-background px-6 py-10">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div>
            <p className="text-sm font-semibold tracking-widest uppercase mb-1">Artivist</p>
            <p className="text-xs text-background/40">© {new Date().getFullYear()} Caroline Bampa. Portugal.</p>
          </div>
          <div className="flex flex-wrap items-center gap-6 text-xs text-background/60">
            <Link href="/marketplace" className="hover:text-background transition-colors">Marketplace</Link>
            <Link href="/register" className="hover:text-background transition-colors">Criar conta</Link>
            <Link href="/privacy" className="hover:text-background transition-colors">Privacidade</Link>
            <Link href="/terms" className="hover:text-background transition-colors">Termos</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
