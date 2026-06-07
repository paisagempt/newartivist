'use client';

import { useEffect, useState } from 'react';

type Slide = {
  src: string;
  label: string;
  sublabel?: string;
};

// Imagens de ações sociais — adiciona URLs aqui (Supabase Storage, Unsplash, etc.)
const SOCIAL_SLIDES: Slide[] = [
  // Exemplo:
  // { src: 'https://...', label: 'Impacto social', sublabel: 'Comunidades apoiadas' },
];

export function HeroSlideshow({ artworkSlides }: { artworkSlides: Slide[] }) {
  const slides = [...artworkSlides, ...SOCIAL_SLIDES].filter(s => s.src);
  const [current, setCurrent] = useState(0);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    if (slides.length <= 1) return;
    const interval = setInterval(() => {
      setVisible(false);
      setTimeout(() => {
        setCurrent(i => (i + 1) % slides.length);
        setVisible(true);
      }, 800);
    }, 8000);
    return () => clearInterval(interval);
  }, [slides.length]);

  if (slides.length === 0) {
    return (
      <div className="w-full h-full bg-muted flex items-center justify-center">
        <p className="text-xs text-muted-foreground uppercase tracking-widest">Artivist</p>
      </div>
    );
  }

  const slide = slides[current];

  return (
    <div className="relative w-full h-full overflow-hidden bg-muted">
      <img
        src={slide.src}
        alt={slide.label}
        className="w-full h-full object-cover"
        style={{
          opacity: visible ? 1 : 0,
          transition: 'opacity 800ms ease-in-out',
        }}
      />
      {/* Esmaecido branco na base */}
      <div className="absolute bottom-0 left-0 right-0 h-28 bg-gradient-to-t from-white to-transparent" />

      {/* Label — texto preto sobre o esmaecido */}
      <div
        className="absolute bottom-0 left-0 right-0 px-5 py-4"
        style={{
          opacity: visible ? 1 : 0,
          transition: 'opacity 800ms ease-in-out',
        }}
      >
        <p className="text-[10px] text-foreground/40 uppercase tracking-[0.15em] mb-0.5">{slide.sublabel ?? 'Marketplace'}</p>
        <p className="text-xs font-medium text-foreground truncate">{slide.label}</p>
      </div>

      {/* Indicadores */}
      {slides.length > 1 && (
        <div className="absolute top-4 right-4 flex gap-1">
          {slides.map((_, i) => (
            <button
              key={i}
              onClick={() => { setVisible(false); setTimeout(() => { setCurrent(i); setVisible(true); }, 800); }}
              className={`w-1 h-1 transition-colors ${i === current ? 'bg-foreground' : 'bg-foreground/20'}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
