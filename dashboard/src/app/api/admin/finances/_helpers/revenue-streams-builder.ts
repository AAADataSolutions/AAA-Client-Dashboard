export interface RevenueStreamsItem {
  id: string;
  propertyName: string;
  organizationName: string;
  address?: string;
  monthlyPrice: number;
  servicesPrice: number;
  totalMonthly: number;
  servicesCount: number;
  billingStatus: 'BILLING_DONE' | 'BILLING_PENDING';
  onboardingDate?: string;
}

export interface DataCircuitRevenueItem {
  id: string;
  propertyName: string;
  propertyAddress?: string;
  wholesalerName: string;
  carrierName: string;
  bandwidth?: string;
  clientMonthlyPrice: number;
  revenueSharePercentage: number;
  monthlyCommission: number;
  isReceived: boolean;
  status: string;
}

export interface RevenueStreamsPayload {
  monthKey: string;
  portingRevenue: {
    totalPortingMrr: number;
    basePropertiesGmr: number;
    servicesGmr: number;
    propertiesCount: number;
    servicesCount: number;
    billingDoneCount: number;
    billingPendingCount: number;
    items: RevenueStreamsItem[];
  };
  dataCircuitRevenue: {
    totalExpectedRevShare: number;
    receivedRevShare: number;
    pendingRevShare: number;
    circuitsCount: number;
    receivedCount: number;
    pendingCount: number;
    wholesalerBreakdown: Array<{
      wholesalerName: string;
      expectedAmount: number;
      receivedAmount: number;
      circuitsCount: number;
    }>;
    carrierBreakdown: Array<{
      carrierName: string;
      commissionAmount: number;
      circuitsCount: number;
    }>;
    items: DataCircuitRevenueItem[];
  };
  summary: {
    totalCombinedInflow: number;
    portingPercentage: number;
    circuitPercentage: number;
    annualizedInflow: number;
  };
  historicalTrends: Array<{
    monthKey: string;
    monthLabel: string;
    portingRevenue: number;
    circuitRevenue: number;
    totalRevenue: number;
  }>;
}

