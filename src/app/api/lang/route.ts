import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  const { lang } = await request.json();
  if (!['pt', 'en', 'es'].includes(lang)) {
    return NextResponse.json({ error: 'invalid lang' }, { status: 400 });
  }
  const res = NextResponse.json({ ok: true });
  res.cookies.set('lang', lang, { path: '/', maxAge: 60 * 60 * 24 * 365, sameSite: 'lax' });
  return res;
}
