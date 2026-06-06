import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { LogoutButton } from '@/components/logout-button';

export async function NavHeader({ backLink }: { backLink?: { href: string; label: string } }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  return (
    <header className="border-b bg-white dark:bg-zinc-900 px-6 py-4 flex items-center justify-between sticky top-0 z-10">
      <div className="flex items-center gap-6">
        <Link href="/" className="text-xl font-bold tracking-tight">Artivist</Link>
        {backLink ? (
          <Link href={backLink.href} className="text-sm text-muted-foreground hover:text-foreground">
            ← {backLink.label}
          </Link>
        ) : (
          <Link href="/marketplace" className="text-sm text-muted-foreground hover:text-foreground hidden sm:block">
            Marketplace
          </Link>
        )}
      </div>
      <div className="flex items-center gap-4">
        {user ? (
          <>
            <Link href="/dashboard" className="text-sm text-muted-foreground hover:text-foreground hidden sm:block">
              Dashboard
            </Link>
            <LogoutButton />
          </>
        ) : (
          <>
            <Link href="/login" className="text-sm text-muted-foreground hover:text-foreground">
              Entrar
            </Link>
            <Link
              href="/register"
              className="text-sm font-medium bg-foreground text-background px-4 py-2 rounded-full hover:opacity-90 transition-opacity"
            >
              Criar conta
            </Link>
          </>
        )}
      </div>
    </header>
  );
}
