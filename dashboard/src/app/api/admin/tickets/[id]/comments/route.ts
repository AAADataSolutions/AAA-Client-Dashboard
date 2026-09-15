import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const body = await request.json();

    const { content, is_internal } = body;
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
      .select('id, status')
      .eq('id', id)
      .single();

    if (ticketErr || !ticket) {
      return NextResponse.json({ success: false, error: 'Ticket not found.' }, { status: 404 });
    }

    const { data: newComment, error } = await supabase
      .from('ticket_comments')
      .insert({
        ticket_id: id,
        author_id: user.id,
        content: content.trim(),
        is_internal: is_internal ?? false,
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

    // If this is a public reply (not internal note) from admin, update ticket status and updated_at
    if (!is_internal) {
      await supabase
        .from('tickets')
        .update({
          status: ticket.status === 'OPEN' ? 'IN_PROGRESS' : ticket.status,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id);
    }

    return NextResponse.json({ success: true, data: newComment });
  } catch (err: any) {
    console.error('Admin comment error:', err);
    return NextResponse.json({ success: false, error: err.message || 'Internal server error' }, { status: 500 });
  }
}
