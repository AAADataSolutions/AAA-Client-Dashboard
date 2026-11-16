import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import {
  handleAddQuote,
  handleSelectQuote,
  handleStandardCircuitUpdate,
} from '../_helpers/patch-handlers';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const adminClient = createAdminClient();
    const db = adminClient || supabase;

    const { data: circuit, error } = await db
      .from('data_circuits')
      .select('*, data_circuit_quotes(*), data_circuit_monthly_revenues(*)')
      .eq('id', id)
      .single();

    if (error || !circuit) {
      return NextResponse.json({ success: false, error: 'Data Circuit not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: circuit });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message || 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const adminClient = createAdminClient();
    const db = adminClient || supabase;

    const body = await request.json();
    const action = body.action;

    // Fetch existing circuit
    const { data: existing, error: fetchErr } = await db
      .from('data_circuits')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchErr || !existing) {
      return NextResponse.json({ success: false, error: 'Data Circuit not found.' }, { status: 404 });
    }

    // Action A: Add a new competing wholesaler quote
    if (action === 'ADD_QUOTE') {
      return handleAddQuote(db, id, body);
    }

    // Action B: Select a winning quote & optionally mark Quotation Sent
    if (action === 'SELECT_QUOTE') {
      return handleSelectQuote(db, id, existing, body);
    }

    // Action C: Delete a quote
    if (action === 'DELETE_QUOTE') {
      const { quote_id } = body;
      await db.from('data_circuit_quotes').delete().eq('id', quote_id);
      return NextResponse.json({ success: true });
    }

    // Standard Stage & Details Update
    return handleStandardCircuitUpdate(db, id, existing, body);
  } catch (err: any) {
    console.error('[Data Circuit ID PATCH] Error:', err);
    return NextResponse.json({ success: false, error: err.message || 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const adminClient = createAdminClient();
    const db = adminClient || supabase;

    // Fetch existing circuit to get property_id before deleting
    const { data: existing } = await db
      .from('data_circuits')
      .select('id, property_id')
      .eq('id', id)
      .maybeSingle();

    const { error } = await db.from('data_circuits').delete().eq('id', id);
    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 400 });
    }

    // Reset property's connectivity_type back to PORTED if no active circuits remain
    if (existing?.property_id) {
      const { data: remaining } = await db
        .from('data_circuits')
        .select('id')
        .eq('property_id', existing.property_id)
        .neq('status', 'CANCELLED')
        .limit(1);

      if (!remaining || remaining.length === 0) {
        await db
          .from('properties')
          .update({
            connectivity_type: 'PORTED',
            updated_at: new Date().toISOString(),
          })
          .eq('id', existing.property_id);
      }
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message || 'Internal server error' }, { status: 500 });
  }
}

