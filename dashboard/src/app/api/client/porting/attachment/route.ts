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
    const storagePath = searchParams.get('path');

    if (!storagePath) {
      return NextResponse.json({ success: false, error: 'Storage path is required' }, { status: 400 });
    }

    const dbClient = createAdminClient() || supabase;

    // Generate signed URL valid for 1 hour
    const { data, error } = await dbClient.storage
      .from('porting-attachments')
      .createSignedUrl(storagePath, 3600);

    if (error || !data?.signedUrl) {
      return NextResponse.json({ success: false, error: error?.message || 'File not found' }, { status: 404 });
    }

    // Redirect user to the secure signed URL
    return NextResponse.redirect(data.signedUrl);
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message || 'Internal server error' }, { status: 500 });
  }
}
