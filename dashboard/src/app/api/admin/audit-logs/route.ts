import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    const { data: logs, error } = await supabase
      .from('audit_logs')
      .select(`
        *,
        actor:profiles(id, full_name, email, role),
        organization:organizations(id, name)
      `)
      .order('created_at', { ascending: false })
      .limit(150);

    if (error) {
      const { data: simpleLogs, error: sErr } = await supabase
        .from('audit_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(150);

      if (sErr) {
        return NextResponse.json({ success: false, error: sErr.message }, { status: 400 });
      }

      const formattedSimple = (simpleLogs || []).map((l: any) => formatLogRecord(l));
      return NextResponse.json({ success: true, data: formattedSimple });
    }

    const formatted = (logs || []).map((l: any) => formatLogRecord(l));
    return NextResponse.json({ success: true, data: formatted });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message || 'Internal server error' }, { status: 500 });
  }
}

function formatLogRecord(item: any) {
  const actorName = item.actor?.full_name || item.actor_email?.split('@')[0] || item.actor_name || 'Admin User';
  const actorEmail = item.actor?.email || item.actor_email || 'admin@aaasolutions.com';
  const entityName = item.entity_name || item.organization?.name || 'Entity';
  const dateStr = new Date(item.created_at).toLocaleString();

  // Create human-readable Action title & narrative description
  let actionTitle = item.action ? item.action.replace(/_/g, ' ') : 'System Action';
  let narrative = item.description || `${actorName} executed ${item.action || 'an action'} on ${entityName} at ${dateStr}.`;

  switch (item.action) {
    case 'PROPERTY_CREATED':
      actionTitle = 'New Property Created';
      narrative = `${actorName} created property '${entityName}'${item.changes?.organization_name ? ` and assigned it to '${item.changes.organization_name}'` : ''} at ${dateStr}.`;
      break;
    case 'PROPERTY_UPDATED':
      actionTitle = 'Property Details Updated';
      narrative = `${actorName} updated property configuration for '${entityName}' at ${dateStr}.`;
      break;
    case 'PROPERTY_STATUS_CHANGED':
      actionTitle = 'Property Status Changed';
      narrative = `${actorName} changed status of '${entityName}' to ${item.changes?.status || 'updated status'} at ${dateStr}.`;
      break;
    case 'PROPERTY_ARCHIVED':
      actionTitle = 'Property Archived';
      narrative = `${actorName} archived property '${entityName}' at ${dateStr}.`;
      break;
    case 'PROPERTY_ASSIGNED_TO_ORG':
      actionTitle = 'Property Assigned to Organization';
      narrative = `${actorName} assigned property '${entityName}' to '${item.changes?.organization_name || 'Organization'}' at ${dateStr}.`;
      break;
    case 'PROPERTY_UNASSIGNED_FROM_ORG':
      actionTitle = 'Property Unassigned from Organization';
      narrative = `${actorName} unassigned property '${entityName}' from organization at ${dateStr}.`;
      break;
    case 'PROPERTY_CONTACT_ADDED':
      actionTitle = 'Property Contact Added';
      narrative = `${actorName} added contact '${entityName}' to property at ${dateStr}.`;
      break;
    case 'PROPERTY_CONTACT_REMOVED':
      actionTitle = 'Property Contact Removed';
      narrative = `${actorName} removed contact from property '${item.changes?.property_id || entityName}' at ${dateStr}.`;
      break;
    case 'ORGANIZATION_CREATED':
      actionTitle = 'New Organization Created';
      narrative = `${actorName} created organization '${entityName}' at ${dateStr}.`;
      break;
    case 'ORGANIZATION_STATUS_CHANGED':
      actionTitle = 'Organization Status Changed';
      narrative = `${actorName} changed organization '${entityName}' status to ${item.changes?.status || 'updated'} at ${dateStr}.`;
      break;
    case 'ORGANIZATION_CONTACT_ADDED':
      actionTitle = 'Organization Contact Added';
      narrative = `${actorName} added contact '${entityName}' to organization at ${dateStr}.`;
      break;
    case 'ORGANIZATION_CONTACT_REMOVED':
      actionTitle = 'Organization Contact Removed';
      narrative = `${actorName} removed contact from organization at ${dateStr}.`;
      break;
    case 'SERVICE_CREATED':
      actionTitle = 'Telecom Service Provisioned';
      narrative = `${actorName} provisioned service '${item.changes?.phone_number || entityName}'${item.changes?.assigned_property ? ` and attached to '${item.changes.assigned_property}'` : ''} at ${dateStr}.`;
      break;
    case 'SERVICE_STATUS_CHANGED':
      actionTitle = 'Service Status Changed';
      narrative = `${actorName} changed service status of '${entityName}' to ${item.changes?.status || 'updated'} at ${dateStr}.`;
      break;
    case 'SERVICE_ASSIGNED_TO_PROPERTY':
      actionTitle = 'Service Assigned to Property';
      narrative = `${actorName} assigned service '${item.changes?.service_number || 'Service'}' to property '${entityName}' at ${dateStr}.`;
      break;
    case 'ONBOARDING_INITIALIZED':
      actionTitle = 'Onboarding Pipeline Initialized';
      narrative = `${actorName} initialized onboarding pipeline for '${entityName}' in Draft Initialized stage at ${dateStr}.`;
      break;
    case 'ONBOARDING_STAGE_UPDATED':
      actionTitle = 'Onboarding Stage Updated';
      narrative = `${actorName} updated onboarding stage for '${entityName}' to ${item.changes?.stage || 'updated stage'} at ${dateStr}.`;
      break;
    case 'ONBOARDING_COMPLETED_PROPERTY_ACTIVATED':
      actionTitle = 'Live Cutover Completed (Property Activated)';
      narrative = `${actorName} marked cutover completed for '${entityName}', automatically setting property status to ACTIVE at ${dateStr}.`;
      break;
    case 'TICKET_CREATED':
      actionTitle = 'Support Ticket Created';
      narrative = `${actorName} created support ticket '${entityName}' with priority ${item.changes?.priority || 'MEDIUM'} at ${dateStr}.`;
      break;
  }

  return {
    id: item.id,
    actor_name: actorName,
    actor_email: actorEmail,
    actor_role: item.actor?.role || item.actor_role || 'SUPER_ADMIN',
    action: actionTitle,
    raw_action: item.action,
    entity_type: item.entity_type || 'SYSTEM',
    entity_name: entityName,
    description: narrative,
    ip_address: item.ip_address || '127.0.0.1',
    changes: item.changes || {},
    created_at: item.created_at,
  };
}
