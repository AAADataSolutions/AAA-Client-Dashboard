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

    // Parallel fetch of core counts & top collections
    const [
      orgsRes,
      propsRes,
      servicesRes,
      onboardingsRes,
      portingsRes,
      ticketsRes,
      e911Res,
      activityRes,
    ] = await Promise.all([
      // 1. Organizations with properties & services
      db
        .from('organizations')
        .select(`
          id,
          name,
          status,
          created_at,
          org_properties:organization_properties(
            id,
            property:properties(id, name)
          )
        `)
        .order('created_at', { ascending: false }),

      // 2. Properties
      db
        .from('properties')
        .select('id, name, city, state, status, created_at')
        .order('created_at', { ascending: false }),

      // 3. Organization Property Services
      db
        .from('organization_property_services')
        .select('id, service_type, status, did_count, created_at'),

      // 4. Onboardings with property & org
      db
        .from('onboardings')
        .select(`
          *,
          org_property:organization_properties(
            id,
            property:properties(id, name, city, state),
            organization:organizations(id, name)
          )
        `)
        .order('created_at', { ascending: false }),

      // 5. Porting requests with property & org
      db
        .from('porting_requests')
        .select(`
          *,
          organization_property:organization_properties(
            id,
            property:properties(id, name, city, state),
            organization:organizations(id, name)
          )
        `)
        .order('created_at', { ascending: false }),

      // 6. Tickets
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

      // 7. E911 Records
      db
        .from('e911_records')
        .select(`
          id,
          status,
          caller_name,
          phone_number,
          civic_address,
          created_at,
          org_property:organization_properties(
            property:properties(name)
          )
        `)
        .order('created_at', { ascending: false }),

      // 8. Recent Audit Logs
      db
        .from('audit_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10),
    ]);

    const orgs = orgsRes.data || [];
    const props = propsRes.data || [];
    const services = servicesRes.data || [];
    const onboardings = onboardingsRes.data || [];
    const portings = portingsRes.data || [];
    const tickets = ticketsRes.data || [];
    const e911Records = e911Res.data || [];
    const auditLogs = activityRes.data || [];

    // 1. KPI Counts
    const orgsCount = orgs.length;
    const propsCount = props.length;
    const servicesCount = services.length;

    const activeOnboardings = onboardings.filter((o) => o.status !== 'COMPLETED');
    const activePortings = portings.filter(
      (p) => p.status !== 'COMPLETED' && p.status !== 'CANCELLED' && p.status !== 'REJECTED'
    );
    const openTickets = tickets.filter(
      (t) => t.status !== 'CLOSED' && t.status !== 'RESOLVED'
    );
    const urgentTickets = openTickets.filter((t) => t.priority === 'URGENT');

    // 2. Attention Required Items
    const attentionRequired: any[] = [];

    const e911Corrections = e911Records.filter((e) => e.status === 'CORRECTION_REQUIRED');
    if (e911Corrections.length > 0) {
      const propNames = Array.from(
        new Set(e911Corrections.map((e: any) => e.org_property?.property?.name).filter(Boolean))
      ).slice(0, 2);
      attentionRequired.push({
        id: 'e911-corr',
        severity: 'Critical',
        title: `${e911Corrections.length} E911 correction${e911Corrections.length > 1 ? 's' : ''} required`,
        description: `PSAP routing mismatch identified${propNames.length > 0 ? ` on ${propNames.join(' & ')}.` : '.'}`,
        actionText: 'Fix Now →',
        actionHref: '/admin/e911',
      });
    }

    const e911Failed = e911Records.filter((e) => e.status === 'FAILED');
    if (e911Failed.length > 0) {
      attentionRequired.push({
        id: 'e911-fail',
        severity: 'Critical',
        title: `${e911Failed.length} E911 verification${e911Failed.length > 1 ? 's' : ''} failed`,
        description: 'Dispatch validation error: Address unverified against MSAG database.',
        actionText: 'Review →',
        actionHref: '/admin/e911',
      });
    }

    if (urgentTickets.length > 0) {
      attentionRequired.push({
        id: 'urgent-tickets',
        severity: 'Critical',
        title: `${urgentTickets.length} urgent support ticket${urgentTickets.length > 1 ? 's' : ''}`,
        description: 'High-priority voice service or PBX outage reported.',
        actionText: 'Respond →',
        actionHref: '/admin/tickets',
      });
    }

    const waitingSofOnb = onboardings.filter((o) => o.status === 'SOF_WAITING' || o.status === 'DRAFT');
    if (waitingSofOnb.length > 0) {
      attentionRequired.push({
        id: 'onb-sof',
        severity: 'Attention',
        title: `${waitingSofOnb.length} onboarding${waitingSofOnb.length > 1 ? 's' : ''} pending sign-off`,
        description: 'Pending Service Order Form (SOF) sign-off from tenant managers.',
        actionText: 'Notify →',
        actionHref: '/admin/onboarding-porting',
      });
    }

    const portingDueSoon = portings.filter((p) => p.status === 'FOC_RECEIVED' || p.status === 'IN_PROGRESS');
    if (portingDueSoon.length > 0) {
      attentionRequired.push({
        id: 'port-due',
        severity: 'Attention',
        title: `${portingDueSoon.length} porting cutover${portingDueSoon.length > 1 ? 's' : ''} active`,
        description: 'FOC cutover window active. Pre-testing and trunk verification pending.',
        actionText: 'Schedule →',
        actionHref: '/admin/porting',
      });
    }

    // 3. Upcoming Deadlines
    const upcomingDeadlines: any[] = [];
    const combinedDeadlines = [
      ...onboardings
        .filter((o) => o.target_date && o.status !== 'COMPLETED')
        .map((o) => ({
          id: `onb-${o.id}`,
          date: new Date(o.target_date),
          propertyName: o.org_property?.property?.name || 'Hospitality Location',
          stage: o.status ? `Stage: ${o.status.replace(/_/g, ' ')}` : 'Stage: In Flight',
          type: 'Onboarding',
        })),
      ...portings
        .filter((p) => p.target_date && p.status !== 'COMPLETED' && p.status !== 'CANCELLED')
        .map((p) => ({
          id: `port-${p.id}`,
          date: new Date(p.target_date),
          propertyName: p.organization_property?.property?.name || 'Carrier Trunk Cut',
          stage: p.status ? `Stage: ${p.status.replace(/_/g, ' ')}` : 'Stage: Cutover Milestone',
          type: 'Porting',
        })),
    ].sort((a, b) => a.date.getTime() - b.date.getTime());

    combinedDeadlines.slice(0, 5).forEach((item) => {
      const month = item.date.toLocaleString('en-US', { month: 'short' });
      const day = item.date.getDate().toString().padStart(2, '0');
      upcomingDeadlines.push({
        id: item.id,
        month,
        day,
        propertyName: item.propertyName,
        stage: item.stage,
        type: item.type,
      });
    });

    // 4. Onboarding Pipeline Breakdown & Progress Items
    const onbStageCounts = {
      waitingSignature: onboardings.filter((o) => o.status === 'SOF_WAITING' || o.status === 'CONTRACT_SENT').length,
      waitingPorting: onboardings.filter((o) => o.status === 'PORTING_WAITING').length,
      portingSubmitted: onboardings.filter((o) => o.status === 'PORTING_SUBMITTED').length,
      sofReview: onboardings.filter((o) => o.status === 'DRAFT' || o.status === 'SIGNED').length,
      completed: onboardings.filter((o) => o.status === 'COMPLETED').length,
    };

    const getOnboardingProgressPercent = (status: string) => {
      switch (status) {
        case 'COMPLETED': return 100;
        case 'FOC_RECEIVED': return 90;
        case 'PORTING_SUBMITTED': return 75;
        case 'PORTING_WAITING': return 55;
        case 'SOF_WAITING': return 40;
        case 'CONTRACT_SENT': return 25;
        default: return 15;
      }
    };

    const keyPipelineProperties = onboardings
      .filter((o) => o.status !== 'COMPLETED')
      .slice(0, 5)
      .map((o) => {
        const percent = getOnboardingProgressPercent(o.status);
        return {
          id: o.id,
          propertyName: o.org_property?.property?.name || 'Property Location',
          stageLabel: `${o.status?.replace(/_/g, ' ') || 'In Progress'} · ${percent}%`,
          percent,
          colorClass:
            percent >= 80 ? 'bg-emerald-500 text-emerald-500' :
            percent >= 60 ? 'bg-sky-500 text-sky-500' :
            percent >= 40 ? 'bg-[#f97316] text-[#f97316]' : 'bg-purple-500 text-purple-400',
        };
      });

    // 5. Porting Pipeline Breakdown & Mini Table
    const portingStageCounts = {
      pending: portings.filter((p) => p.status === 'PENDING').length,
      submitted: portings.filter((p) => p.status === 'SUBMITTED').length,
      inProgress: portings.filter((p) => p.status === 'IN_PROGRESS').length,
      focReceived: portings.filter((p) => p.status === 'FOC_RECEIVED').length,
      completed: portings.filter((p) => p.status === 'COMPLETED').length,
      total: portings.length,
    };

    const recentPortingTable = portings.slice(0, 5).map((p) => ({
      id: p.id,
      propertyName: p.organization_property?.property?.name || 'Carrier Trunk Port',
      numbersCount: p.numbers_count ? `${p.numbers_count} DIDs` : 'Multiple DIDs',
      status: p.status || 'SUBMITTED',
      targetDate: p.target_date
        ? new Date(p.target_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
        : 'Pending FOC',
    }));

    // 6. Support Tickets & 7-Day Trend
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      return {
        dateStr: d.toISOString().split('T')[0],
        dayName: d.toLocaleDateString('en-US', { weekday: 'short' }),
        created: 0,
        resolved: 0,
      };
    });

    tickets.forEach((t) => {
      const createdDate = t.created_at?.split('T')[0];
      const matchCreated = last7Days.find((d) => d.dateStr === createdDate);
      if (matchCreated) matchCreated.created++;

      if (t.status === 'RESOLVED' || t.status === 'CLOSED') {
        const updatedDate = (t.updated_at || t.created_at)?.split('T')[0];
        const matchResolved = last7Days.find((d) => d.dateStr === updatedDate);
        if (matchResolved) matchResolved.resolved++;
      }
    });

    // 7. E911 Compliance Status Breakdown
    const e911Stats = {
      verified: e911Records.filter((e) => e.status === 'VERIFIED').length,
      pending: e911Records.filter((e) => e.status === 'PENDING').length,
      correctionRequired: e911Corrections.length,
      failed: e911Failed.length,
      total: e911Records.length,
    };

    // 8. Organizations Overview Table
    const topOrganizations = orgs.slice(0, 6).map((org: any) => {
      const orgPropsCount = org.org_properties?.length || 0;
      const initials = (org.name || 'Org')
        .split(' ')
        .map((w: string) => w[0])
        .join('')
        .substring(0, 2)
        .toUpperCase();

      return {
        id: org.id,
        name: org.name || 'Unnamed Organization',
        initials,
        propertiesCount: orgPropsCount,
        status: org.status || 'ACTIVE',
      };
    });

    // 9. Recent Activity Format
    const formattedActivities = auditLogs.map((log: any) => {
      const timeAgo = formatTimeAgo(new Date(log.created_at));
      return {
        id: log.id,
        title: log.action ? log.action.replace(/_/g, ' ') : 'System Audit Event',
        description: `Target: ${log.entity_type || 'system'} ${log.actor_email ? `• ${log.actor_email}` : ''}`,
        timeAgo,
      };
    });

    return NextResponse.json({
      success: true,
      data: {
        stats: {
          orgsCount,
          propsCount,
          servicesCount,
          onboardingsCount: activeOnboardings.length,
          portingCount: activePortings.length,
          ticketsCount: openTickets.length,
          urgentTicketsCount: urgentTickets.length,
        },
        attentionRequired,
        upcomingDeadlines,
        onboardingPipeline: {
          totalActive: activeOnboardings.length,
          stageCounts: onbStageCounts,
          keyProperties: keyPipelineProperties,
        },
        portingPipeline: {
          stageCounts: portingStageCounts,
          recentOrders: recentPortingTable,
        },
        ticketAnalytics: {
          openCount: openTickets.length,
          urgentCount: urgentTickets.length,
          last7Days,
        },
        e911Compliance: e911Stats,
        organizationsOverview: {
          total: orgsCount,
          list: topOrganizations,
        },
        recentActivities: formattedActivities,
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

function formatTimeAgo(date: Date): string {
  const diffMs = Date.now() - date.getTime();
  const mins = Math.floor(diffMs / (1000 * 60));
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins} min ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} hr${hours > 1 ? 's' : ''} ago`;
  const days = Math.floor(hours / 24);
  return `${days} day${days > 1 ? 's' : ''} ago`;
}
