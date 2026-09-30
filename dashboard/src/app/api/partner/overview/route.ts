import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const adminClient = createAdminClient();
    const db = adminClient || supabase;
    const { data: { user } } = await supabase.auth.getUser();

    // Check if user is logged in
    let partnerQuery = db.from('partners').select('*');

    if (user) {
      partnerQuery = partnerQuery.or(`user_id.eq.${user.id},email.eq.${user.email?.toLowerCase()}`);
    }

    const { data: partnerRecords } = await partnerQuery;
    const partner = partnerRecords?.[0] || null;

    if (!partner) {
      // Fallback preview data if viewing as demo/admin
      return NextResponse.json({
        success: true,
        data: {
          partner: {
            name: user?.user_metadata?.full_name || 'Partner Account',
            company_name: 'Partner Organization',
            email: user?.email || 'partner@example.com',
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
    const { data: properties } = await db
      .from('properties')
      .select('id, name, address, city, state, zip_code, monthly_price, status, partner_commission_override')
      .eq('partner_id', partner.id);

    const activeProps = (properties || []).filter((p) => p.status === 'ACTIVE');
    const totalGross = activeProps.reduce((sum, p) => sum + Number(p.monthly_price || 0), 0);
    
    const monthlyRunRate = activeProps.reduce((sum, p) => {
      const rate = p.partner_commission_override !== null && p.partner_commission_override !== undefined
        ? Number(p.partner_commission_override)
        : Number(partner.default_commission_rate || 10);
      return sum + (Number(p.monthly_price || 0) * (rate / 100));
    }, 0);

    // Fetch invoices
    const { data: invoices } = await db
      .from('partner_invoices')
      .select('*')
      .eq('partner_id', partner.id)
      .order('created_at', { ascending: false });

    const allInvoices = invoices || [];
    const totalEarned = allInvoices.filter((inv) => inv.status === 'PAID').reduce((sum, inv) => sum + Number(inv.commission_amount || 0), 0);
    const pendingPayout = allInvoices.filter((inv) => inv.status === 'APPROVED' || inv.status === 'SUBMITTED').reduce((sum, inv) => sum + Number(inv.commission_amount || 0), 0);

    return NextResponse.json({
      success: true,
      data: {
        partner,
        metrics: {
          totalEarned,
          monthlyRunRate,
          activePropertiesCount: activeProps.length,
          totalGrossRevenue: totalGross,
          pendingPayout,
        },
        recentInvoices: allInvoices.slice(0, 5),
      },
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message || 'Internal server error' }, { status: 500 });
  }
}
