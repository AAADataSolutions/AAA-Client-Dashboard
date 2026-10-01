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
          .maybeSingle();

        const { data: partnerRec } = await supabase
          .from('partners')
          .select('id')
          .or(`user_id.eq.${user.id},email.ilike.${user.email?.toLowerCase()}`)
          .maybeSingle();

        const isInternal = profile?.role === 'SUPER_ADMIN' || profile?.role === 'SUB_SUPER_ADMIN';
        const isPartner = profile?.role === 'PARTNER' || Boolean(partnerRec);

        const dest = isInternal ? '/admin' : isPartner ? '/partner' : '/dashboard';
        return NextResponse.redirect(`${origin}${dest}`);
      }
    }
  }

  // Return the user to login if something went wrong
  return NextResponse.redirect(`${origin}/auth`);
}
