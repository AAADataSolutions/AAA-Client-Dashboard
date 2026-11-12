export function computeOperationalMetrics({
  orgs,
  props,
  servicesCount,
  onboardings,
  portings,
  tickets,
  e911Records,
  auditLogs,
  managementGroups,
}: {
  orgs: any[];
  props: any[];
  servicesCount: number;
  onboardings: any[];
  portings: any[];
  tickets: any[];
  e911Records: any[];
  auditLogs: any[];
  managementGroups: any[];
}) {
  const orgsCount = orgs.length;
  const propsCount = props.length;

  const activeOnboardings = onboardings.filter((o) => o.status !== 'COMPLETED');
  const activePortings = portings.filter(
    (p) => p.status !== 'COMPLETED' && p.status !== 'CANCELLED' && p.status !== 'REJECTED'
  );
  const openTickets = tickets.filter((t) => t.status !== 'CLOSED' && t.status !== 'RESOLVED');
  const urgentTickets = openTickets.filter((t) => t.priority === 'URGENT');

  const propsMap = new Map<string, any>(props.map((p: any) => [p.id, p]));

  const allPortingItems = portings.map((p: any) => {
    const orgProp = p.organization_property;
    const propFromJoin = Array.isArray(orgProp?.property) ? orgProp?.property[0] : orgProp?.property;
    const propFromMap = p.property_id ? propsMap.get(p.property_id) : null;
    const prop = propFromJoin || propFromMap;
    const ob = Array.isArray(orgProp?.onboardings) ? orgProp?.onboardings[0] : orgProp?.onboardings;
    const rawStatus = (p.status || ob?.status || prop?.status || 'DRAFT').toUpperCase();
    const propName = p.property_name || prop?.name || 'Property Location';

    let stageKey = 'DRAFT';
    let stageLabel = 'Draft Initialized';
    let percent = 12.5;
    let color = '#64748b';

    switch (rawStatus) {
      case 'CONTRACT_SENT':
      case 'SENT':
        stageKey = 'CONTRACT_SENT';
        stageLabel = 'Contract Sent';
        percent = 25;
        color = '#6366f1';
        break;
      case 'SIGNED':
        stageKey = 'SIGNED';
        stageLabel = 'Contract Signed';
        percent = 37.5;
        color = '#2563eb';
        break;
      case 'CSR_DETAILS':
      case 'CSR_AND_CONTRACT_DETAILS':
        stageKey = 'CSR_DETAILS';
        stageLabel = 'CSR and Contract Details';
        percent = 50;
        color = '#0d9488';
        break;
      case 'CUT_SHEET_REVIEW':
      case 'CUT_SHEET':
      case 'CUTSHEET':
      case 'SOF_WAITING':
        stageKey = 'CUT_SHEET_REVIEW';
        stageLabel = 'Cut Sheet Review';
        percent = 62.5;
        color = '#a855f7';
        break;
      case 'PORTING_SUBMITTED':
      case 'PORTING':
      case 'SUBMITTED':
      case 'IN_PROGRESS':
        stageKey = 'PORTING_SUBMITTED';
        stageLabel = 'Porting Submitted';
        percent = 75;
        color = '#f59e0b';
        break;
      case 'FOC_RECEIVED':
      case 'FOC':
      case 'FOC_CONFIRMED':
        stageKey = 'FOC_RECEIVED';
        stageLabel = 'FOC Confirmed';
        percent = 87.5;
        color = '#0ea5e9';
        break;
      case 'COMPLETED':
      case 'ONBOARDED':
      case 'ACTIVE':
        stageKey = 'COMPLETED';
        stageLabel = 'Onboarded';
        percent = 100;
        color = '#10b981';
        break;
      default:
        stageKey = 'DRAFT';
        stageLabel = 'Draft Initialized';
        percent = 12.5;
        color = '#64748b';
        break;
    }

    return {
      id: p.id,
      propertyId: prop?.id || p.property_id || '',
      propertyName: propName,
      stageKey,
      stageName: stageLabel,
      stageLabel: `${stageLabel} · ${percent}%`,
      percent,
      color,
      created_at: p.created_at,
      updated_at: p.updated_at || p.created_at,
    };
  });

  // Also include any properties that are marked as ONBOARDED / ACTIVE in properties table but don't have portings
  const existingPropIdsInPortings = new Set(allPortingItems.map((i: any) => i.propertyId).filter(Boolean));
  props.forEach((prop: any) => {
    if (!existingPropIdsInPortings.has(prop.id)) {
      const isCompleted = prop.status === 'ONBOARDED' || prop.status === 'ACTIVE' || prop.status === 'COMPLETED';
      const isPorting = prop.status === 'PORTING' || prop.status === 'IN_PROGRESS' || prop.status === 'SUBMITTED';
      const stageKey = isCompleted ? 'COMPLETED' : isPorting ? 'PORTING_SUBMITTED' : 'DRAFT';
      const stageLabel = isCompleted ? 'Onboarded' : isPorting ? 'Porting Submitted' : 'Draft Initialized';
      const percent = isCompleted ? 100 : isPorting ? 71 : 14;
      const color = isCompleted ? '#10b981' : isPorting ? '#f59e0b' : '#64748b';

      allPortingItems.push({
        id: `prop-${prop.id}`,
        propertyId: prop.id,
        propertyName: prop.name || 'Property Location',
        stageKey,
        stageName: stageLabel,
        stageLabel: `${stageLabel} · ${percent}%`,
        percent,
        color,
        created_at: prop.created_at,
        updated_at: prop.created_at,
      });
    }
  });

  const stageCounts7 = {
    draft: allPortingItems.filter((i: any) => i.stageKey === 'DRAFT').length,
    contractSent: allPortingItems.filter((i: any) => i.stageKey === 'CONTRACT_SENT').length,
    signed: allPortingItems.filter((i: any) => i.stageKey === 'SIGNED').length,
    cutSheetReview: allPortingItems.filter((i: any) => i.stageKey === 'CUT_SHEET_REVIEW').length,
    portingSubmitted: allPortingItems.filter((i: any) => i.stageKey === 'PORTING_SUBMITTED').length,
    focReceived: allPortingItems.filter((i: any) => i.stageKey === 'FOC_RECEIVED').length,
    completed: allPortingItems.filter((i: any) => i.stageKey === 'COMPLETED').length,
    total: allPortingItems.length,
  };

  const keyPipelineProperties = allPortingItems.slice(0, 3);

  // E911 derivation
  const e911VerifiedRecords = e911Records.filter((e: any) => e.status === 'VERIFIED' || e.status === 'ACTIVE').length;
  const e911PendingRecords = e911Records.filter((e: any) => e.status === 'PENDING').length;
  const e911CorrectionRecords = e911Records.filter((e: any) => e.status === 'CORRECTION_REQUIRED').length;
  const e911FailedRecords = e911Records.filter((e: any) => e.status === 'FAILED').length;

  let finalVerified = e911VerifiedRecords;
  let finalPending = e911PendingRecords;
  let finalCorrection = e911CorrectionRecords;
  let finalFailed = e911FailedRecords;
  let finalTotal = e911Records.length;

  if (finalTotal === 0 && props.length > 0) {
    finalVerified = props.filter((p: any) => p.ray_baud_and_logs_enabled || p.status === 'ACTIVE').length;
    finalPending = Math.max(0, props.length - finalVerified);
    finalCorrection = 0;
    finalTotal = props.length;
  }

  const e911Stats = {
    verified: finalVerified,
    pending: finalPending,
    correctionRequired: finalCorrection,
    failed: finalFailed,
    total: finalTotal,
  };

  // Ticket Analytics breakdown
  const now = new Date();
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(now.getDate() - (6 - i));
    const dayStart = new Date(d.setHours(0, 0, 0, 0));
    const dayEnd = new Date(d.setHours(23, 59, 59, 999));
    const dayName = days[dayStart.getDay()];

    const created = tickets.filter((t: any) => {
      const cDate = new Date(t.created_at);
      return cDate >= dayStart && cDate <= dayEnd;
    }).length;

    const resolved = tickets.filter((t: any) => {
      const uDate = new Date(t.updated_at || t.created_at);
      return (t.status === 'RESOLVED' || t.status === 'CLOSED') && uDate >= dayStart && uDate <= dayEnd;
    }).length;

    return {
      dayName,
      created,
      resolved,
    };
  });

  const ticketAnalytics = {
    open: openTickets.length,
    urgent: urgentTickets.length,
    pending: tickets.filter((t: any) => t.status === 'IN_PROGRESS' || t.status === 'PENDING').length,
    resolved: tickets.filter((t: any) => t.status === 'RESOLVED' || t.status === 'CLOSED').length,
    last7Days,
  };

  // Format recent activities
  const recentActivities: any[] = (auditLogs.length > 0 ? auditLogs : []).slice(0, 5).map((log: any) => {
    const createdTime = new Date(log.created_at);
    const diffMs = Date.now() - createdTime.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    let timeAgo = `${diffMins} mins ago`;
    if (diffDays > 0) timeAgo = `${diffDays} days ago`;
    else if (diffHours > 0) timeAgo = `${diffHours} hours ago`;
    else if (diffMins <= 1) timeAgo = 'Just now';

    return {
      id: log.id,
      title: log.action || log.event_type || 'System Event',
      description: log.details?.message || log.description || log.entity_name || 'System record updated',
      timeAgo,
    };
  });

  // If no audit logs exist, fallback with recent properties/tickets activity realistically
  if (recentActivities.length === 0) {
    props.slice(0, 4).forEach((p: any) => {
      recentActivities.push({
        id: `prop-${p.id}`,
        title: `Property ${p.status === 'ACTIVE' ? 'Live' : 'Configured'}`,
        description: `${p.name} updated in ${p.city || 'Network'}`,
        timeAgo: 'Recently',
      });
    });
  }

  const organizationsOverview = {
    list: managementGroups.slice(0, 5),
    total: orgs.length,
  };

  return {
    stats: {
      orgsCount,
      propsCount,
      servicesCount,
      onboardingsCount: activeOnboardings.length,
      portingCount: activePortings.length,
      ticketsCount: openTickets.length,
      urgentTicketsCount: urgentTickets.length,
    },
    onboardingPipeline: {
      totalActive: stageCounts7.total,
      stageCounts: stageCounts7,
      keyProperties: keyPipelineProperties,
    },
    ticketAnalytics,
    e911Compliance: e911Stats,
    recentActivities,
    organizationsOverview,
  };
}

