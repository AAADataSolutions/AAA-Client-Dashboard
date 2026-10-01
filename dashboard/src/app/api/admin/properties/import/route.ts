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
        currentLine += '"';
        i++; // skip escaped quote
      } else {
        inQuotes = !inQuotes;
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

  // Parse a single CSV row into columns
  const parseRow = (line: string): string[] => {
    const cells: string[] = [];
    let currentCell = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      const nextChar = line[i + 1];

      if (char === '"') {
        if (inQuotes && nextChar === '"') {
          currentCell += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        cells.push(currentCell.trim());
        currentCell = '';
      } else {
        currentCell += char;
      }
    }
    cells.push(currentCell.trim());
    return cells;
  };

  const rawHeaders = parseRow(lines[0]);
  const headers = rawHeaders.map((h) => h.replace(/^["']|["']$/g, '').trim());

  const rows: Record<string, string>[] = [];
  for (let i = 1; i < lines.length; i++) {
    const cells = parseRow(lines[i]);
    if (cells.every((c) => !c)) continue; // skip empty line

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
    return {
      address: 'Address pending',
      city: 'City',
      state: 'IL',
      zip_code: '00000',
      country: 'USA',
    };
  }

  const parts = clean.split(',').map((p) => p.trim()).filter(Boolean);

  if (parts.length >= 3) {
    const address = parts[0];
    const city = parts[1];
    const stateZip = parts.slice(2).join(' ');
    
    // Parse "IL 60601" or "Illinois 60601"
    const stateZipMatch = stateZip.match(/([A-Za-z\s]+)\s*(\d{5}(?:-\d{4})?)?/);
    const state = stateZipMatch && stateZipMatch[1] ? stateZipMatch[1].trim() : parts[2] || 'IL';
    const zip_code = stateZipMatch && stateZipMatch[2] ? stateZipMatch[2].trim() : '00000';

    return { address, city, state, zip_code, country: 'USA' };
  } else if (parts.length === 2) {
    const address = parts[0];
    const stateZipMatch = parts[1].match(/([A-Za-z\s]+)\s*(\d{5}(?:-\d{4})?)?/);
    const cityOrState = stateZipMatch && stateZipMatch[1] ? stateZipMatch[1].trim() : parts[1];
    const zip_code = stateZipMatch && stateZipMatch[2] ? stateZipMatch[2].trim() : '00000';
    return {
      address,
      city: cityOrState,
      state: 'IL',
      zip_code,
      country: 'USA',
    };
  } else {
    return {
      address: clean,
      city: 'City',
      state: 'IL',
      zip_code: '00000',
      country: 'USA',
    };
  }
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

    // Cache existing organizations
    const { data: allOrgs } = await dbClient.from('organizations').select('id, name');
    const orgsMap = new Map<string, string>();
    (allOrgs || []).forEach((o: any) => {
      orgsMap.set(o.name.trim().toLowerCase(), o.id);
    });

    const importedProperties: any[] = [];
    const errors: { row: number; propertyName: string; reason: string }[] = [];

    for (let index = 0; index < rawRows.length; index++) {
      const row = rawRows[index];
      const rowNum = index + 2; // Accounting for 1-based index + header row

      // 1. Property Name
      const propertyName = getHeaderValue(row, [
        'Property Name',
        'PropertyName',
        'property_name',
        'Name',
        'name',
      ]);

      if (!propertyName.trim()) {
        errors.push({
          row: rowNum,
          propertyName: 'Row ' + rowNum,
          reason: 'Missing Property Name',
        });
        continue;
      }

      // 2. Property Location
      const locationRaw = getHeaderValue(row, [
        'Property Location',
        'PropertyLocation',
        'property_location',
        'Location',
        'location',
        'Address',
        'address',
      ]);
      const loc = parseLocation(locationRaw);

      // 3. Monthly price
      const priceRaw = getHeaderValue(row, [
        'Monthly price',
        'MonthlyPrice',
        'monthly_price',
        'Monthly Price',
        'Price',
        'price',
        'MRR',
      ]);
      const cleanPrice = priceRaw ? parseFloat(priceRaw.replace(/[^0-9.]/g, '')) : null;
      const monthlyPrice = cleanPrice && !isNaN(cleanPrice) ? cleanPrice : null;

      // 4. Main Phone no
      const mainPhone = getHeaderValue(row, [
        'Main Phone no',
        'Main Phone No',
        'MainPhoneNo',
        'main_phone_no',
        'Main Phone',
        'main_phone',
        'Phone',
        'phone',
      ]);

      // 5. Management group
      const mgmtGroup = getHeaderValue(row, [
        'Management group',
        'Management Group',
        'ManagementGroup',
        'management_group',
        'Organization',
        'organization',
        'Group',
        'group',
      ]);

      // 6. E911 Status
      const e911Raw = getHeaderValue(row, [
        'E911 Status',
        'E911Status',
        'e911_status',
        'E911',
        'e911',
      ]).toLowerCase();
      const isE911Verified =
        e911Raw.includes('verif') ||
        e911Raw.includes('active') ||
        e911Raw.includes('yes') ||
        e911Raw.includes('true') ||
        e911Raw.includes('pass');

      // 7. Ray Baum and Kari's law (supports "ay Baum and Kary's law" or "Ray Baum and Kari's law")
      const rayBaumRaw = getHeaderValue(row, [
        'Ray Baum and Kari\'s law',
        'Ray Baum and Kary\'s law',
        'ay Baum and Kary\'s law',
        'Ray Baum',
        'ray_baum',
        'ray_baum_status',
        'Karis Law',
        'kari_law',
      ]).toLowerCase();
      const isRayBaumActive =
        rayBaumRaw.includes('act') ||
        rayBaumRaw.includes('yes') ||
        rayBaumRaw.includes('true') ||
        rayBaumRaw.includes('verif') ||
        rayBaumRaw.includes('comp') ||
        isE911Verified;

      // 8. GM Name
      const gmName = getHeaderValue(row, [
        'GM Name',
        'GMName',
        'gm_name',
        'General Manager Name',
        'general_manager_name',
        'General Manager',
      ]);

      // 9. GM email
      const gmEmail = getHeaderValue(row, [
        'GM email',
        'GMEmail',
        'gm_email',
        'General Manager Email',
        'general_manager_email',
        'GM Email',
      ]);

      try {
        // A. Insert property record
        const { data: newProp, error: insertPropErr } = await dbClient
          .from('properties')
          .insert({
            name: propertyName.trim(),
            address: loc.address,
            city: loc.city,
            state: loc.state,
            zip_code: loc.zip_code,
            country: loc.country,
            main_phone: mainPhone.trim() || null,
            general_manager_name: gmName.trim() || null,
            general_manager_email: gmEmail.trim() || null,
            contact_person_name: gmName.trim() || null,
            contact_person_email: gmEmail.trim() || null,
            monthly_price: monthlyPrice,
            ray_baud_and_logs_enabled: isE911Verified || isRayBaumActive,
            ray_baum_status: isRayBaumActive ? 'ACTIVE' : 'INACTIVE',
            status: 'ACTIVE',
          })
          .select()
          .single();

        if (insertPropErr || !newProp) {
          throw new Error(insertPropErr?.message || 'Failed to insert property record');
        }

        // B. Handle Management Group linking
        let orgId: string | null = null;
        let orgName = mgmtGroup.trim();

        if (orgName) {
          const lowerName = orgName.toLowerCase();
          if (orgsMap.has(lowerName)) {
            orgId = orgsMap.get(lowerName)!;
          } else {
            // Create organization if it does not already exist
            const { data: createdOrg, error: createOrgErr } = await dbClient
              .from('organizations')
              .insert({
                name: orgName,
                type: 'GROUP',
                status: 'ACTIVE',
              })
              .select('id, name')
              .single();

            if (!createOrgErr && createdOrg) {
              orgId = createdOrg.id;
              orgsMap.set(lowerName, createdOrg.id);
            }
          }
        }

        // C. Link to Organization Properties and set Onboarding status to COMPLETED (Onboarded)
        if (orgId) {
          const { data: newOp, error: opErr } = await dbClient
            .from('organization_properties')
            .insert({
              organization_id: orgId,
              property_id: newProp.id,
              status: 'ACTIVE',
            })
            .select('id')
            .single();

          if (!opErr && newOp) {
            // Guarantee status is "Onboarded" via COMPLETED onboarding record
            await dbClient.from('onboardings').insert({
              organization_property_id: newOp.id,
              status: 'COMPLETED',
            });

            // Insert E911 dispatch record
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

    // Central Audit Log
    if (importedProperties.length > 0) {
      await logAuditEvent({
        action: 'PROPERTIES_IMPORTED',
        entity_type: 'PROPERTY',
        entity_id: importedProperties[0].id,
        entity_name: `${importedProperties.length} Properties Batch Import`,
        changes: {
          imported_count: importedProperties.length,
          failed_count: errors.length,
          total_processed: rawRows.length,
        },
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
