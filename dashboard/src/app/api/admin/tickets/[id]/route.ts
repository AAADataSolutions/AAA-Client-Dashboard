import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const body = await request.json();

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

    return NextResponse.json({ success: true, data: updatedTicket });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message || 'Internal server error' }, { status: 500 });
  }
}
