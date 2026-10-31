export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const globalForScheduler = globalThis as unknown as {
      __utcMonthlyPartnerInvoiceSchedulerStarted?: boolean;
      __lastExecutedUtcMonth?: string;
    };

    if (globalForScheduler.__utcMonthlyPartnerInvoiceSchedulerStarted) {
      return;
    }
    globalForScheduler.__utcMonthlyPartnerInvoiceSchedulerStarted = true;

    const checkAndRunMonthlyInvoices = async () => {
      try {
        const now = new Date();
        // Trigger strictly on the 1st day of the month in UTC (starting at 00:00 UTC)
        if (now.getUTCDate() !== 1) {
          return;
        }

        const monthKey = `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, '0')}`;
        if (globalForScheduler.__lastExecutedUtcMonth === monthKey) {
          return;
        }

        globalForScheduler.__lastExecutedUtcMonth = monthKey;

        const { generateMonthlyPartnerInvoices } = await import('@/lib/partners/monthly-invoices');
        const res = await generateMonthlyPartnerInvoices(now, {
          sendEmails: true,
          waitForEmails: false,
        });

        console.log(
          `[UTC 1st-of-Month Scheduler] Executed for ${monthKey}. Generated: ${res.generated}, Skipped: ${res.skipped}, Emails Queued: ${res.emailsQueued}`
        );
      } catch (err) {
        console.error('[UTC 1st-of-Month Scheduler] Error:', err);
      }
    };

    // Check immediately on boot (in case server restarted on the 1st of the month) and every 60 seconds thereafter
    setTimeout(checkAndRunMonthlyInvoices, 5000);
    setInterval(checkAndRunMonthlyInvoices, 60 * 1000);
  }
}

