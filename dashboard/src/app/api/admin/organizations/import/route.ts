import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { logAuditEvent } from '@/lib/audit/logger';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const adminClient = createAdminClient();
    const db = adminClient || supabase;

    const {
      data: { user },
      error: authErr,
    } = await supabase.auth.getUser();

    if (authErr || !user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .maybeSingle();

    if (profile?.role !== 'SUPER_ADMIN' && profile?.role !== 'SUB_SUPER_ADMIN') {
      return NextResponse.json({ success: false, error: 'Forbidden: Super Admin access required.' }, { status: 403 });
    }

    const body = await request.json();
    const { rows } = body;

    if (!rows || !Array.isArray(rows) || rows.length === 0) {
      return NextResponse.json({ success: false, error: 'No data rows provided for import.' }, { status: 400 });
    }

    const results = {
      imported: 0,
      updated: 0,
      failed: 0,
      errors: [] as { row: number; name: string; error: string }[],
    };

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const rowNum = i + 1;

      const rawName = row.name || row['Management Group Name'] || row['Management Group'] || row['Group Name'];
      if (!rawName || !String(rawName).trim()) {
        results.failed++;
        results.errors.push({
          row: rowNum,
          name: 'Unknown',
          error: 'Management Group Name is required.',
        });
        continue;
      }

      const name = String(rawName).trim();
      const rawType = String(row.type || row['Type'] || 'GROUP').trim().toUpperCase();
      const type = rawType === 'INDIVIDUAL' ? 'INDIVIDUAL' : 'GROUP';

      const contactName = String(row.primary_contact || row['Primary Contact'] || row['Contact Name'] || '').trim();
      const email = String(row.email || row['Email'] || '').trim().toLowerCase() || null;
      const phone = String(row.phone || row['Phone'] || '').trim() || null;

      const rawStatus = String(row.status || row['Status'] || 'ACTIVE').trim().toUpperCase();
      const status = ['ACTIVE', 'INACTIVE', 'PENDING'].includes(rawStatus) ? rawStatus : 'ACTIVE';

      const streetAddress = String(row.street_address || row['Street Address'] || row.address || row['Address'] || '').trim() || null;
      const city = String(row.city || row['City'] || '').trim() || null;
      const state = String(row.state || row['State'] || '').trim() || null;
      const zipCode = String(row.zip || row['Zip'] || row.zip_code || row['Zip Code'] || '').trim() || null;

      let createdAt: string | undefined = undefined;
      const rawCreatedAt = row.created_at || row['Created At'] || row['CreatedAt'];
      if (rawCreatedAt) {
        const parsedD = new Date(rawCreatedAt);
        if (!isNaN(parsedD.getTime())) {
          createdAt = parsedD.toISOString();
        }
      }

      try {
        // Check if an organization with this exact name already exists
        const { data: existingOrg } = await db
          .from('organizations')
          .select('id, name')
          .ilike('name', name)
          .maybeSingle();

        let orgId: string;

        if (existingOrg) {
          // Update existing
          const updatePayload: Record<string, any> = {
            type,
            status,
            updated_at: new Date().toISOString(),
          };
          if (email) updatePayload.email = email;
          if (phone) updatePayload.phone = phone;
          if (streetAddress) updatePayload.address = streetAddress;
          if (city) updatePayload.city = city;
          if (state) updatePayload.state = state;
          if (zipCode) updatePayload.zip_code = zipCode;

          const { error: updErr } = await db
            .from('organizations')
            .update(updatePayload)
            .eq('id', existingOrg.id);

          if (updErr) throw updErr;
          orgId = existingOrg.id;
          results.updated++;
        } else {
          // Insert new
          const insertPayload: Record<string, any> = {
            name,
            type,
            email,
            phone,
            address: streetAddress,
            city: city || 'City',
            state: state || 'IL',
            zip_code: zipCode || '00000',
            country: 'USA',
            status,
          };
          if (createdAt) insertPayload.created_at = createdAt;

          const { data: created, error: insErr } = await db
            .from('organizations')
            .insert(insertPayload)
            .select('id')
            .single();

          if (insErr || !created) throw insErr || new Error('Insert failed');
          orgId = created.id;
          results.imported++;
        }

        // If primary contact name or email provided, sync organization_contacts
        if (contactName || email) {
          const { data: existingContact } = await db
            .from('organization_contacts')
            .select('id')
            .eq('organization_id', orgId)
            .eq('is_primary', true)
            .maybeSingle();

          if (existingContact) {
            await db
              .from('organization_contacts')
              .update({
                name: contactName || 'Primary Administrator',
                email: email || 'contact@client.com',
                phone: phone || null,
                updated_at: new Date().toISOString(),
              })
              .eq('id', existingContact.id);
          } else {
            await db
              .from('organization_contacts')
              .insert({
                organization_id: orgId,
                name: contactName || 'Primary Administrator',
                email: email || 'contact@client.com',
                phone: phone || null,
                role: 'ADMIN',
                is_primary: true,
              });
          }
        }
      } catch (err: any) {
        results.failed++;
        results.errors.push({
          row: rowNum,
          name,
          error: err.message || 'Database error occurred',
        });
      }
    }

    await logAuditEvent({
      action: 'ORGANIZATIONS_IMPORTED_CSV',
      entity_type: 'ORGANIZATION',
      entity_id: user.id,
      entity_name: `Batch Import (${results.imported} new, ${results.updated} updated)`,
      changes: {
        total_rows: rows.length,
        imported: results.imported,
        updated: results.updated,
        failed: results.failed,
      },
    });

    return NextResponse.json({
      success: true,
      data: results,
      message: `Import completed: ${results.imported} created, ${results.updated} updated, ${results.failed} skipped/failed.`,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message || 'Internal server error' }, { status: 500 });
  }
}
