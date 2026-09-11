import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const origin = requestUrl.origin;

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      // Determine where to redirect based on user role
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single();

        const isInternal = profile?.role === 'SUPER_ADMIN' || profile?.role === 'SUB_SUPER_ADMIN';
        return NextResponse.redirect(`${origin}${isInternal ? '/admin' : '/dashboard'}`);
      }
    }
  }

  // Return the user to login if something went wrong
  return NextResponse.redirect(`${origin}/auth`);
}
