import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { logAuditEvent } from '@/lib/audit/logger';

// Lifecycle stage standard mapping
const STAGE_MAP: Record<string, string> = {
  '1': 'DRAFT',
  'DRAFT': 'DRAFT',
  'STAGE 1': 'DRAFT',
  'STAGE 1: DRAFT INITIALIZED': 'DRAFT',
  'DRAFT INITIALIZED': 'DRAFT',

  '2': 'CONTRACT_SENT',
  'CONTRACT_SENT': 'CONTRACT_SENT',
  'STAGE 2': 'CONTRACT_SENT',
  'STAGE 2: CONTRACT SENT': 'CONTRACT_SENT',
  'CONTRACT SENT': 'CONTRACT_SENT',

  '3': 'SIGNED',
  'SIGNED': 'SIGNED',
  'STAGE 3': 'SIGNED',
  'STAGE 3: CONTRACT SIGNED': 'SIGNED',
  'CONTRACT SIGNED': 'SIGNED',

  '4': 'CSR_DETAILS',
  'CSR_DETAILS': 'CSR_DETAILS',
  'STAGE 4': 'CSR_DETAILS',
  'STAGE 4: CSR AND CONTRACT DETAILS': 'CSR_DETAILS',
  'CSR AND CONTRACT DETAILS': 'CSR_DETAILS',

  '5': 'CUT_SHEET_REVIEW',
  'CUT_SHEET_REVIEW': 'CUT_SHEET_REVIEW',
  'STAGE 5': 'CUT_SHEET_REVIEW',
  'STAGE 5: CUT SHEET REVIEW': 'CUT_SHEET_REVIEW',
  'CUT SHEET REVIEW': 'CUT_SHEET_REVIEW',

  '6': 'PORTING_SUBMITTED',
  'PORTING_SUBMITTED': 'PORTING_SUBMITTED',
  'STAGE 6': 'PORTING_SUBMITTED',
  'STAGE 6: PORTING SUBMITTED': 'PORTING_SUBMITTED',
  'PORTING SUBMITTED': 'PORTING_SUBMITTED',

  '7': 'FOC_RECEIVED',
  'FOC_RECEIVED': 'FOC_RECEIVED',
  'STAGE 7': 'FOC_RECEIVED',
  'STAGE 7: FOC CONFIRM': 'FOC_RECEIVED',
  'FOC CONFIRM': 'FOC_RECEIVED',

  '8': 'COMPLETED',
  'COMPLETED': 'COMPLETED',
  'STAGE 8': 'COMPLETED',
  'STAGE 8: ONBOARDING': 'COMPLETED',
  'ONBOARDING': 'COMPLETED',
};

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
      return NextResponse.json(
        { success: false, error: 'Forbidden: Super Admin access required.' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { rows } = body;

    if (!rows || !Array.isArray(rows) || rows.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No data rows provided for import.' },
        { status: 400 }
      );
    }

    // 1. Fetch existing organizations and partners for lookup
    const [{ data: orgs }, { data: partners }] = await Promise.all([
      db.from('organizations').select('id, name, type'),
      db.from('partners').select('id, name, company_name, default_commission_rate'),
    ]);

    const orgMap = new Map<string, { id: string; name: string; type: string }>();
    (orgs || []).forEach((o) => {
      orgMap.set(o.name.trim().toLowerCase(), o);
    });

    const partnerMap = new Map<string, { id: string; name: string; default_commission_rate: number }>();
    (partners || []).forEach((p) => {
      partnerMap.set(p.name.trim().toLowerCase(), p);
      if (p.company_name) {
        partnerMap.set(p.company_name.trim().toLowerCase(), p);
      }
    });

    const results = {
      imported: 0,
      failed: 0,
      errors: [] as { row: number; property: string; error: string }[],
    };

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const rowNum = i + 1;

      // Extract property name and phone
      const propertyName = String(
        row.property_name || row['Property Name'] || row.name || ''
      ).trim();
      const propertyPhone = String(
        row.property_phone || row['Main Phone Number'] || row['Phone Number'] || row.phone || ''
      ).trim();

      if (!propertyName) {
        results.failed++;
        results.errors.push({
          row: rowNum,
          property: 'Unknown',
          error: 'Property Name is required.',
        });
        continue;
      }

      if (!propertyPhone) {
        results.failed++;
        results.errors.push({
          row: rowNum,
          property: propertyName,
          error: 'Main Phone Number is required.',
        });
        continue;
      }

      // Extract client / org
      const clientRaw = String(
        row.client || row['Client'] || row['Management Group'] || row.organization || ''
      ).trim();
      let matchedOrg: { id: string; name: string; type: string } | null = null;
      if (
        clientRaw &&
        !['unassigned', 'none', '-- unassigned (none) --', 'n/a', '-'].includes(
          clientRaw.toLowerCase()
        )
      ) {
        matchedOrg = orgMap.get(clientRaw.toLowerCase()) || null;
      }

      // Extract partner
      const partnerRaw = String(
        row.partner || row['Channel Partner'] || row.channel_partner || ''
      ).trim();
      let matchedPartner: { id: string; name: string; default_commission_rate: number } | null = null;
      if (
        partnerRaw &&
        !['no partner assigned', 'unassigned', 'none', 'n/a', '-'].includes(
          partnerRaw.toLowerCase()
        )
      ) {
        matchedPartner = partnerMap.get(partnerRaw.toLowerCase()) || null;
      }

      // Revenue share override
      let partnerRevShare: number | null = null;
      const revShareRaw =
        row.partner_revenue_share ??
        row['Partner Revenue Share (%)'] ??
        row['Partner Revenue Share'] ??
        row.commission;
      if (revShareRaw !== undefined && revShareRaw !== null && revShareRaw !== '') {
        const parsedPct = parseFloat(String(revShareRaw).replace(/[^0-9.]/g, ''));
        if (!isNaN(parsedPct)) {
          partnerRevShare = parsedPct;
        }
      } else if (matchedPartner) {
        partnerRevShare = matchedPartner.default_commission_rate;
      }

      // Monthly price
      let monthlyPrice: number | null = null;
      const priceRaw = row.monthly_price ?? row['Monthly Price ($)'] ?? row['Monthly Price'];
      if (priceRaw !== undefined && priceRaw !== null && priceRaw !== '') {
        const parsedPrice = parseFloat(String(priceRaw).replace(/[^0-9.]/g, ''));
        if (!isNaN(parsedPrice)) {
          monthlyPrice = parsedPrice;
        }
      }

      // Target cutover date
      let targetDate: string | null = null;
      const dateRaw = row.target_date || row['Target Cutover Date'] || row['Target Date'];
      if (dateRaw) {
        const d = new Date(dateRaw);
        if (!isNaN(d.getTime())) {
          targetDate = d.toISOString().split('T')[0];
        }
      }

      // Address fields
      const streetAddress = String(
        row.street_address || row['Street Address'] || row.address || ''
      ).trim();
      const city = String(row.city || row['City'] || '').trim();
      const state = String(row.state || row['State'] || '').trim();
      const zipCode = String(
        row.zip_code || row['ZIP Code'] || row['Zip Code'] || row.zip || ''
      ).trim();

      const fullAddress = streetAddress || 'Address Pending';
      const finalCity = city || 'Pending';
      const finalState = state || 'Pending';
      const finalZip = zipCode || '00000';

      // Contacts
      const gmName = String(
        row.general_manager_name || row['GM Full Name'] || row['GM Name'] || ''
      ).trim();
      const gmPhone = String(
        row.general_manager_phone || row['GM Phone Number'] || row['GM Phone'] || ''
      ).trim();
      const gmEmail = String(
        row.general_manager_email || row['GM Email Address'] || row['GM Email'] || ''
      ).trim();
      const fax = String(row.fax || row['Fax Number'] || row['Fax'] || '').trim() || null;
      const carrierDetails = String(
        row.carrier_details ||
          row['Losing Carrier & Porting Notes'] ||
          row['Porting Notes'] ||
          row.notes ||
          ''
      ).trim();

      // Lifecycle stage
      const stageRaw = String(
        row.status || row['Initial Lifecycle Stage'] || row['Lifecycle Stage'] || row.stage || 'DRAFT'
      ).trim().toUpperCase();
      const normalizedStage = STAGE_MAP[stageRaw] || 'DRAFT';

      // E911 Compliance
      const e911Raw = String(
        row.e911_status || row['E911 Compliance Status'] || row['E911 Status'] || 'VERIFIED'
      ).trim().toUpperCase();
      const isE911 =
        e911Raw.includes('VERIFIED') ||
        e911Raw.includes('COMPLIANT') ||
        e911Raw === 'YES' ||
        e911Raw === 'TRUE';

      // Ray Baum
      const rayBaumRaw = String(
        row.ray_baum_status ||
          row["Ray Baum & Kari's Law"] ||
          row['Ray Baum Status'] ||
          'ACTIVE'
      ).trim().toUpperCase();
      const isRayBaumActive =
        rayBaumRaw.includes('ACTIVE') ||
        rayBaumRaw.includes('COMPLIANT') ||
        rayBaumRaw === 'YES' ||
        rayBaumRaw === 'TRUE';

      try {
        let createdOpId: string | null = null;

        if (matchedOrg) {
          // 1. Create property record
          const { data: newProp, error: propErr } = await db
            .from('properties')
            .insert({
              name: propertyName,
              address: fullAddress,
              city: finalCity,
              state: finalState,
              zip_code: finalZip,
              country: 'USA',
              main_phone: propertyPhone,
              fax: fax,
              monthly_price: monthlyPrice,
              partner_id: matchedPartner ? matchedPartner.id : null,
              partner_commission_override: partnerRevShare,
              general_manager_name: gmName || null,
              general_manager_phone: gmPhone || null,
              general_manager_email: gmEmail || null,
              ray_baud_and_logs_enabled: isRayBaumActive,
              ray_baum_status: isRayBaumActive ? 'ACTIVE' : 'INACTIVE',
              status: 'ONBOARDING',
            })
            .select('id')
            .single();

          if (propErr) throw propErr;

          // 2. Link in organization_properties
          const { data: newOp, error: opErr } = await db
            .from('organization_properties')
            .insert({
              organization_id: matchedOrg.id,
              property_id: newProp.id,
              status: 'ACTIVE',
            })
            .select('id')
            .single();

          if (opErr) throw opErr;
          createdOpId = newOp.id;

          // 3. Create initial onboarding record
          await db.from('onboardings').insert({
            organization_property_id: newOp.id,
            status: normalizedStage,
            target_date: targetDate,
            draft_date: new Date().toISOString(),
          });

          // 4. Create e911 record
          await db.from('e911_records').insert({
            organization_property_id: newOp.id,
            emergency_address: `${fullAddress}, ${finalCity}, ${finalState} ${finalZip}`,
            status: isE911 ? 'VERIFIED' : 'PENDING',
            verified_at: isE911 ? new Date().toISOString() : null,
          });
        }

        // 5. Build Porting Request
        const metadata: Record<string, any> = {
          stage_dates: {
            draft_date: new Date().toISOString(),
            target_date: targetDate,
          },
        };

        if (!matchedOrg) {
          metadata.property_details = {
            monthly_price: monthlyPrice,
            fax,
            partner_id: matchedPartner ? matchedPartner.id : null,
            partner_commission_override: partnerRevShare,
            street_address: streetAddress,
            city,
            state,
            zip_code: zipCode,
            general_manager_name: gmName,
            general_manager_phone: gmPhone,
            general_manager_email: gmEmail,
            e911_status: isE911 ? 'VERIFIED' : 'AUDIT_REQUIRED',
            ray_baum_status: isRayBaumActive ? 'ACTIVE' : 'INACTIVE',
          };
        }

        const notesContent = `<!--METADATA:${JSON.stringify(metadata)}-->`;

        const { error: portingErr } = await db.from('porting_requests').insert({
          organization_id: matchedOrg ? matchedOrg.id : null,
          organization_property_id: createdOpId,
          created_by: user.id,
          property_name: propertyName,
          property_address: `${fullAddress}${finalCity !== 'Pending' ? `, ${finalCity}, ${finalState} ${finalZip}` : ''}`,
          property_phone: propertyPhone,
          fax: fax,
          carrier_details: carrierDetails || null,
          target_date: targetDate,
          status: normalizedStage,
          is_activated: false,
          notes: notesContent,
        });

        if (portingErr) throw portingErr;

        results.imported++;
      } catch (err: any) {
        results.failed++;
        results.errors.push({
          row: rowNum,
          property: propertyName,
          error: err.message || 'Insert failed',
        });
      }
    }

    await logAuditEvent({
      action: 'PORTING_REQUESTS_BULK_IMPORTED',
      entity_type: 'PORTING_REQUEST',
      entity_id: user.id,
      entity_name: `Bulk Porting Import: ${results.imported} imported, ${results.failed} failed`,
      changes: { total: rows.length, imported: results.imported, failed: results.failed },
    });

    return NextResponse.json({
      success: true,
      data: results,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
