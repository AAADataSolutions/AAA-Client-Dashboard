import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { logAdminAction } from '@/lib/audit/logger';

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

    if (body.emergency_address !== undefined) updatePayload.emergency_address = body.emergency_address.trim();
    if (body.correction_notes !== undefined) updatePayload.correction_notes = body.correction_notes ? body.correction_notes.trim() : null;
    if (body.status !== undefined) {
      updatePayload.status = body.status;
      if (body.status === 'VERIFIED') updatePayload.verified_at = new Date().toISOString();
    }

    const { data: updatedRecord, error } = await supabase
      .from('e911_records')
      .update(updatePayload)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 400 });
    }

    await logAdminAction({
      action: body.status === 'VERIFIED' ? 'E911_VERIFIED' : 'E911_RECORD_UPDATED',
      entity_type: 'E911',
      entity_id: id,
      entity_name: updatedRecord.emergency_address,
      description: body.status === 'VERIFIED'
        ? `Verified and approved E911 compliance for '${updatedRecord.emergency_address}'`
        : `Updated E911 record for '${updatedRecord.emergency_address}'`,
      changes: updatePayload,
    });

    return NextResponse.json({ success: true, data: updatedRecord });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message || 'Internal server error' }, { status: 500 });
  }
}
