import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    const { data: logs, error } = await supabase
      .from('audit_logs')
      .select(`
        *,
        actor:profiles(id, full_name, email, role),
        organization:organizations(id, name)
      `)
      .order('created_at', { ascending: false })
      .limit(100);

    if (error) {
      const { data: simpleLogs, error: sErr } = await supabase
        .from('audit_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (sErr) {
        return NextResponse.json({ success: false, error: sErr.message }, { status: 400 });
      }

      return NextResponse.json({ success: true, data: simpleLogs || [] });
    }

    return NextResponse.json({ success: true, data: logs || [] });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message || 'Internal server error' }, { status: 500 });
  }
}
