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
    <Link
      href={`/artworks/${listing.id}`}
      className="group block border border-border hover:border-foreground transition-colors bg-card overflow-hidden"
    >
      {/* Image bleeds to edge */}
      <div className="aspect-square bg-muted overflow-hidden">
        {listing.cover_image_url ? (
          <img
            src={listing.cover_image_url}
            alt={listing.title}
            className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs uppercase tracking-widest">
            Sem imagem
          </div>
        )}
      </div>

      {/* Metadata below image */}
      <div className="p-4 space-y-3 border-t border-border">
        <div>
          <h3 className="text-sm font-semibold truncate">{listing.title}</h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            {listing.type === 'digital' ? 'Digital' : 'Física'} ·{' '}
            {available === 1 && listing.edition_size === 1 ? 'Obra única' : `${available} disponíveis`}
          </p>
        </div>
        {listing.ongs && (
          <p className="text-xs text-muted-foreground truncate">
            {listing.ong_percentage}% → {listing.ongs.name}
          </p>
        )}
        <div className="flex items-baseline justify-between">
          <span className="font-bold">€{Number(listing.price_eur).toFixed(2)}</span>
          <span className="text-xs text-muted-foreground">{artistPercentage}% artista</span>
        </div>
      </div>
    </Link>
  );
}
