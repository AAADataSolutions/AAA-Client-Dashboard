import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { logAuditEvent } from '@/lib/audit/logger';

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

    const dbClient = createAdminClient() || supabase;

    // Call stored procedure activate_porting_property
    const { data: rpcResult, error: rpcErr } = await dbClient.rpc('activate_porting_property', {
      p_porting_request_id: id,
    });

    if (rpcErr) {
      return NextResponse.json({ success: false, error: rpcErr.message }, { status: 400 });
    }

    // Fetch porting request info for logging & notifications
    const { data: porting } = await dbClient
      .from('porting_requests')
      .select('property_name, organization_id, created_by')
      .eq('id', id)
      .single();

    // Log audit event
    await logAuditEvent({
      action: 'PORTING_PROPERTY_ACTIVATED',
      entity_type: 'PROPERTY',
      entity_id: rpcResult?.property_id || id,
      entity_name: porting?.property_name || 'Ported Property',
      changes: rpcResult,
    });

    // Notify client if created_by exists
    if (porting?.created_by) {
      await dbClient.from('notifications').insert({
        recipient_id: porting.created_by,
        sender_id: user.id,
        type: 'PORTING_PROPERTY_ACTIVATED',
        title: `Property Activated: ${porting.property_name}`,
        message: `Your porting request has been completed and the property has been activated. Onboarding is now initialized at Draft stage.`,
        entity_type: 'property',
        entity_id: rpcResult?.property_id,
        organization_id: porting.organization_id,
      });
    }

    return NextResponse.json({ success: true, data: rpcResult });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message || 'Internal server error' }, { status: 500 });
  }
}
