import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function GET() {
  try {
    const supabase = await createClient();
    const adminClient = createAdminClient();
    const db = adminClient || supabase;

    const {
      data: { user },
      error: authErr,
    } = await supabase.auth.getUser();

    if (authErr || !user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    // Resolve user profile & organization membership
    const { data: profile } = await db
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .maybeSingle();

    const { data: member } = await db
      .from('organization_members')
      .select('*, organization:organizations(*)')
      .eq('profile_id', user.id)
      .maybeSingle();

    const orgId = member?.organization_id;

    if (!orgId) {
      // Return empty/placeholder telemetry if org is pending setup
      return NextResponse.json({
        success: true,
        data: {
          organization: member?.organization || null,
          metrics: {
            propertiesCount: 0,
            servicesCount: 0,
            activeOnboardingsCount: 0,
            activePortingCount: 0,
            openTicketsCount: 0,
            ticketsInLast24Hours: 0,
          },
          attentionRequired: [],
          upcomingDeadlines: [],
          onboardingProgress: [],
          recentActivity: [],
          ticketAnalytics: {
            open: 0,
            inProgress: 0,
            waitingOnClient: 0,
            resolved: 0,
            closed: 0,
            resolutionRate: '100%',
          },
        },
      });
    }

    // 1. Fetch Organization Properties
    const { data: orgProps } = await db
      .from('organization_properties')
      .select('id, property:properties(*)')
      .eq('organization_id', orgId);

    const orgPropIds = (orgProps || []).map((op) => op.id);
    const propertiesList = (orgProps || []).map((op) => op.property).filter(Boolean);
    const propertiesCount = propertiesList.length;

    // 2. Fetch Services Count
    let servicesCount = 0;
    if (orgPropIds.length > 0) {
      const { data: servs } = await db
        .from('organization_property_services')
        .select('id, did_count')
        .in('organization_property_id', orgPropIds);

      const totalDids = (servs || []).reduce((acc, s) => acc + (Number(s.did_count) || 1), 0);
      servicesCount = totalDids > 0 ? totalDids : (servs || []).length;
    }

    // 3. Fetch Onboardings
    let activeOnboardingsCount = 0;
    let onboardingRecords: any[] = [];
    if (orgPropIds.length > 0) {
      const { data: onbs } = await db
        .from('onboardings')
        .select('*, organization_property:organization_properties(property:properties(name))')
        .in('organization_property_id', orgPropIds)
        .order('created_at', { ascending: false });

      onboardingRecords = onbs || [];
      activeOnboardingsCount = onboardingRecords.filter(
        (o) => o.status !== 'COMPLETED' && o.status !== 'DRAFT'
      ).length;
    }

    // 4. Fetch Porting Requests
    let activePortingCount = 0;
    let portingRecords: any[] = [];
    if (orgPropIds.length > 0) {
      const { data: ports } = await db
        .from('porting_requests')
        .select('*, organization_property:organization_properties(property:properties(name))')
        .in('organization_property_id', orgPropIds)
        .order('created_at', { ascending: false });

      portingRecords = ports || [];
      activePortingCount = portingRecords.filter(
        (p) => p.status !== 'COMPLETED' && p.status !== 'CANCELLED' && p.status !== 'REJECTED'
      ).length;
    }

    // 5. Fetch Support Tickets
    let openTicketsCount = 0;
    let ticketsInLast24Hours = 0;
    let ticketsList: any[] = [];
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

    if (orgPropIds.length > 0) {
      const { data: tickets } = await db
        .from('tickets')
        .select('*, creator:profiles!tickets_created_by_fkey(full_name), org_property:organization_properties(property:properties(name))')
        .in('organization_property_id', orgPropIds)
        .order('created_at', { ascending: false });

      ticketsList = tickets || [];
      openTicketsCount = ticketsList.filter(
        (t) => t.status === 'OPEN' || t.status === 'IN_PROGRESS' || t.status === 'WAITING_ON_CLIENT'
      ).length;
      ticketsInLast24Hours = ticketsList.filter((t) => t.created_at >= oneDayAgo).length;
    }

    // 6. Fetch E911 Records for Attention Required
    let e911Issues: any[] = [];
    if (orgPropIds.length > 0) {
      const { data: e911s } = await db
        .from('e911_records')
        .select('*, organization_property:organization_properties(property:properties(name))')
        .in('organization_property_id', orgPropIds)
        .in('status', ['PENDING', 'CORRECTION_REQUIRED', 'FAILED']);
      e911Issues = e911s || [];
    }

    // Build Attention Required Queue
    const attentionRequired: any[] = [];

    const correctionCount = e911Issues.filter((e) => e.status === 'CORRECTION_REQUIRED').length;
    if (correctionCount > 0) {
      attentionRequired.push({
        id: 'e911-corr',
        severity: 'CRITICAL',
        title: `${correctionCount} E911 correction${correctionCount > 1 ? 's' : ''} required`,
        description: 'PSAP civic address mismatch detected. Please review emergency location.',
        actionLabel: 'Review E911 →',
        actionHref: '/dashboard/e911',
      });
    }

    const failedCount = e911Issues.filter((e) => e.status === 'FAILED').length;
    if (failedCount > 0) {
      attentionRequired.push({
        id: 'e911-fail',
        severity: 'CRITICAL',
        title: `${failedCount} E911 verification${failedCount > 1 ? 's' : ''} failed`,
        description: 'Address validation rejected by MSAG carrier database.',
        actionLabel: 'Fix Location →',
        actionHref: '/dashboard/e911',
      });
    }

    const urgentTickets = ticketsList.filter((t) => t.priority === 'URGENT' && t.status !== 'CLOSED' && t.status !== 'RESOLVED');
    if (urgentTickets.length > 0) {
      attentionRequired.push({
        id: 'urgent-tickets',
        severity: 'CRITICAL',
        title: `${urgentTickets.length} urgent support ticket${urgentTickets.length > 1 ? 's' : ''} pending`,
        description: 'High-priority voice service request requires engineering attention.',
        actionLabel: 'View Tickets →',
        actionHref: '/dashboard/tickets',
      });
    }

    const waitingOnb = onboardingRecords.filter((o) => o.status === 'SOF_WAITING' || o.status === 'PORTING_WAITING');
    if (waitingOnb.length > 0) {
      attentionRequired.push({
        id: 'onb-waiting',
        severity: 'ATTENTION',
        title: `${waitingOnb.length} property onboarding${waitingOnb.length > 1 ? 's' : ''} awaiting sign-off`,
        description: 'Pending carrier Service Order Form (SOF) or porting authorization.',
        actionLabel: 'Track Onboarding →',
        actionHref: '/dashboard/onboarding',
      });
    }

    const focDuePorting = portingRecords.filter((p) => p.status === 'FOC_RECEIVED');
    if (focDuePorting.length > 0) {
      attentionRequired.push({
        id: 'port-foc',
        severity: 'WARNING',
        title: `${focDuePorting.length} carrier cutover${focDuePorting.length > 1 ? 's' : ''} scheduled`,
        description: 'Firm Order Commitment (FOC) confirmed. Number porting window active.',
        actionLabel: 'View Cutover →',
        actionHref: '/dashboard/porting',
      });
    }

    // Build Upcoming Deadlines
    const upcomingDeadlines: any[] = [];
    [...onboardingRecords, ...portingRecords]
      .filter((item) => item.target_date)
      .slice(0, 5)
      .forEach((item, idx) => {
        const propName = item.organization_property?.property?.name || 'Property Location';
        const dateObj = new Date(item.target_date);
        const month = dateObj.toLocaleString('en-US', { month: 'short' }).toUpperCase();
        const day = dateObj.getDate().toString();

        upcomingDeadlines.push({
          id: `dl-${idx}`,
          month,
          day,
          propertyName: propName,
          stage: item.status?.replace(/_/g, ' ') || 'In Progress',
          type: item.signed_at !== undefined ? 'Onboarding' : 'Porting',
        });
      });

    // Build Ticket Analytics
    const ticketStats = {
      open: ticketsList.filter((t) => t.status === 'OPEN').length,
      inProgress: ticketsList.filter((t) => t.status === 'IN_PROGRESS').length,
      waitingOnClient: ticketsList.filter((t) => t.status === 'WAITING_ON_CLIENT').length,
      resolved: ticketsList.filter((t) => t.status === 'RESOLVED').length,
      closed: ticketsList.filter((t) => t.status === 'CLOSED').length,
      resolutionRate:
        ticketsList.length > 0
          ? `${Math.round(
              ((ticketsList.filter((t) => t.status === 'RESOLVED' || t.status === 'CLOSED').length) /
                ticketsList.length) *
                100
            )}%`
          : '100%',
    };

    // Fetch Recent Activity Audit Logs
    const { data: activityLogs } = await db
      .from('audit_logs')
      .select('*')
      .eq('organization_id', orgId)
      .order('created_at', { ascending: false })
      .limit(6);

    return NextResponse.json({
      success: true,
      data: {
        organization: member.organization,
        profile,
        metrics: {
          propertiesCount,
          servicesCount,
          activeOnboardingsCount,
          activePortingCount,
          openTicketsCount,
          ticketsInLast24Hours,
        },
        attentionRequired,
        upcomingDeadlines,
        onboardingProgress: onboardingRecords.slice(0, 4),
        ticketAnalytics: ticketStats,
        recentActivity: activityLogs || [],
      },
    });
  } catch (err: any) {
    console.error('Client Overview API error:', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Failed to fetch overview data' },
      { status: 500 }
    );
  }
}
