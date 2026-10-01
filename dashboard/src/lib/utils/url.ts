/**
 * Helper to get the canonical application base URL for emails and links.
 * Prioritizes NEXT_PUBLIC_APP_URL or APP_URL and defaults to https://onedashboard.aaadatasolutions.com
 */
export function getAppBaseUrl(request?: Request): string {
  const envUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL || '';
  if (envUrl) {
    return envUrl.replace(/\/+$/, '');
  }

  if (request) {
    try {
      const host = request.headers.get('x-forwarded-host') || request.headers.get('host');
      const proto = request.headers.get('x-forwarded-proto') || 'https';
      if (host && !host.includes('localhost') && !host.includes('127.0.0.1')) {
        return `${proto}://${host}`.replace(/\/+$/, '');
      }
    } catch {
      // ignore
    }
  }

  return 'https://onedashboard.aaadatasolutions.com';
}
