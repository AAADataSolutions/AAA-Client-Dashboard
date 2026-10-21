import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

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

    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    const monthShort = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    // -------------------------------------------------------------------------
    // HELPER: Compute complete financial payload for ANY given month key (YYYY-MM)
    // Purely based on actual database records whose creation date <= that month
    // -------------------------------------------------------------------------
    const computeMonthFinancials = (mKey: string) => {
      const [yStr, mStr] = mKey.split('-');
      const y = parseInt(yStr, 10);
      const mIdx = parseInt(mStr, 10) - 1;

      // Filter assigned properties that were CREATED on or before this month
      const assignedForMonth = enrichedProps.filter((p: any) => {
        if (!p.is_assigned) return false;
        if (propStatusParam === 'ACTIVE') {
          if (p.status !== 'ACTIVE' && p.status !== 'COMPLETED' && p.status !== 'ONBOARDED') return false;
        } else {
          if (p.status === 'ARCHIVED') return false;
        }
        // Strict real-date check: property only exists if its created_at <= this month
        const pCreatedMonth = p.created_at ? p.created_at.substring(0, 7) : '9999-99';
        return pCreatedMonth <= mKey;
      });

      let baseGmr = 0;
      let servicesGmr = 0;
      let partnerOutflow = 0;
      const partnerOutflowMap = new Map<string, { partnerId: string; partnerName: string; count: number; totalGross: number; commission: number; rate: number }>();

      // Sum base prices from properties that actually existed by this month
      assignedForMonth.forEach((p: any) => {
        const basePrice = Number(p.monthly_price || 0);
        baseGmr += basePrice;

        // Calculate services assigned to this property that actually existed by this month
        const servData = servicesByPropId.get(p.id);
        let propServicesPrice = 0;
        if (servData?.items) {
          servData.items.forEach((s: any) => {
            const sCreatedMonth = s.created_at ? s.created_at.substring(0, 7) : '9999-99';
            if (sCreatedMonth <= mKey) {
              const uPrice = Number(s.price || s.monthly_price || 0);
              propServicesPrice += uPrice;
            }
          });
        }
        servicesGmr += propServicesPrice;

        const totalPropMonthly = basePrice + propServicesPrice;

        if (p.partner_id && activePartnerIds.has(p.partner_id)) {
          const partner = partnersMap.get(p.partner_id);
          const rate =
            p.partner_commission_override !== null && p.partner_commission_override !== undefined && p.partner_commission_override !== ''
              ? Number(p.partner_commission_override)
              : Number(partner?.default_commission_rate || 10);

          const commission = totalPropMonthly * (rate / 100);
          partnerOutflow += commission;

          const pName = partner?.company_name || partner?.name || 'Partner';
          const existing = partnerOutflowMap.get(p.partner_id) || {
            partnerId: p.partner_id,
            partnerName: pName,
            count: 0,
            totalGross: 0,
            commission: 0,
            rate,
          };
          existing.count += 1;
          existing.totalGross += totalPropMonthly;
          existing.commission += commission;
          partnerOutflowMap.set(p.partner_id, existing);
        }
      });

      const gmr = baseGmr + servicesGmr;

      // Check if real partner invoices exist in database for this specific month
      const matchingInvoices = allInvoices.filter((inv: any) => inv.period_start?.startsWith(mKey));

      // Newly added revenue in this specific month
      let newPropsRev = 0;
      let newServicesRev = 0;

      const assignedPropIdsForMonth = new Set(assignedForMonth.map((p: any) => p.id));

      assignedForMonth.forEach((p: any) => {
        if (p.created_at && p.created_at.startsWith(mKey)) {
          newPropsRev += Number(p.monthly_price || 0);
        }
      });

      // Calculate newly provisioned services for properties that were assigned in this month
      allServices.forEach((s: any) => {
        if (s.created_at && s.created_at.startsWith(mKey) && s.status !== 'DISCONNECTED' && s.status !== 'INACTIVE') {
          const links = Array.isArray(s.property_links) ? s.property_links : s.property_links ? [s.property_links] : [];
          const isLinkedToAssignedProp = links.some((l: any) => {
            const pId = l?.org_property?.property_id;
            return pId && assignedPropIdsForMonth.has(pId);
          });
          if (isLinkedToAssignedProp) {
            newServicesRev += Number(s.price || s.monthly_price || 0);
          }
        }
      });

      const revenueIncrease = newPropsRev + newServicesRev;

      // Vendors & Servers active in this month
      let monthVendorsCost = 0;
      allVendors.forEach((v: any) => {
        if (v.status === 'ACTIVE') {
          const vCreatedMonth = v.created_at ? v.created_at.substring(0, 7) : '9999-99';
          if (vCreatedMonth <= mKey && gmr > 0) {
            monthVendorsCost += Number(v.monthly_cost || 0);
          }
        }
      });

      let monthServersCost = 0;
      allServers.forEach((s: any) => {
        if (s.status === 'ACTIVE') {
          const sCreatedMonth = s.created_at ? s.created_at.substring(0, 7) : '9999-99';
          if (sCreatedMonth <= mKey && gmr > 0) {
            monthServersCost += Number(s.monthly_cost || 0);
          }
        }
      });

      const totalExpenses = partnerOutflow + monthVendorsCost + monthServersCost;
      const netRetainedValue = Math.max(0, gmr - partnerOutflow);
      const netProfit = gmr > 0 ? gmr - totalExpenses : 0;
      const netMarginPct = gmr > 0 ? Math.round((netProfit / gmr) * 1000) / 10 : 0.0;
      const arr = gmr * 12;

      const colors = ['#2563eb', '#f59e0b', '#10b981', '#8b5cf6', '#ec4899', '#3b82f6'];
      const partnerBreakdown = Array.from(partnerOutflowMap.values()).map((p, idx) => {
        const pct = partnerOutflow > 0 ? Math.round((p.commission / partnerOutflow) * 1000) / 10 : 0;
        return {
          ...p,
          percentage: pct,
          color: colors[idx % colors.length],
        };
      });

      const invoiceList = matchingInvoices.map((inv: any) => {
        const p = partnersMap.get(inv.partner_id);
        return {
          id: inv.id,
          partner_name: p?.company_name || p?.name || 'Partner',
          invoice_number: inv.invoice_number,
          commission_amount: Number(inv.commission_amount || 0),
          gross_revenue: Number(inv.gross_revenue || 0),
          total_properties: inv.total_properties,
          status: inv.status,
        };
      });

      const waterfallData = [
        { label: 'GMR', value: gmr, isTotal: true, color: '#2563eb' },
        { label: 'Partner share', value: -partnerOutflow, isTotal: false, color: '#ef4444' },
        { label: 'Vendors', value: -monthVendorsCost, isTotal: false, color: '#f97316' },
        { label: 'Servers', value: -monthServersCost, isTotal: false, color: '#f59e0b' },
        { label: 'Net profit', value: netProfit, isTotal: true, color: netProfit >= 0 ? '#10b981' : '#ef4444' },
      ];

      // Previous month calculation for bridge and Net Revenue Added This Month
      const prevMonthIdx = mIdx === 0 ? 11 : mIdx - 1;
      const prevYear = mIdx === 0 ? y - 1 : y;
      const prevMKey = `${prevYear}-${String(prevMonthIdx + 1).padStart(2, '0')}`;

      // Calculate exact previous month GMR based on properties & services active on/before prevMKey
      const assignedForPrevMonth = enrichedProps.filter((p: any) => {
        if (!p.is_assigned) return false;
        if (propStatusParam === 'ACTIVE') {
          if (p.status !== 'ACTIVE' && p.status !== 'COMPLETED' && p.status !== 'ONBOARDED') return false;
        } else {
          if (p.status === 'ARCHIVED') return false;
        }
        const pCreatedMonth = p.created_at ? p.created_at.substring(0, 7) : '9999-99';
        return pCreatedMonth <= prevMKey;
      });

      let prevBaseGmr = 0;
      let prevServicesGmr = 0;
      assignedForPrevMonth.forEach((p: any) => {
        prevBaseGmr += Number(p.monthly_price || 0);
        const servData = servicesByPropId.get(p.id);
        if (servData?.items) {
          servData.items.forEach((s: any) => {
            const sCreatedMonth = s.created_at ? s.created_at.substring(0, 7) : '9999-99';
            if (sCreatedMonth <= prevMKey) {
              prevServicesGmr += Number(s.price || s.monthly_price || 0);
            }
          });
        }
      });
      const exactPrevGmr = Math.round((prevBaseGmr + prevServicesGmr) * 100) / 100;
      const revenueAddedThisMonth = Math.round((gmr - exactPrevGmr) * 100) / 100;
      const revenueAddedGrowthPct = exactPrevGmr > 0
        ? Math.round(((gmr - exactPrevGmr) / exactPrevGmr) * 1000) / 10
        : (gmr > 0 ? 100 : 0);

      const revenueBridgeData = [
        { label: `${monthShort[prevMonthIdx]} GMR`, value: exactPrevGmr, isTotal: true, color: '#2563eb' },
        { label: 'New listings', value: newPropsRev, isTotal: false, color: '#10b981' },
        { label: 'Service add-ons', value: newServicesRev, isTotal: false, color: '#10b981' },
        { label: `${monthShort[mIdx]} GMR`, value: gmr, isTotal: true, color: '#2563eb' },
      ];

      return {
        monthKey: mKey,
        monthName: `${monthNames[mIdx]} ${y}`,
        shortMonth: monthShort[mIdx],
        year: y,
        monthIndex: mIdx,
        grossMonthlyRevenue: Math.round(gmr * 100) / 100,
        basePropertyRevenue: Math.round(baseGmr * 100) / 100,
        servicesRevenue: Math.round(servicesGmr * 100) / 100,
        revenueIncreaseMonthly: Math.round(revenueIncrease * 100) / 100,
        revenueAddedThisMonth,
        revenueAddedGrowthPct,
        previousMonthGmr: exactPrevGmr,
        previousMonthName: `${monthNames[prevMonthIdx]} ${prevYear}`,
        previousMonthShort: monthShort[prevMonthIdx],
        partnerCommissionOutflow: Math.round(partnerOutflow * 100) / 100,
        partnerOutflowPctOfGMR: gmr > 0 ? Math.round((partnerOutflow / gmr) * 1000) / 10 : 0.0,
        netRetainedValue: Math.round(netRetainedValue * 100) / 100,
        netRetainedPct: gmr > 0 ? Math.round((netRetainedValue / gmr) * 1000) / 10 : 0.0,
        totalOperatingExpenses: Math.round(totalExpenses * 100) / 100,
        vendorExpenses: Math.round(monthVendorsCost * 100) / 100,
        serverExpenses: Math.round(monthServersCost * 100) / 100,
        netProfit: Math.round(netProfit * 100) / 100,
        netProfitMarginPct: netMarginPct,
        annualizedRunRate: Math.round(arr * 100) / 100,
        activePropertiesCount: assignedForMonth.length,
        activePartnersCount: partnerBreakdown.length,
        waterfallData,
        revenueBridgeData,
        partnerBreakdown,
        invoiceList,
      };
    };

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

    return NextResponse.json({
      success: true,
      selectedMonthKey: monthKeyParam,
      selectedYear: yearParam,
      defaultMonthData,
      monthlyDataMap,
      availableMonths,
      monthlySeries,
      lastYearSeries,
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
