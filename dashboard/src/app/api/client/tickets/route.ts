import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// Generate a deterministic 8-digit ticket number from UUID
function generateTicketNumber(uuid: string): string {
  // Use the first 8 hex chars of UUID and convert to a numeric string
  const hex = uuid.replace(/-/g, '').substring(0, 8);
  const num = parseInt(hex, 16) % 100000000;
  return num.toString().padStart(8, '0');
}

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
        creator:profiles!tickets_created_by_fkey(id, full_name, email, phone_number),
        assignee:profiles!tickets_assigned_to_fkey(id, full_name, email),
        organization_property:organization_properties(
          id,
          property:properties(id, name, city, state)
        ),
        comments:ticket_comments(id, content, is_internal, created_at, author:profiles(id, full_name, email, role))
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

      // Find the last admin reply (from SUPER_ADMIN or SUB_SUPER_ADMIN)
      const adminReplies = visibleComments
        .filter((c: any) => c.author?.role === 'SUPER_ADMIN' || c.author?.role === 'SUB_SUPER_ADMIN')
        .sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

      const lastAdminReply = adminReplies.length > 0 ? adminReplies[0] : null;

      return {
        id: t.id,
        ticket_number: generateTicketNumber(t.id),
        subject: t.subject,
        description: t.description,
        status: t.status,
        priority: t.priority,
        category: t.category || null,
        property_id: prop?.id,
        property_name: prop?.name || 'General Property',
        property_location: prop ? `${prop.city}, ${prop.state}` : '',
        created_by_name: t.creator?.full_name || 'Organization User',
        created_by_email: t.creator?.email,
        created_by_phone: t.creator?.phone_number || '',
        assigned_to_name: t.assignee?.full_name || 'Engineering Support',
        comments_count: visibleComments.length,
        last_reply: lastAdminReply
          ? {
              content: lastAdminReply.content,
              created_at: lastAdminReply.created_at,
              author_name: lastAdminReply.author?.full_name || 'Admin Support',
            }
          : null,
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
          t.property_name.toLowerCase().includes(search) ||
          t.ticket_number.includes(search)
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

    const contentType = request.headers.get('content-type') || '';

    // Handle multipart form data (with attachments)
    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData();
      let organization_property_id = formData.get('organization_property_id') as string | null;
      const property_id = formData.get('property_id') as string | null;
      const subject = formData.get('subject') as string;
      const description = formData.get('description') as string;
      const priority = (formData.get('priority') as string) || 'MEDIUM';
      const category = formData.get('category') as string | null;
      const phone_number = formData.get('phone_number') as string | null;

      if (!subject || !subject.trim()) {
        return NextResponse.json({ success: false, error: 'Ticket subject is required.' }, { status: 400 });
      }
      if (!description || !description.trim()) {
        return NextResponse.json({ success: false, error: 'Ticket description is required.' }, { status: 400 });
      }

      // Resolve organization_property_id
      if (!organization_property_id && property_id) {
        const { data: op } = await supabase
          .from('organization_properties')
          .select('id')
          .eq('organization_id', member.organization_id)
          .eq('property_id', property_id)
          .maybeSingle();
        if (op) organization_property_id = op.id;
      }

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

      // Update phone number on profile if provided
      if (phone_number && phone_number.trim()) {
        await supabase
          .from('profiles')
          .update({ phone_number: phone_number.trim() })
          .eq('id', user.id);
      }

      // Build the description with category prefix
      const fullDescription = category
        ? `[Category: ${category}]\n\n${description.trim()}`
        : description.trim();

      // Create ticket
      const { data: newTicket, error: insertErr } = await supabase
        .from('tickets')
        .insert({
          organization_property_id,
          created_by: user.id,
          subject: subject.trim(),
          description: fullDescription,
          priority,
          status: 'OPEN',
        })
        .select()
        .single();

      if (insertErr || !newTicket) {
        throw insertErr || new Error('Failed to create ticket');
      }

      // Handle file attachments (max 3)
      const files: File[] = [];
      for (let i = 0; i < 3; i++) {
        const file = formData.get(`attachment_${i}`) as File | null;
        if (file && file.size > 0) {
          files.push(file);
        }
      }

      if (files.length > 0) {
        for (const file of files) {
          const fileExt = file.name.split('.').pop() || 'png';
          const storagePath = `tickets/${newTicket.id}/${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;

          const arrayBuffer = await file.arrayBuffer();
          const buffer = Buffer.from(arrayBuffer);

          const { error: uploadErr } = await supabase.storage
            .from('ticket-attachments')
            .upload(storagePath, buffer, {
              contentType: file.type,
              upsert: false,
            });

          if (!uploadErr) {
            // Insert attachment record
            await supabase.from('ticket_attachments').insert({
              ticket_id: newTicket.id,
              uploaded_by: user.id,
              file_name: file.name,
              file_size: file.size,
              mime_type: file.type,
              storage_path: storagePath,
            });
          } else {
            console.error('File upload error:', uploadErr.message);
          }
        }
      }

      return NextResponse.json({
        success: true,
        data: newTicket,
        message: 'Support ticket raised successfully.',
      });
    }

    // Handle JSON body (without attachments)
    const body = await request.json();
    let { organization_property_id, property_id, subject, description, priority, category, phone_number } = body;

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

    // Update phone number on profile if provided
    if (phone_number && phone_number.trim()) {
      await supabase
        .from('profiles')
        .update({ phone_number: phone_number.trim() })
        .eq('id', user.id);
    }

    // Build the description with category prefix
    const fullDescription = category
      ? `[Category: ${category}]\n\n${description.trim()}`
      : description.trim();

    const { data: newTicket, error: insertErr } = await supabase
      .from('tickets')
      .insert({
        organization_property_id,
        created_by: user.id,
        subject: subject.trim(),
        description: fullDescription,
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
