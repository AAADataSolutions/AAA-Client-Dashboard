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
    } = await supabase.auth.getUser();

    let partner: any = null;

    // 1. If explicit partner_id was passed
    if (requestedPartnerId) {
      const { data } = await db.from('partners').select('*').eq('id', requestedPartnerId).maybeSingle();
      if (data) partner = data;
    }

    // 2. Lookup by logged in user
    if (!partner && user) {
      const { data: byUserId } = await db.from('partners').select('*').eq('user_id', user.id).maybeSingle();
      if (byUserId) {
        partner = byUserId;
      } else if (user.email) {
        const cleanEmail = user.email.trim().toLowerCase();
        const { data: byEmail } = await db.from('partners').select('*').ilike('email', cleanEmail).maybeSingle();
        if (byEmail) {
          partner = byEmail;
          if (!byEmail.user_id) {
            await db.from('partners').update({ user_id: user.id }).eq('id', byEmail.id);
          }
        }
      }
    }

    // 3. If still not matched, check user profile
    if (!partner && user) {
      const { data: profile } = await db.from('profiles').select('*').eq('id', user.id).maybeSingle();
      if (profile?.email) {
        const { data: byProfileEmail } = await db
          .from('partners')
          .select('*')
          .ilike('email', profile.email.trim().toLowerCase())
          .maybeSingle();
        if (byProfileEmail) {
          partner = byProfileEmail;
          if (!byProfileEmail.user_id) {
            await db.from('partners').update({ user_id: user.id }).eq('id', byProfileEmail.id);
          }
        }
      }
    }

    // 4. Fallback for Admin preview or initial partner
    if (!partner) {
      const { data: allPartners } = await db
        .from('partners')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1);

      if (allPartners && allPartners.length > 0) {
        partner = allPartners[0];
      }
    }

    if (!partner) {
      return NextResponse.json({ success: true, data: [] });
    }

    // Fetch properties assigned to this partner
    const { data: props, error } = await db
      .from('properties')
      .select('*')
      .eq('partner_id', partner.id)
      .order('name', { ascending: true });

    if (error) {
      console.error('Error fetching partner properties:', error);
      return NextResponse.json({ success: false, error: error.message }, { status: 400 });
    }

    const assignedProps = props || [];

    // Fetch porting requests for these properties to ensure stage sync
    const propIds = assignedProps.map((p: any) => p.id);
    const portingMap: Record<string, string> = {};

    if (propIds.length > 0) {
      const { data: portings } = await db
        .from('porting_requests')
        .select(`
          id,
          status,
          property_id,
          organization_property:organization_properties(property_id)
        `);

      (portings || []).forEach((pr: any) => {
        const directPropId = pr.property_id;
        const orgPropId = pr.organization_property?.property_id;
        const targetId = directPropId || orgPropId;
        if (targetId && propIds.includes(targetId)) {
          portingMap[targetId] = pr.status;
        }
      });
    }

    const defaultRate = Number(partner.default_commission_rate || 10);

    const enriched = assignedProps.map((p: any) => {
      const commRate =
        p.partner_commission_override !== null && p.partner_commission_override !== undefined
          ? Number(p.partner_commission_override)
          : defaultRate;

      const price = Number(p.monthly_price || 0);
      const monthlyCommission = price * (commRate / 100);

      // Check if property is onboarded or active
      const portingStatus = portingMap[p.id];
      const isPortingCompleted = portingStatus === 'COMPLETED';

      // Effective status
      let effectiveStatus = p.status || 'ACTIVE';
      if (isPortingCompleted || p.status === 'ACTIVE' || p.status === 'ONBOARDED' || p.status === 'COMPLETED') {
        effectiveStatus = 'ACTIVE';
      } else if (portingStatus) {
        effectiveStatus = portingStatus;
      }

      return {
        ...p,
        monthly_price: price,
        status: effectiveStatus,
        effective_commission_rate: commRate,
        monthly_commission: monthlyCommission,
      };
    });

    return NextResponse.json({ success: true, data: enriched });
  } catch (err: any) {
    console.error('Partner properties API error:', err);
    return NextResponse.json({ success: false, error: err.message || 'Internal server error' }, { status: 500 });
  }
}

