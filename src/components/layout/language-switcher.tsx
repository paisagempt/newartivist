'use client';

import { useEffect, useState } from 'react';

const LANGS = [
  { code: 'pt', label: 'PT' },
  { code: 'en', label: 'EN' },
  { code: 'es', label: 'ES' },
];

export function LanguageSwitcher() {
  const [active, setActive] = useState('pt');

  useEffect(() => {
    // Detecta idioma activo pelo cookie do Google Translate
    const match = document.cookie.match(/googtrans=\/pt\/(\w+)/);
    if (match && match[1] !== 'pt') {
      setActive(match[1]);
    }
  }, []);

  const switchLang = (lang: string) => {
    if (lang === 'pt') {
      // Remover cookie e recarregar
      document.cookie = 'googtrans=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC';
      document.cookie = 'googtrans=; path=/; domain=' + window.location.hostname + '; expires=Thu, 01 Jan 1970 00:00:00 UTC';
      setActive('pt');
      window.location.reload();
      return;
    }

    // Definir cookie de tradução
    document.cookie = `googtrans=/pt/${lang}; path=/`;
    document.cookie = `googtrans=/pt/${lang}; path=/; domain=${window.location.hostname}`;
    setActive(lang);

    // Acionar o select escondido do Google Translate
    const select = document.querySelector<HTMLSelectElement>('.goog-te-combo');
    if (select) {
      select.value = lang;
      select.dispatchEvent(new Event('change'));
    } else {
      window.location.reload();
    }
  };

  return (
    <div className="flex items-center divide-x divide-border border border-border">
      {LANGS.map(l => (
        <button
          key={l.code}
          onClick={() => switchLang(l.code)}
          className={`px-2.5 py-1 text-[11px] font-medium uppercase tracking-wider transition-colors ${
            active === l.code
              ? 'bg-foreground text-background'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          {l.label}
        </button>
      ))}
    </div>
  );
}
