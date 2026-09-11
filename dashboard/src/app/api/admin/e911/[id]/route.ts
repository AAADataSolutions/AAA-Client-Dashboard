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

    return NextResponse.json({ success: true, data: updatedRecord });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message || 'Internal server error' }, { status: 500 });
  }
}