export function buildRevenueStreamsData({
  monthKey,
  assignedForMonth,
  servicesByPropId,
  allDataCircuits,
  allDataCircuitRevs,
  propMap,
  monthlyDataMap,
  availableMonths,
}: {
  monthKey: string;
  assignedForMonth: any[];
  servicesByPropId: Map<string, { totalServicePrice: number; count: number; items: any[] }>;
  allDataCircuits: any[];
  allDataCircuitRevs: any[];
  propMap: Map<string, any>;
  monthlyDataMap: Record<string, any>;
  availableMonths: Array<{ key: string; label: string; year: number }>;
}): RevenueStreamsPayload {
  // 1. Build Porting & Voice Items
  let basePropertiesGmr = 0;
  let servicesGmr = 0;
  let totalServicesCount = 0;
  let billingDoneCount = 0;
  let billingPendingCount = 0;

  const portingItems: RevenueStreamsItem[] = assignedForMonth.map((p: any) => {
    const basePrice = Number(p.monthly_price || 0);
    const servData = servicesByPropId.get(p.id) || { totalServicePrice: 0, count: 0, items: [] };
    const servPrice = servData.totalServicePrice;
    const totalMonthly = basePrice + servPrice;

    basePropertiesGmr += basePrice;
    servicesGmr += servPrice;
    totalServicesCount += servData.count;

    const bStatus = p.billing_status === 'BILLING_DONE' ? 'BILLING_DONE' : 'BILLING_PENDING';
    if (bStatus === 'BILLING_DONE') billingDoneCount++;
    else billingPendingCount++;

    return {
      id: p.id,
      propertyName: p.name,
      organizationName: p.organization_name || 'Assigned Organization',
      address: p.address || `${p.city || ''}, ${p.state || ''}`.trim(),
      monthlyPrice: Math.round(basePrice * 100) / 100,
      servicesPrice: Math.round(servPrice * 100) / 100,
      totalMonthly: Math.round(totalMonthly * 100) / 100,
      servicesCount: servData.count,
      billingStatus: bStatus,
      onboardingDate: p.onboarding_date || p.created_at || undefined,
    };
  });

  const totalPortingMrr = Math.round((basePropertiesGmr + servicesGmr) * 100) / 100;

  // 2. Build Data Circuit Items & Vendor Aggregates
  const monthDcRevs = (allDataCircuitRevs || []).filter((r: any) => r.month_key === monthKey);
  const dcRevMap = new Map<string, any>(monthDcRevs.map((r: any) => [r.data_circuit_id, r]));

  let totalExpectedRevShare = 0;
  let receivedRevShare = 0;
  let receivedCount = 0;
  let pendingCount = 0;

  const wholesalerMap = new Map<string, { expected: number; received: number; count: number }>();
  const carrierMap = new Map<string, { commission: number; count: number }>();

  const circuitItems: DataCircuitRevenueItem[] = (allDataCircuits || [])
    .filter((c: any) => c.status !== 'CANCELLED')
    .map((c: any) => {
      const p = propMap.get(c.property_id);
      const revRecord = dcRevMap.get(c.id);
      const isReceived = Boolean(revRecord?.revenue_received);
      const commission = Math.round(Number(c.monthly_revenue_share_amount || 0) * 100) / 100;
      const clientPrice = Math.round(Number(c.circuit_monthly_price || 0) * 100) / 100;
      const wName = c.wholesaler_name?.trim() || 'Wholesaler Pending';
      const cName = c.carrier_name?.trim() || 'Carrier Pending';

      totalExpectedRevShare += commission;
      if (isReceived) {
        receivedRevShare += commission;
        receivedCount++;
      } else {
        pendingCount++;
      }

      // Aggregate by Wholesaler
      const wAgg = wholesalerMap.get(wName) || { expected: 0, received: 0, count: 0 };
      wAgg.expected += commission;
      if (isReceived) wAgg.received += commission;
      wAgg.count++;
      wholesalerMap.set(wName, wAgg);

      // Aggregate by Carrier
      const cAgg = carrierMap.get(cName) || { commission: 0, count: 0 };
      cAgg.commission += commission;
      cAgg.count++;
      carrierMap.set(cName, cAgg);

      return {
        id: c.id,
        propertyName: p?.name || c.property_name || 'Property',
        propertyAddress: p?.address || c.property_address || '',
        wholesalerName: wName,
        carrierName: cName,
        bandwidth: c.bandwidth || '1 Gig',
        clientMonthlyPrice: clientPrice,
        revenueSharePercentage: Number(c.revenue_share_percentage || 0),
        monthlyCommission: commission,
        isReceived,
        status: c.status,
      };
    });

  const pendingRevShare = Math.round(Math.max(0, totalExpectedRevShare - receivedRevShare) * 100) / 100;
  totalExpectedRevShare = Math.round(totalExpectedRevShare * 100) / 100;
  receivedRevShare = Math.round(receivedRevShare * 100) / 100;

  const wholesalerBreakdown = Array.from(wholesalerMap.entries()).map(([wholesalerName, agg]) => ({
    wholesalerName,
    expectedAmount: Math.round(agg.expected * 100) / 100,
    receivedAmount: Math.round(agg.received * 100) / 100,
    circuitsCount: agg.count,
  }));

  const carrierBreakdown = Array.from(carrierMap.entries()).map(([carrierName, agg]) => ({
    carrierName,
    commissionAmount: Math.round(agg.commission * 100) / 100,
    circuitsCount: agg.count,
  }));

  // 3. Combined Summary
  const totalCombinedInflow = Math.round((totalPortingMrr + receivedRevShare) * 100) / 100;
  const portingPercentage = totalCombinedInflow > 0 ? Math.round((totalPortingMrr / totalCombinedInflow) * 100) : 0;
  const circuitPercentage = totalCombinedInflow > 0 ? Math.round((receivedRevShare / totalCombinedInflow) * 100) : 0;
  const annualizedInflow = Math.round(totalCombinedInflow * 12 * 100) / 100;

  // 4. Historical Trends (Recent 12 months)
  const recentMonths = (availableMonths || []).slice(0, 12).reverse();
  const historicalTrends = recentMonths.map((m) => {
    const mData = monthlyDataMap[m.key] || {};
    const portingRev = Math.round(Number((mData.baseGrossRevenue || 0) + (mData.servicesGrossRevenue || 0)) * 100) / 100;
    const circRev = Math.round(Number(mData.dataCircuitRevenueShare || 0) * 100) / 100;
    const totRev = Math.round((portingRev + circRev) * 100) / 100;
    return {
      monthKey: m.key,
      monthLabel: m.label.split(' ')[0],
      portingRevenue: portingRev,
      circuitRevenue: circRev,
      totalRevenue: totRev,
    };
  });

  return {
    monthKey,
    portingRevenue: {
      totalPortingMrr,
      basePropertiesGmr: Math.round(basePropertiesGmr * 100) / 100,
      servicesGmr: Math.round(servicesGmr * 100) / 100,
      propertiesCount: portingItems.length,
      servicesCount: totalServicesCount,
      billingDoneCount,
      billingPendingCount,
      items: portingItems,
    },
    dataCircuitRevenue: {
      totalExpectedRevShare,
      receivedRevShare,
      pendingRevShare,
      circuitsCount: circuitItems.length,
      receivedCount,
      pendingCount,
      wholesalerBreakdown,
      carrierBreakdown,
      items: circuitItems,
    },
    summary: {
      totalCombinedInflow,
      portingPercentage,
      circuitPercentage,
      annualizedInflow,
    },
    historicalTrends,
  };
}

