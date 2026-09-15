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
    const adminClient = createAdminClient();

    let invite: any = null;

    // 1. Primary: If service role is available, query directly bypassing RLS
    if (adminClient) {
      const { data, error } = await adminClient
        .from('invitations')
        .select(`
          *,
          organization:organizations(id, name, city, state, address)
        `)
        .or(`token_hash.eq.${token},token_hash.eq.${tokenHash}`)
        .maybeSingle();

      if (!error && data) {
        invite = data;
      }
    }

    // 2. Secondary: If no admin client or not found, try RPC function (security definer)
    if (!invite) {
      try {
        const { data: rpcResult, error: rpcError } = await supabase.rpc('verify_invitation_token', {
          p_token: token,
        });

        if (!rpcError && rpcResult?.success && rpcResult?.data) {
          return NextResponse.json({
            success: true,
            data: rpcResult.data,
          });
        }
      } catch (rpcErr) {
        // RPC may not be installed yet, proceed to direct fallback
      }
    }

    // 3. Fallback: Direct select on table (works if public RLS policy is applied)
    if (!invite) {
      const { data, error } = await supabase
        .from('invitations')
        .select(`
          *,
          organization:organizations(id, name, city, state, address)
        `)
        .or(`token_hash.eq.${token},token_hash.eq.${tokenHash}`)
        .maybeSingle();

      if (!error && data) {
        invite = data;
      }
    }

    if (!invite) {
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
