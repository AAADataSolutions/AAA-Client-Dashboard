import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

// POST: add one or many devices to a vendor
// Body: { vendor_id: string, devices: [{ serial_number, device_name, cost }] }
export async function POST(request: NextRequest) {
  try {
    const supabase = createAdminClient() || (await createClient());
    const { vendor_id, devices } = await request.json();

    if (!vendor_id) {
      return NextResponse.json({ success: false, error: 'vendor_id is required.' }, { status: 400 });
    }
    if (!Array.isArray(devices) || devices.length === 0) {
      return NextResponse.json({ success: false, error: 'At least one device is required.' }, { status: 400 });
    }

    const rows = devices
      .filter((d: any) => d.device_name?.trim())
      .map((d: any) => ({
        vendor_id,
        serial_number: d.serial_number?.trim() || null,
        device_name: d.device_name.trim(),
        cost: d.cost !== undefined && d.cost !== '' ? Number(d.cost) : 0,
      }));

    if (rows.length === 0) {
      return NextResponse.json({ success: false, error: 'Device name is required.' }, { status: 400 });
    }

    const { data, error } = await supabase.from('vendor_devices').insert(rows).select();
    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 400 });
    }

    // Auto-sync: keep vendor's monthly_cost strictly in sync with sum of its devices
    const { data: allDevs } = await supabase
      .from('vendor_devices')
      .select('cost')
      .eq('vendor_id', vendor_id);
    const newTotalCost = (allDevs || []).reduce((sum: number, d: any) => sum + Number(d.cost || 0), 0);
    await supabase.from('vendors').update({ monthly_cost: newTotalCost }).eq('id', vendor_id);

    return NextResponse.json({ success: true, data, updated_monthly_cost: newTotalCost });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message || 'Internal server error' }, { status: 500 });
  }
}

// DELETE: remove a device ?id=<device_id>
export async function DELETE(request: NextRequest) {
  try {
    const supabase = createAdminClient() || (await createClient());
    const id = new URL(request.url).searchParams.get('id');
    if (!id) {
      return NextResponse.json({ success: false, error: 'Device id is required.' }, { status: 400 });
    }

    // Fetch device first to know its vendor_id for cost sync
    const { data: dev } = await supabase
      .from('vendor_devices')
      .select('vendor_id')
      .eq('id', id)
      .single();

    const { error } = await supabase.from('vendor_devices').delete().eq('id', id);
    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 400 });
    }

    // Auto-sync: recalculate vendor's monthly_cost after deletion
    if (dev?.vendor_id) {
      const { data: remainingDevs } = await supabase
        .from('vendor_devices')
        .select('cost')
        .eq('vendor_id', dev.vendor_id);
      const newTotalCost = (remainingDevs || []).reduce((sum: number, d: any) => sum + Number(d.cost || 0), 0);
      await supabase.from('vendors').update({ monthly_cost: newTotalCost }).eq('id', dev.vendor_id);
    }

    return NextResponse.json({ success: true, deletedId: id });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message || 'Internal server error' }, { status: 500 });
  }
}
