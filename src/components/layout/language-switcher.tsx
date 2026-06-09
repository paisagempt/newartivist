'use client';

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import type { Lang } from '@/lib/i18n';

const LANGS: { code: Lang; label: string }[] = [
  { code: 'pt', label: 'PT' },
  { code: 'en', label: 'EN' },
  { code: 'es', label: 'ES' },
];

export function LanguageSwitcher({ current }: { current: Lang }) {
  const router = useRouter();
  const [, startTransition] = useTransition();

  const switchLang = async (lang: Lang) => {
    await fetch('/api/lang', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ lang }),
    });
    startTransition(() => router.refresh());
  };

  return (
    <>
      {/* Mobile: select nativo */}
      <select
        value={current}
        onChange={e => switchLang(e.target.value as Lang)}
        className="sm:hidden border border-border bg-background text-[11px] font-medium uppercase tracking-wider px-2 py-1 focus:outline-none focus:border-foreground transition-colors cursor-pointer font-[inherit]"
      >
        {LANGS.map(l => (
          <option key={l.code} value={l.code}>{l.label}</option>
        ))}
      </select>

      {/* Desktop: botões */}
      <div className="hidden sm:flex items-center divide-x divide-border border border-border">
        {LANGS.map(l => (
          <button
            key={l.code}
            onClick={() => switchLang(l.code)}
            className={`px-2.5 py-1 text-[11px] font-medium uppercase tracking-wider transition-colors ${
              current === l.code
                ? 'bg-foreground text-background'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {l.label}
          </button>
        ))}
      </div>
    </>
  );
}
