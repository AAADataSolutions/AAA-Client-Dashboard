import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

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

    const { data: member } = await supabase
      .from('organization_members')
      .select('organization_id')
      .eq('profile_id', user.id)
      .maybeSingle();

    if (!member?.organization_id) {
      return NextResponse.json({ success: false, error: 'Organization not found' }, { status: 404 });
    }

    const { data: ticket, error } = await supabase
      .from('tickets')
      .select(`
        *,
        creator:profiles!tickets_created_by_fkey(id, full_name, email, role, phone_number),
        assignee:profiles!tickets_assigned_to_fkey(id, full_name, email, role),
        organization_property:organization_properties(
          id,
          organization_id,
          property:properties(id, name, city, state, main_phone)
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

    // Verify tenant ownership
    if (ticket.organization_property?.organization_id !== member.organization_id) {
      return NextResponse.json({ success: false, error: 'Access denied' }, { status: 403 });
    }

    // Filter comments to exclude internal admin notes for client side
    const visibleComments = (ticket.comments || [])
      .filter((c: any) => !c.is_internal)
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

    // Extract category and related items from description if they exist
    let category = null;
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
        console.warn('Failed to parse attachments JSON from description:', e);
      }
      cleanDescription = cleanDescription.replace(attachmentsMatch[0], '').trim();
    }

    const relatedItems: {
      property?: string;
      e911?: string;
      onboarding?: string;
      service?: string;
      porting?: string;
    } = {};

    const relatedMatch = cleanDescription.match(/\n\n--- Related Items ---\n([\s\S]*)$/);
    if (relatedMatch) {
      const block = relatedMatch[1];
      cleanDescription = cleanDescription.replace(relatedMatch[0], '').trim();
      const pMatch = block.match(/Property: (.+)/);
      if (pMatch) relatedItems.property = pMatch[1].trim();
      const eMatch = block.match(/E911: (.+)/);
      if (eMatch) relatedItems.e911 = eMatch[1].trim();
      const oMatch = block.match(/Onboarding: (.+)/);
      if (oMatch) relatedItems.onboarding = oMatch[1].trim();
      const sMatch = block.match(/Service: (.+)/);
      if (sMatch) relatedItems.service = sMatch[1].trim();
      const portMatch = block.match(/Porting: (.+)/);
      if (portMatch) relatedItems.porting = portMatch[1].trim();
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

    return NextResponse.json({
      success: true,
      data: {
        ...ticket,
        ticket_number: generateTicketNumber(ticket.id),
        category,
        related_items: Object.keys(relatedItems).length > 0 ? relatedItems : null,
        clean_description: cleanDescription,
        comments: visibleComments,
        attachments: finalAttachments,
      },
    });
  } catch (err: any) {
    console.error('Client Single Ticket API error:', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Failed to fetch ticket' },
      { status: 500 }
    );
  }
}

export async function POST(
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

    const body = await request.json();
    const { content } = body;

    if (!content || !content.trim()) {
      return NextResponse.json({ success: false, error: 'Comment message is required.' }, { status: 400 });
    }

    // Verify that this ticket exists and user has access (via has_org_property_access RLS)
    const { data: ticket, error: ticketErr } = await supabase
      .from('tickets')
      .select('id, organization_property_id, status')
      .eq('id', id)
      .single();

    if (ticketErr || !ticket) {
      return NextResponse.json(
        { success: false, error: 'Ticket not found or access denied.' },
        { status: 404 }
      );
    }

    // Insert comment — RLS policy checks has_org_property_access(ticket.organization_property_id) + is_internal=false
    const { data: newComment, error: commentErr } = await supabase
      .from('ticket_comments')
      .insert({
        ticket_id: id,
        author_id: user.id,
        content: content.trim(),
        is_internal: false,
      })
      .select('*, author:profiles(id, full_name, email, role)')
      .single();

    if (commentErr || !newComment) {
      console.error('Comment insert error:', commentErr);
      throw commentErr || new Error('Failed to post comment');
    }

    // Update ticket updated_at and status only if it was waiting on client
    const updateData: any = {
      updated_at: new Date().toISOString(),
    };
    if (ticket.status === 'WAITING_ON_CLIENT') {
      updateData.status = 'IN_PROGRESS';
    }

    await supabase
      .from('tickets')
      .update(updateData)
      .eq('id', id);

    return NextResponse.json({
      success: true,
      data: newComment,
      message: 'Reply posted successfully.',
    });
  } catch (err: any) {
    console.error('Client Ticket Comment error:', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Failed to post reply' },
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
    const {
      data: { user },
      error: authErr,
    } = await supabase.auth.getUser();

    if (authErr || !user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { status } = body;

    if (!status || !['RESOLVED', 'CLOSED', 'OPEN'].includes(status)) {
      return NextResponse.json({ success: false, error: 'Invalid status update.' }, { status: 400 });
    }

    const updates: any = {
      status,
      updated_at: new Date().toISOString(),
    };

    if (status === 'RESOLVED') {
      updates.resolved_at = new Date().toISOString();
    } else if (status === 'CLOSED') {
      updates.closed_at = new Date().toISOString();
    }

    const { data: updatedTicket, error: updateErr } = await supabase
      .from('tickets')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (updateErr || !updatedTicket) {
      throw updateErr || new Error('Failed to update ticket');
    }

    return NextResponse.json({
      success: true,
      data: updatedTicket,
      message: `Ticket marked as ${status.toLowerCase()}.`,
    });
  } catch (err: any) {
    console.error('Client Ticket Status error:', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Failed to update ticket status' },
      { status: 500 }
    );
  }
}
