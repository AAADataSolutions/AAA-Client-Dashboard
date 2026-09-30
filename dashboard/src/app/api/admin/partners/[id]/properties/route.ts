import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { logAuditEvent } from '@/lib/audit/logger';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: partnerId } = await params;
    const supabase = await createClient();
    const body = await request.json();

    const { property_id, action, commission_override } = body;

    if (!property_id) {
      return NextResponse.json({ success: false, error: 'Property ID is required.' }, { status: 400 });
    }

    if (action === 'UNASSIGN') {
      const { error } = await supabase
        .from('properties')
        .update({ partner_id: null, partner_commission_override: null, updated_at: new Date().toISOString() })
        .eq('id', property_id);

      if (error) {
        return NextResponse.json({ success: false, error: error.message }, { status: 400 });
      }

      await logAuditEvent({
        action: 'PARTNER_PROPERTY_UNASSIGNED',
        entity_type: 'PARTNER',
        entity_id: partnerId,
        changes: { property_id, action: 'UNASSIGN' },
      });

      return NextResponse.json({ success: true, message: 'Property unassigned from partner.' });
    }

    // Default action: ASSIGN or UPDATE_OVERRIDE
    const updatePayload: Record<string, any> = {
      partner_id: partnerId,
      updated_at: new Date().toISOString(),
    };

    if (commission_override !== undefined && commission_override !== '' && commission_override !== null) {
      updatePayload.partner_commission_override = Number(commission_override);
    } else {
      updatePayload.partner_commission_override = null;
    }

    const { data: updatedProp, error: propErr } = await supabase
      .from('properties')
      .update(updatePayload)
      .eq('id', property_id)
      .select('id, name, monthly_price, partner_id, partner_commission_override')
      .single();

    if (propErr) {
      return NextResponse.json({ success: false, error: propErr.message }, { status: 400 });
    }

    await logAuditEvent({
      action: 'PARTNER_PROPERTY_ASSIGNED',
      entity_type: 'PARTNER',
      entity_id: partnerId,
      changes: { property_id, partner_id: partnerId, commission_override: updatePayload.partner_commission_override },
    });

    return NextResponse.json({ success: true, data: updatedProp });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message || 'Internal server error' }, { status: 500 });
  }
}
