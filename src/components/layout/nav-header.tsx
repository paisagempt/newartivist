import { createClient } from '@/lib/supabase/server';
import { getLang, dict } from '@/lib/i18n';
import Link from 'next/link';
import { LogoutButton } from '@/components/logout-button';
import { LanguageSwitcher } from '@/components/layout/language-switcher';

export async function NavHeader({ backLink }: { backLink?: { href: string; label: string } }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const lang = await getLang();
  const t = dict[lang].nav;

  return (
    <header className="border-b border-border bg-background px-6 py-0 flex items-center justify-between sticky top-0 z-10 h-14">
      <div className="flex items-center gap-8">
        <Link href="/" className="text-sm font-semibold tracking-widest uppercase">
          Artivist
        </Link>
        {backLink ? (
          <Link href={backLink.href} className="text-sm text-muted-foreground hover:text-foreground transition-colors">
            ← {backLink.label}
          </Link>
        ) : (
          <Link href="/marketplace" className="text-sm text-muted-foreground hover:text-foreground transition-colors hidden sm:block">
            {t.marketplace}
          </Link>
        )}
      </div>
      <div className="flex items-center gap-4">
        <LanguageSwitcher current={lang} />
        {user ? (
          <>
            <Link href="/dashboard" className="text-sm text-muted-foreground hover:text-foreground transition-colors hidden sm:block">
              {t.dashboard}
            </Link>
            <LogoutButton />
          </>
        ) : (
          <>
            <Link href="/login" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              {t.login}
            </Link>
            <Link
              href="/register"
              className="text-sm font-medium bg-foreground text-background px-5 py-2 hover:bg-foreground/85 transition-colors"
            >
              {t.register}
            </Link>
          </>
        )}
      </div>
    </header>
  );
}
