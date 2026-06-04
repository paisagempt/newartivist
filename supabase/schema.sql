-- Artivist — Schema v1
-- Corre este ficheiro no Supabase SQL Editor

-- Extensões
create extension if not exists "uuid-ossp";

-- Utilizadores (espelho do Supabase Auth + dados de perfil)
create table users (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  role text not null check (role in ('artist', 'ong', 'buyer', 'admin')) default 'buyer',
  wallet_address text,
  kyc_status text check (kyc_status in ('pending', 'approved', 'rejected')) default 'pending',
  created_at timestamptz not null default now()
);

-- Perfis de artistas
create table artists (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references users(id) on delete cascade,
  bio text,
  portfolio_url text,
  verified boolean not null default false,
  total_raised_eur numeric(12,2) not null default 0,
  created_at timestamptz not null default now()
);

-- ONGs
create table ongs (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references users(id) on delete cascade,
  name text not null,
  mission text,
  registration_number text not null,
  country text not null,
  verified boolean not null default false,
  total_received_eur numeric(12,2) not null default 0,
  created_at timestamptz not null default now()
);

-- Listagens de obras
create table listings (
  id uuid primary key default uuid_generate_v4(),
  artist_id uuid not null references artists(id) on delete cascade,
  ong_id uuid not null references ongs(id),
  title text not null,
  description text,
  type text not null check (type in ('digital', 'physical', 'both')),
  price_eur numeric(10,2) not null,
  edition_size integer not null default 1,
  editions_sold integer not null default 0,
  ong_percentage numeric(5,2) not null check (ong_percentage >= 10 and ong_percentage <= 90),
  royalty_percentage numeric(5,2) not null default 10,
  status text not null check (status in ('draft', 'active', 'sold', 'archived')) default 'draft',
  cover_image_url text,
  file_url text,
  is_campaign boolean not null default false,
  campaign_deadline timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Vendas
create table sales (
  id uuid primary key default uuid_generate_v4(),
  listing_id uuid not null references listings(id),
  buyer_id uuid not null references users(id),
  price_eur numeric(10,2) not null,
  eurc_amount numeric(18,6),
  split_tx_hash text,
  nft_mint_address text,
  status text not null check (status in ('pending', 'escrowed', 'completed', 'refunded')) default 'pending',
  created_at timestamptz not null default now()
);

-- Escrow (arte física)
create table escrows (
  id uuid primary key default uuid_generate_v4(),
  sale_id uuid not null references sales(id) on delete cascade,
  tracking_code text,
  sent_at timestamptz,
  confirmed_at timestamptz,
  auto_release_at timestamptz,
  dispute_opened_at timestamptz
);

-- Disputas
create table disputes (
  id uuid primary key default uuid_generate_v4(),
  sale_id uuid not null references sales(id),
  reason text,
  status text not null check (status in ('open', 'resolved')) default 'open',
  resolution text,
  created_at timestamptz not null default now()
);

-- Row Level Security
alter table users enable row level security;
alter table artists enable row level security;
alter table ongs enable row level security;
alter table listings enable row level security;
alter table sales enable row level security;
alter table escrows enable row level security;
alter table disputes enable row level security;

-- Policies básicas
create policy "Utilizador vê o seu próprio perfil" on users
  for select using (auth.uid() = id);

create policy "Artistas são visíveis publicamente" on artists
  for select using (true);

create policy "ONGs verificadas são visíveis publicamente" on ongs
  for select using (verified = true);

create policy "Listagens activas são visíveis publicamente" on listings
  for select using (status = 'active');

create policy "Comprador vê as suas vendas" on sales
  for select using (auth.uid() = buyer_id);
