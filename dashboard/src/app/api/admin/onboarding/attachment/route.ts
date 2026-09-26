import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authErr,
    } = await supabase.auth.getUser();

    if (authErr || !user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const path = searchParams.get('path');

    if (!path) {
      return NextResponse.json({ success: false, error: 'Missing attachment path parameter' }, { status: 400 });
    }

    const dbClient = createAdminClient() || supabase;

    // Try 'onboarding-attachments' bucket first, fallback to 'porting-attachments'
    let signedUrlRes = await dbClient.storage
      .from('onboarding-attachments')
      .createSignedUrl(path, 300);

    if (signedUrlRes.error || !signedUrlRes.data?.signedUrl) {
      signedUrlRes = await dbClient.storage
        .from('porting-attachments')
        .createSignedUrl(path, 300);
    }

    if (signedUrlRes.data?.signedUrl) {
      return NextResponse.redirect(signedUrlRes.data.signedUrl);
    }

    // Direct blob download fallback
    let downloadRes = await dbClient.storage
      .from('onboarding-attachments')
      .download(path);

    if (downloadRes.error || !downloadRes.data) {
      downloadRes = await dbClient.storage
        .from('porting-attachments')
        .download(path);
    }

    if (downloadRes.error || !downloadRes.data) {
      return NextResponse.json(
        { success: false, error: downloadRes.error?.message || 'File not found' },
        { status: 404 }
      );
    }

    const buffer = await downloadRes.data.arrayBuffer();
    const fileName = path.split('/').pop() || 'attachment';

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': downloadRes.data.type || 'application/octet-stream',
        'Content-Disposition': `attachment; filename="${fileName}"`,
      },
    });
  } catch (err: any) {
    console.error('Download admin onboarding attachment error:', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
