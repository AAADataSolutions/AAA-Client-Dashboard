import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

const BUCKET_CANDIDATES = ['porting-attachments', 'onboarding-attachments', 'attachments'];

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

    // 1. Try creating a signed URL from any of the candidate buckets
    for (const bucket of BUCKET_CANDIDATES) {
      const { data } = await dbClient.storage.from(bucket).createSignedUrl(path, 300);
      if (data?.signedUrl) {
        return NextResponse.redirect(data.signedUrl);
      }
    }

    // 2. Fallback: Try direct download from any of the candidate buckets
    for (const bucket of BUCKET_CANDIDATES) {
      const { data: fileBlob } = await dbClient.storage.from(bucket).download(path);
      if (fileBlob) {
        const buffer = await fileBlob.arrayBuffer();
        const fileName = path.split('/').pop() || 'attachment';
        return new NextResponse(buffer, {
          headers: {
            'Content-Type': fileBlob.type || 'application/octet-stream',
            'Content-Disposition': `attachment; filename="${fileName}"`,
          },
        });
      }
    }

    return NextResponse.json(
      { success: false, error: 'File not found in storage' },
      { status: 404 }
    );
  } catch (err: any) {
    console.error('Download admin porting attachment error:', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

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

    const db = createAdminClient() || supabase;
    const formData = await request.formData();
    const files = formData.getAll('files') as File[];
    const singleFile = formData.get('file') as File | null;
    const allFiles: File[] = files.length > 0 ? files : singleFile ? [singleFile] : [];

    if (allFiles.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No files provided for upload.' },
        { status: 400 }
      );
    }

    const uploadedAttachments: {
      file_name: string;
      file_size: number;
      mime_type: string;
      storage_path: string;
    }[] = [];

    for (const file of allFiles) {
      const cleanName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
      const storagePath = `admin/${Date.now()}_${Math.random().toString(36).slice(2, 7)}_${cleanName}`;
      const arrayBuffer = await file.arrayBuffer();
      const fileBuffer = Buffer.from(arrayBuffer);

      let uploadedBucket: string | null = null;

      for (const bucket of BUCKET_CANDIDATES) {
        const { error: upErr } = await db.storage.from(bucket).upload(storagePath, fileBuffer, {
          contentType: file.type || 'application/octet-stream',
          upsert: true,
        });
        if (!upErr) {
          uploadedBucket = bucket;
          break;
        }
      }

      if (!uploadedBucket) {
        // Auto-create 'porting-attachments' bucket via service role and retry
        await db.storage.createBucket('porting-attachments', { public: false }).catch(() => null);
        const { error: retryErr } = await db.storage
          .from('porting-attachments')
          .upload(storagePath, fileBuffer, {
            contentType: file.type || 'application/octet-stream',
            upsert: true,
          });
        if (!retryErr) {
          uploadedBucket = 'porting-attachments';
        }
      }

      if (uploadedBucket) {
        uploadedAttachments.push({
          file_name: file.name,
          file_size: file.size || 0,
          mime_type: file.type || 'application/octet-stream',
          storage_path: storagePath,
        });
      }
    }

    return NextResponse.json({
      success: true,
      data: uploadedAttachments,
    });
  } catch (err: any) {
    console.error('Upload porting attachment error:', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
