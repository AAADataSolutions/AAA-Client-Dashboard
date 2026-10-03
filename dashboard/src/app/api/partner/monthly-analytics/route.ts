import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export interface PartnerMonthlyDataPoint {
  monthKey: string; // '2026-01'
  monthIndex: number; // 0-11
  monthName: string; // 'January 2026'
  shortMonth: string; // 'Jan'
  year: number;
  grossRevenue: number;
  commissionAmount: number;
  propertiesCount: number;
  invoicesCount: number;
  growthPct: number | null;
  status: 'RECORDED' | 'LIVE_CURRENT' | 'PROJECTED' | 'NO_DATA';
  isCurrentMonth: boolean;
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const adminClient = createAdminClient();
    const db = adminClient || supabase;

    const {
      data: { user },
      error: authErr,
    } = await supabase.auth.getUser();

    if (authErr || !user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonthIdx = now.getMonth(); // 0-11
    const yearParam = searchParams.get('year');
    const selectedYear = yearParam ? parseInt(yearParam, 10) : currentYear;

    // Strict Tenant Lookup for logged in Partner
    let partner: any = null;
    const { data: byUserId } = await db.from('partners').select('*').eq('user_id', user.id).maybeSingle();
    if (byUserId) {
      partner = byUserId;
    } else {
      const userEmail = (user.email || '').trim().toLowerCase();
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

    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    const shortMonthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    // If partner not linked or 0 properties, return empty tenant dataset
    if (!partner) {
      const emptyMonths: PartnerMonthlyDataPoint[] = monthNames.map((name, m) => ({
        monthKey: `${selectedYear}-${String(m + 1).padStart(2, '0')}`,
        monthIndex: m,
        monthName: `${name} ${selectedYear}`,
        shortMonth: shortMonthNames[m],
        year: selectedYear,
        grossRevenue: 0,
        commissionAmount: 0,
        propertiesCount: 0,
        invoicesCount: 0,
        growthPct: 0,
        status: 'NO_DATA',
        isCurrentMonth: selectedYear === currentYear && m === currentMonthIdx,
      }));

      return NextResponse.json({
        success: true,
        selectedYear,
        personalMonthlyRunRate: 0,
        personalMonthlyGrossRate: 0,
        totalYearCommission: 0,
        totalYearGross: 0,
        currentMonthKey: `${currentYear}-${String(currentMonthIdx + 1).padStart(2, '0')}`,
        monthlyData: emptyMonths,
      });
    }

    // 1. Fetch STRICTLY this partner's invoices
    const { data: invoicesData } = await db
      .from('partner_invoices')
      .select('id, invoice_number, period_start, period_end, total_properties, gross_revenue, commission_amount, status, created_at')
      .eq('partner_id', partner.id)
      .order('period_start', { ascending: true });

    const partnerInvoices = invoicesData || [];

    // 2. Fetch STRICTLY this partner's assigned properties
    const { data: assignedProps } = await db
      .from('properties')
      .select('id, name, monthly_price, partner_id, partner_commission_override, status')
      .eq('partner_id', partner.id);

    const properties = assignedProps || [];

    // Calculate current live monthly baseline for THIS partner
    const defaultRate = Number(partner.default_commission_rate || 10);
    let currentLiveGross = 0;
    let currentLiveCommission = 0;

    properties.forEach((prop: any) => {
      const rate =
        prop.partner_commission_override !== null && prop.partner_commission_override !== undefined && prop.partner_commission_override !== ''
          ? Number(prop.partner_commission_override)
          : defaultRate;

      const price = Number(prop.monthly_price || 0);
      currentLiveGross += price;
      currentLiveCommission += price * (rate / 100);
    });

    // 3. Build 12 months data for this partner
    const monthlyData: PartnerMonthlyDataPoint[] = [];

    for (let m = 0; m < 12; m++) {
      const monthNumStr = String(m + 1).padStart(2, '0');
      const monthKey = `${selectedYear}-${monthNumStr}`;
      const periodStartPrefix = `${selectedYear}-${monthNumStr}`;
      const isCurrentMonth = selectedYear === currentYear && m === currentMonthIdx;
      const isFutureMonth = selectedYear > currentYear || (selectedYear === currentYear && m > currentMonthIdx);

      // Find invoices for this specific month
      const matchingInvoices = partnerInvoices.filter((inv: any) => {
        if (!inv.period_start) return false;
        return inv.period_start.startsWith(periodStartPrefix);
      });

      let grossRevenue = 0;
      let commissionAmount = 0;
      let propertiesCount = 0;

      if (matchingInvoices.length > 0) {
        matchingInvoices.forEach((inv: any) => {
          grossRevenue += Number(inv.gross_revenue || 0);
          commissionAmount += Number(inv.commission_amount || 0);
          propertiesCount = Math.max(propertiesCount, Number(inv.total_properties || 0));
        });
      } else if (isCurrentMonth) {
        grossRevenue = currentLiveGross;
        commissionAmount = currentLiveCommission;
        propertiesCount = properties.length;
      }

      let status: PartnerMonthlyDataPoint['status'] = 'NO_DATA';
      if (matchingInvoices.length > 0) {
        status = 'RECORDED';
      } else if (isCurrentMonth && properties.length > 0) {
        status = 'LIVE_CURRENT';
      } else if (isFutureMonth) {
        status = 'PROJECTED';
      }

      monthlyData.push({
        monthKey,
        monthIndex: m,
        monthName: `${monthNames[m]} ${selectedYear}`,
        shortMonth: shortMonthNames[m],
        year: selectedYear,
        grossRevenue: Math.round(grossRevenue * 100) / 100,
        commissionAmount: Math.round(commissionAmount * 100) / 100,
        propertiesCount,
        invoicesCount: matchingInvoices.length,
        growthPct: null,
        status,
        isCurrentMonth,
      });
    }

    // 4. Calculate month-over-month growth %
    for (let i = 0; i < monthlyData.length; i++) {
      if (i > 0) {
        const prev = monthlyData[i - 1].commissionAmount;
        const curr = monthlyData[i].commissionAmount;
        if (prev > 0) {
          monthlyData[i].growthPct = Math.round(((curr - prev) / prev) * 1000) / 10;
        } else if (curr > 0) {
          monthlyData[i].growthPct = 100.0;
        } else {
          monthlyData[i].growthPct = 0.0;
        }
      } else {
        monthlyData[i].growthPct = 0.0;
      }
    }

    const totalYearGross = monthlyData.reduce((sum, d) => sum + d.grossRevenue, 0);
    const totalYearCommission = monthlyData.reduce((sum, d) => sum + d.commissionAmount, 0);

    return NextResponse.json({
      success: true,
      selectedYear,
      partner: {
        id: partner.id,
        name: partner.name,
        email: partner.email,
        default_commission_rate: defaultRate,
      },
      personalMonthlyRunRate: Math.round(currentLiveCommission * 100) / 100,
      personalMonthlyGrossRate: Math.round(currentLiveGross * 100) / 100,
      totalYearGross: Math.round(totalYearGross * 100) / 100,
      totalYearCommission: Math.round(totalYearCommission * 100) / 100,
      currentMonthKey: `${currentYear}-${String(currentMonthIdx + 1).padStart(2, '0')}`,
      monthlyData,
    });
  } catch (err: any) {
    console.error('Partner monthly analytics error:', err);
    return NextResponse.json({ success: false, error: err.message || 'Internal server error' }, { status: 500 });
  }
}
