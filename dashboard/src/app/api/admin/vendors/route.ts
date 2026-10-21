import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { logAuditEvent } from '@/lib/audit/logger';

export async function GET(request: NextRequest) {
  try {
    const supabase = createAdminClient() || (await createClient());
    const { searchParams } = new URL(request.url);

    const search = searchParams.get('search')?.trim().toLowerCase() || '';
    const category = searchParams.get('category') || '';
    const marginStatus = searchParams.get('margin') || ''; // 'profitable' | 'loss' | 'pure_expense'

    // Query vendors strictly from Supabase database
    const { data: dbVendors, error: vendorErr } = await supabase
      .from('vendors')
      .select('*')
      .order('created_at', { ascending: true });

    if (vendorErr) {
      console.error('[Vendors API] Query error:', vendorErr);
      return NextResponse.json({
        success: true,
        data: [],
        metrics: {
          totalPaid: 0,
          totalEarned: 0,
          netProfit: 0,
          activeVendorsCount: 0,
          totalDevicesInstalled: 0,
        },
      });
    }

    const vendors = dbVendors || [];

    // Fetch allocations for vendors from database
    const { data: dbAllocations } = await supabase
      .from('vendor_property_allocations')
      .select('*');

    const allocations = dbAllocations || [];

    // Fetch devices belonging to vendors
    const { data: dbDevices } = await supabase
      .from('vendor_devices')
      .select('*')
      .order('created_at', { ascending: true });
    const allDevices = dbDevices || [];

    const enriched = vendors.map((v: any) => {
      const vAllocations = allocations.filter((a: any) => a.vendor_id === v.id);
      const vDevices = allDevices.filter((d: any) => d.vendor_id === v.id);
      const devicesTotalCost = vDevices.reduce((s: number, d: any) => s + Number(d.cost || 0), 0);
      const hasDevices = vDevices.length > 0;
      const allocDevices = vAllocations.reduce((sum: number, a: any) => sum + Number(a.devices_count || 0), 0);
      const totalDevices = hasDevices ? vDevices.length : allocDevices;
      // Source of truth: if devices are listed, what you pay = sum of device costs
      const paid = hasDevices ? devicesTotalCost : Number(v.monthly_cost || 0);

      // Auto-heal DB row if monthly_cost in table was out of sync with actual devices
      if (hasDevices && Math.abs(Number(v.monthly_cost || 0) - devicesTotalCost) > 0.001) {
        supabase.from('vendors').update({ monthly_cost: devicesTotalCost }).eq('id', v.id).then();
      }

      const earned = Number(v.monthly_billed || 0);
      const netMargin = earned - paid;
      const marginPct = earned > 0 ? Math.round((netMargin / earned) * 1000) / 10 : earned === 0 && paid > 0 ? -100.0 : 0.0;

      const costPerDevice = totalDevices > 0 ? paid / totalDevices : 0;
      const billedPerDevice = totalDevices > 0 ? earned / totalDevices : 0;
      const profitPerDevice = billedPerDevice - costPerDevice;

      return {
        id: v.id,
        name: v.name,
        category: v.category,
        monthly_cost: paid,
        monthly_cost_manual: Number(v.monthly_cost || 0),
        pay_source: hasDevices ? 'DEVICES' : 'MANUAL',
        monthly_billed: earned,
        net_margin: netMargin,
        margin_pct: marginPct,
        status: v.status || 'ACTIVE',
        devices_count: totalDevices,
        cost_per_device: costPerDevice,
        billed_per_device: billedPerDevice,
        profit_per_device: profitPerDevice,
        contact_person: v.contact_person,
        contact_email: v.contact_email,
        contact_phone: v.contact_phone,
        notes: v.notes,
        devices: vDevices,
        devices_list_count: vDevices.length,
        devices_total_cost: devicesTotalCost,
        allocations: vAllocations.map((a: any) => {
          const count = Number(a.devices_count || 1);
          const uCost = a.unit_cost_monthly !== undefined && a.unit_cost_monthly !== null ? Number(a.unit_cost_monthly) : costPerDevice;
          const uBilled = a.unit_billed_monthly !== undefined && a.unit_billed_monthly !== null ? Number(a.unit_billed_monthly) : billedPerDevice;
          const locPaid = count * uCost;
          const locBilled = count * uBilled;
          return {
            id: a.id,
            location_name: a.location_name,
            devices_count: count,
            unit_cost_monthly: uCost,
            unit_billed_monthly: uBilled,
            total_cost: locPaid,
            total_billed: locBilled,
            net_profit: locBilled - locPaid,
            status: a.status || 'ACTIVE',
          };
        }),
      };
    });

    let filtered = enriched;
    if (search) {
      filtered = filtered.filter((v: any) =>
        v.name?.toLowerCase().includes(search) ||
        v.category?.toLowerCase().includes(search) ||
        v.contact_person?.toLowerCase().includes(search)
      );
    }
    if (category) {
      filtered = filtered.filter((v: any) => v.category?.toLowerCase() === category.toLowerCase());
    }
    if (marginStatus === 'profitable') {
      filtered = filtered.filter((v: any) => v.net_margin > 0);
    } else if (marginStatus === 'loss') {
      filtered = filtered.filter((v: any) => v.net_margin < 0);
    } else if (marginStatus === 'pure_expense') {
      filtered = filtered.filter((v: any) => v.monthly_billed === 0);
    }

    const activeVendors = enriched.filter((v: any) => v.status === 'ACTIVE');
    const totalPaid = activeVendors.reduce((sum: number, v: any) => sum + v.monthly_cost, 0);
    const totalEarned = activeVendors.reduce((sum: number, v: any) => sum + v.monthly_billed, 0);
    const netProfit = totalEarned - totalPaid;

    return NextResponse.json({
      success: true,
      data: filtered,
      metrics: {
        totalPaid: Math.round(totalPaid * 100) / 100,
        totalEarned: Math.round(totalEarned * 100) / 100,
        netProfit: Math.round(netProfit * 100) / 100,
        activeVendorsCount: activeVendors.length,
        totalDevicesInstalled: enriched.reduce((sum: number, v: any) => sum + v.devices_count, 0),
      },
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message || 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createAdminClient() || (await createClient());
    const body = await request.json();
    const { name, category, monthly_cost, monthly_billed, status, contact_person, contact_email, contact_phone, notes, allocations } = body;

    if (!name || !name.trim()) {
      return NextResponse.json({ success: false, error: 'Vendor name is required.' }, { status: 400 });
    }

    const { data: newVendor, error: insertErr } = await supabase
      .from('vendors')
      .insert({
        name: name.trim(),
        category: category || 'Telecom',
        monthly_cost: monthly_cost !== undefined && monthly_cost !== '' ? Number(monthly_cost) : 0,
        monthly_billed: monthly_billed !== undefined && monthly_billed !== '' ? Number(monthly_billed) : 0,
        status: status || 'ACTIVE',
        contact_person: contact_person?.trim() || null,
        contact_email: contact_email?.trim() || null,
        contact_phone: contact_phone?.trim() || null,
        notes: notes?.trim() || null,
      })
      .select()
      .single();

    if (insertErr) {
      return NextResponse.json({ success: false, error: insertErr.message }, { status: 400 });
    }

    // Insert allocations if provided
    if (allocations && Array.isArray(allocations) && allocations.length > 0) {
      const allocRows = allocations.map((a: any) => ({
        vendor_id: newVendor.id,
        property_id: a.property_id || null,
        location_name: a.location_name || 'Site Location',
        devices_count: a.devices_count ? Number(a.devices_count) : 1,
        unit_cost_monthly: a.unit_cost_monthly !== undefined ? Number(a.unit_cost_monthly) : 0,
        unit_billed_monthly: a.unit_billed_monthly !== undefined ? Number(a.unit_billed_monthly) : 0,
        status: a.status || 'ACTIVE',
      }));
      await supabase.from('vendor_property_allocations').insert(allocRows);
    }

    await logAuditEvent({
      action: 'VENDOR_CREATED',
      entity_type: 'VENDOR',
      entity_id: newVendor.id,
      entity_name: newVendor.name,
      changes: newVendor,
    });

    return NextResponse.json({ success: true, data: newVendor });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message || 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const supabase = createAdminClient() || (await createClient());
    const body = await request.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json({ success: false, error: 'Vendor ID is required for update.' }, { status: 400 });
    }

    if (updates.monthly_cost !== undefined) {
      updates.monthly_cost = updates.monthly_cost === '' ? 0 : Number(updates.monthly_cost);
    }
    if (updates.monthly_billed !== undefined) {
      updates.monthly_billed = updates.monthly_billed === '' ? 0 : Number(updates.monthly_billed);
    }

    const { data: updated, error: updateErr } = await supabase
      .from('vendors')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (updateErr) {
      return NextResponse.json({ success: false, error: updateErr.message }, { status: 400 });
    }

    await logAuditEvent({
      action: 'VENDOR_UPDATED',
      entity_type: 'VENDOR',
      entity_id: updated.id,
      entity_name: updated.name,
      changes: updates,
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message || 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = createAdminClient() || (await createClient());
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ success: false, error: 'Vendor ID is required for deletion.' }, { status: 400 });
    }

    // Cascade delete any child devices and property allocations
    await supabase.from('vendor_devices').delete().eq('vendor_id', id);
    await supabase.from('vendor_property_allocations').delete().eq('vendor_id', id);

    const { error: delErr } = await supabase.from('vendors').delete().eq('id', id);

    if (delErr) {
      return NextResponse.json({ success: false, error: delErr.message }, { status: 400 });
    }

    await logAuditEvent({
      action: 'VENDOR_DELETED',
      entity_type: 'VENDOR',
      entity_id: id,
      changes: { deleted: true },
    });

    return NextResponse.json({ success: true, deletedId: id });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message || 'Internal server error' }, { status: 500 });
  }
}
