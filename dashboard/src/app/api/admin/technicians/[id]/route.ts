import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    if (!id) {
      return NextResponse.json({ success: false, error: 'Technician ID is required' }, { status: 400 });
    }

    const supabase = createAdminClient() || (await createClient());
    const body = await request.json();

    const updates: Record<string, any> = {
      updated_at: new Date().toISOString(),
    };

    if (body.name !== undefined) updates.name = body.name.trim();
    if (body.area_name !== undefined) updates.area_name = body.area_name.trim();
    if (body.phone_no !== undefined) updates.phone_no = body.phone_no.trim();
    if (body.status !== undefined) updates.status = body.status.trim();

    const { data, error } = await supabase
      .from('technicians')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('[Technicians PATCH Error]:', error);
      return NextResponse.json({ success: false, error: error.message }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      data,
      message: 'Technician updated successfully',
    });
  } catch (err: any) {
    console.error('[Technicians PATCH Catch]:', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    if (!id) {
      return NextResponse.json({ success: false, error: 'Technician ID is required' }, { status: 400 });
    }

    const supabase = createAdminClient() || (await createClient());

    const { error } = await supabase
      .from('technicians')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('[Technicians DELETE Error]:', error);
      return NextResponse.json({ success: false, error: error.message }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      message: 'Technician deleted successfully',
    });
  } catch (err: any) {
    console.error('[Technicians DELETE Catch]:', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
