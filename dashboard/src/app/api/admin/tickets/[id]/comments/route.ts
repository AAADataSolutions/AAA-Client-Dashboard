import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { logAuditEvent } from '@/lib/audit/logger';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const body = await request.json();

    const { content, is_internal, new_status } = body;
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    if (!content || !content.trim()) {
      return NextResponse.json({ success: false, error: 'Comment content is required.' }, { status: 400 });
    }

    // Verify ticket exists before inserting comment
    const { data: ticket, error: ticketErr } = await supabase
      .from('tickets')
      .select('id, subject, status')
      .eq('id', id)
      .single();

    if (ticketErr || !ticket) {
      return NextResponse.json({ success: false, error: 'Ticket not found.' }, { status: 404 });
    }

    const isInternal = Boolean(is_internal);

    const { data: newComment, error } = await supabase
      .from('ticket_comments')
      .insert({
        ticket_id: id,
        author_id: user.id,
        content: content.trim(),
        is_internal: isInternal,
      })
      .select(`
        *,
        author:profiles(id, full_name, email, role)
      `)
      .single();

    if (error) {
      console.error('Admin comment insert error:', error);
      return NextResponse.json({ success: false, error: error.message }, { status: 400 });
    }

    // Update ticket status and updated_at
    const updateData: Record<string, any> = {
      updated_at: new Date().toISOString(),
    };

    if (new_status && ['OPEN', 'IN_PROGRESS', 'WAITING_ON_CLIENT', 'RESOLVED', 'CLOSED'].includes(new_status)) {
      updateData.status = new_status;
      if (new_status === 'RESOLVED') updateData.resolved_at = new Date().toISOString();
      if (new_status === 'CLOSED') updateData.closed_at = new Date().toISOString();
    } else if (!isInternal) {
      // Default: If public reply sent, keep in progress or move to in progress if was open
      if (ticket.status === 'OPEN') {
        updateData.status = 'IN_PROGRESS';
      }
    }

    await supabase
      .from('tickets')
      .update(updateData)
      .eq('id', id);

    // Audit Log
    await logAuditEvent({
      action: isInternal ? 'TICKET_INTERNAL_NOTE_ADDED' : 'TICKET_REPLY_SENT',
      entity_type: 'TICKET',
      entity_id: id,
      entity_name: ticket.subject,
      changes: {
        comment_id: newComment.id,
        is_internal: isInternal,
        status_updated_to: updateData.status || ticket.status,
      },
    });

    return NextResponse.json({
      success: true,
      data: newComment,
      message: isInternal ? 'Internal note added.' : 'Reply sent to client.',
    });
  } catch (err: any) {
    console.error('Admin comment error:', err);
    return NextResponse.json({ success: false, error: err.message || 'Internal server error' }, { status: 500 });
  }
}
