'use client';

import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { useCallback, useTransition } from 'react';

const TYPES = [
  { value: '', label: 'Tudo' },
  { value: 'digital', label: 'Digital' },
  { value: 'physical', label: 'Física' },
];

const SORTS = [
  { value: '', label: 'Recente' },
  { value: 'price_asc', label: 'Preço ↑' },
  { value: 'price_desc', label: 'Preço ↓' },
];

export function MarketplaceFilters() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();

  const q = searchParams.get('q') ?? '';
  const type = searchParams.get('type') ?? '';
  const sort = searchParams.get('sort') ?? '';

  const updateParam = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
      startTransition(() => {
        router.push(`${pathname}?${params.toString()}`, { scroll: false });
      });
    },
    [router, pathname, searchParams],
  );

  return (
    <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
      {/* Search */}
      <div className="relative flex-1 max-w-sm">
        <input
          type="search"
          placeholder="Pesquisar obras..."
          defaultValue={q}
          onChange={e => updateParam('q', e.target.value)}
          className="w-full border border-border bg-background px-4 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:border-foreground transition-colors font-[inherit]"
        />
      </div>

      <div className="flex items-center gap-4">
        {/* Type filter */}
        <div className="flex border border-border divide-x divide-border">
          {TYPES.map(t => (
            <button
              key={t.value}
              onClick={() => updateParam('type', t.value)}
              className={`px-3 py-2 text-[11px] font-medium uppercase tracking-[0.1em] transition-colors ${
                type === t.value
                  ? 'bg-foreground text-background'
                  : 'bg-background text-muted-foreground hover:text-foreground'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Sort */}
        <div className="flex border border-border divide-x divide-border">
          {SORTS.map(s => (
            <button
              key={s.value}
              onClick={() => updateParam('sort', s.value)}
              className={`px-3 py-2 text-[11px] font-medium uppercase tracking-[0.1em] transition-colors ${
                sort === s.value
                  ? 'bg-foreground text-background'
                  : 'bg-background text-muted-foreground hover:text-foreground'
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
