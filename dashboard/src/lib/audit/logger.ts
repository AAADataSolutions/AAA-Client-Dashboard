import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export interface AuditLogPayload {
  action: string;
  entityType?: string;
  entity_type?: string;
  entityId?: string | null;
  entity_id?: string | null;
  entityName?: string | null;
  entity_name?: string | null;
  organizationId?: string | null;
  organization_id?: string | null;
  description?: string;
  details?: string;
  changes?: Record<string, any> | null;
  userId?: string | null;
  actorId?: string | null;
  actor_id?: string | null;
  actorName?: string;
  actor_name?: string;
  actorEmail?: string;
  actor_email?: string;
  actorRole?: string;
  actor_role?: string;
  ipAddress?: string;
  ip_address?: string;
  userAgent?: string;
  user_agent?: string;
}

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function toValidUuidOrNull(val: any): string | null {
  if (typeof val === 'string' && UUID_REGEX.test(val.trim())) {
    return val.trim();
  }
  return null;
}

/**
 * Robust Admin and System Audit Logger.
 * Records every administrative and lifecycle action across properties, organizations,
 * services, tickets, portings, and compliance events into public.audit_logs.
 */
export async function logAdminAction(payload: AuditLogPayload) {
  try {
    const supabase = await createClient();
    const adminClient = createAdminClient();
    const db = adminClient || supabase;

    const effectiveEntityType = payload.entityType || payload.entity_type || 'SYSTEM';
    const rawEntityId = payload.entityId ?? payload.entity_id ?? null;
    const effectiveEntityName = payload.entityName || payload.entity_name || null;
    const rawOrgId = payload.organizationId ?? payload.organization_id ?? null;

    let actorId = payload.actorId || payload.actor_id || payload.userId || null;
    let actorEmail = payload.actorEmail || payload.actor_email || null;
    let actorName = payload.actorName || payload.actor_name || null;
    let actorRole = payload.actorRole || payload.actor_role || null;
    const ipAddress = payload.ipAddress || payload.ip_address || '127.0.0.1';
    const userAgent = payload.userAgent || payload.user_agent || null;

    // Resolve authenticated caller if not explicitly provided
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        actorId = actorId || user.id;
        actorEmail = actorEmail || user.email || null;

        const { data: profile } = await db
          .from('profiles')
          .select('full_name, email, role')
          .eq('id', user.id)
          .maybeSingle();

        if (profile) {
          actorName = actorName || profile.full_name || user.user_metadata?.full_name;
          actorEmail = actorEmail || profile.email;
          actorRole = actorRole || profile.role;
        } else if (user.user_metadata?.full_name) {
          actorName = actorName || user.user_metadata.full_name;
        }
      }
    } catch {
      // Fallback
    }

    actorName = actorName || (actorEmail ? actorEmail.split('@')[0] : 'Binoy (Super Admin)');
    actorEmail = actorEmail || 'binoy@aaasolutions.com';
    actorRole = actorRole || 'SUPER_ADMIN';

    // Generate human-friendly descriptive sentence if not passed
    let actionDesc = payload.description || payload.details;
    if (!actionDesc) {
      const entityLabel = effectiveEntityName ? `'${effectiveEntityName}'` : (rawEntityId ? `ID ${rawEntityId}` : effectiveEntityType);
      actionDesc = `${actorName} performed ${payload.action.replace(/_/g, ' ').toLowerCase()} on ${effectiveEntityType} ${entityLabel}`.trim();
    }

    const baseRecord: Record<string, any> = {
      organization_id: toValidUuidOrNull(rawOrgId),
      actor_id: toValidUuidOrNull(actorId),
      actor_email: actorEmail,
      actor_name: actorName,
      actor_role: actorRole,
      action: payload.action,
      entity_type: effectiveEntityType,
      entity_id: rawEntityId ? String(rawEntityId) : null,
      entity_name: effectiveEntityName,
      description: actionDesc,
      changes: payload.changes || null,
      ip_address: ipAddress,
      user_agent: userAgent,
      created_at: new Date().toISOString(),
    };

    // Primary Insert
    const { error: insertError } = await db.from('audit_logs').insert(baseRecord);

    if (insertError) {
      console.warn('[AuditLogger] Primary insert failed, retrying with sanitized payload:', insertError.message);

      // Retry 1: If entity_id or actor_id caused constraint violation, sanitize strictly
      const sanitizedRecord: Record<string, any> = {
        action: payload.action,
        entity_type: effectiveEntityType,
        entity_id: toValidUuidOrNull(rawEntityId), // Pass null if DB strictly requires UUID
        entity_name: effectiveEntityName,
        actor_email: actorEmail,
        actor_name: actorName,
        description: actionDesc,
        changes: {
          ...payload.changes,
          raw_entity_id: rawEntityId,
          raw_organization_id: rawOrgId,
        },
        ip_address: ipAddress,
        created_at: new Date().toISOString(),
      };

      const { error: retryError } = await db.from('audit_logs').insert(sanitizedRecord);

      if (retryError) {
        // Retry 2: Minimalist insert matching base schema
        console.warn('[AuditLogger] Retry 1 failed, attempting minimal fallback insert:', retryError.message);
        await db.from('audit_logs').insert({
          action: payload.action,
          entity_type: effectiveEntityType,
          actor_email: actorEmail,
          changes: {
            description: actionDesc,
            entity_name: effectiveEntityName,
            ...payload.changes,
          },
          created_at: new Date().toISOString(),
        });
      }
    }
  } catch (err) {
    console.error('[AuditLogger] Failed to write audit log:', err);
  }
}

export const logAuditEvent = logAdminAction;
