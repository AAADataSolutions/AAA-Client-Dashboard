import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { logAdminAction } from '@/lib/audit/logger';
import { pbxUpdateManagementUser, pbxDeactivateManagementUser, normalizePortalUsername } from '@/lib/pbx/client';

export async function handlePatchOrganization(
  request: NextRequest,
  id: string
) {
  const supabase = await createClient();
  const dbClient = createAdminClient() || supabase;
  const body = await request.json();

  const updatePayload: Record<string, any> = {
    updated_at: new Date().toISOString(),
  };

  if (body.name !== undefined) updatePayload.name = body.name.trim();
  if (body.type !== undefined) updatePayload.type = (body.type === 'INDIVIDUAL' || body.type === 'Individual') ? 'INDIVIDUAL' : 'GROUP';
  if (body.email !== undefined) updatePayload.email = body.email ? body.email.trim() : null;
  if (body.phone !== undefined) updatePayload.phone = body.phone ? body.phone.trim() : null;
  if (body.address !== undefined) updatePayload.address = body.address ? body.address.trim() : null;
  if (body.city !== undefined) updatePayload.city = body.city ? body.city.trim() : null;
  if (body.state !== undefined) updatePayload.state = body.state ? body.state.trim() : null;
  if (body.zip_code !== undefined) updatePayload.zip_code = body.zip_code ? body.zip_code.trim() : null;
  if (body.country !== undefined) updatePayload.country = body.country ? body.country.trim() : 'USA';
  if (body.logo_url !== undefined) updatePayload.logo_url = body.logo_url ? body.logo_url.trim() : null;
  if (body.status !== undefined) updatePayload.status = body.status;

  const cleanContactName = body.contact_name !== undefined ? body.contact_name : body.primary_contact_name;

  const { data: updatedOrg, error } = await dbClient
    .from('organizations')
    .update(updatePayload)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }

  // Sync updates/deactivation with Call Forwarding Portal (management_group.php)
  try {
    const oldUsername = normalizePortalUsername(updatedOrg.portal_username || updatedOrg.email, updatedOrg.name);
    const newUsername = body.portal_username
      ? normalizePortalUsername(body.portal_username, updatedOrg.name)
      : (body.email ? normalizePortalUsername(body.email, updatedOrg.name) : oldUsername);

    if (body.status === 'INACTIVE' || body.status === 'SUSPENDED' || body.status === 'ARCHIVED') {
      await pbxDeactivateManagementUser({
        username: oldUsername,
        organization_id: id,
      });
      await dbClient
        .from('organizations')
        .update({
          portal_active: false,
          portal_sync_status: 'SYNCED',
          portal_last_synced_at: new Date().toISOString(),
        })
        .eq('id', id);
    } else {
      const pbxUpd = await pbxUpdateManagementUser({
        username: oldUsername,
        new_username: newUsername !== oldUsername ? newUsername : undefined,
        hotel_name: updatedOrg.name,
        contact_name: cleanContactName || updatedOrg.name,
        organization_id: id,
      });
      await dbClient
        .from('organizations')
        .update({
          portal_username: newUsername,
          portal_user_id: pbxUpd.data?.user_id || updatedOrg.portal_user_id || null,
          portal_sync_status: pbxUpd.success ? 'SYNCED' : 'ERROR',
          portal_last_synced_at: new Date().toISOString(),
        })
        .eq('id', id);
    }
  } catch {
    // Non-blocking if migration 29 columns are not added yet
  }

  // Synchronize primary organization_contacts
  if (cleanContactName !== undefined || body.email !== undefined || body.phone !== undefined) {
    try {
      const { data: primaryContacts } = await dbClient
        .from('organization_contacts')
        .select('id')
        .eq('organization_id', id)
        .eq('is_primary', true)
        .limit(1);

      if (primaryContacts && primaryContacts.length > 0) {
        const cUpdates: any = { updated_at: new Date().toISOString() };
        if (cleanContactName !== undefined) cUpdates.name = cleanContactName ? cleanContactName.trim() : 'Primary Contact';
        if (body.email !== undefined) cUpdates.email = body.email ? body.email.trim() : null;
        if (body.phone !== undefined) cUpdates.phone = body.phone ? body.phone.trim() : null;
        await dbClient.from('organization_contacts').update(cUpdates).eq('id', primaryContacts[0].id);
      } else if (cleanContactName || body.email) {
        await dbClient.from('organization_contacts').insert({
          organization_id: id,
          name: cleanContactName ? cleanContactName.trim() : 'Primary Contact',
          email: body.email ? body.email.trim() : null,
          phone: body.phone ? body.phone.trim() : null,
          role: 'Primary Contact',
          is_primary: true,
        });
      }
    } catch (cErr) {
      console.warn('Could not sync organization_contacts:', cErr);
    }

    // Synchronize with member profile full_name if exists
    if (cleanContactName && cleanContactName.trim()) {
      try {
        const { data: orgMembers } = await dbClient
          .from('organization_members')
          .select('profile_id')
          .eq('organization_id', id);

        if (orgMembers && orgMembers.length > 0) {
          const profileIds = orgMembers.map((m: any) => m.profile_id).filter(Boolean);
          if (profileIds.length > 0) {
            await dbClient
              .from('profiles')
              .update({ full_name: cleanContactName.trim() })
              .in('id', profileIds);
          }
        }
      } catch (pErr) {
        console.warn('Could not sync profiles full_name:', pErr);
      }
    }
  }

  // Log Audit Event
  await logAdminAction({
    action: body.status !== undefined ? 'ORGANIZATION_STATUS_CHANGED' : 'ORGANIZATION_UPDATED',
    entity_type: 'ORGANIZATION',
    entity_id: id,
    entity_name: updatedOrg.name,
    organization_id: id,
    description: body.status !== undefined
      ? `Changed organization '${updatedOrg.name}' status to ${body.status}`
      : `Updated organization details for '${updatedOrg.name}'`,
    changes: updatePayload,
  });

  return NextResponse.json({ success: true, data: updatedOrg, message: 'Organization updated successfully' });
}

export async function handleDeleteOrganization(
  id: string
) {
  const supabase = await createClient();
  const dbClient = createAdminClient() || supabase;

  // Fetch org name for audit
  const { data: orgData } = await dbClient
    .from('organizations')
    .select('name')
    .eq('id', id)
    .maybeSingle();

  if (!orgData) {
    return NextResponse.json({ success: false, error: 'Organization not found' }, { status: 404 });
  }

  // Try hard deletion by unlinking dependencies first
  try {
    await dbClient.from('organization_members').delete().eq('organization_id', id);
    await dbClient.from('invitations').delete().eq('organization_id', id);
    await dbClient.from('organization_properties').delete().eq('organization_id', id);
    const { error: delErr } = await dbClient.from('organizations').delete().eq('id', id);
    if (delErr) {
      // Fallback to ARCHIVED if constraint still prevents hard delete
      await dbClient
        .from('organizations')
        .update({ status: 'ARCHIVED', updated_at: new Date().toISOString() })
        .eq('id', id);
    }
  } catch {
    await dbClient
      .from('organizations')
      .update({ status: 'ARCHIVED', updated_at: new Date().toISOString() })
      .eq('id', id);
  }

  // Log Audit Event
  await logAdminAction({
    action: 'ORGANIZATION_DELETED',
    entity_type: 'ORGANIZATION',
    entity_id: id,
    entity_name: orgData.name || `Organization ${id}`,
    organization_id: id,
    description: `Deleted organization '${orgData.name || id}'`,
    changes: { deleted: true },
  });

  return NextResponse.json({ success: true, message: 'Organization deleted successfully' });
}
