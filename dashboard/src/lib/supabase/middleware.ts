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

  // Protect /admin and /dashboard routes
  const isAuthRoute = pathname === '/auth' || pathname.startsWith('/auth/');
  const isAdminRoute = pathname === '/admin' || pathname.startsWith('/admin/');
  const isDashboardRoute = pathname === '/dashboard' || pathname.startsWith('/dashboard/');

  if (!user && (isAdminRoute || isDashboardRoute)) {
    const url = request.nextUrl.clone();
    url.pathname = '/auth';
    url.searchParams.set('redirectTo', pathname);
    return NextResponse.redirect(url);
  }

  // If user is authenticated and visits /auth or root /, redirect them to their workspace
  if (user && (isAuthRoute || pathname === '/')) {
    // Check user's profile role from Supabase
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    const isInternal = profile?.role === 'SUPER_ADMIN' || profile?.role === 'SUB_SUPER_ADMIN';
    const redirectTarget = isInternal ? '/admin' : '/dashboard';

    const url = request.nextUrl.clone();
    url.pathname = redirectTarget;
    return NextResponse.redirect(url);
  }

  // If client user attempts to visit /admin, check role and deny access
  if (user && isAdminRoute) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    const isInternal = profile?.role === 'SUPER_ADMIN' || profile?.role === 'SUB_SUPER_ADMIN';
    if (!isInternal) {
      const url = request.nextUrl.clone();
      url.pathname = '/dashboard';
      url.searchParams.set('error', 'unauthorized_admin_access');
      return NextResponse.redirect(url);
    }
  }

  return supabaseResponse;
}
