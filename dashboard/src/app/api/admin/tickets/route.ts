import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { logAuditEvent } from '@/lib/audit/logger';

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
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const contentType = request.headers.get('content-type') || '';
    let subject = '';
    let description = '';
    let priority = 'MEDIUM';
    let status = 'OPEN';
    let property_id: string | null = null;
    let organization_property_id: string | null = null;
    let assigned_to: string | null = null;
    const files: File[] = [];

    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData();
      subject = (formData.get('subject') as string) || '';
      description = (formData.get('description') as string) || '';
      priority = (formData.get('priority') as string) || 'MEDIUM';
      status = (formData.get('status') as string) || 'OPEN';
      property_id = formData.get('property_id') as string | null;
      organization_property_id = formData.get('organization_property_id') as string | null;
      assigned_to = formData.get('assigned_to') as string | null;

      for (let i = 0; i < 3; i++) {
        const file = formData.get(`attachment_${i}`) as File | null;
        if (file && file.size > 0) {
          files.push(file);
        }
      }
    } else {
      const body = await request.json();
      subject = body.subject || '';
      description = body.description || '';
      priority = body.priority || 'MEDIUM';
      status = body.status || 'OPEN';
      property_id = body.property_id || null;
      organization_property_id = body.organization_property_id || null;
      assigned_to = body.assigned_to || null;
    }

    if (!subject || !subject.trim()) {
      return NextResponse.json({ success: false, error: 'Ticket subject is required.' }, { status: 400 });
    }

    let targetOrgPropId = organization_property_id;

    if (!targetOrgPropId && property_id) {
      const { data: orgProp } = await supabase
        .from('organization_properties')
        .select('id')
        .eq('property_id', property_id)
        .maybeSingle();

      if (orgProp) {
        targetOrgPropId = orgProp.id;
      }
    }

    const { data: newTicket, error } = await supabase
      .from('tickets')
      .insert({
        organization_property_id: targetOrgPropId || null,
        created_by: user?.id || null,
        assigned_to: assigned_to || null,
        subject: subject.trim(),
        description: description?.trim() || '',
        priority: priority || 'MEDIUM',
        status: status || 'OPEN',
      })
      .select()
      .single();

    if (error || !newTicket) {
      return NextResponse.json({ success: false, error: error?.message || 'Failed to create ticket' }, { status: 400 });
    }

    // Process attachments if any
    if (files.length > 0) {
      for (const file of files) {
        const fileExt = file.name.split('.').pop() || 'png';
        const storagePath = `tickets/${newTicket.id}/${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;

        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        const { error: uploadErr } = await supabase.storage
          .from('ticket-attachments')
          .upload(storagePath, buffer, {
            contentType: file.type || 'image/png',
            upsert: true,
          });

        if (uploadErr) {
          console.error('Admin Supabase storage upload error:', uploadErr.message);
        }

        // Insert attachment record into database
        const { error: attInsertErr } = await supabase.from('ticket_attachments').insert({
          ticket_id: newTicket.id,
          uploaded_by: user?.id || null,
          file_name: file.name,
          file_size: file.size,
          mime_type: file.type || 'image/png',
          storage_path: storagePath,
        });

        if (attInsertErr) {
          console.error('Admin ticket_attachments table insert error:', attInsertErr);
        }
      }
    }

    // Central Audit Log
    await logAuditEvent({
      action: 'TICKET_CREATED',
      entity_type: 'TICKET',
      entity_id: newTicket.id,
      entity_name: newTicket.subject,
      changes: {
        ticket_id: newTicket.id,
        subject: newTicket.subject,
        priority: newTicket.priority,
        status: newTicket.status,
        attachments_count: files.length,
      },
    });

    return NextResponse.json({ success: true, data: newTicket });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message || 'Internal server error' }, { status: 500 });
  }
}
