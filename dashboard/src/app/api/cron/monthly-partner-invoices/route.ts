import { NextRequest, NextResponse } from 'next/server';
import { generateMonthlyPartnerInvoices } from '@/lib/partners/monthly-invoices';

/**
 * Automated Cron Endpoint — Runs on the 1st day of every month (0 0 1 * *)
 * Generates monthly partner invoices and dispatches emails with PDF attachments sequentially one by one.
 */
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    // If CRON_SECRET is configured in environment, verify it
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ success: false, error: 'Unauthorized cron invocation' }, { status: 401 });
    }

    const result = await generateMonthlyPartnerInvoices(undefined, {
      sendEmails: true,
      waitForEmails: true,
    });

    return NextResponse.json({
      success: true,
      executedAt: new Date().toISOString(),
      data: result,
      message: `1st-of-month partner invoicing complete. Generated: ${result.generated}, Skipped: ${result.skipped}, Emails Dispatched: ${result.emailsQueued}.`,
    });
  } catch (err: any) {
    console.error('[Cron Monthly Partner Invoices] Error:', err);
    return NextResponse.json(
      { success: false, error: err?.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  return GET(request);
}

