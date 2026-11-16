import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { logAuditEvent } from '@/lib/audit/logger';
import { syncPropertyMonthlyPrice } from '@/lib/properties/pricing';
import { normalizeDid } from '@/lib/pbx/client';

function getField(row: Record<string, any>, keys: string[]): string {
  const normMap: Record<string, string> = {};
  Object.keys(row || {}).forEach((k) => {
    normMap[k.toLowerCase().replace(/[^a-z0-9]/g, '')] = String(row[k] ?? '');
  });
  for (const key of keys) {
    const nk = key.toLowerCase().replace(/[^a-z0-9]/g, '');
    if (normMap[nk] !== undefined && normMap[nk].trim() !== '') {
      return normMap[nk].trim();
    }
  }
  return '';
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: propertyId } = await params;
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

    const body = await request.json();
    const rows = Array.isArray(body.rows) ? body.rows : [];

    if (rows.length === 0) {
      return NextResponse.json({ success: false, error: 'No service rows provided.' }, { status: 400 });
    }

    const { data: prop, error: propErr } = await db
      .from('properties')
      .select('id, name')
      .eq('id', propertyId)
      .maybeSingle();

    if (propErr || !prop) {
      return NextResponse.json({ success: false, error: 'Property not found.' }, { status: 404 });
    }

    const [{ data: orgProp }, { data: serviceTypes }, { data: existingServices }] = await Promise.all([
      db.from('organization_properties').select('id').eq('property_id', propertyId).maybeSingle(),
      db.from('service_types').select('id, name'),
      db.from('services').select('*').eq('property_id', propertyId),
    ]);

    const typeMap = new Map<string, { id: string; name: string }>();
    (serviceTypes || []).forEach((t: any) => {
      if (t.name) typeMap.set(t.name.trim().toLowerCase(), t);
    });

    const existingByPhone = new Map<string, any>();
    const existingByCustomId = new Map<string, any>();
    (existingServices || []).forEach((s: any) => {
      if (s.phone_number) existingByPhone.set(String(s.phone_number).trim().toLowerCase(), s);
      if (s.custom_service_id) existingByCustomId.set(String(s.custom_service_id).trim().toLowerCase(), s);
    });

    const importedServices: any[] = [];
    const errors: { row: number; phone: string; reason: string }[] = [];

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const rowNum = i + 1;

      const phoneNumber = getField(row, ['Phone Number', 'Phone', 'DID', 'Number', 'phone_number']);
      if (!phoneNumber) {
        errors.push({ row: rowNum, phone: 'N/A', reason: 'Missing Phone Number' });
        continue;
      }

      const serviceTypeName =
        getField(row, ['Service Type', 'Type', 'service_type', 'service_type_name']) || 'Voice Trunk / DID';
      const serviceName = getField(row, ['Service Name', 'Name', 'service_name']);
      const priceRaw = getField(row, ['Monthly Price', 'Price', 'monthly_price', 'price']);
      const parsedPrice = priceRaw ? parseFloat(priceRaw.replace(/[^0-9.]/g, '')) : 0;
      const priceNum = !isNaN(parsedPrice) && parsedPrice >= 0 ? parsedPrice : 0;
      const description = getField(row, ['Description', 'Notes', 'description']);
      const statusRaw = getField(row, ['Status', 'status']).toUpperCase() || 'ACTIVE';
      const customServiceIdInput = getField(row, ['Service ID', 'Custom Service ID', 'custom_service_id', 'ID']);
      const deviceType = getField(row, ['Device Type', 'device_type']);
      const serialNumber = getField(row, ['Serial Number', 'Serial', 'serial_number']);

      try {
        // Resolve or create service type
        let typeObj = typeMap.get(serviceTypeName.toLowerCase());
        if (!typeObj) {
          const { data: createdType } = await db
            .from('service_types')
            .insert({ name: serviceTypeName, description: `${serviceTypeName} Service` })
            .select('id, name')
            .single();
          if (createdType) {
            typeObj = createdType;
            typeMap.set(serviceTypeName.toLowerCase(), createdType);
          }
        }

        const existingSvc =
          existingByPhone.get(phoneNumber.toLowerCase()) ||
          (customServiceIdInput ? existingByCustomId.get(customServiceIdInput.toLowerCase()) : null);

        if (existingSvc) {
          // Fill blank columns only; never overwrite already-filled values
          const blankUpdate: Record<string, any> = {};
          const isBlank = (v: any) => v === null || v === undefined || String(v).trim() === '';

          if (isBlank(existingSvc.service_name) && serviceName) blankUpdate.service_name = serviceName;
          if (isBlank(existingSvc.description) && description) blankUpdate.description = description;
          if ((existingSvc.price === null || existingSvc.price === undefined || Number(existingSvc.price) === 0) && priceNum > 0) {
            blankUpdate.price = priceNum;
          }
          if (isBlank(existingSvc.custom_service_id) && customServiceIdInput) {
            blankUpdate.custom_service_id = customServiceIdInput;
          }
          if (isBlank(existingSvc.status) && statusRaw) blankUpdate.status = statusRaw;
          if (!existingSvc.service_type_id && typeObj?.id) blankUpdate.service_type_id = typeObj.id;

          if (Object.keys(blankUpdate).length > 0) {
            blankUpdate.updated_at = new Date().toISOString();
            const { data: updSvc, error: updErr } = await db
              .from('services')
              .update(blankUpdate)
              .eq('id', existingSvc.id)
              .select()
              .single();
            if (updErr) throw updErr;
            importedServices.push(updSvc);
          } else {
            importedServices.push(existingSvc);
          }
          continue;
        }

        const lowerType = serviceTypeName.toLowerCase();
        const isFire = lowerType.includes('fire');
        const isElevator = lowerType.includes('elevator');
        const prefix = isFire ? 'FL' : isElevator ? 'EL' : 'SVC';
        const generatedId =
          customServiceIdInput || `${prefix}-${Math.floor(100000 + Math.random() * 900000)}`;

        const fullDesc = [
          description,
          deviceType ? `Device: ${deviceType}` : '',
          serialNumber ? `S/N: ${serialNumber}` : '',
        ]
          .filter(Boolean)
          .join(' | ');

        const { data: newService, error: insertErr } = await db
          .from('services')
          .insert({
            custom_service_id: generatedId,
            service_name: serviceName || `${serviceTypeName} (${phoneNumber})`,
            phone_number: phoneNumber,
            service_type_id: typeObj?.id || null,
            property_id: propertyId,
            description: fullDesc || null,
            price: priceNum,
            status: statusRaw,
            normalized_did: normalizeDid(phoneNumber),
          })
          .select()
          .single();

        if (insertErr || !newService) {
          throw new Error(insertErr?.message || 'Failed to create service');
        }

        if (orgProp?.id) {
          await db.from('organization_property_services').insert({
            organization_property_id: orgProp.id,
            service_id: newService.id,
          });
        }

        if (isFire) {
          try {
            await db.from('fire_lines').insert({
              property_id: propertyId,
              service_id: newService.id,
              phone_number: phoneNumber,
              device_type: deviceType || 'Fire Communicator',
              serial_number: serialNumber || null,
              price: priceNum,
              status: statusRaw,
            });
          } catch {}
        } else if (isElevator) {
          try {
            await db.from('elevator_lines').insert({
              property_id: propertyId,
              service_id: newService.id,
              phone_number: phoneNumber,
              device_type: deviceType || 'Elevator Phone',
              serial_number: serialNumber || null,
              price: priceNum,
              status: statusRaw,
            });
          } catch {}
        }

        existingByPhone.set(phoneNumber.toLowerCase(), newService);
        importedServices.push(newService);
      } catch (rowErr: any) {
        errors.push({ row: rowNum, phone: phoneNumber, reason: rowErr.message || 'Insert failed' });
      }
    }

    if (importedServices.length > 0) {
      await syncPropertyMonthlyPrice(db, propertyId);
      await logAuditEvent({
        action: 'PROPERTY_SERVICES_CSV_IMPORTED',
        entity_type: 'PROPERTY',
        entity_id: propertyId,
        entity_name: prop.name,
        changes: { importedCount: importedServices.length, failedCount: errors.length },
      });
    }

    return NextResponse.json({
      success: true,
      importedCount: importedServices.length,
      failedCount: errors.length,
      errors: errors.length > 0 ? errors : undefined,
      message: `Successfully imported ${importedServices.length} service(s) for ${prop.name}.${errors.length > 0 ? ` (${errors.length} failed)` : ''}`,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message || 'Internal server error' }, { status: 500 });
  }
}
