import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { logAuditEvent } from '@/lib/audit/logger';

const BUCKET_CANDIDATES = ['data-circuit-agreements', 'porting-attachments', 'onboarding-attachments', 'attachments'];

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

    for (const bucket of BUCKET_CANDIDATES) {
      const signedUrlRes = await dbClient.storage.from(bucket).createSignedUrl(path, 300);
      if (signedUrlRes.data?.signedUrl) {
        return NextResponse.redirect(signedUrlRes.data.signedUrl);
      }
    }

    for (const bucket of BUCKET_CANDIDATES) {
      const downloadRes = await dbClient.storage.from(bucket).download(path);
      if (downloadRes.data) {
        const buffer = await downloadRes.data.arrayBuffer();
        const fileName = path.split('/').pop() || 'Signed_Agreement.pdf';
        return new NextResponse(buffer, {
          headers: {
            'Content-Type': downloadRes.data.type || 'application/pdf',
            'Content-Disposition': `attachment; filename="${fileName}"`,
          },
        });
      }
    }

    return NextResponse.json({ success: false, error: 'Agreement file not found in storage' }, { status: 404 });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message || 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const adminClient = createAdminClient();
    const db = adminClient || supabase;

    const formData = await request.formData();
    const circuitId = formData.get('circuit_id') as string;
    const file = formData.get('file') as File | null;
    const autoAdvanceToSigned = formData.get('advance_stage') === 'true';

    if (!circuitId || !file) {
      return NextResponse.json(
        { success: false, error: 'Circuit ID and Agreement PDF file are required.' },
        { status: 400 }
      );
    }

    const cleanFileName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
    const storagePath = `data-circuits/${circuitId}/${Date.now()}_${cleanFileName}`;
    const arrayBuffer = await file.arrayBuffer();
    const fileBuffer = Buffer.from(arrayBuffer);

    let uploadedBucket: string | null = null;

    // Ensure at least one bucket works (create 'data-circuit-agreements' if needed)
    for (const bucket of BUCKET_CANDIDATES) {
      const { error: upErr } = await db.storage.from(bucket).upload(storagePath, fileBuffer, {
        contentType: file.type || 'application/pdf',
        upsert: true,
      });
      if (!upErr) {
        uploadedBucket = bucket;
        break;
      }
    }

    if (!uploadedBucket) {
      // Attempt to create 'data-circuit-agreements' bucket via adminClient and retry
      await db.storage.createBucket('data-circuit-agreements', { public: false }).catch(() => null);
      const { error: retryErr } = await db.storage
        .from('data-circuit-agreements')
        .upload(storagePath, fileBuffer, {
          contentType: file.type || 'application/pdf',
          upsert: true,
        });
      if (!retryErr) {
        uploadedBucket = 'data-circuit-agreements';
      }
    }

    const downloadUrl = `/api/admin/data-circuits/attachment?path=${encodeURIComponent(storagePath)}`;

    const updatePayload: Record<string, any> = {
      agreement_file_name: file.name,
      agreement_file_size: file.size,
      agreement_mime_type: file.type || 'application/pdf',
      agreement_storage_path: storagePath,
      agreement_file_url: downloadUrl,
      paperwork_signed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    if (autoAdvanceToSigned) {
      updatePayload.status = 'PAPERWORK_SIGNED';
    }

    const { data: updated, error: dbErr } = await db
      .from('data_circuits')
      .update(updatePayload)
      .eq('id', circuitId)
      .select('*')
      .single();

    if (dbErr) {
      return NextResponse.json({ success: false, error: dbErr.message }, { status: 400 });
    }

    await logAuditEvent({
      action: 'DATA_CIRCUIT_AGREEMENT_UPLOADED',
      entity_type: 'DATA_CIRCUIT',
      entity_id: circuitId,
      entity_name: file.name,
      description: `Uploaded signed Agreement PDF (${file.name}) for Data Circuit ${circuitId}`,
      changes: { file_name: file.name, file_size: file.size, status: updated.status },
    });

    return NextResponse.json({
      success: true,
      data: updated,
      attachment: {
        file_name: file.name,
        file_size: file.size,
        mime_type: file.type || 'application/pdf',
        storage_path: storagePath,
        file_url: downloadUrl,
      },
    });
  } catch (err: any) {
    console.error('[Data Circuit Attachment POST] Error:', err);
    return NextResponse.json({ success: false, error: err.message || 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient();
    const adminClient = createAdminClient();
    const db = adminClient || supabase;

    const { searchParams } = new URL(request.url);
    const circuitId = searchParams.get('circuitId');

    if (!circuitId) {
      return NextResponse.json({ success: false, error: 'Circuit ID is required' }, { status: 400 });
    }

    const { data: existing } = await db
      .from('data_circuits')
      .select('agreement_storage_path')
      .eq('id', circuitId)
      .maybeSingle();

    if (existing?.agreement_storage_path) {
      for (const bucket of BUCKET_CANDIDATES) {
        await db.storage.from(bucket).remove([existing.agreement_storage_path]).catch(() => null);
      }
    }

    const { data: updated, error } = await db
      .from('data_circuits')
      .update({
        agreement_file_name: null,
        agreement_file_size: null,
        agreement_mime_type: null,
        agreement_storage_path: null,
        agreement_file_url: null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', circuitId)
      .select('*')
      .single();

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true, data: updated });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message || 'Internal server error' }, { status: 500 });
  }
}

