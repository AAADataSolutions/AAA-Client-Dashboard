import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    await supabase.auth.signOut({ scope: 'global' });

    const response = NextResponse.json({ success: true });
    
    // Clear all cookies explicitly with path / and maxAge 0
    const cookiesToClear = request.cookies.getAll();
    for (const cookie of cookiesToClear) {
      response.cookies.set(cookie.name, '', {
        maxAge: 0,
        path: '/',
        expires: new Date(0),
        sameSite: 'lax',
      });
      response.cookies.delete(cookie.name);
    }

    return response;
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    await supabase.auth.signOut({ scope: 'global' });
  } catch {
    // Ignore error
  }
  const url = new URL('/auth', request.url);
  const response = NextResponse.redirect(url);
  const cookiesToClear = request.cookies.getAll();
  for (const cookie of cookiesToClear) {
    response.cookies.set(cookie.name, '', {
      maxAge: 0,
      path: '/',
      expires: new Date(0),
      sameSite: 'lax',
    });
    response.cookies.delete(cookie.name);
  }
  return response;
}
