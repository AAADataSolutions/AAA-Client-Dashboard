import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function GET() {
  try {
    const supabase = await createClient();
    const adminClient = createAdminClient();
    const db = adminClient || supabase;

    // Check user authentication
    const {
      data: { user },
      error: authErr,
    } = await supabase.auth.getUser();

    if (authErr || !user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    // Parallel fetch of core data collections
    const [
      orgsRes,
      propsRes,
      partnersRes,
      servicesRes,
      onboardingsRes,
      portingsRes,
      ticketsRes,
      e911Res,
      activityRes,
    ] = await Promise.all([
      // 1. Organizations with properties
      db
        .from('organizations')
        .select(`
          id,
          name,
          status,
          created_at,
          org_properties:organization_properties(
            id,
            property:properties(id, name, monthly_price, status, partner_id)
          )
        `)
        .order('created_at', { ascending: false }),

      // 2. Properties with financials and partner assignments
      db
        .from('properties')
        .select('id, name, city, state, address, status, monthly_price, partner_id, partner_commission_override, ray_baud_and_logs_enabled, ray_baum_status, created_at')
        .order('created_at', { ascending: false }),

      // 3. Partners
      db
        .from('partners')
        .select('id, full_name, email, phone, default_commission_rate, status, company_name, created_at')
        .order('created_at', { ascending: false }),

      // 4. Total provisioned services
      db
        .from('services')
        .select('id', { count: 'exact', head: true }),

      // 5. Onboardings with property & org
      db
        .from('onboardings')
        .select(`
          *,
          org_property:organization_properties(
            id,
            property:properties(id, name, city, state, monthly_price),
            organization:organizations(id, name)
          )
        `)
        .order('created_at', { ascending: false }),

      // 6. Porting requests with property & org
      db
        .from('porting_requests')
        .select(`
          *,
          organization:organizations(id, name),
          organization_property:organization_properties(
            id,
            property:properties(id, name, city, state, address, monthly_price, ray_baud_and_logs_enabled),
            organization:organizations(id, name),
            onboardings(
              id,
              status,
              target_date
            )
          )
        `)
        .order('created_at', { ascending: false }),

      // 7. Tickets
      db
        .from('tickets')
        .select(`
          id,
          title,
          priority,
          status,
          created_at,
          updated_at,
          org_property:organization_properties(
            property:properties(name)
          )
        `)
        .order('created_at', { ascending: false }),

      // 8. E911 Records
      db
        .from('e911_records')
        .select(`
          id,
          status,
          emergency_address,
          psap_id,
          created_at,
          org_property:organization_properties(
            property:properties(id, name, address, ray_baud_and_logs_enabled)
          )
        `)
        .order('created_at', { ascending: false }),

      // 9. Recent Audit Logs
      db
        .from('audit_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10),
    ]);

    let orgs = orgsRes.data || [];
    let props = propsRes.data || [];
    let partners = partnersRes.data || [];
    let onboardings = onboardingsRes.data || [];
    let portings = portingsRes.data || [];
    let tickets = ticketsRes.data || [];
    let e911Records = e911Res.data || [];
    let auditLogs = activityRes.data || [];

    // Fallbacks if joins failed
    if (!portingsRes.data && portingsRes.error) {
      const { data: fbPortings } = await db.from('porting_requests').select('*').order('created_at', { ascending: false });
      portings = fbPortings || [];
    }

    if (!e911Res.data && e911Res.error) {
      const { data: fbE911 } = await db.from('e911_records').select('*').order('created_at', { ascending: false });
      e911Records = fbE911 || [];
    }

    // ==========================================
    // REAL FINANCIAL & SUPER ADMIN COMPUTATIONS
    // ==========================================

    // 1. Gross Monthly Revenue (MRR) across all properties
    const grossMRR = props.reduce((sum, p) => sum + Number(p.monthly_price || 0), 0);
    const activeProps = props.filter((p) => p.status === 'ACTIVE' || p.status === 'COMPLETED' || p.status === 'ONBOARDED');
    const activeMRR = activeProps.reduce((sum, p) => sum + Number(p.monthly_price || 0), 0);
    const pendingProps = props.filter((p) => p.status !== 'ACTIVE' && p.status !== 'COMPLETED' && p.status !== 'ONBOARDED');
    const pendingMRR = pendingProps.reduce((sum, p) => sum + Number(p.monthly_price || 0), 0);

    const averagePropertyMRR = props.length > 0 ? grossMRR / props.length : 0;

    // 2. Partner Commission Outflow calculation
    const partnersMap = new Map<string, any>();
    partners.forEach((partner: any) => {
      partnersMap.set(partner.id, partner);
    });

    let totalPartnerCommissionOutflow = 0;
    let partnerAssignedPropsCount = 0;

    const partnerStatsMap: Record<string, {
      partner: any;
      assignedProps: any[];
      monthlyRunRate: number;
      commissionOutflow: number;
    }> = {};

    partners.forEach((pt: any) => {
      partnerStatsMap[pt.id] = {
        partner: pt,
        assignedProps: [],
        monthlyRunRate: 0,
        commissionOutflow: 0,
      };
    });

    props.forEach((prop: any) => {
      if (prop.partner_id) {
        partnerAssignedPropsCount++;
        const partner = partnersMap.get(prop.partner_id);
        const rate =
          prop.partner_commission_override !== null && prop.partner_commission_override !== undefined
            ? Number(prop.partner_commission_override)
            : Number(partner?.default_commission_rate || 10);

        const propMonthly = Number(prop.monthly_price || 0);
        const propCommission = propMonthly * (rate / 100);
        totalPartnerCommissionOutflow += propCommission;

        if (partnerStatsMap[prop.partner_id]) {
          partnerStatsMap[prop.partner_id].assignedProps.push(prop);
          partnerStatsMap[prop.partner_id].monthlyRunRate += propMonthly;
          partnerStatsMap[prop.partner_id].commissionOutflow += propCommission;
        }
      }
    });

    const netRetainedMRR = Math.max(0, grossMRR - totalPartnerCommissionOutflow);
    const retainedPct = grossMRR > 0 ? Math.round((netRetainedMRR / grossMRR) * 100) : 100;
    const outflowPct = grossMRR > 0 ? Math.round((totalPartnerCommissionOutflow / grossMRR) * 100) : 0;

    // 3. Management Groups (Organizations) Detailed Stats
    const managementGroups = orgs.map((org: any) => {
      const orgProps = (org.org_properties || [])
        .map((op: any) => op.property)
        .filter(Boolean);

      const orgMonthly = orgProps.reduce((sum: number, p: any) => sum + Number(p.monthly_price || 0), 0);
      const activeCount = orgProps.filter((p: any) => p.status === 'ACTIVE' || p.status === 'COMPLETED').length;
      const partnerIds = new Set(orgProps.map((p: any) => p.partner_id).filter(Boolean));

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
        propertiesCount: orgProps.length,
        activePropertiesCount: activeCount,
        monthlyRevenue: orgMonthly,
        revenueSharePct: grossMRR > 0 ? ((orgMonthly / grossMRR) * 100).toFixed(1) : '0.0',
        partnersCount: partnerIds.size,
        created_at: org.created_at,
      };
    }).sort((a: any, b: any) => b.monthlyRevenue - a.monthlyRevenue);

    // 4. Partner Commission List
    const partnerCommissionList = Object.values(partnerStatsMap).map((entry) => {
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
    }).sort((a, b) => b.commissionOutflow - a.commissionOutflow);

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

    // 6. Operational Telemetry (Maintained for Sub-Super Admin / Operational fallback)
    const orgsCount = orgs.length;
    const propsCount = props.length;
    const servicesCount = servicesRes.count ?? 0;

    const activeOnboardings = onboardings.filter((o) => o.status !== 'COMPLETED');
    const activePortings = portings.filter(
      (p) => p.status !== 'COMPLETED' && p.status !== 'CANCELLED' && p.status !== 'REJECTED'
    );
    const openTickets = tickets.filter(
      (t) => t.status !== 'CLOSED' && t.status !== 'RESOLVED'
    );
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
      let percent = 14;
      let color = '#64748b';

      switch (rawStatus) {
        case 'CONTRACT_SENT':
        case 'SENT':
          stageKey = 'CONTRACT_SENT';
          stageLabel = 'Contract Sent';
          percent = 28;
          color = '#6366f1';
          break;
        case 'SIGNED':
          stageKey = 'SIGNED';
          stageLabel = 'Contract Signed';
          percent = 42;
          color = '#2563eb';
          break;
        case 'CUT_SHEET_REVIEW':
        case 'CUT_SHEET':
        case 'CUTSHEET':
        case 'SOF_WAITING':
          stageKey = 'CUT_SHEET_REVIEW';
          stageLabel = 'Cut Sheet Review';
          percent = 57;
          color = '#a855f7';
          break;
        case 'PORTING_SUBMITTED':
        case 'PORTING':
        case 'SUBMITTED':
        case 'IN_PROGRESS':
          stageKey = 'PORTING_SUBMITTED';
          stageLabel = 'Porting Submitted';
          percent = 71;
          color = '#f59e0b';
          break;
        case 'FOC_RECEIVED':
        case 'FOC':
        case 'FOC_CONFIRMED':
          stageKey = 'FOC_RECEIVED';
          stageLabel = 'FOC Confirmed';
          percent = 85;
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
          percent = 14;
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
    const e911VerifiedRecords = e911Records.filter(
      (e: any) => e.status === 'VERIFIED' || e.status === 'ACTIVE'
    ).length;
    const e911PendingRecords = e911Records.filter(
      (e: any) => e.status === 'PENDING'
    ).length;
    const e911CorrectionRecords = e911Records.filter(
      (e: any) => e.status === 'CORRECTION_REQUIRED'
    ).length;
    const e911FailedRecords = e911Records.filter(
      (e: any) => e.status === 'FAILED'
    ).length;

    let finalVerified = e911VerifiedRecords;
    let finalPending = e911PendingRecords;
    let finalCorrection = e911CorrectionRecords;
    let finalFailed = e911FailedRecords;
    let finalTotal = e911Records.length;

    if (finalTotal === 0 && props.length > 0) {
      finalVerified = props.filter(
        (p: any) => p.ray_baud_and_logs_enabled || p.status === 'ACTIVE'
      ).length;
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

    return NextResponse.json({
      success: true,
      data: {
        // Core KPI Metrics requested for Super Admin
        superAdminKPIs: {
          managementGroupsCount: orgs.length,
          activeManagementGroupsCount: orgs.filter((o: any) => o.status === 'ACTIVE').length,
          propertiesCount: props.length,
          activePropertiesCount: activeProps.length,
          pendingPropertiesCount: pendingProps.length,
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
        // Standard stats for Sub Super Admin
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
      },
    });
  } catch (err: any) {
    console.error('Admin Overview API error:', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
