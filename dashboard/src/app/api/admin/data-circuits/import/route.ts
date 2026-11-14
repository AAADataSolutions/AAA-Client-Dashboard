import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { logAuditEvent } from '@/lib/audit/logger';
import { normalizeCircuitStage } from '@/app/admin/data-circuits/_components/dataCircuitsCsvParser';

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
      if (char === '\r' && nextChar === '\n') i++;
      if (currentLine.trim()) lines.push(currentLine);
      currentLine = '';
    } else {
      currentLine += char;
    }
  }
  if (currentLine.trim()) lines.push(currentLine);
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

function getConsecutivePastMonthKeys(count: number): string[] {
  const keys: string[] = [];
  const now = new Date();
  for (let i = 0; i < count; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    keys.push(`${y}-${m}`);
  }
  return keys;
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const dbClient = createAdminClient() || supabase;

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
      if (Array.isArray(body.rows)) rawRows = body.rows;
      else if (typeof body.csvText === 'string') rawRows = parseCSV(body.csvText);
    } else if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData();
      const file = formData.get('file') as File | null;
      if (!file) {
        return NextResponse.json({ success: false, error: 'No CSV file provided.' }, { status: 400 });
      }
      rawRows = parseCSV(await file.text());
    } else {
      rawRows = parseCSV(await request.text());
    }

    if (!rawRows || rawRows.length === 0) {
      return NextResponse.json(
        { success: false, error: 'The CSV file is empty or does not contain valid data rows.' },
        { status: 400 }
      );
    }

    // Cache existing properties, existing data circuit property IDs, and wholesalers
    const [{ data: existingProps }, { data: existingCircuits }] = await Promise.all([
      dbClient.from('properties').select('id, name, address, city, state, zip_code, country, fax, connectivity_type'),
      dbClient.from('data_circuits').select('property_id').neq('status', 'CANCELLED'),
    ]);
    const propsMap = new Map<string, any>();
    (existingProps || []).forEach((p: any) => {
      if (p.name) propsMap.set(p.name.trim().toLowerCase(), p);
    });
    const existingCircuitPropIds = new Set<string>(
      (existingCircuits || []).map((c: any) => c.property_id).filter(Boolean)
    );
    const batchPropNames = new Set<string>();

    const wholesalersSet = new Set<string>();
    try {
      const { data: wData } = await dbClient.from('data_circuit_wholesalers').select('name');
      (wData || []).forEach((w: any) => {
        if (w.name) wholesalersSet.add(w.name.trim().toLowerCase());
      });
    } catch {
      // Ignore if wholesalers table doesn't exist
    }

    const importedCircuits: any[] = [];
    const errors: { row: number; propertyName: string; reason: string }[] = [];
    let totalRevenueAdded = 0;

    for (let index = 0; index < rawRows.length; index++) {
      const row = rawRows[index];
      const rowNum = index + 2;

      const propertyName = getHeaderValue(row, ['Property Name', 'PropertyName', 'property_name', 'Name']).trim();
      if (!propertyName) {
        errors.push({ row: rowNum, propertyName: `Row ${rowNum}`, reason: 'Missing Property Name' });
        continue;
      }

      const normPropName = propertyName.toLowerCase();
      const matchedProp = propsMap.get(normPropName);
      if (batchPropNames.has(normPropName) || (matchedProp && existingCircuitPropIds.has(matchedProp.id))) {
        errors.push({ row: rowNum, propertyName, reason: 'Duplicate data circuit for this property already exists' });
        continue;
      }
      batchPropNames.add(normPropName);

      const propertyAddress = getHeaderValue(row, ['Property Address', 'PropertyAddress', 'property_address', 'Street Address', 'Address']).trim();
      const city = getHeaderValue(row, ['City', 'city']).trim();
      const zipCode = getHeaderValue(row, ['Zip Code', 'ZipCode', 'zip_code', 'Zip', 'Postal Code']).trim();
      const country = getHeaderValue(row, ['Country', 'country']).trim() || 'USA';
      const faxNumber = getHeaderValue(row, ['Fax Number', 'FaxNumber', 'fax_number', 'Fax', 'Apps Number', 'AppsNumber', 'apps_number', 'Phone Number']).trim();
      const wholesalerName = getHeaderValue(row, ['Wholesaler Name', 'WholesalerName', 'wholesaler_name', 'Wholesaler']).trim();
      const carrier = getHeaderValue(row, ['Carrier', 'carrier', 'Carrier Name', 'carrier_name']).trim();
      const bandwidth = getHeaderValue(row, ['Bandwidth', 'bandwidth', 'Speed']).trim() || '1 Gig';
      const clientPriceRaw = getHeaderValue(row, ['Client Price', 'ClientPrice', 'client_price', 'Price', 'Monthly Price']);
      const revenueShareRaw = getHeaderValue(row, ['Revenue Share', 'RevenueShare', 'revenue_share', 'Revenue Share %', 'Share']);
      const stageRaw = getHeaderValue(row, ['Stage', 'stage', 'Status', 'status']);
      const timesPaidRaw = getHeaderValue(row, [
        'Number of Times Monthly Revenue Paid',
        'NumberOfTimesMonthlyRevenuePaid',
        'number_of_times_monthly_revenue_paid',
        'Times Paid',
        'Months Paid',
        'times_paid',
      ]);

      const clientPrice = parseFloat(clientPriceRaw.replace(/[^0-9.]/g, '')) || 0;
      const revSharePct = parseFloat(revenueShareRaw.replace(/[^0-9.]/g, '')) || 0;
      const monthlyRevShareAmt = Math.round(clientPrice * (revSharePct / 100) * 100) / 100;
      const timesPaid = Math.max(0, parseInt(timesPaidRaw.replace(/[^0-9]/g, ''), 10) || 0);
      const mappedStage = normalizeCircuitStage(stageRaw);

      try {
        // 1. Resolve or Create Property
        let propRecord = propsMap.get(propertyName.toLowerCase());
        if (!propRecord) {
          const { data: createdProp, error: propCreateErr } = await dbClient
            .from('properties')
            .insert({
              name: propertyName,
              address: propertyAddress || 'Address pending',
              city: city || 'City',
              state: 'IL',
              zip_code: zipCode || '00000',
              country,
              fax: faxNumber || null,
              connectivity_type: 'DATA_CIRCUITED',
              status: 'ACTIVE',
            })
            .select('id, name, address, city, state, zip_code, country, fax, connectivity_type')
            .single();

          if (propCreateErr || !createdProp) {
            throw new Error(propCreateErr?.message || 'Failed to create property for circuit');
          }
          propRecord = createdProp;
          propsMap.set(propertyName.toLowerCase(), propRecord);
        } else {
          const propUpdate: Record<string, any> = {};
          if (faxNumber && !propRecord.fax) propUpdate.fax = faxNumber;
          if (propertyAddress && (!propRecord.address || propRecord.address === 'Address pending')) propUpdate.address = propertyAddress;
          if (city && (!propRecord.city || propRecord.city === 'City')) propUpdate.city = city;
          if (zipCode && (!propRecord.zip_code || propRecord.zip_code === '00000')) propUpdate.zip_code = zipCode;
          if (propRecord.connectivity_type === 'PORTED') propUpdate.connectivity_type = 'BOTH';
          if (Object.keys(propUpdate).length > 0) {
            await dbClient.from('properties').update(propUpdate).eq('id', propRecord.id);
          }
        }

        // 2. Ensure Wholesaler exists in directory (best-effort)
        if (wholesalerName && !wholesalersSet.has(wholesalerName.toLowerCase())) {
          try {
            await dbClient.from('data_circuit_wholesalers').insert({ name: wholesalerName });
            wholesalersSet.add(wholesalerName.toLowerCase());
          } catch {
            // Ignore duplicate or missing table
          }
        }

        // 3. Insert Data Circuit
        const nowIso = new Date().toISOString();
        const { data: newCircuit, error: circuitErr } = await dbClient
          .from('data_circuits')
          .insert({
            property_id: propRecord.id,
            status: mappedStage,
            wholesaler_name: wholesalerName || null,
            carrier_name: carrier || null,
            bandwidth,
            circuit_monthly_price: clientPrice,
            revenue_share_percentage: revSharePct,
            monthly_revenue_share_amount: monthlyRevShareAmt,
            installed_at: mappedStage === 'INSTALLED' ? nowIso : null,
            created_by: user.id,
          })
          .select('*')
          .single();

        if (circuitErr || !newCircuit) {
          throw new Error(circuitErr?.message || 'Failed to insert data circuit');
        }

        // 4. Insert selected quote if pricing/wholesaler provided
        if ((wholesalerName || carrier) && clientPrice > 0) {
          try {
            await dbClient.from('data_circuit_quotes').insert({
              data_circuit_id: newCircuit.id,
              wholesaler_name: wholesalerName || 'Wholesaler',
              carrier_name: carrier || 'Carrier',
              bandwidth,
              quoted_monthly_price: clientPrice,
              revenue_share_percentage: revSharePct,
              is_selected: true,
            });
          } catch {
            // Ignore quote insert errors
          }
        }

        // 5. Record "Number of Times Monthly Revenue Paid" into data_circuit_monthly_revenues
        let circuitPaidTotal = 0;
        if (timesPaid > 0 && monthlyRevShareAmt > 0) {
          const monthKeys = getConsecutivePastMonthKeys(timesPaid);
          const revRows = monthKeys.map((mKey) => ({
            data_circuit_id: newCircuit.id,
            property_id: propRecord.id,
            month_key: mKey,
            wholesaler_name: wholesalerName || null,
            carrier_name: carrier || null,
            circuit_monthly_price: clientPrice,
            revenue_share_percentage: revSharePct,
            revenue_share_amount: monthlyRevShareAmt,
            revenue_received: true,
            received_at: nowIso,
            updated_by: user.id,
            notes: `Imported via CSV (${timesPaid} months paid = $${(timesPaid * monthlyRevShareAmt).toFixed(2)})`,
            updated_at: nowIso,
          }));

          const { error: revErr } = await dbClient
            .from('data_circuit_monthly_revenues')
            .upsert(revRows, { onConflict: 'data_circuit_id,month_key' });

          if (!revErr) {
            circuitPaidTotal = Math.round(timesPaid * monthlyRevShareAmt * 100) / 100;
            totalRevenueAdded = Math.round((totalRevenueAdded + circuitPaidTotal) * 100) / 100;
          }
        }

        importedCircuits.push({
          ...newCircuit,
          property_name: propRecord.name,
          times_paid: timesPaid,
          total_revenue_added: circuitPaidTotal,
        });
      } catch (rowErr: any) {
        errors.push({
          row: rowNum,
          propertyName,
          reason: rowErr.message || 'Database insert error',
        });
      }
    }

    await logAuditEvent({
      action: 'DATA_CIRCUITS_BULK_IMPORTED',
      entity_type: 'DATA_CIRCUIT',
      entity_name: `${importedCircuits.length} Data Circuits Imported`,
      description: `Bulk imported ${importedCircuits.length} data circuits via CSV (Total Revenue Added: $${totalRevenueAdded.toFixed(2)}).`,
      changes: {
        importedCount: importedCircuits.length,
        failedCount: errors.length,
        totalRevenueAdded,
      },
    });

    return NextResponse.json({
      success: true,
      importedCount: importedCircuits.length,
      failedCount: errors.length,
      totalRevenueAdded,
      message: `Successfully imported ${importedCircuits.length} data circuit(s) and added $${totalRevenueAdded.toFixed(2)} in monthly revenue share.`,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (err: any) {
    console.error('[Data Circuits CSV Import] Error:', err);
    return NextResponse.json({ success: false, error: err.message || 'Failed to import CSV' }, { status: 500 });
  }
}

