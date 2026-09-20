import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { logAuditEvent } from '@/lib/audit/logger';

// Generate a deterministic 8-digit ticket number from UUID
function generateTicketNumber(uuid: string): string {
  const hex = uuid.replace(/-/g, '').substring(0, 8);
  const num = parseInt(hex, 16) % 100000000;
  return num.toString().padStart(8, '0');
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const {
      data: { user },
      error: authErr,
    } = await supabase.auth.getUser();

    if (authErr || !user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { data: ticket, error } = await supabase
      .from('tickets')
      .select(`
        *,
        creator:profiles!tickets_created_by_fkey(id, full_name, email, role, phone_number),
        assignee:profiles!tickets_assigned_to_fkey(id, full_name, email, role),
        organization_property:organization_properties(
          id,
          property:properties(id, name, city, state, main_phone),
          organization:organizations(id, name)
        ),
        comments:ticket_comments(
          id,
          content,
          is_internal,
          created_at,
          updated_at,
          author:profiles(id, full_name, email, role)
        ),
        attachments:ticket_attachments(
          id,
          file_name,
          file_size,
          mime_type,
          storage_path,
          created_at
        )
      `)
      .eq('id', id)
      .single();

    if (error || !ticket) {
      return NextResponse.json(
        { success: false, error: error?.message || 'Ticket not found' },
        { status: 404 }
      );
    }

    // Sort comments chronologically
    const sortedComments = (ticket.comments || [])
      .sort((a: any, b: any) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

    // Generate direct Supabase public URLs for attachments
    const attachmentsWithUrls = await Promise.all(
      (ticket.attachments || []).map(async (att: any) => {
        let url = '';
        if (att.storage_path?.startsWith('http') || att.storage_path?.startsWith('data:')) {
          url = att.storage_path;
        } else if (att.storage_path) {
          const { data: publicData } = supabase.storage
            .from('ticket-attachments')
            .getPublicUrl(att.storage_path);
          url = publicData?.publicUrl || '';
        }
        return {
          ...att,
          url: url || '',
        };
      })
    );

    // Extract category & related items from description
    let category = ticket.category || null;
    let cleanDescription = ticket.description || '';
    
    const categoryMatch = cleanDescription.match(/^\[Category: ([^\]]+)\]\n\n/);
    if (categoryMatch) {
      category = categoryMatch[1];
      cleanDescription = cleanDescription.replace(categoryMatch[0], '');
    }

    // Extract attachments from description if stored in metadata block
    let metadataAttachments: any[] = [];
    const attachmentsMatch = cleanDescription.match(/\n\n--- Attachments ---\n([\s\S]*)$/);
    if (attachmentsMatch) {
      try {
        metadataAttachments = JSON.parse(attachmentsMatch[1].trim());
      } catch (e) {
        console.warn('Failed to parse attachments JSON in admin single ticket:', e);
      }
      cleanDescription = cleanDescription.replace(attachmentsMatch[0], '').trim();
    }

    // Extract related items section if present
    let relatedItems: Record<string, string> = {};
    const relatedSectionMatch = cleanDescription.match(/\n\n--- Related Items ---\n([\s\S]+)$/);
    if (relatedSectionMatch) {
      const itemsBlock = relatedSectionMatch[1];
      itemsBlock.split('\n').forEach((line: string) => {
        const parts = line.split(': ');
        if (parts.length >= 2) {
          const key = parts[0].trim();
          const val = parts.slice(1).join(': ').trim();
          relatedItems[key] = val;
        }
      });
      cleanDescription = cleanDescription.replace(relatedSectionMatch[0], '');
    }

    // Combine attachments from table and description metadata
    let finalAttachments = attachmentsWithUrls;
    if (finalAttachments.length === 0 && metadataAttachments.length > 0) {
      finalAttachments = metadataAttachments.map((m: any, idx: number) => ({
        id: `att-meta-${idx}`,
        file_name: m.file_name,
        file_size: m.file_size,
        mime_type: m.mime_type,
        url: m.url || m.storage_path,
        storage_path: m.storage_path || m.url,
      }));
    }

    const orgProp = ticket.organization_property;
    const property = orgProp?.property;
    const organization = orgProp?.organization;

    return NextResponse.json({
      success: true,
      data: {
        ...ticket,
        ticket_number: generateTicketNumber(ticket.id),
        display_id: `TCK-${generateTicketNumber(ticket.id)}`,
        category: category || 'General Support',
        clean_description: cleanDescription.trim(),
        related_items: relatedItems,
        property_name: property?.name || relatedItems['Property'] || 'General Property',
        property_location: property ? `${property.city || ''}, ${property.state || ''}`.trim() : '',
        organization_name: organization?.name || 'Customer Organization',
        created_by_name: ticket.creator?.full_name || 'Client User',
        created_by_email: ticket.creator?.email || '',
        created_by_phone: ticket.creator?.phone_number || '',
        assigned_to_name: ticket.assignee?.full_name || 'Unassigned',
        comments: sortedComments,
        attachments: finalAttachments,
      },
    });
  } catch (err: any) {
    console.error('Admin Single Ticket API error:', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Failed to fetch ticket' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const body = await request.json();

    const {
      data: { user },
      error: authErr,
    } = await supabase.auth.getUser();

    if (authErr || !user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const updatePayload: Record<string, any> = {
      updated_at: new Date().toISOString(),
    };

    if (body.priority !== undefined) updatePayload.priority = body.priority;
    if (body.assigned_to !== undefined) updatePayload.assigned_to = body.assigned_to || null;
    if (body.status !== undefined) {
      updatePayload.status = body.status;
      if (body.status === 'RESOLVED') updatePayload.resolved_at = new Date().toISOString();
      if (body.status === 'CLOSED') updatePayload.closed_at = new Date().toISOString();
    }

    const { data: updatedTicket, error } = await supabase
      .from('tickets')
      .update(updatePayload)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 400 });
    }

    // Log audit event
    await logAuditEvent({
      action: 'TICKET_UPDATED',
      entity_type: 'TICKET',
      entity_id: id,
      entity_name: updatedTicket.subject,
      changes: updatePayload,
    });

    return NextResponse.json({ success: true, data: updatedTicket });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message || 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    const {
      data: { user },
      error: authErr,
    } = await supabase.auth.getUser();

    if (authErr || !user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { data: ticket } = await supabase
      .from('tickets')
      .select('id, subject')
      .eq('id', id)
      .maybeSingle();

    if (!ticket) {
      return NextResponse.json({ success: false, error: 'Ticket not found' }, { status: 404 });
    }

    // Unlink / clean up comments and attachments
    await supabase.from('ticket_comments').delete().eq('ticket_id', id);
    await supabase.from('ticket_attachments').delete().eq('ticket_id', id);

    // Delete ticket
    const { error: deleteErr } = await supabase.from('tickets').delete().eq('id', id);

    if (deleteErr) {
      return NextResponse.json({ success: false, error: deleteErr.message }, { status: 400 });
    }

    // Log audit event
    await logAuditEvent({
      action: 'TICKET_DELETED',
      entity_type: 'TICKET',
      entity_id: id,
      entity_name: ticket.subject,
      changes: { deleted: true },
    });

    return NextResponse.json({ success: true, message: 'Ticket deleted successfully' });
  } catch (err: any) {
    console.error('Admin delete ticket error:', err);
    return NextResponse.json({ success: false, error: err.message || 'Internal server error' }, { status: 500 });
  }
}

