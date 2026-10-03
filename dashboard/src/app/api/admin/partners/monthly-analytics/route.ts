import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export interface MonthlyDataPoint {
  monthKey: string; // '2026-01'
  monthIndex: number; // 0-11
  monthName: string; // 'January 2026'
  shortMonth: string; // 'Jan'
  year: number;
  grossRevenue: number;
  commissionAmount: number;
  propertiesCount: number;
  partnersCount: number;
  invoicesCount: number;
  growthPct: number | null; // % change vs previous month
  status: 'RECORDED' | 'LIVE_CURRENT' | 'PROJECTED' | 'NO_DATA';
  isCurrentMonth: boolean;
}

export async function GET(request: NextRequest) {
  try {
    const supabase = createAdminClient() || (await createClient());
    const { searchParams } = new URL(request.url);

    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonthIdx = now.getMonth(); // 0-11
    const yearParam = searchParams.get('year');
    const selectedYear = yearParam ? parseInt(yearParam, 10) : currentYear;

    // 1. Fetch all partner invoices
    const { data: invoicesData, error: invErr } = await supabase
      .from('partner_invoices')
      .select('id, partner_id, invoice_number, period_start, period_end, total_properties, gross_revenue, commission_amount, status, created_at')
      .order('period_start', { ascending: true });

    if (invErr) {
      console.error('[Monthly Analytics API] Invoices query error:', invErr);
    }
    const allInvoices = invoicesData || [];

    // 2. Fetch all partners & assigned properties for current run-rate calculations
    const [{ data: partnersData }, { data: propertiesData }] = await Promise.all([
      supabase.from('partners').select('id, name, default_commission_rate, status'),
      supabase.from('properties').select('id, name, monthly_price, partner_id, partner_commission_override, status'),
    ]);

    const partners = partnersData || [];
    const properties = propertiesData || [];

    // Calculate current live monthly run rate
    let currentLiveGross = 0;
    let currentLiveCommission = 0;
    let currentActiveAssignedPropsCount = 0;
    const activePartnerIds = new Set(partners.filter((p: any) => p.status === 'ACTIVE').map((p: any) => p.id));

    properties.forEach((prop: any) => {
      if (prop.partner_id && activePartnerIds.has(prop.partner_id)) {
        const partner = partners.find((p: any) => p.id === prop.partner_id);
        const rate =
          prop.partner_commission_override !== null && prop.partner_commission_override !== undefined
            ? Number(prop.partner_commission_override)
            : Number(partner?.default_commission_rate || 10);

        const price = Number(prop.monthly_price || 0);
        currentLiveGross += price;
        currentLiveCommission += price * (rate / 100);
        currentActiveAssignedPropsCount++;
      }
    });

    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    const shortMonthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    // 3. Build 12 months data for the selected year
    const monthlyData: MonthlyDataPoint[] = [];

    for (let m = 0; m < 12; m++) {
      const monthNumStr = String(m + 1).padStart(2, '0');
      const monthKey = `${selectedYear}-${monthNumStr}`;
      const periodStartPrefix = `${selectedYear}-${monthNumStr}`;
      const isCurrentMonth = selectedYear === currentYear && m === currentMonthIdx;
      const isFutureMonth = selectedYear > currentYear || (selectedYear === currentYear && m > currentMonthIdx);

      // Find invoices matching this month (period_start starts with YYYY-MM)
      const matchingInvoices = allInvoices.filter((inv: any) => {
        if (!inv.period_start) return false;
        return inv.period_start.startsWith(periodStartPrefix);
      });

      let grossRevenue = 0;
      let commissionAmount = 0;
      let propertiesCount = 0;
      const uniquePartnerIds = new Set<string>();

      if (matchingInvoices.length > 0) {
        matchingInvoices.forEach((inv: any) => {
          grossRevenue += Number(inv.gross_revenue || 0);
          commissionAmount += Number(inv.commission_amount || 0);
          propertiesCount += Number(inv.total_properties || 0);
          if (inv.partner_id) uniquePartnerIds.add(inv.partner_id);
        });
      } else if (isCurrentMonth) {
        // Live current active rate
        grossRevenue = currentLiveGross;
        commissionAmount = currentLiveCommission;
        propertiesCount = currentActiveAssignedPropsCount;
        activePartnerIds.forEach((pid) => uniquePartnerIds.add(pid));
      }

      let status: MonthlyDataPoint['status'] = 'NO_DATA';
      if (matchingInvoices.length > 0) {
        status = 'RECORDED';
      } else if (isCurrentMonth) {
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
        partnersCount: uniquePartnerIds.size,
        invoicesCount: matchingInvoices.length,
        growthPct: null, // Will calculate below
        status,
        isCurrentMonth,
      });
    }

    // 4. Calculate month-over-month growth %
    for (let i = 0; i < monthlyData.length; i++) {
      if (i > 0) {
        const prev = monthlyData[i - 1].grossRevenue;
        const curr = monthlyData[i].grossRevenue;
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

    // 5. Overall aggregated metrics
    const totalYearGross = monthlyData.reduce((sum, item) => sum + item.grossRevenue, 0);
    const totalYearCommission = monthlyData.reduce((sum, item) => sum + item.commissionAmount, 0);

    return NextResponse.json({
      success: true,
      selectedYear,
      currentMonthlyRunRate: Math.round(currentLiveGross * 100) / 100,
      currentMonthlyCommissionRate: Math.round(currentLiveCommission * 100) / 100,
      totalYearGross: Math.round(totalYearGross * 100) / 100,
      totalYearCommission: Math.round(totalYearCommission * 100) / 100,
      currentMonthKey: `${currentYear}-${String(currentMonthIdx + 1).padStart(2, '0')}`,
      monthlyData,
    });
  } catch (err: any) {
    console.error('[Monthly Analytics API] Unexpected error:', err);
    return NextResponse.json({ success: false, error: err.message || 'Internal server error' }, { status: 500 });
  }
}
