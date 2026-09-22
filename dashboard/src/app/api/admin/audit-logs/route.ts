import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const adminClient = createAdminClient();
    const db = adminClient || supabase;

    const { searchParams } = new URL(request.url);
    const limit = Math.max(1, Math.min(500, parseInt(searchParams.get('limit') || '200', 10)));
    const search = searchParams.get('search')?.trim().toLowerCase() || '';
    const actionFilter = searchParams.get('action') || 'ALL';

    const { data: logs, error } = await db
      .from('audit_logs')
      .select(`
        *,
        actor:profiles(id, full_name, email, role),
        organization:organizations(id, name)
      `)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      const { data: simpleLogs, error: sErr } = await db
        .from('audit_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (sErr) {
        return NextResponse.json({ success: false, error: sErr.message }, { status: 400 });
      }

      let formattedSimple = (simpleLogs || []).map((l: any) => formatLogRecord(l));
      formattedSimple = applyFilters(formattedSimple, search, actionFilter);

      return NextResponse.json({
        success: true,
        data: formattedSimple,
        total: formattedSimple.length,
      });
    }

    let formatted = (logs || []).map((l: any) => formatLogRecord(l));
    formatted = applyFilters(formatted, search, actionFilter);

    return NextResponse.json({
      success: true,
      data: formatted,
      total: formatted.length,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message || 'Internal server error' }, { status: 500 });
  }
}

function applyFilters(logs: any[], search: string, actionFilter: string) {
  let filtered = logs;

  if (actionFilter !== 'ALL') {
    filtered = filtered.filter(
      (l) =>
        l.entity_type?.toUpperCase().includes(actionFilter.toUpperCase()) ||
        l.raw_action?.toUpperCase().includes(actionFilter.toUpperCase()) ||
        l.action?.toUpperCase().includes(actionFilter.toUpperCase())
    );
  }

  if (search) {
    filtered = filtered.filter(
      (l) =>
        l.action?.toLowerCase().includes(search) ||
        l.raw_action?.toLowerCase().includes(search) ||
        l.actor_email?.toLowerCase().includes(search) ||
        l.actor_name?.toLowerCase().includes(search) ||
        l.entity_name?.toLowerCase().includes(search) ||
        l.description?.toLowerCase().includes(search)
    );
  }

  return filtered;
}

