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

    // Generate signed URL from 'porting-attachments' storage bucket
    const { data, error } = await dbClient.storage
      .from('porting-attachments')
      .createSignedUrl(path, 300); // 5 minutes validity

    if (error || !data?.signedUrl) {
      const { data: fileBlob, error: downloadErr } = await dbClient.storage
        .from('porting-attachments')
        .download(path);

      if (downloadErr || !fileBlob) {
        return NextResponse.json(
          { success: false, error: error?.message || downloadErr?.message || 'File not found' },
          { status: 404 }
        );
      }

      const buffer = await fileBlob.arrayBuffer();
      const fileName = path.split('/').pop() || 'attachment';

      return new NextResponse(buffer, {
        headers: {
          'Content-Type': fileBlob.type || 'application/octet-stream',
          'Content-Disposition': `attachment; filename="${fileName}"`,
        },
      });
    }

    return NextResponse.redirect(data.signedUrl);
  } catch (err: any) {
    console.error('Download admin porting attachment error:', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
