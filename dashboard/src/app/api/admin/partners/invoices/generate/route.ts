import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { generateMonthlyPartnerInvoices } from '@/lib/partners/monthly-invoices';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authErr,
    } = await supabase.auth.getUser();

    if (authErr || !user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .maybeSingle();

    if (profile?.role !== 'SUPER_ADMIN' && profile?.role !== 'SUB_SUPER_ADMIN') {
      return NextResponse.json({ success: false, error: 'Forbidden: Super Admin access required.' }, { status: 403 });
    }

    let targetDate: Date | undefined;
    try {
      const body = await request.json();
      if (body?.month && body?.year) {
        targetDate = new Date(body.year, body.month - 1, 1);
      }
    } catch {
      // no body or malformed, default to current date
    }

    const result = await generateMonthlyPartnerInvoices(targetDate);

    return NextResponse.json({
      success: true,
      data: result,
      message: `Monthly invoicing executed. Generated: ${result.generated}, Skipped (Already existed): ${result.skipped}.`,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message || 'Internal server error' }, { status: 500 });
  }
}
