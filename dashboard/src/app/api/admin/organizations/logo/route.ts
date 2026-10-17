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

    // Verify user is an Admin or Super Admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .maybeSingle();

    if (profile?.role !== 'SUPER_ADMIN' && profile?.role !== 'ADMIN') {
      return NextResponse.json({ success: false, error: 'Forbidden: Admin access required.' }, { status: 403 });
    }

    const formData = await request.formData();
    const file = formData.get('logo') as File | null;
    const organizationId = formData.get('organization_id') as string | null;

    if (!file || file.size === 0) {
      return NextResponse.json({ success: false, error: 'No logo file provided' }, { status: 400 });
    }

    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ success: false, error: 'Logo file size must be 5MB or less.' }, { status: 400 });
    }

    const allowedTypes = ['image/jpeg', 'image/png', 'image/svg+xml', 'image/webp', 'image/gif'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { success: false, error: 'File type must be JPG, PNG, SVG, GIF, or WebP.' },
        { status: 400 }
      );
    }

    const dbClient = createAdminClient() || supabase;

    // Ensure 'org-logos' bucket exists
    try {
      const { data: buckets } = await dbClient.storage.listBuckets();
      if (!buckets?.some((b: any) => b.name === 'org-logos')) {
        await dbClient.storage.createBucket('org-logos', { public: true });
      }
    } catch (bucketErr) {
      console.warn('Could not list/create org-logos bucket:', bucketErr);
    }

    const ext = file.name.split('.').pop() || 'png';
    const folder = organizationId && organizationId !== 'temp' ? organizationId : 'admin_uploads';
    const storagePath = `${folder}/logo_${Date.now()}.${ext}`;

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

    // If an existing organizationId was provided, update the organization immediately
    if (organizationId && organizationId !== 'temp') {
      const { error: updateErr } = await dbClient
        .from('organizations')
        .update({ logo_url: logoUrl, updated_at: new Date().toISOString() })
        .eq('id', organizationId);

      if (updateErr) {
        console.error('Failed to update organization with logo_url:', updateErr);
      }
    }

    return NextResponse.json({
      success: true,
      logo_url: logoUrl,
      message: 'Management group logo uploaded successfully.',
    });
  } catch (err: any) {
    console.error('Admin logo upload error:', err);
    return NextResponse.json({ success: false, error: err.message || 'Internal server error' }, { status: 500 });
  }
}
