import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

const BUCKET_NAME = 'porting-attachments';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: propertyId } = await params;
    const supabase = await createClient();
    const adminClient = createAdminClient();
    const db = adminClient || supabase;

    const {
      data: { user },
      error: authErr,
    } = await supabase.auth.getUser();

    if (authErr || !user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

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

    // Fetch existing property attachments
    const { data: prop, error: propErr } = await db
      .from('properties')
      .select('id, attachments')
      .eq('id', propertyId)
      .single();

    if (propErr || !prop) {
      return NextResponse.json(
        { success: false, error: 'Property not found' },
        { status: 404 }
      );
    }

    const existingAttachments: any[] = Array.isArray(prop.attachments) ? [...prop.attachments] : [];
    const newAttachments: any[] = [];

    // Ensure storage bucket exists
    await db.storage.createBucket(BUCKET_NAME, { public: false }).catch(() => null);

    for (const file of allFiles) {
      const cleanName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
      const storagePath = `properties/${propertyId}/${Date.now()}_${Math.random().toString(36).slice(2, 7)}_${cleanName}`;
      const arrayBuffer = await file.arrayBuffer();
      const fileBuffer = Buffer.from(arrayBuffer);

      const { error: upErr } = await db.storage
        .from(BUCKET_NAME)
        .upload(storagePath, fileBuffer, {
          contentType: file.type || 'application/octet-stream',
          upsert: true,
        });

      if (!upErr) {
        const item = {
          id: `att_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
          file_name: file.name,
          file_size: file.size || 0,
          mime_type: file.type || 'application/octet-stream',
          storage_path: storagePath,
          created_at: new Date().toISOString(),
        };
        newAttachments.push(item);
        existingAttachments.push(item);
      }
    }

    // Save updated attachments to property
    const { error: updateErr } = await db
      .from('properties')
      .update({ attachments: existingAttachments, updated_at: new Date().toISOString() })
      .eq('id', propertyId);

    if (updateErr) {
      return NextResponse.json({ success: false, error: updateErr.message }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      data: newAttachments,
      total_attachments: existingAttachments.length,
    });
  } catch (err: any) {
    console.error('Property attachment upload error:', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: propertyId } = await params;
    const supabase = await createClient();
    const adminClient = createAdminClient();
    const db = adminClient || supabase;

    const {
      data: { user },
      error: authErr,
    } = await supabase.auth.getUser();

    if (authErr || !user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    let storagePath = searchParams.get('storage_path');
    let attachmentId = searchParams.get('id');

    if (!storagePath && !attachmentId) {
      try {
        const body = await request.json();
        storagePath = body.storage_path || null;
        attachmentId = body.id || null;
      } catch {
        // empty body
      }
    }

    if (!storagePath && !attachmentId) {
      return NextResponse.json(
        { success: false, error: 'Either storage_path or attachment id is required.' },
        { status: 400 }
      );
    }

    // Fetch existing property attachments
    const { data: prop, error: propErr } = await db
      .from('properties')
      .select('id, attachments')
      .eq('id', propertyId)
      .single();

    if (propErr || !prop) {
      return NextResponse.json({ success: false, error: 'Property not found' }, { status: 404 });
    }

    const existingAttachments: any[] = Array.isArray(prop.attachments) ? prop.attachments : [];
    const filteredAttachments = existingAttachments.filter((att: any) => {
      if (storagePath && att.storage_path === storagePath) return false;
      if (attachmentId && att.id === attachmentId) return false;
      return true;
    });

    // Update property
    await db
      .from('properties')
      .update({ attachments: filteredAttachments, updated_at: new Date().toISOString() })
      .eq('id', propertyId);

    // Also remove from porting_attachments table if it exists there
    if (attachmentId) {
      try {
        await db.from('porting_attachments').delete().eq('id', attachmentId);
      } catch {
        // ignore if table doesn't exist
      }
    }
    if (storagePath) {
      try {
        await db.from('porting_attachments').delete().eq('storage_path', storagePath);
      } catch {
        // ignore if table doesn't exist
      }
      // Attempt storage deletion
      await db.storage.from(BUCKET_NAME).remove([storagePath]).catch(() => null);
    }

    return NextResponse.json({
      success: true,
      message: 'Attachment removed successfully.',
      remaining_attachments: filteredAttachments.length,
    });
  } catch (err: any) {
    console.error('Property attachment delete error:', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

