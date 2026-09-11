import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    const { data: onboarding, error } = await supabase
      .from('onboardings')
      .select(`
        *,
        org_property:organization_properties(
          id,
          status,
          property:properties(*),
          organization:organizations(*)
        )
      `)
      .eq('id', id)
      .single();

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: onboarding });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message || 'Internal server error' }, { status: 500 });
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

    const updatePayload: Record<string, any> = {
      updated_at: new Date().toISOString(),
    };

    if (body.target_date !== undefined) updatePayload.target_date = body.target_date;

    if (body.status !== undefined) {
      updatePayload.status = body.status;

      // Automatically timestamp milestone transitions
      const now = new Date().toISOString();
      if (body.status === 'CONTRACT_SENT' && !body.contract_sent_at) updatePayload.contract_sent_at = now;
      if (body.status === 'SIGNED' && !body.signed_at) updatePayload.signed_at = now;
      if (body.status === 'PORTING_WAITING' && !body.porting_waiting_at) updatePayload.porting_waiting_at = now;
      if (body.status === 'PORTING_SUBMITTED' && !body.porting_submitted_at) updatePayload.porting_submitted_at = now;
      if (body.status === 'SOF_WAITING' && !body.sof_waiting_at) updatePayload.sof_waiting_at = now;
      if (body.status === 'FOC_RECEIVED' && !body.foc_received_at) updatePayload.foc_received_at = now;
      if (body.status === 'COMPLETED' && !body.completed_at) updatePayload.completed_at = now;
    }

    const { data: updatedOnboarding, error } = await supabase
      .from('onboardings')
      .update(updatePayload)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true, data: updatedOnboarding });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message || 'Internal server error' }, { status: 500 });
  }
}
