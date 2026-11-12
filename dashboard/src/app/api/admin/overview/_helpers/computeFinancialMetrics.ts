export function computeFinancialMetrics({
  orgs,
  props,
  partners,
  services,
  orgProps,
}: {
  orgs: any[];
  props: any[];
  partners: any[];
  services: any[];
  orgProps: any[];
}) {
  // Map organization assignment (Assigned properties generating real revenue)
  const assignedPropIds = new Set<string>();
  orgProps.forEach((op: any) => {
    if (op.property_id) {
      assignedPropIds.add(op.property_id);
    }
  });

  // Map active services to properties
  const servicesByPropId = new Map<string, number>();
  services.forEach((s: any) => {
    if (s.status !== 'DISCONNECTED' && s.status !== 'INACTIVE') {
      const links = Array.isArray(s.property_links) ? s.property_links : s.property_links ? [s.property_links] : [];
      const unitPrice = Number(s.price || s.monthly_price || 0);
      links.forEach((link: any) => {
        const pId = link?.org_property?.property_id;
        if (pId) {
          servicesByPropId.set(pId, (servicesByPropId.get(pId) || 0) + unitPrice);
        }
      });
    }
  });

  // Active assigned properties (Generating real realized revenue)
  const activeAssignedProps = props.filter((p: any) => {
    const isAssigned = assignedPropIds.has(p.id);
    const isActive = p.status === 'ACTIVE' || p.status === 'COMPLETED' || p.status === 'ONBOARDED';
    return isAssigned && isActive;
  });

  // Real Gross Monthly Revenue (GMR) matching Finances page
  let activeBaseMRR = 0;
  let activeServicesMRR = 0;
  activeAssignedProps.forEach((p: any) => {
    activeBaseMRR += Number(p.monthly_price || 0);
    activeServicesMRR += servicesByPropId.get(p.id) || 0;
  });

  const grossMRR = activeBaseMRR + activeServicesMRR;
  const activeMRR = grossMRR;
  const unassignedProps = props.filter(
    (p: any) => !assignedPropIds.has(p.id) || (p.status !== 'ACTIVE' && p.status !== 'COMPLETED' && p.status !== 'ONBOARDED')
  );
  const pendingMRR = unassignedProps.reduce((sum: number, p: any) => sum + Number(p.monthly_price || 0), 0);

  const averagePropertyMRR = activeAssignedProps.length > 0 ? grossMRR / activeAssignedProps.length : 0;

  // 2. Real Partner Commission Outflow calculation (only on active assigned revenue)
  const partnersMap = new Map<string, any>();
  partners.forEach((partner: any) => {
    partnersMap.set(partner.id, partner);
  });

  let totalPartnerCommissionOutflow = 0;
  let partnerAssignedPropsCount = 0;

  const partnerStatsMap: Record<
    string,
    {
      partner: any;
      assignedProps: any[];
      monthlyRunRate: number;
      commissionOutflow: number;
    }
  > = {};

  partners.forEach((pt: any) => {
    partnerStatsMap[pt.id] = {
      partner: pt,
      assignedProps: [],
      monthlyRunRate: 0,
      commissionOutflow: 0,
    };
  });

  // Compute partner outflow strictly on revenue-generating active assigned properties
  activeAssignedProps.forEach((prop: any) => {
    if (prop.partner_id && partnersMap.has(prop.partner_id)) {
      partnerAssignedPropsCount++;
      const partner = partnersMap.get(prop.partner_id);
      const rate =
        prop.partner_commission_override !== null &&
        prop.partner_commission_override !== undefined &&
        prop.partner_commission_override !== ''
          ? Number(prop.partner_commission_override)
          : Number(partner?.default_commission_rate || 10);

      const propMonthly = Number(prop.monthly_price || 0) + (servicesByPropId.get(prop.id) || 0);
      const propCommission = propMonthly * (rate / 100);
      totalPartnerCommissionOutflow += propCommission;

      if (partnerStatsMap[prop.partner_id]) {
        partnerStatsMap[prop.partner_id].assignedProps.push(prop);
        partnerStatsMap[prop.partner_id].monthlyRunRate += propMonthly;
        partnerStatsMap[prop.partner_id].commissionOutflow += propCommission;
      }
    }
  });

  totalPartnerCommissionOutflow = Math.round(totalPartnerCommissionOutflow * 100) / 100;
  const netRetainedMRR = Math.max(0, grossMRR - totalPartnerCommissionOutflow);
  const retainedPct = grossMRR > 0 ? Math.round((netRetainedMRR / grossMRR) * 1000) / 10 : 100;
  const outflowPct = grossMRR > 0 ? Math.round((totalPartnerCommissionOutflow / grossMRR) * 1000) / 10 : 0;

  // 3. Management Groups (Organizations) Detailed Stats
  const managementGroups = orgs
    .map((org: any) => {
      const orgPropsList = (org.org_properties || []).map((op: any) => op.property).filter(Boolean);

      const orgMonthly = orgPropsList.reduce((sum: number, p: any) => sum + Number(p.monthly_price || 0), 0);
      const activeCount = orgPropsList.filter((p: any) => p.status === 'ACTIVE' || p.status === 'COMPLETED').length;
      const partnerIds = new Set(orgPropsList.map((p: any) => p.partner_id).filter(Boolean));

      const initials = (org.name || 'Org')
        .split(' ')
        .map((w: string) => w[0])
        .join('')
        .substring(0, 2)
        .toUpperCase();

      return {
        id: org.id,
        name: org.name || 'Unnamed Management Group',
        initials,
        status: org.status || 'ACTIVE',
        propertiesCount: orgPropsList.length,
        activePropertiesCount: activeCount,
        monthlyRevenue: orgMonthly,
        revenueSharePct: grossMRR > 0 ? ((orgMonthly / grossMRR) * 100).toFixed(1) : '0.0',
        partnersCount: partnerIds.size,
        created_at: org.created_at,
      };
    })
    .sort((a: any, b: any) => b.monthlyRevenue - a.monthlyRevenue);

  // 4. Partner Commission List
  const partnerCommissionList = Object.values(partnerStatsMap)
    .map((entry) => {
      const pt = entry.partner;
      const effectiveRate = Number(pt.default_commission_rate || 10);
      return {
        id: pt.id,
        name: pt.full_name || pt.company_name || 'Partner',
        email: pt.email || '—',
        phone: pt.phone || '—',
        status: pt.status || 'ACTIVE',
        commissionRate: effectiveRate,
        assignedPropertiesCount: entry.assignedProps.length,
        monthlyRunRate: entry.monthlyRunRate,
        commissionOutflow: entry.commissionOutflow,
        shareOfTotalOutflow:
          totalPartnerCommissionOutflow > 0
            ? ((entry.commissionOutflow / totalPartnerCommissionOutflow) * 100).toFixed(1)
            : '0.0',
      };
    })
    .sort((a, b) => b.commissionOutflow - a.commissionOutflow);

  // 5. Top Revenue Properties
  const topRevenueProperties = [...props]
    .sort((a, b) => Number(b.monthly_price || 0) - Number(a.monthly_price || 0))
    .slice(0, 5)
    .map((p: any) => {
      const partner = p.partner_id ? partnersMap.get(p.partner_id) : null;
      return {
        id: p.id,
        name: p.name || 'Property',
        city: p.city || '',
        state: p.state || '',
        monthlyPrice: Number(p.monthly_price || 0),
        status: p.status || 'ACTIVE',
        partnerName: partner?.full_name || partner?.company_name || 'Unassigned',
        partnerCommissionOverride: p.partner_commission_override,
      };
    });

  return {
    superAdminKPIs: {
      managementGroupsCount: orgs.length,
      activeManagementGroupsCount: orgs.filter((o: any) => o.status === 'ACTIVE').length,
      propertiesCount: props.length,
      activePropertiesCount: activeAssignedProps.length,
      pendingPropertiesCount: unassignedProps.length,
      grossMRR,
      activeMRR,
      pendingMRR,
      partnerCommissionOutflow: totalPartnerCommissionOutflow,
      netRetainedMRR,
      retainedPct,
      outflowPct,
      averagePropertyMRR,
      totalPartnersCount: partners.length,
      activePartnersCount: partners.filter((p: any) => p.status === 'ACTIVE').length,
      partnerAssignedPropsCount,
    },
    managementGroups,
    partnerCommissions: partnerCommissionList,
    topRevenueProperties,
  };
}

