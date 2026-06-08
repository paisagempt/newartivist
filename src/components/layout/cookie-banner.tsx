'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export function CookieBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const accepted = localStorage.getItem('cookie_notice');
    if (!accepted) setVisible(true);
  }, []);

  const dismiss = () => {
    localStorage.setItem('cookie_notice', '1');
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-background px-6 py-4">
      <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <p className="text-xs text-muted-foreground leading-relaxed max-w-xl">
          Este site utiliza apenas cookies estritamente necessários para autenticação e preferência de idioma.
          Ao continuar, aceita o uso destes cookies.{' '}
          <Link href="/privacy#cookies" className="underline underline-offset-2 hover:text-foreground transition-colors">
            Saber mais
          </Link>
        </p>
        <button
          onClick={dismiss}
          className="shrink-0 text-xs font-medium bg-foreground text-background px-5 py-2 hover:bg-foreground/85 transition-colors"
        >
          Aceitar e fechar
        </button>
      </div>
    </div>
  );
}
