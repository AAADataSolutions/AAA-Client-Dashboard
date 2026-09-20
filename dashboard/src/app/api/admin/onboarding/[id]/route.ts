import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { logAdminAction } from '@/lib/audit/logger';

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
    if (body.target_completion_date !== undefined) updatePayload.target_completion_date = body.target_completion_date;
    if (body.draft_date !== undefined) updatePayload.draft_date = body.draft_date || null;
    if (body.contract_sent_date !== undefined) updatePayload.contract_sent_date = body.contract_sent_date || null;
    if (body.signed_date !== undefined) updatePayload.signed_date = body.signed_date || null;
    if (body.porting_submitted_date !== undefined) updatePayload.porting_submitted_date = body.porting_submitted_date || null;
    if (body.sof_review_date !== undefined) updatePayload.sof_review_date = body.sof_review_date || null;
    if (body.foc_confirmed_date !== undefined) updatePayload.foc_confirmed_date = body.foc_confirmed_date || null;
    if (body.live_cutover_date !== undefined) updatePayload.live_cutover_date = body.live_cutover_date || null;

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
      .select(`
        *,
        org_property:organization_properties(
          id,
          property_id,
          property:properties(id, name, status)
        )
      `)
      .single();

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 400 });
    }

    let activatedProperty = false;
    if (body.status === 'COMPLETED' && updatedOnboarding?.org_property?.property_id) {
      await supabase
        .from('properties')
        .update({ status: 'ACTIVE', updated_at: new Date().toISOString() })
        .eq('id', updatedOnboarding.org_property.property_id);
      activatedProperty = true;
    }

    const propName = updatedOnboarding?.org_property?.property?.name || 'Property';

    // Audit Log
    await logAdminAction({
      action: body.status === 'COMPLETED' ? 'ONBOARDING_COMPLETED_PROPERTY_ACTIVATED' : 'ONBOARDING_STAGE_UPDATED',
      entity_type: 'ONBOARDING',
      entity_id: id,
      entity_name: propName,
      description: body.status === 'COMPLETED'
        ? `Completed cutover for '${propName}', automatically setting property status to ACTIVE`
        : `Updated onboarding stage for '${propName}' to ${body.status || 'updated'}`,
      changes: {
        stage: body.status,
        target_date: body.target_date,
        property_id: updatedOnboarding?.org_property?.property_id,
        property_activated: activatedProperty,
      },
    });

    return NextResponse.json({ success: true, data: updatedOnboarding, propertyActivated: activatedProperty });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message || 'Internal server error' }, { status: 500 });
  }
}
