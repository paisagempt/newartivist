import Link from 'next/link';

type Listing = {
  id: string;
  title: string;
  type: string;
  price_eur: number;
  edition_size: number;
  editions_sold: number;
  ong_percentage: number;
  cover_image_url: string | null;
  ongs: { name: string } | null;
};

export function ArtworkCard({ listing }: { listing: Listing }) {
  const available = listing.edition_size - listing.editions_sold;
  const artistPercentage = 100 - 10 - listing.ong_percentage;

  return (
    <Link href={`/artworks/${listing.id}`} className="group block rounded-2xl border bg-white dark:bg-zinc-900 overflow-hidden hover:shadow-md transition-shadow">
      <div className="aspect-square bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
        {listing.cover_image_url ? (
          <img
            src={listing.cover_image_url}
            alt={listing.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-muted-foreground text-sm">
            Sem imagem
          </div>
        )}
      </div>
      <div className="p-4 space-y-3">
        <div>
          <h3 className="font-semibold truncate">{listing.title}</h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            {listing.type === 'digital' ? 'Arte digital' : 'Arte física'} · {available === 1 && listing.edition_size === 1 ? 'Obra única' : `${available} disponíveis`}
          </p>
        </div>
        {listing.ongs && (
          <p className="text-xs text-blue-600 truncate">
            {listing.ong_percentage}% → {listing.ongs.name}
          </p>
        )}
        <div className="flex items-center justify-between">
          <span className="font-bold text-lg">€{Number(listing.price_eur).toFixed(2)}</span>
          <span className="text-xs text-muted-foreground">{artistPercentage}% para o artista</span>
        </div>
      </div>
    </Link>
  );
}
