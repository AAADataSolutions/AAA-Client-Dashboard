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
  changes?: Record<string, any>;
  userId?: string | null;
  actorName?: string;
  actorEmail?: string;
  ipAddress?: string;
}

export async function logAdminAction(payload: AuditLogPayload) {
  try {
    const supabase = await createClient();
    const adminClient = createAdminClient();
    const db = adminClient || supabase;

    const effectiveEntityType = payload.entityType || payload.entity_type || 'SYSTEM';
    const effectiveEntityId = payload.entityId || payload.entity_id || null;
    const effectiveEntityName = payload.entityName || payload.entity_name || null;
    const effectiveOrgId = payload.organizationId || payload.organization_id || null;

    // Extract caller if not supplied
    let actorEmail = payload.actorEmail;
    let actorName = payload.actorName;
    let actorId: string | null = payload.userId || null;

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        actorId = actorId || user.id;
        actorEmail = actorEmail || user.email;

        const { data: profile } = await db
          .from('profiles')
          .select('full_name, email')
          .eq('id', user.id)
          .maybeSingle();

        if (profile) {
          actorName = actorName || profile.full_name;
          actorEmail = actorEmail || profile.email;
        }
      }
    } catch {
      // Fallback
    }

    actorName = actorName || 'Binoy (Super Admin)';
    actorEmail = actorEmail || 'binoy@aaasolutions.com';

    // Formulate clean natural language description if not supplied
    const actionDesc =
      payload.description ||
      payload.details ||
      `${actorName} performed ${payload.action} on ${effectiveEntityType} ${effectiveEntityName || effectiveEntityId || ''}`.trim();

    await db.from('audit_logs').insert({
      organization_id: effectiveOrgId,
      actor_id: actorId,
      actor_email: actorEmail,
      actor_name: actorName,
      action: payload.action,
      entity_type: effectiveEntityType,
      entity_id: effectiveEntityId,
      entity_name: effectiveEntityName,
      description: actionDesc,
      changes: payload.changes || null,
      ip_address: payload.ipAddress || '127.0.0.1',
      created_at: new Date().toISOString(),
    });
  } catch (err) {
    console.warn('[AuditLogger] Skipped log write:', err);
  }
}

export const logAuditEvent = logAdminAction;
