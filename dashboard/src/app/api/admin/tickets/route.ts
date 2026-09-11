import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    const { data: tickets, error } = await supabase
      .from('tickets')
      .select(`
        *,
        creator:profiles!tickets_created_by_fkey(id, full_name, email),
        assignee:profiles!tickets_assigned_to_fkey(id, full_name, email),
        org_property:organization_properties(
          id,
          property:properties(id, name, city, state),
          organization:organizations(id, name)
        ),
        comments:ticket_comments(
          id,
          content,
          is_internal,
          created_at,
          author:profiles(id, full_name, email)
        )
      `)
      .order('created_at', { ascending: false });

    if (error) {
      const { data: simpleTickets, error: sErr } = await supabase
        .from('tickets')
        .select('*')
        .order('created_at', { ascending: false });

      if (sErr) {
        return NextResponse.json({ success: false, error: sErr.message }, { status: 400 });
      }

      return NextResponse.json({ success: true, data: simpleTickets || [] });
    }

    return NextResponse.json({ success: true, data: tickets || [] });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message || 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const body = await request.json();

    const {
      organization_property_id,
      subject,
      description,
      priority,
      status,
      assigned_to,
    } = body;

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!subject || !subject.trim()) {
      return NextResponse.json({ success: false, error: 'Ticket subject is required.' }, { status: 400 });
    }

    const { data: newTicket, error } = await supabase
      .from('tickets')
      .insert({
        organization_property_id,
        created_by: user?.id,
        assigned_to: assigned_to || null,
        subject: subject.trim(),
        description: description?.trim() || '',
        priority: priority || 'MEDIUM',
        status: status || 'OPEN',
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true, data: newTicket });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message || 'Internal server error' }, { status: 500 });
  }
}
