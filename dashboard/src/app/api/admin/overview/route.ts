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
        .select('id, name, city, state, address, status, ray_baud_and_logs_enabled, ray_baum_status, created_at')
        .order('created_at', { ascending: false }),

      // 3. Total provisioned services
      db
        .from('services')
        .select('id', { count: 'exact', head: true }),

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
          organization:organizations(id, name),
          organization_property:organization_properties(
            id,
            property:properties(id, name, city, state, address, ray_baud_and_logs_enabled),
            organization:organizations(id, name),
            onboardings(
              id,
              status,
              target_date
            )
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
          emergency_address,
          psap_id,
          created_at,
          org_property:organization_properties(
            property:properties(id, name, address, ray_baud_and_logs_enabled)
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

    let orgs = orgsRes.data || [];
    let props = propsRes.data || [];
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

    // 1. KPI Counts
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

    // 2. Map all Porting Items with the 7 Lifecycle Stages & Colors
    // Stage 1: DRAFT (14%, Slate #64748b)
    // Stage 2: CONTRACT_SENT (28%, Indigo #6366f1)
    // Stage 3: SIGNED (42%, Blue #2563eb)
    // Stage 4: CUT_SHEET_REVIEW (57%, Purple #a855f7)
    // Stage 5: PORTING_SUBMITTED (71%, Amber #f59e0b)
    // Stage 6: FOC_RECEIVED (85%, Sky #0ea5e9)
    // Stage 7: COMPLETED (100%, Emerald #10b981)

    const allPortingItems = portings.map((p: any) => {
      const orgProp = p.organization_property;
      const prop = Array.isArray(orgProp?.property) ? orgProp?.property[0] : orgProp?.property;
      const ob = Array.isArray(orgProp?.onboardings) ? orgProp?.onboardings[0] : orgProp?.onboardings;
      const rawStatus = (p.status || ob?.status || 'DRAFT').toUpperCase();
      const propName = p.property_name || prop?.name || 'Property Location';

      let stageKey = 'DRAFT';
      let stageLabel = 'Draft Initialized';
      let percent = 14;
      let color = '#64748b'; // Slate
      let colorClass = 'bg-slate-500 text-slate-400';

      switch (rawStatus) {
        case 'CONTRACT_SENT':
          stageKey = 'CONTRACT_SENT';
          stageLabel = 'Contract Sent';
          percent = 28;
          color = '#6366f1';
          colorClass = 'bg-indigo-500 text-indigo-400';
          break;
        case 'SIGNED':
          stageKey = 'SIGNED';
          stageLabel = 'Contract Signed';
          percent = 42;
          color = '#2563eb';
          colorClass = 'bg-blue-600 text-blue-400';
          break;
        case 'CUT_SHEET_REVIEW':
        case 'CUT_SHEET':
        case 'CUTSHEET':
        case 'SOF_WAITING':
          stageKey = 'CUT_SHEET_REVIEW';
          stageLabel = 'Cut Sheet Review';
          percent = 57;
          color = '#a855f7';
          colorClass = 'bg-purple-500 text-purple-400';
          break;
        case 'PORTING_SUBMITTED':
        case 'SUBMITTED':
        case 'IN_PROGRESS':
          stageKey = 'PORTING_SUBMITTED';
          stageLabel = 'Porting Submitted';
          percent = 71;
          color = '#f59e0b';
          colorClass = 'bg-amber-500 text-amber-400';
          break;
        case 'FOC_RECEIVED':
          stageKey = 'FOC_RECEIVED';
          stageLabel = 'FOC Confirmed';
          percent = 85;
          color = '#0ea5e9';
          colorClass = 'bg-sky-500 text-sky-400';
          break;
        case 'COMPLETED':
          stageKey = 'COMPLETED';
          stageLabel = 'Onboarded';
          percent = 100;
          color = '#10b981';
          colorClass = 'bg-emerald-500 text-emerald-400';
          break;
        default:
          stageKey = 'DRAFT';
          stageLabel = 'Draft Initialized';
          percent = 14;
          color = '#64748b';
          colorClass = 'bg-slate-500 text-slate-400';
          break;
      }

      return {
        id: p.id,
        propertyName: propName,
        stageKey,
        stageName: stageLabel,
        stageLabel: `${stageLabel} · ${percent}%`,
        percent,
        color,
        colorClass,
        created_at: p.created_at,
        updated_at: p.updated_at || p.created_at,
      };
    });

    // 7 Stages Counts
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

    // REQUIREMENT 2: Show only the last 3 properties present under the porting section
    const keyPipelineProperties = allPortingItems.slice(0, 3);

    // 3. E911 Compliance Status Breakdown (Dynamic from e911_records and properties)
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

    // If e911_records table is empty, dynamically derive from properties
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

    // 4. Attention Required Items
    const attentionRequired: any[] = [];
    if (finalCorrection > 0) {
      attentionRequired.push({
        id: 'e911-corr',
        severity: 'Critical',
        title: `${finalCorrection} E911 correction${finalCorrection > 1 ? 's' : ''} required`,
        description: 'PSAP routing mismatch identified on property emergency addresses.',
        actionText: 'Fix Now →',
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

    // 5. Support Tickets & 7-Day Trend
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

    tickets.forEach((t: any) => {
      const createdDate = t.created_at?.split('T')[0];
      const matchCreated = last7Days.find((d) => d.dateStr === createdDate);
      if (matchCreated) matchCreated.created++;

      if (t.status === 'RESOLVED' || t.status === 'CLOSED') {
        const updatedDate = (t.updated_at || t.created_at)?.split('T')[0];
        const matchResolved = last7Days.find((d) => d.dateStr === updatedDate);
        if (matchResolved) matchResolved.resolved++;
      }
    });

    // 6. Organizations Overview Table
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

    // 7. Recent Activity Format
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
        onboardingPipeline: {
          totalActive: stageCounts7.total,
          stageCounts: stageCounts7,
          keyProperties: keyPipelineProperties,
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
