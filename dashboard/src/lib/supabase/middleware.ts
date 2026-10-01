import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://your-project.supabase.co';
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-anon-key';

  const supabase = createServerClient(
    supabaseUrl,
    supabaseAnonKey,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;

  // Do not run page-level route redirects on API endpoints
  if (pathname.startsWith('/api/')) {
    return supabaseResponse;
  }

  const isAuthRoute = pathname === '/auth' || pathname.startsWith('/auth/');
  const isAdminRoute = pathname === '/admin' || pathname.startsWith('/admin/');
  const isDashboardRoute = pathname === '/dashboard' || pathname.startsWith('/dashboard/');
  const isPartnerRoute = pathname === '/partner' || pathname.startsWith('/partner/');
  const isOnboardingRoute = pathname === '/onboarding' || pathname.startsWith('/onboarding/');

  // 1. If not authenticated and visiting protected areas
  if (!user && (isAdminRoute || isDashboardRoute || isPartnerRoute || isOnboardingRoute)) {
    const url = request.nextUrl.clone();
    url.pathname = '/auth';
    url.searchParams.set('redirectTo', pathname);
    return NextResponse.redirect(url);
  }

  // 2. If authenticated and visiting /auth or root /
  if (user && (isAuthRoute || pathname === '/')) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .maybeSingle();

    const isInternal = profile?.role === 'SUPER_ADMIN' || profile?.role === 'SUB_SUPER_ADMIN';

    if (isInternal) {
      const url = request.nextUrl.clone();
      url.pathname = '/admin';
      return NextResponse.redirect(url);
    }

    if (profile?.role === 'PARTNER') {
      const url = request.nextUrl.clone();
      url.pathname = '/partner';
      return NextResponse.redirect(url);
    }

    // Check if user is in partners table even if profile.role was not set yet
    const { data: partnerRecord } = await supabase
      .from('partners')
      .select('id')
      .or(`user_id.eq.${user.id},email.eq.${user.email?.toLowerCase()}`)
      .maybeSingle();

    if (partnerRecord) {
      const url = request.nextUrl.clone();
      url.pathname = '/partner';
      return NextResponse.redirect(url);
    }

    // Check if client user has an active organization
    const { data: membership } = await supabase
      .from('organization_members')
      .select('organization_id')
      .eq('profile_id', user.id)
      .maybeSingle();

    const url = request.nextUrl.clone();
    url.pathname = membership?.organization_id ? '/dashboard' : '/onboarding';
    return NextResponse.redirect(url);
  }

  // 3. If client or partner user visits /admin, block them
  if (user && isAdminRoute) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .maybeSingle();

    const isInternal = profile?.role === 'SUPER_ADMIN' || profile?.role === 'SUB_SUPER_ADMIN';
    if (!isInternal) {
      const url = request.nextUrl.clone();
      url.pathname = profile?.role === 'PARTNER' ? '/partner' : '/dashboard';
      return NextResponse.redirect(url);
    }
  }

  // 4. If partner visits /dashboard, redirect to /partner
  if (user && isDashboardRoute) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .maybeSingle();

    if (profile?.role === 'PARTNER') {
      const url = request.nextUrl.clone();
      url.pathname = '/partner';
      return NextResponse.redirect(url);
    }

    const { data: partnerRecord } = await supabase
      .from('partners')
      .select('id')
      .or(`user_id.eq.${user.id},email.ilike.${user.email?.toLowerCase()}`)
      .maybeSingle();

    if (partnerRecord) {
      const url = request.nextUrl.clone();
      url.pathname = '/partner';
      return NextResponse.redirect(url);
    }
  }

  return supabaseResponse;
}
