import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
  }

  const body = await request.json();
  const { role } = body;

  if (role === 'artist') {
    const { bio, portfolio_url } = body;
    const { error } = await supabase.from('artists').upsert({
      user_id: user.id,
      bio: bio ?? null,
      portfolio_url: portfolio_url ?? null,
      verified: true,
      total_raised_eur: 0,
    });
    if (error) {
      console.error('[onboarding] artist upsert error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
  } else if (role === 'ong') {
    const { name, mission, registration_number, country } = body;
    const { error } = await supabase.from('ongs').upsert({
      user_id: user.id,
      name,
      mission: mission ?? null,
      registration_number,
      country,
      verified: false,
      total_received_eur: 0,
    });
    if (error) {
      console.error('[onboarding] ong upsert error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
  }

  return NextResponse.json({ ok: true });
}
