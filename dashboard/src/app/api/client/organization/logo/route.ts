import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

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

    const { data: member } = await supabase
      .from('organization_members')
      .select('organization_id, role')
      .eq('profile_id', user.id)
      .maybeSingle();

    if (!member?.organization_id) {
      return NextResponse.json({ success: false, error: 'No organization found' }, { status: 403 });
    }

    if (member.role !== 'ADMIN') {
      return NextResponse.json({ success: false, error: 'Only organization administrators can update the logo.' }, { status: 403 });
    }

    const formData = await request.formData();
    const file = formData.get('logo') as File | null;

    if (!file || file.size === 0) {
      return NextResponse.json({ success: false, error: 'No logo file provided' }, { status: 400 });
    }

    if (file.size > 2 * 1024 * 1024) {
      return NextResponse.json({ success: false, error: 'Logo file size must be 2MB or less.' }, { status: 400 });
    }

    const allowedTypes = ['image/jpeg', 'image/png', 'image/svg+xml', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ success: false, error: 'File type must be JPG, PNG, SVG, or WebP.' }, { status: 400 });
    }

    const dbClient = createAdminClient() || supabase;

    // Delete old logo files in this folder if possible
    try {
      const { data: existingFiles } = await dbClient.storage
        .from('org-logos')
        .list(member.organization_id);

      if (existingFiles && existingFiles.length > 0) {
        const filesToDelete = existingFiles.map((f: any) => `${member.organization_id}/${f.name}`);
        await dbClient.storage.from('org-logos').remove(filesToDelete);
      }
    } catch (cleanErr) {
      console.warn('Could not clean old logo files:', cleanErr);
    }

    const ext = file.name.split('.').pop() || 'png';
    const storagePath = `${member.organization_id}/logo_${Date.now()}.${ext}`;
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const { error: uploadErr } = await dbClient.storage
      .from('org-logos')
      .upload(storagePath, buffer, {
        contentType: file.type,
        upsert: true,
      });

    if (uploadErr) {
      return NextResponse.json({ success: false, error: uploadErr.message }, { status: 400 });
    }

    const { data: publicData } = dbClient.storage.from('org-logos').getPublicUrl(storagePath);
    const logoUrl = publicData.publicUrl;

    const { error: updateErr } = await dbClient
      .from('organizations')
      .update({ logo_url: logoUrl, updated_at: new Date().toISOString() })
      .eq('id', member.organization_id);

    if (updateErr) {
      return NextResponse.json({ success: false, error: updateErr.message }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      logo_url: logoUrl,
      message: 'Organization logo updated successfully.',
    });
  } catch (err: any) {
    console.error('Logo upload error:', err);
    return NextResponse.json({ success: false, error: err.message || 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authErr,
    } = await supabase.auth.getUser();

    if (authErr || !user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { data: member } = await supabase
      .from('organization_members')
      .select('organization_id, role')
      .eq('profile_id', user.id)
      .maybeSingle();

    if (!member?.organization_id || member.role !== 'ADMIN') {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 403 });
    }

    const dbClient = createAdminClient() || supabase;

    try {
      const { data: existingFiles } = await dbClient.storage
        .from('org-logos')
        .list(member.organization_id);

      if (existingFiles && existingFiles.length > 0) {
        const filesToDelete = existingFiles.map((f: any) => `${member.organization_id}/${f.name}`);
        await dbClient.storage.from('org-logos').remove(filesToDelete);
      }
    } catch (cleanErr) {
      console.warn('Could not clean old logo files:', cleanErr);
    }

    await dbClient
      .from('organizations')
      .update({ logo_url: null, updated_at: new Date().toISOString() })
      .eq('id', member.organization_id);

    return NextResponse.json({ success: true, message: 'Logo removed successfully.' });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message || 'Internal server error' }, { status: 500 });
  }
}
