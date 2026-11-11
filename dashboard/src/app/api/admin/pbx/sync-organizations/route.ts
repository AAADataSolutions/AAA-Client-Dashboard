import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import {
  pbxListManagementUsers,
  pbxCreateManagementUser,
  normalizePortalUsername,
} from '@/lib/pbx/client';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const db = createAdminClient() || supabase;

    const {
      data: { user },
    } = await supabase.auth.getUser();

    // 1. Fetch existing portal users via management_group.php (list)
    const listRes = await pbxListManagementUsers({
      limit: 100,
      offset: 0,
      triggered_by: user?.id,
    });

    const portalUsers = Array.isArray(listRes.data) ? listRes.data : [];
    const portalMapByUsername = new Map<string, any>();
    portalUsers.forEach((pu) => {
      if (pu.username) {
        portalMapByUsername.set(String(pu.username).toLowerCase(), pu);
      }
    });

    // 2. Fetch all organizations in One Dashboard
    const { data: orgs } = await db
      .from('organizations')
      .select('*, contacts:organization_contacts(name, email, is_primary)')
      .order('created_at', { ascending: false });

    let syncedCount = 0;
    let createdOnPortalCount = 0;

    for (const org of orgs || []) {
      const contacts = Array.isArray(org.contacts) ? org.contacts : [];
      const primary = contacts.find((c: any) => c.is_primary) || contacts[0];
      const targetEmail = org.portal_username || primary?.email || org.email;
      const username = normalizePortalUsername(targetEmail, org.name);
      const contactName = primary?.name || org.name;

      const matchedPortalUser = portalMapByUsername.get(username.toLowerCase());
      if (matchedPortalUser) {
        await db
          .from('organizations')
          .update({
            portal_username: matchedPortalUser.username,
            portal_user_id: matchedPortalUser.user_id,
            portal_active: matchedPortalUser.active !== 0,
            portal_sync_status: 'SYNCED',
            portal_last_synced_at: new Date().toISOString(),
            portal_sync_error: null,
          })
          .eq('id', org.id);
        syncedCount++;
      } else {
        const createRes = await pbxCreateManagementUser({
          username,
          hotel_name: org.name,
          contact_name: contactName,
          organization_id: org.id,
          triggered_by: user?.id,
        });

        await db
          .from('organizations')
          .update({
            portal_username: username,
            portal_user_id: createRes.data?.user_id || org.portal_user_id || null,
            portal_active: org.status === 'ACTIVE',
            portal_sync_status: createRes.success ? 'SYNCED' : 'ERROR',
            portal_last_synced_at: new Date().toISOString(),
            portal_sync_error: createRes.success ? null : (createRes.message || createRes.error_code || null),
          })
          .eq('id', org.id);

        if (createRes.success) {
          syncedCount++;
          createdOnPortalCount++;
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: `Synchronized ${syncedCount} Management Groups with Call Forwarding Portal (${createdOnPortalCount} newly provisioned).`,
      stats: {
        totalOrganizations: (orgs || []).length,
        syncedCount,
        createdOnPortalCount,
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || 'Failed to synchronize organizations with PBX Portal' },
      { status: 500 }
    );
  }
}

