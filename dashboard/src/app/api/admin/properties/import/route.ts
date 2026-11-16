import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { logAuditEvent } from '@/lib/audit/logger';

// Helper to parse CSV string into array of object rows
function parseCSV(text: string): Record<string, string>[] {
  const lines: string[] = [];
  let currentLine = '';
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const nextChar = text[i + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        currentLine += '""';
        i++;
      } else {
        inQuotes = !inQuotes;
        currentLine += char;
      }
    } else if ((char === '\r' || char === '\n') && !inQuotes) {
      if (char === '\r' && nextChar === '\n') {
        i++;
      }
      if (currentLine.trim()) {
        lines.push(currentLine);
      }
      currentLine = '';
    } else {
      currentLine += char;
    }
  }
  if (currentLine.trim()) {
    lines.push(currentLine);
  }

  if (lines.length < 2) return [];

  const parseRow = (line: string): string[] => {
    const cells: string[] = [];
    let currentCell = '';
    let inQ = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      const nextChar = line[i + 1];

      if (char === '"') {
        if (inQ && nextChar === '"') {
          currentCell += '"';
          i++;
        } else {
          inQ = !inQ;
        }
      } else if (char === ',' && !inQ) {
        cells.push(currentCell.trim());
        currentCell = '';
      } else {
        currentCell += char;
      }
    }
    cells.push(currentCell.trim());
    return cells;
  };

  const headers = parseRow(lines[0]).map((h) => h.replace(/^["']|["']$/g, '').trim());

  const rows: Record<string, string>[] = [];
  for (let i = 1; i < lines.length; i++) {
    const cells = parseRow(lines[i]);
    if (cells.every((c) => !c)) continue;

    const rowObj: Record<string, string> = {};
    headers.forEach((header, colIndex) => {
      rowObj[header] = cells[colIndex] ? cells[colIndex].replace(/^["']|["']$/g, '').trim() : '';
    });
    rows.push(rowObj);
  }

  return rows;
}

// Helper to normalize location into street, city, state, zip
function parseLocation(locStr: string): { address: string; city: string; state: string; zip_code: string; country: string } {
  const clean = (locStr || '').trim();
  if (!clean) {
    return { address: 'Address pending', city: 'City', state: 'IL', zip_code: '00000', country: 'USA' };
  }
  const parts = clean.split(',').map((p) => p.trim()).filter(Boolean);
  if (parts.length >= 3) {
    const address = parts[0];
    const city = parts[1];
    const stateZip = parts.slice(2).join(' ');
    const match = stateZip.match(/([A-Za-z\s]+)\s*(\d{5}(?:-\d{4})?)?/);
    const state = match && match[1] ? match[1].trim() : parts[2] || 'IL';
    const zip_code = match && match[2] ? match[2].trim() : '00000';
    return { address, city, state, zip_code, country: 'USA' };
  } else if (parts.length === 2) {
    const address = parts[0];
    const match = parts[1].match(/([A-Za-z\s]+)\s*(\d{5}(?:-\d{4})?)?/);
    const cityOrState = match && match[1] ? match[1].trim() : parts[1];
    const zip_code = match && match[2] ? match[2].trim() : '00000';
    return { address, city: cityOrState, state: 'IL', zip_code, country: 'USA' };
  }
  return { address: clean, city: 'City', state: 'IL', zip_code: '00000', country: 'USA' };
}

// Find header value flexibly
function getHeaderValue(row: Record<string, string>, possibleKeys: string[]): string {
  const normalizedRowKeys = Object.keys(row).reduce((acc, key) => {
    acc[key.toLowerCase().replace(/[^a-z0-9]/g, '')] = row[key];
    return acc;
  }, {} as Record<string, string>);

  for (const key of possibleKeys) {
    const normalizedKey = key.toLowerCase().replace(/[^a-z0-9]/g, '');
    if (normalizedRowKeys[normalizedKey] !== undefined && normalizedRowKeys[normalizedKey] !== '') {
      return normalizedRowKeys[normalizedKey];
    }
  }
  return '';
}

// Helper to parse date string into standard YYYY-MM-DD format
function parseDateString(dateStr: string): string {
  if (!dateStr || !dateStr.trim()) {
    return new Date().toISOString().slice(0, 10);
  }
  const clean = dateStr.trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(clean)) return clean;
  if (/^\d{4}\/\d{1,2}\/\d{1,2}$/.test(clean)) {
    const [y, m, d] = clean.split('/');
    return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
  }
  if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(clean)) {
    const [m, d, y] = clean.split('/');
    return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
  }
  const parsed = new Date(clean);
  if (!isNaN(parsed.getTime())) {
    return parsed.toISOString().slice(0, 10);
  }
  return new Date().toISOString().slice(0, 10);
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const dbClient = createAdminClient() || supabase;

    // Check user authentication
    const {
      data: { user },
      error: authErr,
    } = await supabase.auth.getUser();

    if (authErr || !user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    let rawRows: Record<string, string>[] = [];
    const contentType = request.headers.get('content-type') || '';

    if (contentType.includes('application/json')) {
      const body = await request.json();
      if (Array.isArray(body.rows)) {
        rawRows = body.rows;
      } else if (typeof body.csvText === 'string') {
        rawRows = parseCSV(body.csvText);
      }
    } else if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData();
      const file = formData.get('file') as File | null;
      if (!file) {
        return NextResponse.json({ success: false, error: 'No CSV file provided.' }, { status: 400 });
      }
      const csvText = await file.text();
      rawRows = parseCSV(csvText);
    } else {
      const text = await request.text();
      rawRows = parseCSV(text);
    }

    if (!rawRows || rawRows.length === 0) {
      return NextResponse.json(
        { success: false, error: 'The CSV file is empty or does not contain valid data rows.' },
        { status: 400 }
      );
    }

    // Cache existing organizations, servers, vendors, and property names
    const [{ data: allOrgs }, { data: allServers }, { data: allVendors }, { data: existingPropsData }] = await Promise.all([
      dbClient.from('organizations').select('id, name'),
      dbClient.from('servers').select('id, name'),
      dbClient.from('vendors').select('id, name'),
      dbClient.from('properties').select('*'),
    ]);
    const orgsMap = new Map<string, string>();
    (allOrgs || []).forEach((o: any) => {
      orgsMap.set(o.name.trim().toLowerCase(), o.id);
    });
    const serversMap = new Map<string, string>();
    (allServers || []).forEach((s: any) => {
      if (s.name) serversMap.set(s.name.trim().toLowerCase(), s.id);
    });
    const vendorsMap = new Map<string, string>();
    (allVendors || []).forEach((v: any) => {
      if (v.name) vendorsMap.set(v.name.trim().toLowerCase(), v.id);
    });
    const existingPropsMap = new Map<string, any>();
    (existingPropsData || []).forEach((p: any) => {
      if (p.name) existingPropsMap.set(p.name.trim().toLowerCase(), p);
    });
    const batchPropNames = new Set<string>();

    const importedProperties: any[] = [];
    const errors: { row: number; propertyName: string; reason: string }[] = [];

    for (let index = 0; index < rawRows.length; index++) {
      const row = rawRows[index];
      const rowNum = index + 2;

      // 1. Property Name
      const propertyName = getHeaderValue(row, [
        'Property Name', 'PropertyName', 'property_name', 'Name', 'name',
      ]);

      if (!propertyName.trim()) {
        errors.push({ row: rowNum, propertyName: 'Row ' + rowNum, reason: 'Missing Property Name' });
        continue;
      }

      const normPropName = propertyName.trim().toLowerCase();
      if (batchPropNames.has(normPropName)) {
        errors.push({ row: rowNum, propertyName: propertyName.trim(), reason: 'Duplicate property name within CSV' });
        continue;
      }
      batchPropNames.add(normPropName);
      const existingProp = existingPropsMap.get(normPropName);

      // 2. Street Address, City, State, Zip, Country
      const streetRaw = getHeaderValue(row, [
        'Street Address', 'StreetAddress', 'street_address', 'Address', 'address', 'Property Location', 'Location',
      ]);
      const cityRaw = getHeaderValue(row, ['City', 'city']);
      const stateRaw = getHeaderValue(row, ['State', 'state']);
      const zipRaw = getHeaderValue(row, ['Zip', 'zip', 'Zip Code', 'zip_code', 'postal_code']);
      const countryRaw = getHeaderValue(row, ['Country', 'country']) || 'USA';

      let loc = { address: streetRaw, city: cityRaw, state: stateRaw, zip_code: zipRaw, country: countryRaw };
      if (!cityRaw || !stateRaw || !zipRaw) {
        const parsed = parseLocation(streetRaw);
        loc = {
          address: parsed.address || streetRaw || 'Address pending',
          city: cityRaw || parsed.city || 'City',
          state: stateRaw || parsed.state || 'IL',
          zip_code: zipRaw || parsed.zip_code || '00000',
          country: countryRaw || parsed.country || 'USA',
        };
      }

      // 3. Main Phone Number & Fax Number
      const mainPhone = getHeaderValue(row, [
        'Main Phone Number', 'MainPhoneNumber', 'main_phone_number', 'Main Phone no', 'Main Phone No', 'Main Phone', 'Phone',
      ]);
      const faxNumber = getHeaderValue(row, ['Fax Number', 'FaxNumber', 'fax_number', 'Fax', 'fax']);

      // 4. Organization Name
      const mgmtGroup = getHeaderValue(row, [
        'Organization Name', 'OrganizationName', 'organization_name', 'Management group', 'Management Group', 'ManagementGroup', 'Organization', 'Group',
      ]);

      // 5. General Manager Contacts
      const gmName = getHeaderValue(row, [
        'General Manager Name', 'GeneralManagerName', 'general_manager_name', 'GM Name', 'GMName', 'gm_name',
      ]);
      const gmEmail = getHeaderValue(row, [
        'General Manager Email', 'GeneralManagerEmail', 'general_manager_email', 'GM email', 'GMEmail', 'gm_email',
      ]);
      const gmPhone = getHeaderValue(row, [
        'General Manager Phone', 'GeneralManagerPhone', 'general_manager_phone', 'GM phone', 'GMPhone', 'gm_phone',
      ]);

      // 6. Monthly Pricing
      const priceRaw = getHeaderValue(row, [
        'Monthly Pricing', 'MonthlyPricing', 'monthly_pricing', 'Monthly price', 'MonthlyPrice', 'monthly_price', 'Price', 'price', 'MRR',
      ]);
      const cleanPrice = priceRaw ? parseFloat(priceRaw.replace(/[^0-9.]/g, '')) : null;
      const monthlyPrice = cleanPrice && !isNaN(cleanPrice) ? cleanPrice : null;

      // 7. Ray Baum and Kari's Law Status (Fix: never couple to E911)
      const rayBaumRaw = getHeaderValue(row, [
        "Ray Baum and Kari's Law Status", "Ray Baum and Kari's law", "Ray Baum and Kary's law", "ay Baum and Kary's law", "array bomb and carry loss status", 'Ray Baum', 'ray_baum', 'ray_baum_status',
      ]).toLowerCase();
      const isRayBaumActive =
        (rayBaumRaw.includes('act') || rayBaumRaw.includes('yes') || rayBaumRaw.includes('true') || rayBaumRaw.includes('comp')) &&
        !rayBaumRaw.includes('inact') &&
        !rayBaumRaw.includes('non');

      // 8. E911 Status
      const e911Raw = getHeaderValue(row, ['E911 Status', 'E911Status', 'e911_status', 'E911', 'e911']).toLowerCase();
      const isE911Verified =
        e911Raw.includes('verif') || e911Raw.includes('active') || e911Raw.includes('yes') || e911Raw.includes('true');

      // 9. Onboarding Date
      const onboardingDateRaw = getHeaderValue(row, [
        'Onboarding Date', 'OnboardingDate', 'onboarding_date', 'Onboarding date', 'Onboard Date', 'Date',
      ]);
      const onboardingDate = parseDateString(onboardingDateRaw);

      // 10. Billing Status & Billing Date
      const billingStatusRaw = getHeaderValue(row, ['Billing Status', 'BillingStatus', 'billing_status', 'Billing']).toLowerCase();
      const isBillingDone = billingStatusRaw.includes('done') || billingStatusRaw.includes('billed');
      const billingDateRaw = getHeaderValue(row, ['Billing Date', 'BillingDate', 'billing_date', 'Billed Date']);
      const resolvedBilledDate = billingDateRaw ? parseDateString(billingDateRaw) : (isBillingDone ? onboardingDate : null);

      // 11. Data Subject Status (Connectivity Mode)
      const dataSubjectRaw = getHeaderValue(row, [
        'Data Subject Status', 'DataSubjectStatus', 'data_subject_status', 'Data Circuit Status', 'Connectivity Mode', 'connectivity_type',
      ]).toUpperCase();
      let connectivityType: 'PORTED' | 'DATA_CIRCUITED' | 'BOTH' = 'PORTED';
      if (dataSubjectRaw.includes('BOTH') || (dataSubjectRaw.includes('PORT') && dataSubjectRaw.includes('CIRCUIT'))) {
        connectivityType = 'BOTH';
      } else if (dataSubjectRaw.includes('CIRCUIT')) {
        connectivityType = 'DATA_CIRCUITED';
      }

      // 12. Server & Vendor lookup by name
      const serverNameRaw = getHeaderValue(row, ['Server Name', 'ServerName', 'server_name', 'Server', 'server']).trim();
      const vendorNameRaw = getHeaderValue(row, ['Vendor Name', 'VendorName', 'vendor_name', 'Vendor', 'vendor']).trim();
      const resolvedServerId = serverNameRaw ? (serversMap.get(serverNameRaw.toLowerCase()) || null) : null;
      const resolvedVendorId = vendorNameRaw ? (vendorsMap.get(vendorNameRaw.toLowerCase()) || null) : null;

      try {
        if (existingProp) {
          const isBlank = (v: any, placeholders: string[] = []) => {
            if (v === null || v === undefined) return true;
            const s = String(v).trim();
            return s === '' || placeholders.includes(s);
          };

          const blankUpdate: Record<string, any> = {};
          if (isBlank(existingProp.address, ['Address pending']) && !isBlank(loc.address, ['Address pending'])) blankUpdate.address = loc.address;
          if (isBlank(existingProp.city, ['City']) && !isBlank(loc.city, ['City'])) blankUpdate.city = loc.city;
          if (isBlank(existingProp.state) && !isBlank(loc.state)) blankUpdate.state = loc.state;
          if (isBlank(existingProp.zip_code, ['00000']) && !isBlank(loc.zip_code, ['00000'])) blankUpdate.zip_code = loc.zip_code;
          if (isBlank(existingProp.country) && !isBlank(loc.country)) blankUpdate.country = loc.country;
          if (isBlank(existingProp.main_phone) && mainPhone.trim()) blankUpdate.main_phone = mainPhone.trim();
          if (isBlank(existingProp.fax) && faxNumber.trim()) blankUpdate.fax = faxNumber.trim();
          if (isBlank(existingProp.general_manager_name) && gmName.trim()) blankUpdate.general_manager_name = gmName.trim();
          if (isBlank(existingProp.general_manager_email) && gmEmail.trim()) blankUpdate.general_manager_email = gmEmail.trim();
          if (isBlank(existingProp.general_manager_phone) && (gmPhone.trim() || mainPhone.trim())) blankUpdate.general_manager_phone = gmPhone.trim() || mainPhone.trim();
          if (isBlank(existingProp.contact_person_name) && gmName.trim()) blankUpdate.contact_person_name = gmName.trim();
          if (isBlank(existingProp.contact_person_email) && gmEmail.trim()) blankUpdate.contact_person_email = gmEmail.trim();
          if ((existingProp.monthly_price === null || existingProp.monthly_price === undefined || Number(existingProp.monthly_price) === 0) && monthlyPrice !== null) {
            blankUpdate.monthly_price = monthlyPrice;
            if (!existingProp.base_price) blankUpdate.base_price = monthlyPrice;
          }
          if (isBlank(existingProp.onboarding_date) && onboardingDate) blankUpdate.onboarding_date = onboardingDate;
          if (isBlank(existingProp.billing_status)) blankUpdate.billing_status = isBillingDone ? 'BILLING_DONE' : 'BILLING_PENDING';
          if (isBlank(existingProp.billed_date) && resolvedBilledDate) blankUpdate.billed_date = resolvedBilledDate;
          if (isBlank(existingProp.connectivity_type)) blankUpdate.connectivity_type = connectivityType;
          if (!existingProp.server_id && resolvedServerId) blankUpdate.server_id = resolvedServerId;
          if (!existingProp.vendor_id && resolvedVendorId) blankUpdate.vendor_id = resolvedVendorId;

          let updatedProp = existingProp;
          if (Object.keys(blankUpdate).length > 0) {
            blankUpdate.updated_at = new Date().toISOString();
            const { data: upd, error: updErr } = await dbClient
              .from('properties')
              .update(blankUpdate)
              .eq('id', existingProp.id)
              .select()
              .single();
            if (!updErr && upd) {
              updatedProp = upd;
            }
          }

          // Link organization only if not already linked to any organization
          if (mgmtGroup.trim()) {
            const { data: existingOps } = await dbClient
              .from('organization_properties')
              .select('id')
              .eq('property_id', existingProp.id)
              .limit(1);

            if (!existingOps || existingOps.length === 0) {
              const lowerName = mgmtGroup.trim().toLowerCase();
              let orgId = orgsMap.get(lowerName) || null;
              if (!orgId) {
                const { data: createdOrg } = await dbClient
                  .from('organizations')
                  .insert({ name: mgmtGroup.trim(), type: 'GROUP', status: 'ACTIVE' })
                  .select('id, name')
                  .single();
                if (createdOrg) {
                  orgId = createdOrg.id;
                  orgsMap.set(lowerName, createdOrg.id);
                }
              }
              if (orgId) {
                await dbClient.from('organization_properties').insert({
                  organization_id: orgId,
                  property_id: existingProp.id,
                  status: 'ACTIVE',
                });
              }
            }
          }

          importedProperties.push({
            id: updatedProp.id,
            name: updatedProp.name,
            address: updatedProp.address,
            city: updatedProp.city,
            state: updatedProp.state,
            zip_code: updatedProp.zip_code,
            monthly_price: updatedProp.monthly_price,
            onboarding_date: updatedProp.onboarding_date || onboardingDate,
            main_phone: updatedProp.main_phone,
            organization_name: mgmtGroup.trim() || 'Unassigned',
            onboarding_stage: 'Onboarded',
            status: updatedProp.status || 'ACTIVE',
            e911_status: updatedProp.ray_baud_and_logs_enabled ? 'VERIFIED' : 'AUDIT_REQUIRED',
            ray_baum_status: updatedProp.ray_baum_status === 'ACTIVE' ? 'Active' : 'Inactive',
          });
          continue;
        }

        const insertPayload: Record<string, any> = {
          name: propertyName.trim(),
          address: loc.address,
          city: loc.city,
          state: loc.state,
          zip_code: loc.zip_code,
          country: loc.country,
          main_phone: mainPhone.trim() || null,
          fax: faxNumber.trim() || null,
          general_manager_name: gmName.trim() || null,
          general_manager_email: gmEmail.trim() || null,
          general_manager_phone: gmPhone.trim() || mainPhone.trim() || null,
          contact_person_name: gmName.trim() || null,
          contact_person_email: gmEmail.trim() || null,
          base_price: monthlyPrice || 0,
          monthly_price: monthlyPrice,
          onboarding_date: onboardingDate,
          ray_baud_and_logs_enabled: isE911Verified,
          ray_baum_status: isRayBaumActive ? 'ACTIVE' : 'INACTIVE',
          billing_status: isBillingDone ? 'BILLING_DONE' : 'BILLING_PENDING',
          billed_date: resolvedBilledDate,
          connectivity_type: connectivityType,
          server_id: resolvedServerId,
          vendor_id: resolvedVendorId,
          status: 'ACTIVE',
        };

        let { data: newProp, error: insertPropErr } = await dbClient
          .from('properties')
          .insert(insertPayload)
          .select()
          .single();

        if (insertPropErr && insertPropErr.message && (insertPropErr.message.includes('server_id') || insertPropErr.message.includes('vendor_id'))) {
          delete insertPayload.server_id;
          delete insertPayload.vendor_id;
          const retry = await dbClient.from('properties').insert(insertPayload).select().single();
          newProp = retry.data;
          insertPropErr = retry.error;
        }

        if (insertPropErr || !newProp) {
          throw new Error(insertPropErr?.message || 'Failed to insert property record');
        }

        // Link organization
        let orgId: string | null = null;
        const orgName = mgmtGroup.trim();

        if (orgName) {
          const lowerName = orgName.toLowerCase();
          if (orgsMap.has(lowerName)) {
            orgId = orgsMap.get(lowerName)!;
          } else {
            const { data: createdOrg, error: createOrgErr } = await dbClient
              .from('organizations')
              .insert({ name: orgName, type: 'GROUP', status: 'ACTIVE' })
              .select('id, name')
              .single();

            if (!createOrgErr && createdOrg) {
              orgId = createdOrg.id;
              orgsMap.set(lowerName, createdOrg.id);
            }
          }
        }

        if (orgId) {
          const { data: newOp, error: opErr } = await dbClient
            .from('organization_properties')
            .insert({ organization_id: orgId, property_id: newProp.id, status: 'ACTIVE' })
            .select('id')
            .single();

          if (!opErr && newOp) {
            await dbClient.from('onboardings').insert({
              organization_property_id: newOp.id,
              status: 'COMPLETED',
              completed_at: `${onboardingDate}T12:00:00.000Z`,
              target_date: onboardingDate,
            });

            await dbClient.from('e911_records').insert({
              organization_property_id: newOp.id,
              emergency_address: `${loc.address}, ${loc.city}, ${loc.state} ${loc.zip_code}`,
              status: isE911Verified ? 'VERIFIED' : 'PENDING',
              verified_at: isE911Verified ? new Date().toISOString() : null,
            });
          }
        }

        importedProperties.push({
          id: newProp.id,
          name: newProp.name,
          address: newProp.address,
          city: newProp.city,
          state: newProp.state,
          zip_code: newProp.zip_code,
          monthly_price: newProp.monthly_price,
          onboarding_date: newProp.onboarding_date || onboardingDate,
          main_phone: newProp.main_phone,
          organization_name: orgName || 'Unassigned',
          onboarding_stage: 'Onboarded',
          status: 'ACTIVE',
          e911_status: isE911Verified ? 'VERIFIED' : 'AUDIT_REQUIRED',
          ray_baum_status: isRayBaumActive ? 'Active' : 'Inactive',
        });
      } catch (err: any) {
        console.error(`Error importing row ${rowNum} (${propertyName}):`, err);
        errors.push({
          row: rowNum,
          propertyName: propertyName || 'Unknown',
          reason: err.message || 'Database error during insertion',
        });
      }
    }

    if (importedProperties.length > 0) {
      await logAuditEvent({
        action: 'PROPERTIES_IMPORTED',
        entity_type: 'PROPERTY',
        entity_id: importedProperties[0].id,
        entity_name: `${importedProperties.length} Properties Batch Import`,
        changes: { imported_count: importedProperties.length, failed_count: errors.length, total_processed: rawRows.length },
      });
    }

    return NextResponse.json({
      success: true,
      importedCount: importedProperties.length,
      failedCount: errors.length,
      totalProcessed: rawRows.length,
      properties: importedProperties,
      errors,
      message: `Successfully imported ${importedProperties.length} properties as Onboarded.${errors.length > 0 ? ` (${errors.length} failed)` : ''}`,
    });
  } catch (err: any) {
    console.error('Import properties API error:', err);
    return NextResponse.json({ success: false, error: err.message || 'Internal server error' }, { status: 500 });
  }
}
