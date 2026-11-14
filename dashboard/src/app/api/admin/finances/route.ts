import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { buildRevenueStreamsData } from './_helpers/revenue-streams-builder';
import { createFinancesEngine, monthNames, monthShort } from './_helpers/finances-calculator';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const adminClient = createAdminClient();
    const db = adminClient || supabase;

    const { searchParams } = new URL(request.url);

    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonthNum = String(now.getMonth() + 1).padStart(2, '0');
    const defaultMonthKey = `${currentYear}-${currentMonthNum}`;

    const monthKeyParam = searchParams.get('month') || defaultMonthKey; // 'YYYY-MM'
    const propStatusParam = searchParams.get('status') || 'ACTIVE'; // 'ACTIVE' | 'ALL'
    const yearParam = searchParams.get('year') ? parseInt(searchParams.get('year')!, 10) : currentYear;

    // 1. Fetch all core data in parallel using real DB tables and relationships
    const [
      propsRes,
      orgPropsRes,
      servicesRes,
      partnersRes,
      vendorsRes,
      vendorDevicesRes,
      serversRes,
      invoicesRes,
    ] = await Promise.all([
      // All properties
      db.from('properties').select('*').order('created_at', { ascending: false }),

      // Organization Properties (Junction associating property to tenant organization)
      db.from('organization_properties').select(`
        id,
        organization_id,
        property_id,
        status,
        organization:organizations(id, name, status)
      `),

      // Provisioned services with property links
      db.from('services').select(`
        id,
        service_type_id,
        phone_number,
        status,
        description,
        price,
        monthly_price,
        created_at,
        property_links:organization_property_services(
          id,
          org_property:organization_properties(
            id,
            property_id,
            organization_id,
            property:properties(id, name, monthly_price)
          )
        )
      `),

      // Partners
      db.from('partners').select('*').order('created_at', { ascending: false }),

      // Vendors
      db.from('vendors').select('*').order('created_at', { ascending: false }),

      // Vendor Devices
      db.from('vendor_devices').select('*').order('created_at', { ascending: false }),

      // Servers
      db.from('servers').select('*').order('created_at', { ascending: false }),

      // Partner Invoices
      db.from('partner_invoices').select('*').order('period_start', { ascending: false }),
    ]);

    // Fetch Data Circuits and Monthly Revenues (gracefully handle if tables not created yet)
    let allDataCircuits: any[] = [];
    let allDataCircuitRevs: any[] = [];
    try {
      const [dcRes, dcRevRes] = await Promise.all([
        db.from('data_circuits').select('*'),
        db.from('data_circuit_monthly_revenues').select('*'),
      ]);
      allDataCircuits = dcRes.data || [];
      allDataCircuitRevs = dcRevRes.data || [];
    } catch {
      allDataCircuits = [];
      allDataCircuitRevs = [];
    }

    const allProps = propsRes.data || [];
    const orgProps = orgPropsRes.data || [];
    const allServices = servicesRes.data || [];
    const allPartners = partnersRes.data || [];
    const rawVendors = vendorsRes.data || [];
    const allVendorDevices = vendorDevicesRes.data || [];
    const allServers = serversRes.data || [];
    const allInvoices = invoicesRes.data || [];

    // Map vendor devices by vendor_id to accurately sum device costs
    const devicesByVendorId = new Map<string, number>();
    allVendorDevices.forEach((d: any) => {
      if (d.vendor_id) {
        const current = devicesByVendorId.get(d.vendor_id) || 0;
        devicesByVendorId.set(d.vendor_id, current + Number(d.cost || 0));
      }
    });

    // Ensure vendor cost reflects devices total if devices exist, else fallback to monthly_cost
    const allVendors = rawVendors.map((v: any) => {
      const hasDevs = devicesByVendorId.has(v.id);
      const effectiveCost = hasDevs ? (devicesByVendorId.get(v.id) || 0) : Number(v.monthly_cost || 0);
      return {
        ...v,
        monthly_cost: effectiveCost,
      };
    });

    // Map organization assignment to properties
    const assignedPropertyMap = new Map<string, { orgId: string; orgName: string; orgStatus: string }>();
    orgProps.forEach((op: any) => {
      if (op.property_id) {
        const org = Array.isArray(op.organization) ? op.organization[0] : op.organization;
        assignedPropertyMap.set(op.property_id, {
          orgId: op.organization_id,
          orgName: org?.name || 'Assigned Organization',
          orgStatus: org?.status || 'ACTIVE',
        });
      }
    });

    // Map active services to properties and sum their service monthly prices
    const servicesByPropId = new Map<string, { totalServicePrice: number; count: number; items: any[] }>();

    allServices.forEach((s: any) => {
      const links = Array.isArray(s.property_links) ? s.property_links : s.property_links ? [s.property_links] : [];
      const unitPrice = Number(s.price || s.monthly_price || 0);

      links.forEach((link: any) => {
        const orgProp = link?.org_property;
        const pId = orgProp?.property_id;
        if (pId && s.status !== 'DISCONNECTED' && s.status !== 'INACTIVE') {
          const current = servicesByPropId.get(pId) || { totalServicePrice: 0, count: 0, items: [] };
          current.totalServicePrice += unitPrice;
          current.count += 1;
          current.items.push(s);
          servicesByPropId.set(pId, current);
        }
      });
    });

    const activePartnerIds = new Set(allPartners.filter((p: any) => p.status === 'ACTIVE').map((p: any) => p.id));
    const partnersMap = new Map<string, any>(allPartners.map((p: any) => [p.id, p]));

    // Build enriched properties list
    const enrichedProps = allProps.map((prop: any) => {
      const orgAssignment = assignedPropertyMap.get(prop.id);
      const servData = servicesByPropId.get(prop.id) || { totalServicePrice: 0, count: 0, items: [] };
      const basePrice = Number(prop.monthly_price || 0);
      const servPrice = servData.totalServicePrice;
      const totalGMR = basePrice + servPrice;

      return {
        ...prop,
        base_monthly_price: basePrice,
        services_monthly_price: servPrice,
        total_monthly_gmr: totalGMR,
        services_count: servData.count,
        organization_name: orgAssignment?.orgName || 'Unassigned',
        organization_id: orgAssignment?.orgId || null,
        is_assigned: Boolean(orgAssignment),
      };
    });

    const activeVendorsPaid = allVendors
      .filter((v: any) => v.status === 'ACTIVE')
      .reduce((sum: number, v: any) => sum + Number(v.monthly_cost || 0), 0);

    const activeServersCost = allServers
      .filter((s: any) => s.status === 'ACTIVE')
      .reduce((sum: number, s: any) => sum + Number(s.monthly_cost || 0), 0);

    // -------------------------------------------------------------------------
    // Compute complete financial payload for ANY given month key (YYYY-MM)
    // -------------------------------------------------------------------------
    const computeMonthFinancials = createFinancesEngine({
      enrichedProps,
      servicesByPropId,
      activePartnerIds,
      partnersMap,
      allVendors,
      allServers,
      allInvoices,
      allDataCircuitRevs,
      allServices,
      propStatusParam,
    });

    // -------------------------------------------------------------------------
    // Build Available Months Array (Current year 12 months + previous year)
    // -------------------------------------------------------------------------
    const availableMonths: { key: string; label: string; year: number }[] = [];
    const monthlyDataMap: Record<string, any> = {};

    for (let y = currentYear; y >= currentYear - 1; y--) {
      for (let m = 11; m >= 0; m--) {
        const mKey = `${y}-${String(m + 1).padStart(2, '0')}`;
        availableMonths.push({
          key: mKey,
          label: `${monthNames[m]} ${y}`,
          year: y,
        });
        monthlyDataMap[mKey] = computeMonthFinancials(mKey);
      }
    }

    // -------------------------------------------------------------------------
    // 12-Month Series for Target Year (for Line Chart, Bar Chart & Cumulative Area)
    // -------------------------------------------------------------------------
    const monthlySeries = [];
    const lastYearSeries = [];
    let runningGrossCumulative = 0;

    for (let m = 0; m < 12; m++) {
      const mKey = `${yearParam}-${String(m + 1).padStart(2, '0')}`;
      const mData = monthlyDataMap[mKey] || computeMonthFinancials(mKey);

      runningGrossCumulative += mData.grossMonthlyRevenue;

      monthlySeries.push({
        monthKey: mKey,
        monthLabel: monthShort[m],
        monthName: `${monthNames[m]} ${yearParam}`,
        monthIndex: m,
        grossRevenue: mData.grossMonthlyRevenue,
        partnerOutflow: mData.partnerCommissionOutflow,
        netRetainedValue: mData.netRetainedValue,
        totalExpenses: mData.totalOperatingExpenses,
        netProfit: mData.netProfit,
        cumulativeGross: Math.round(runningGrossCumulative * 100) / 100,
        isCurrent: mKey === defaultMonthKey,
      });

      const lyKey = `${yearParam - 1}-${String(m + 1).padStart(2, '0')}`;
      const lyData = monthlyDataMap[lyKey] || computeMonthFinancials(lyKey);

      lastYearSeries.push({
        monthKey: lyKey,
        monthLabel: monthShort[m],
        monthName: `${monthNames[m]} ${yearParam - 1}`,
        grossRevenue: lyData.grossMonthlyRevenue,
      });
    }

    // Unassigned Properties list
    const unassignedPropsList = enrichedProps.filter((p: any) => !p.is_assigned || p.status === 'UNASSIGNED');
    const unassignedLostRevenue = unassignedPropsList.reduce((sum: number, p: any) => sum + Number(p.monthly_price || 0), 0);

    const defaultMonthData = monthlyDataMap[monthKeyParam] || computeMonthFinancials(monthKeyParam);

    const propMap = new Map<string, any>(allProps.map((p: any) => [p.id, p]));
    const revenueStreams = buildRevenueStreamsData({
      monthKey: monthKeyParam,
      assignedForMonth: defaultMonthData.assignedPropertiesList || [],
      servicesByPropId,
      allDataCircuits,
      allDataCircuitRevs,
      propMap,
      monthlyDataMap,
      availableMonths,
    });

    return NextResponse.json({
      success: true,
      selectedMonthKey: monthKeyParam,
      selectedYear: yearParam,
      defaultMonthData,
      monthlyDataMap,
      availableMonths,
      monthlySeries,
      lastYearSeries,
      revenueStreams,
      metrics: {
        ...defaultMonthData,
        unassignedPropertiesCount: unassignedPropsList.length,
        unassignedLostRevenue: Math.round(unassignedLostRevenue * 100) / 100,
        lifetimeGrossRevenue: Math.round(runningGrossCumulative * 100) / 100,
      },
      unassignedProperties: unassignedPropsList.map((p: any) => ({
        id: p.id,
        name: p.name,
        city: p.city,
        state: p.state,
        monthly_price: Number(p.monthly_price || 0),
        status: p.status,
      })),
    });
  } catch (err: any) {
    console.error('[Finances API] Error:', err);
    return NextResponse.json({ success: false, error: err.message || 'Internal server error' }, { status: 500 });
  }
}
