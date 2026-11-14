export const monthNames = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

export const monthShort = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

interface EngineParams {
  enrichedProps: any[];
  servicesByPropId: Map<string, { totalServicePrice: number; count: number; items: any[] }>;
  activePartnerIds: Set<string>;
  partnersMap: Map<string, any>;
  allVendors: any[];
  allServers: any[];
  allInvoices: any[];
  allDataCircuitRevs: any[];
  allServices: any[];
  propStatusParam: string;
}

export function createFinancesEngine(params: EngineParams) {
  const {
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
  } = params;

  return function computeMonthFinancials(mKey: string) {
    const [yStr, mStr] = mKey.split('-');
    const y = parseInt(yStr, 10);
    const mIdx = parseInt(mStr, 10) - 1;

    // Filter assigned properties created on or before this month
    const assignedForMonth = enrichedProps.filter((p: any) => {
      if (!p.is_assigned) return false;
      if (propStatusParam === 'ACTIVE') {
        if (p.status !== 'ACTIVE' && p.status !== 'COMPLETED' && p.status !== 'ONBOARDED') return false;
      } else {
        if (p.status === 'ARCHIVED') return false;
      }
      const propEffectiveDate = p.onboarding_date || p.created_at;
      const propEffectiveMonth = propEffectiveDate ? String(propEffectiveDate).substring(0, 7) : '9999-99';
      return propEffectiveMonth <= mKey;
    });

    let baseGmr = 0;
    let servicesGmr = 0;
    let partnerOutflow = 0;
    const partnerOutflowMap = new Map<string, { partnerId: string; partnerName: string; count: number; totalGross: number; commission: number; rate: number }>();

    assignedForMonth.forEach((p: any) => {
      const basePrice = Number(p.monthly_price || 0);
      baseGmr += basePrice;

      const servData = servicesByPropId.get(p.id);
      let propServicesPrice = 0;
      if (servData?.items) {
        servData.items.forEach((s: any) => {
          const sCreatedMonth = s.created_at ? s.created_at.substring(0, 7) : '9999-99';
          if (sCreatedMonth <= mKey) {
            propServicesPrice += Number(s.price || s.monthly_price || 0);
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

    // Sum Data Circuit Revenue Share where revenue_received = true
    const dcRevsForMonth = allDataCircuitRevs.filter((r: any) => r.month_key === mKey && r.revenue_received);
    const dataCircuitRevShare = dcRevsForMonth.reduce(
      (sum: number, r: any) => sum + Number(r.revenue_share_amount || 0),
      0
    );

    const gmr = baseGmr + servicesGmr + dataCircuitRevShare;

    // Invoices for this month
    const matchingInvoices = allInvoices.filter((inv: any) => inv.period_start?.startsWith(mKey));

    // Newly added revenue
    let newPropsRev = 0;
    let newServicesRev = 0;
    const assignedPropIdsForMonth = new Set(assignedForMonth.map((p: any) => p.id));

    assignedForMonth.forEach((p: any) => {
      const propEffectiveDate = p.onboarding_date || p.created_at;
      if (propEffectiveDate && String(propEffectiveDate).startsWith(mKey)) {
        newPropsRev += Number(p.monthly_price || 0);
      }
    });

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

    const revenueIncrease = newPropsRev + newServicesRev + dataCircuitRevShare;

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

    // Previous month calculation
    const prevMonthIdx = mIdx === 0 ? 11 : mIdx - 1;
    const prevYear = mIdx === 0 ? y - 1 : y;
    const prevMKey = `${prevYear}-${String(prevMonthIdx + 1).padStart(2, '0')}`;

    const assignedForPrevMonth = enrichedProps.filter((p: any) => {
      if (!p.is_assigned) return false;
      if (propStatusParam === 'ACTIVE') {
        if (p.status !== 'ACTIVE' && p.status !== 'COMPLETED' && p.status !== 'ONBOARDED') return false;
      } else {
        if (p.status === 'ARCHIVED') return false;
      }
      const propEffectiveDate = p.onboarding_date || p.created_at;
      const propEffectiveMonth = propEffectiveDate ? String(propEffectiveDate).substring(0, 7) : '9999-99';
      return propEffectiveMonth <= prevMKey;
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

    const prevDcRevs = allDataCircuitRevs
      .filter((r: any) => r.month_key === prevMKey && r.revenue_received)
      .reduce((sum: number, r: any) => sum + Number(r.revenue_share_amount || 0), 0);

    const voiceGmr = Math.round((baseGmr + servicesGmr) * 100) / 100;
    const prevVoiceGmr = Math.round((prevBaseGmr + prevServicesGmr) * 100) / 100;
    const voiceRevenueAddedThisMonth = Math.round((voiceGmr - prevVoiceGmr) * 100) / 100;
    const voiceRevenueGrowthPct = prevVoiceGmr > 0
      ? Math.round(((voiceGmr - prevVoiceGmr) / prevVoiceGmr) * 1000) / 10
      : (voiceGmr > 0 ? 100 : 0);

    const internetGmr = Math.round(dataCircuitRevShare * 100) / 100;
    const prevInternetGmr = Math.round(prevDcRevs * 100) / 100;
    const internetRevenueAddedThisMonth = Math.round((internetGmr - prevInternetGmr) * 100) / 100;
    const internetRevenueGrowthPct = prevInternetGmr > 0
      ? Math.round(((internetGmr - prevInternetGmr) / prevInternetGmr) * 1000) / 10
      : (internetGmr > 0 ? 100 : 0);

    const exactPrevGmr = Math.round((prevBaseGmr + prevServicesGmr + prevDcRevs) * 100) / 100;
    const revenueAddedThisMonth = Math.round((gmr - exactPrevGmr) * 100) / 100;
    const revenueAddedGrowthPct = exactPrevGmr > 0
      ? Math.round(((gmr - exactPrevGmr) / exactPrevGmr) * 1000) / 10
      : (gmr > 0 ? 100 : 0);

    const revenueBridgeData = [
      { label: `${monthShort[prevMonthIdx]} GMR`, value: exactPrevGmr, isTotal: true, color: '#2563eb' },
      { label: 'New listings', value: newPropsRev, isTotal: false, color: '#10b981' },
      { label: 'Service add-ons', value: newServicesRev, isTotal: false, color: '#10b981' },
      ...(dataCircuitRevShare > 0
        ? [{ label: 'Data Circuit share', value: dataCircuitRevShare, isTotal: false, color: '#06b6d4' }]
        : []),
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
      dataCircuitRevenueShare: Math.round(dataCircuitRevShare * 100) / 100,
      dataCircuitReceivedCount: dcRevsForMonth.length,
      revenueIncreaseMonthly: Math.round(revenueIncrease * 100) / 100,
      revenueAddedThisMonth,
      revenueAddedGrowthPct,
      voiceGmr,
      prevVoiceGmr,
      voiceRevenueAddedThisMonth,
      voiceRevenueGrowthPct,
      internetGmr,
      prevInternetGmr,
      internetRevenueAddedThisMonth,
      internetRevenueGrowthPct,
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
      assignedPropertiesList: assignedForMonth,
    };
  };
}

