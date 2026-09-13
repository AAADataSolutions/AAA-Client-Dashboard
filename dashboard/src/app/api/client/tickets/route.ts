import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authErr,
    } = await supabase.auth.getUser();

    if (authErr || !user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { data: member } = await supabase
      .from('organization_members')
      .select('organization_id')
      .eq('profile_id', user.id)
      .maybeSingle();

    if (!member?.organization_id) {
      return NextResponse.json({
        success: true,
        data: [],
        metrics: { total: 0, open: 0, waitingOnClient: 0, resolvedOrClosed: 0, last24Hours: 0 },
      });
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('q')?.toLowerCase() || '';
    const statusFilter = searchParams.get('status') || 'ALL';
    const priorityFilter = searchParams.get('priority') || 'ALL';
    const propertyFilter = searchParams.get('property_id') || 'ALL';

    // Get organization properties for tenant
    const { data: orgProps } = await supabase
      .from('organization_properties')
      .select('id, property:properties(id, name, city, state)')
      .eq('organization_id', member.organization_id);

    const orgPropIds = (orgProps || []).map((op) => op.id);

    if (orgPropIds.length === 0) {
      return NextResponse.json({
        success: true,
        data: [],
        metrics: { total: 0, open: 0, waitingOnClient: 0, resolvedOrClosed: 0, last24Hours: 0 },
      });
    }

    const { data: ticketRecords, error } = await supabase
      .from('tickets')
      .select(`
        *,
        creator:profiles!tickets_created_by_fkey(id, full_name, email),
        assignee:profiles!tickets_assigned_to_fkey(id, full_name, email),
        organization_property:organization_properties(
          id,
          property:properties(id, name, city, state)
        ),
        comments:ticket_comments(id, is_internal)
      `)
      .in('organization_property_id', orgPropIds)
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 400 });
    }

    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

    const allTickets = (ticketRecords || []).map((t: any) => {
      const prop = t.organization_property?.property;
      // Exclude internal notes from comments count for client view
      const visibleComments = (t.comments || []).filter((c: any) => !c.is_internal);

      return {
        id: t.id,
        subject: t.subject,
        description: t.description,
        status: t.status,
        priority: t.priority,
        property_id: prop?.id,
        property_name: prop?.name || 'General Property',
        property_location: prop ? `${prop.city}, ${prop.state}` : '',
        created_by_name: t.creator?.full_name || 'Organization User',
        created_by_email: t.creator?.email,
        assigned_to_name: t.assignee?.full_name || 'Engineering Support',
        comments_count: visibleComments.length,
        resolved_at: t.resolved_at,
        closed_at: t.closed_at,
        created_at: t.created_at,
        updated_at: t.updated_at,
      };
    });

    const total = allTickets.length;
    const open = allTickets.filter((t) => t.status === 'OPEN' || t.status === 'IN_PROGRESS').length;
    const waitingOnClient = allTickets.filter((t) => t.status === 'WAITING_ON_CLIENT').length;
    const resolvedOrClosed = allTickets.filter((t) => t.status === 'RESOLVED' || t.status === 'CLOSED').length;
    const last24Hours = allTickets.filter((t) => t.created_at >= oneDayAgo).length;

    let filtered = allTickets;
    if (search) {
      filtered = filtered.filter(
        (t) =>
          t.subject.toLowerCase().includes(search) ||
          t.description.toLowerCase().includes(search) ||
          t.property_name.toLowerCase().includes(search)
      );
    }
    if (statusFilter !== 'ALL') {
      filtered = filtered.filter((t) => t.status === statusFilter);
    }
    if (priorityFilter !== 'ALL') {
      filtered = filtered.filter((t) => t.priority === priorityFilter);
    }
    if (propertyFilter !== 'ALL') {
      filtered = filtered.filter((t) => t.property_id === propertyFilter);
    }

    return NextResponse.json({
      success: true,
      data: filtered,
      metrics: { total, open, waitingOnClient, resolvedOrClosed, last24Hours },
    });
  } catch (err: any) {
    console.error('Client Tickets API error:', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Failed to fetch tickets' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authErr,
    } = await supabase.auth.getUser();

    if (authErr || !user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { data: member } = await supabase
      .from('organization_members')
      .select('organization_id')
      .eq('profile_id', user.id)
      .maybeSingle();

    if (!member?.organization_id) {
      return NextResponse.json(
        { success: false, error: 'You must belong to an organization to raise tickets.' },
        { status: 403 }
      );
    }

    const body = await request.json();
    let { organization_property_id, property_id, subject, description, priority } = body;

    if (!subject || !subject.trim()) {
      return NextResponse.json({ success: false, error: 'Ticket subject is required.' }, { status: 400 });
    }
    if (!description || !description.trim()) {
      return NextResponse.json({ success: false, error: 'Ticket description is required.' }, { status: 400 });
    }

    // If property_id was provided instead of organization_property_id, resolve it
    if (!organization_property_id && property_id) {
      const { data: op } = await supabase
        .from('organization_properties')
        .select('id')
        .eq('organization_id', member.organization_id)
        .eq('property_id', property_id)
        .maybeSingle();

      if (op) organization_property_id = op.id;
    }

    // Fallback to first property if not selected
    if (!organization_property_id) {
      const { data: defaultOp } = await supabase
        .from('organization_properties')
        .select('id')
        .eq('organization_id', member.organization_id)
        .limit(1)
        .maybeSingle();

      if (defaultOp) organization_property_id = defaultOp.id;
    }

    if (!organization_property_id) {
      return NextResponse.json(
        { success: false, error: 'No property attached to your organization.' },
        { status: 400 }
      );
    }

    const { data: newTicket, error: insertErr } = await supabase
      .from('tickets')
      .insert({
        organization_property_id,
        created_by: user.id,
        subject: subject.trim(),
        description: description.trim(),
        priority: priority || 'MEDIUM',
        status: 'OPEN',
      })
      .select()
      .single();

    if (insertErr || !newTicket) {
      throw insertErr || new Error('Failed to create ticket');
    }

    return NextResponse.json({
      success: true,
      data: newTicket,
      message: 'Support ticket raised successfully.',
    });
  } catch (err: any) {
    console.error('Client Ticket Creation error:', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Failed to create support ticket' },
      { status: 500 }
    );
  }
}
