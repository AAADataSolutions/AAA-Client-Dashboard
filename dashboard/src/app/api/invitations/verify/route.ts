import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import crypto from 'crypto';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token')?.trim();

    if (!token) {
      return NextResponse.json({ success: false, error: 'Token is required' }, { status: 400 });
    }

    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const supabase = await createClient();
    const dbClient = createAdminClient() || supabase;

    // Search by raw token or token hash
    const { data: invite, error } = await dbClient
      .from('invitations')
      .select(`
        *,
        organization:organizations(id, name, city, state, address)
      `)
      .or(`token_hash.eq.${token},token_hash.eq.${tokenHash}`)
      .maybeSingle();

    if (error || !invite) {
      return NextResponse.json(
        { success: false, error: 'Invitation not found or invalid token.' },
        { status: 404 }
      );
    }

    const isExpired = new Date(invite.expires_at) < new Date();
    const isRevoked = invite.status === 'REVOKED' || invite.status === 'REJECTED';
    const isAccepted = invite.status === 'ACCEPTED' || invite.status === 'APPROVED';

    return NextResponse.json({
      success: true,
      data: {
        id: invite.id,
        email: invite.email,
        invite_type: invite.invite_type,
        target_org_role: invite.target_org_role || 'ADMIN',
        target_app_role: invite.target_app_role || 'CLIENT_USER',
        status: invite.status,
        expires_at: invite.expires_at,
        isExpired,
        isRevoked,
        isAccepted,
        organization: invite.organization || null,
      },
    });
  } catch (err: any) {
    console.error('Verify invitation error:', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
