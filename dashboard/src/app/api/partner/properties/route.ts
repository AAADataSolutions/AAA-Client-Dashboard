import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const adminClient = createAdminClient();
    const db = adminClient || supabase;

    const { searchParams } = new URL(request.url);
    const requestedPartnerId = searchParams.get('partner_id');

    const {
      data: { user },
      error: authErr,
    } = await supabase.auth.getUser();

    if (authErr || !user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is Super Admin
    const { data: userProfile } = await db
      .from('profiles')
      .select('id, role, email')
      .eq('id', user.id)
      .maybeSingle();

    const isInternalAdmin = userProfile?.role === 'SUPER_ADMIN' || userProfile?.role === 'SUB_SUPER_ADMIN';

    let partner: any = null;

    // 1. If internal admin requested a specific partner to inspect
    if (isInternalAdmin && requestedPartnerId) {
      const { data } = await db.from('partners').select('*').eq('id', requestedPartnerId).maybeSingle();
      if (data) partner = data;
    }

    // 2. Strict tenant lookup for the logged-in partner user
    if (!partner) {
      const { data: byUserId } = await db.from('partners').select('*').eq('user_id', user.id).maybeSingle();
      if (byUserId) {
        partner = byUserId;
      } else {
        const userEmail = (user.email || userProfile?.email || '').trim().toLowerCase();
        if (userEmail) {
          const { data: byEmail } = await db.from('partners').select('*').ilike('email', userEmail).maybeSingle();
          if (byEmail) {
            partner = byEmail;
            if (byEmail.user_id !== user.id) {
              await db.from('partners').update({ user_id: user.id, updated_at: new Date().toISOString() }).eq('id', byEmail.id);
            }
          }
        }
      }
    }

    // If no partner record matches this user, return empty array (STRICT TENANT ISOLATION)
    if (!partner) {
      return NextResponse.json({ success: true, data: [] });
    }

    // Fetch STRICTLY properties assigned to THIS partner
    const { data: assignedProps, error: propsErr } = await db
      .from('properties')
      .select('id, name, address, city, state, zip_code, country, main_phone, fax, monthly_price, partner_id, partner_commission_override, status')
      .eq('partner_id', partner.id)
      .order('name', { ascending: true });

    if (propsErr) {
      return NextResponse.json({ success: false, error: propsErr.message }, { status: 400 });
    }

    const properties = assignedProps || [];
    const defaultRate = Number(partner.default_commission_rate || 10);

    const enriched = properties.map((p: any) => {
      const commRate =
        p.partner_commission_override !== null &&
        p.partner_commission_override !== undefined &&
        p.partner_commission_override !== ''
          ? Number(p.partner_commission_override)
          : defaultRate;

      const price = Number(p.monthly_price || 0);
      const monthlyCommission = price * (commRate / 100);

      return {
        ...p,
        monthly_price: price,
        status: p.status || 'ACTIVE',
        effective_commission_rate: commRate,
        monthly_commission: Math.round(monthlyCommission * 100) / 100,
      };
    });

    return NextResponse.json({ success: true, data: enriched });
  } catch (err: any) {
    console.error('Partner properties API error:', err);
    return NextResponse.json({ success: false, error: err.message || 'Internal server error' }, { status: 500 });
  }
}