function formatLogRecord(item: any) {
  const actorName = item.actor?.full_name || item.actor_name || item.actor_email?.split('@')[0] || 'Admin User';
  const actorEmail = item.actor?.email || item.actor_email || 'admin@aaasolutions.com';
  const actorRole = item.actor?.role || item.actor_role || 'SUPER_ADMIN';
  const entityName = item.entity_name || item.organization?.name || 'Entity';
  const dateStr = item.created_at ? new Date(item.created_at).toLocaleString() : '';

  // Create human-readable Action title & narrative description
  let actionTitle = item.action ? item.action.replace(/_/g, ' ') : 'System Action';
  let narrative = item.description || `${actorName} executed ${actionTitle} on ${entityName} at ${dateStr}.`;

  switch (item.action) {
    case 'PROPERTY_CREATED':
      actionTitle = 'New Property Created';
      narrative = narrative || `${actorName} created property '${entityName}'${item.changes?.organization_name ? ` and assigned it to '${item.changes.organization_name}'` : ''} at ${dateStr}.`;
      break;
    case 'PROPERTY_UPDATED':
      actionTitle = 'Property Details Updated';
      narrative = narrative || `${actorName} updated property configuration for '${entityName}' at ${dateStr}.`;
      break;
    case 'PROPERTY_STATUS_CHANGED':
      actionTitle = 'Property Status Changed';
      narrative = narrative || `${actorName} changed status of '${entityName}' to ${item.changes?.status || 'updated status'} at ${dateStr}.`;
      break;
    case 'PROPERTY_ARCHIVED':
      actionTitle = 'Property Archived';
      narrative = narrative || `${actorName} archived property '${entityName}' at ${dateStr}.`;
      break;
    case 'PROPERTY_ASSIGNED_TO_ORGANIZATION':
    case 'PROPERTY_ASSIGNED_TO_ORG':
      actionTitle = 'Property Assigned to Organization';
      narrative = narrative || `${actorName} assigned property '${entityName}' to organization at ${dateStr}.`;
      break;
    case 'PROPERTY_UNASSIGNED_FROM_ORGANIZATION':
    case 'PROPERTY_UNASSIGNED_FROM_ORG':
      actionTitle = 'Property Unassigned from Organization';
      narrative = narrative || `${actorName} unassigned property '${entityName}' from organization at ${dateStr}.`;
      break;
    case 'PROPERTY_CONTACT_ADDED':
      actionTitle = 'Property Contact Added';
      narrative = narrative || `${actorName} added contact '${entityName}' to property at ${dateStr}.`;
      break;
    case 'PROPERTY_CONTACT_REMOVED':
      actionTitle = 'Property Contact Removed';
      narrative = narrative || `${actorName} removed contact from property '${entityName}' at ${dateStr}.`;
      break;
    case 'ORGANIZATION_CREATED':
      actionTitle = 'New Organization Created';
      narrative = narrative || `${actorName} created organization '${entityName}' at ${dateStr}.`;
      break;
    case 'ORGANIZATION_UPDATED':
      actionTitle = 'Organization Details Updated';
      narrative = narrative || `${actorName} updated organization details for '${entityName}' at ${dateStr}.`;
      break;
    case 'ORGANIZATION_STATUS_CHANGED':
      actionTitle = 'Organization Status Changed';
      narrative = narrative || `${actorName} changed organization '${entityName}' status to ${item.changes?.status || 'updated'} at ${dateStr}.`;
      break;
    case 'ORGANIZATION_ARCHIVED':
      actionTitle = 'Organization Archived';
      narrative = narrative || `${actorName} archived organization '${entityName}' at ${dateStr}.`;
      break;
    case 'ORGANIZATION_CONTACT_ADDED':
    case 'PRIMARY_CONTACT_ASSIGNED':
    case 'CONTACT_ADDED':
      actionTitle = item.action === 'PRIMARY_CONTACT_ASSIGNED' ? 'Primary Contact Assigned' : 'Organization Contact Added';
      narrative = narrative || `${actorName} added contact '${entityName}' to organization at ${dateStr}.`;
      break;
    case 'ORGANIZATION_CONTACT_UPDATED':
      actionTitle = 'Organization Contact Updated';
      narrative = narrative || `${actorName} updated contact '${entityName}' at ${dateStr}.`;
      break;
    case 'ORGANIZATION_CONTACT_REMOVED':
    case 'CONTACT_REMOVED':
      actionTitle = 'Organization Contact Removed';
      narrative = narrative || `${actorName} removed contact from organization at ${dateStr}.`;
      break;
    case 'SERVICE_CREATED':
      actionTitle = 'Telecom Service Provisioned';
      narrative = narrative || `${actorName} provisioned service '${item.changes?.phone_number || entityName}' at ${dateStr}.`;
      break;
    case 'SERVICE_UPDATED':
      actionTitle = 'Service Configuration Updated';
      narrative = narrative || `${actorName} updated service '${entityName}' at ${dateStr}.`;
      break;
    case 'SERVICE_STATUS_CHANGED':
      actionTitle = 'Service Status Changed';
      narrative = narrative || `${actorName} changed service status of '${entityName}' to ${item.changes?.status || 'updated'} at ${dateStr}.`;
      break;
    case 'SERVICE_ASSIGNED_TO_PROPERTY':
      actionTitle = 'Service Assigned to Property';
      narrative = narrative || `${actorName} assigned service '${item.changes?.service_number || 'Service'}' to property '${entityName}' at ${dateStr}.`;
      break;
    case 'SERVICE_UNASSIGNED_FROM_PROPERTY':
      actionTitle = 'Service Unassigned from Property';
      narrative = narrative || `${actorName} unassigned service from property '${entityName}' at ${dateStr}.`;
      break;
    case 'SERVICE_DISCONNECTED':
      actionTitle = 'Service Disconnected';
      narrative = narrative || `${actorName} disconnected service '${entityName}' at ${dateStr}.`;
      break;
    case 'ONBOARDING_INITIALIZED':
      actionTitle = 'Onboarding Pipeline Initialized';
      narrative = narrative || `${actorName} initialized onboarding pipeline for '${entityName}' at ${dateStr}.`;
      break;
    case 'ONBOARDING_STAGE_UPDATED':
      actionTitle = 'Onboarding Stage Updated';
      narrative = narrative || `${actorName} updated onboarding stage for '${entityName}' to ${item.changes?.stage || 'updated stage'} at ${dateStr}.`;
      break;
    case 'ONBOARDING_COMPLETED_PROPERTY_ACTIVATED':
      actionTitle = 'Onboarded (Property Activated)';
      narrative = narrative || `${actorName} marked cutover completed for '${entityName}', automatically setting property status to ACTIVE at ${dateStr}.`;
      break;
    case 'TICKET_CREATED':
      actionTitle = 'Support Ticket Created';
      narrative = narrative || `${actorName} created support ticket '${entityName}' with priority ${item.changes?.priority || 'MEDIUM'} at ${dateStr}.`;
      break;
    case 'TICKET_UPDATED':
      actionTitle = 'Support Ticket Updated';
      narrative = narrative || `${actorName} updated support ticket '${entityName}' at ${dateStr}.`;
      break;
    case 'TICKET_INTERNAL_NOTE_ADDED':
      actionTitle = 'Ticket Internal Note Added';
      narrative = narrative || `${actorName} added internal note to ticket '${entityName}' at ${dateStr}.`;
      break;
    case 'TICKET_REPLY_SENT':
      actionTitle = 'Ticket Reply Sent';
      narrative = narrative || `${actorName} replied to client on ticket '${entityName}' at ${dateStr}.`;
      break;
    case 'PORTING_REQUEST_CREATED':
    case 'PORTING_ORDER_CREATED':
      actionTitle = 'Porting Order Submitted';
      narrative = narrative || `${actorName} submitted porting request for '${entityName}' at ${dateStr}.`;
      break;
    case 'PORTING_STATUS_UPDATED':
    case 'PORTING_STATUS_CHANGED':
      actionTitle = 'Porting Order Status Updated';
      narrative = narrative || `${actorName} updated porting status for '${entityName}' to ${item.changes?.status || 'updated'} at ${dateStr}.`;
      break;
    case 'PORTING_COMPLETED':
      actionTitle = 'Porting Order Completed';
      narrative = narrative || `${actorName} completed porting order for '${entityName}', activating phone numbers at ${dateStr}.`;
      break;
    case 'E911_RECORD_CREATED':
      actionTitle = 'E911 Address Registered';
      narrative = narrative || `${actorName} registered E911 dispatch address for '${entityName}' at ${dateStr}.`;
      break;
    case 'E911_RECORD_UPDATED':
      actionTitle = 'E911 Address Updated';
      narrative = narrative || `${actorName} updated E911 dispatch record for '${entityName}' at ${dateStr}.`;
      break;
    case 'E911_VERIFIED':
      actionTitle = 'E911 Compliance Verified';
      narrative = narrative || `${actorName} verified and approved E911 compliance for '${entityName}' at ${dateStr}.`;
      break;
    case 'E911_CORRECTION_NOTE_ADDED':
      actionTitle = 'E911 Correction Note Added';
      narrative = narrative || `${actorName} added correction note to E911 record '${entityName}' at ${dateStr}.`;
      break;
    case 'INVITATION_SENT':
    case 'ADMIN_INVITATION_SENT':
      actionTitle = item.action === 'ADMIN_INVITATION_SENT' ? 'Admin Team Invitation Sent' : 'Client Invitation Sent';
      narrative = narrative || `${actorName} sent invitation to '${entityName}' at ${dateStr}.`;
      break;
    case 'ADMIN_INVITATION_APPROVED':
      actionTitle = 'Admin Team Invitation Approved';
      narrative = narrative || `${actorName} approved Sub-super Admin invitation for '${entityName}' at ${dateStr}.`;
      break;
    case 'ADMIN_INVITATION_REJECTED':
      actionTitle = 'Admin Team Invitation Rejected';
      narrative = narrative || `${actorName} rejected invitation for '${entityName}' at ${dateStr}.`;
      break;
    case 'ADMIN_INVITATION_REVOKED':
    case 'INVITATION_REVOKED':
      actionTitle = 'Invitation Revoked';
      narrative = narrative || `${actorName} revoked invitation for '${entityName}' at ${dateStr}.`;
      break;
    case 'ADMIN_ROLE_UPDATED':
      actionTitle = 'Admin Role / Permissions Updated';
      narrative = narrative || `${actorName} updated admin role permissions for '${entityName}' at ${dateStr}.`;
      break;
  }

  return {
    id: item.id,
    actor_name: actorName,
    actor_email: actorEmail,
    actor_role: actorRole,
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
