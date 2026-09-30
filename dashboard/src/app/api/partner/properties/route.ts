import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const adminClient = createAdminClient();
    const db = adminClient || supabase;
    const { data: { user } } = await supabase.auth.getUser();

    let partnerQuery = db.from('partners').select('*');
    if (user) {
      partnerQuery = partnerQuery.or(`user_id.eq.${user.id},email.eq.${user.email?.toLowerCase()}`);
    }

    const { data: partnerRecords } = await partnerQuery;
    const partner = partnerRecords?.[0] || null;

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
      return NextResponse.json({ success: false, error: error.message }, { status: 400 });
    }

    // Fetch porting requests for these properties to ensure stage sync
    const propIds = (props || []).map((p: any) => p.id);
    let portingMap: Record<string, string> = {};

    if (propIds.length > 0) {
      // 1. Check direct property_id or organization_property
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

    const enriched = (props || []).map((p: any) => {
      const commRate = p.partner_commission_override !== null && p.partner_commission_override !== undefined
        ? Number(p.partner_commission_override)
        : Number(partner.default_commission_rate || 10);

      const price = Number(p.monthly_price || 0);
      const monthlyCommission = price * (commRate / 100);

      // Check if property is onboarded or active
      const portingStatus = portingMap[p.id];
      const isPortingCompleted = portingStatus === 'COMPLETED';
      const isPropertyActive = p.status === 'ACTIVE' || p.status === 'ONBOARDED' || p.status === 'COMPLETED' || isPortingCompleted;

      // Effective status
      let effectiveStatus = p.status || 'ACTIVE';
      if (isPortingCompleted || p.status === 'ACTIVE' || p.status === 'ONBOARDED') {
        effectiveStatus = 'ACTIVE';
      } else if (portingStatus) {
        effectiveStatus = portingStatus;
      }

      return {
        ...p,
        status: effectiveStatus,
        effective_commission_rate: commRate,
        monthly_commission: monthlyCommission,
      };
    });

    return NextResponse.json({ success: true, data: enriched });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message || 'Internal server error' }, { status: 500 });
  }
}

