'use client';

import { useState } from 'react';
import { X } from 'lucide-react';

export function ArtworkImage({ src, alt }: { src: string; alt: string }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <img
        src={src}
        alt={alt}
        onClick={() => setOpen(true)}
        className="size-12 rounded-lg object-cover shrink-0 cursor-pointer hover:opacity-80 transition-opacity"
      />

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
          onClick={() => setOpen(false)}
        >
          <button
            onClick={() => setOpen(false)}
            className="absolute top-4 right-4 text-white bg-black/50 rounded-full p-2 hover:bg-black/70"
          >
            <X className="size-5" />
          </button>
          <img
            src={src}
            alt={alt}
            onClick={e => e.stopPropagation()}
            className="max-w-full max-h-[90vh] rounded-xl object-contain shadow-2xl"
          />
        </div>
      )}
    </>
  );
}
