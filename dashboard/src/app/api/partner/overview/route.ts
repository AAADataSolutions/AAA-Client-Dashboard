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
      // Direct user_id match
      const { data: byUserId } = await db.from('partners').select('*').eq('user_id', user.id).maybeSingle();
      if (byUserId) {
        partner = byUserId;
      } else if (user.email) {
        // Case-insensitive email match
        const cleanEmail = user.email.trim().toLowerCase();
        const { data: byEmail } = await db.from('partners').select('*').ilike('email', cleanEmail).maybeSingle();
        if (byEmail) {
          partner = byEmail;
          // Auto-link user_id
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
      // Fallback empty preview if no partner exists in database at all
      return NextResponse.json({
        success: true,
        data: {
          partner: {
            name: user?.user_metadata?.full_name || 'Partner Account',
            company_name: 'Affiliate Partner',
            email: user?.email || 'partner@aaadatasolutions.com',
            default_commission_rate: 10.0,
            status: 'ACTIVE',
          },
          metrics: {
            totalEarned: 0,
            monthlyRunRate: 0,
            activePropertiesCount: 0,
            totalGrossRevenue: 0,
            pendingPayout: 0,
          },
          recentInvoices: [],
        },
      });
    }

    // Fetch partner's assigned properties
    let { data: properties, error: propErr } = await db
      .from('properties')
      .select('id, name, address, city, state, zip_code, monthly_price, status, partner_commission_override, partner_id')
      .eq('partner_id', partner.id);

    if (!properties || properties.length === 0) {
      const { data: allProps } = await db
        .from('properties')
        .select('id, name, address, city, state, zip_code, monthly_price, status, partner_commission_override, partner_id');
      if (allProps && allProps.length > 0) {
        properties = allProps;
      }
    }

    const partnerProperties = properties || [];

    // Fetch porting requests to check if any properties are completed
    const propIds = partnerProperties.map((p: any) => p.id);
    const portingCompletedIds = new Set<string>();

    if (propIds.length > 0) {
      const { data: portings } = await db
        .from('porting_requests')
        .select(`
          status,
          property_id,
          organization_property:organization_properties(property_id)
        `);

      (portings || []).forEach((pr: any) => {
        const targetId = pr.property_id || pr.organization_property?.property_id;
        if (targetId && pr.status === 'COMPLETED') {
          portingCompletedIds.add(targetId);
        }
      });
    }

    const totalGross = partnerProperties.reduce((sum, p) => sum + Number(p.monthly_price || 0), 0);

    const defaultRate = Number(partner.default_commission_rate || 10);
    const monthlyRunRate = partnerProperties.reduce((sum, p) => {
      const rate =
        p.partner_commission_override !== null && p.partner_commission_override !== undefined
          ? Number(p.partner_commission_override)
          : defaultRate;
      return sum + Number(p.monthly_price || 0) * (rate / 100);
    }, 0);

    // Fetch invoices
    const { data: invoices } = await db
      .from('partner_invoices')
      .select('*')
      .eq('partner_id', partner.id)
      .order('created_at', { ascending: false });

    const allInvoices = invoices || [];
    const totalEarned = allInvoices
      .filter((inv) => inv.status === 'PAID')
      .reduce((sum, inv) => sum + Number(inv.commission_amount || 0), 0);
    const pendingPayout = allInvoices
      .filter((inv) => inv.status === 'APPROVED' || inv.status === 'SUBMITTED')
      .reduce((sum, inv) => sum + Number(inv.commission_amount || 0), 0);

    return NextResponse.json({
      success: true,
      data: {
        partner,
        metrics: {
          totalEarned,
          monthlyRunRate,
          activePropertiesCount: partnerProperties.length,
          totalGrossRevenue: totalGross,
          pendingPayout,
        },
        recentInvoices: allInvoices.slice(0, 5),
      },
    });
  } catch (err: any) {
    console.error('Partner overview API error:', err);
    return NextResponse.json({ success: false, error: err.message || 'Internal server error' }, { status: 500 });
  }
}
