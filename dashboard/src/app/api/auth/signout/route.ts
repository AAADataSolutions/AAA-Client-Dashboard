import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    await supabase.auth.signOut();

    const response = NextResponse.json({ success: true });
    
    // Clear auth cookies explicitly
    const cookiesToClear = request.cookies.getAll();
    for (const cookie of cookiesToClear) {
      if (cookie.name.includes('supabase') || cookie.name.includes('sb-') || cookie.name.includes('auth')) {
        response.cookies.delete(cookie.name);
      }
    }

    return response;
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    await supabase.auth.signOut();
  } catch {
    // Ignore error
  }
  const url = new URL('/auth', request.url);
  const response = NextResponse.redirect(url);
  const cookiesToClear = request.cookies.getAll();
  for (const cookie of cookiesToClear) {
    if (cookie.name.includes('supabase') || cookie.name.includes('sb-') || cookie.name.includes('auth')) {
      response.cookies.delete(cookie.name);
    }
  }
  return response;
}
