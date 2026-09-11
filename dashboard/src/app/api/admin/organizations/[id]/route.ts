import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    // Fetch org with rich associations
    const { data: org, error } = await supabase
      .from('organizations')
      .select(`
        *,
        properties:properties(*),
        members:organization_members(
          id,
          role,
          status,
          created_at,
          profile:profiles(id, full_name, email, avatar_url, phone_number)
        ),
        tickets:support_tickets(
          id,
          ticket_number,
          subject,
          status,
          priority,
          created_at
        )
      `)
      .eq('id', id)
      .single();

    if (error) {
      // Fallback simple fetch
      const { data: simpleOrg, error: sErr } = await supabase
        .from('organizations')
        .select('*')
        .eq('id', id)
        .single();

      if (sErr) {
        return NextResponse.json({ success: false, error: sErr.message }, { status: 404 });
      }

      return NextResponse.json({ success: true, data: simpleOrg });
    }

    return NextResponse.json({ success: true, data: org });
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
    const body = await request.json();

    const updatePayload: Record<string, any> = {
      updated_at: new Date().toISOString(),
    };

    if (body.name !== undefined) updatePayload.name = body.name.trim();
    if (body.email !== undefined) updatePayload.email = body.email ? body.email.trim() : null;
    if (body.phone !== undefined) updatePayload.phone = body.phone ? body.phone.trim() : null;
    if (body.address !== undefined) updatePayload.address = body.address ? body.address.trim() : null;
    if (body.city !== undefined) updatePayload.city = body.city ? body.city.trim() : null;
    if (body.state !== undefined) updatePayload.state = body.state ? body.state.trim() : null;
    if (body.zip_code !== undefined) updatePayload.zip_code = body.zip_code ? body.zip_code.trim() : null;
    if (body.country !== undefined) updatePayload.country = body.country ? body.country.trim() : 'USA';
    if (body.status !== undefined) updatePayload.status = body.status;

    const { data: updatedOrg, error } = await supabase
      .from('organizations')
      .update(updatePayload)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true, data: updatedOrg });
  } catch (err: any) {
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

    // Instead of hard deleting, we support archiving or cascading deletion
    const { error } = await supabase
      .from('organizations')
      .update({ status: 'ARCHIVED', updated_at: new Date().toISOString() })
      .eq('id', id);

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true, message: 'Organization archived successfully' });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message || 'Internal server error' }, { status: 500 });
  }
}
