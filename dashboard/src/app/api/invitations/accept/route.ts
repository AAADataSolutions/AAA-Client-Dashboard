import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { NextResponse } from 'next/server';
import crypto from 'crypto';

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const adminClient = createAdminClient();
    const body = await request.json();
    const { rawToken, password, fullName, email: customEmail } = body;

    if (!rawToken) {
      return NextResponse.json({ error: 'Invitation token is missing.' }, { status: 400 });
    }

    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');

    // 1. Locate invitation (adminClient -> RPC -> direct)
    let invite: any = null;

    if (adminClient) {
      const { data, error } = await adminClient
        .from('invitations')
        .select('*, organization:organizations(*)')
        .or(`token_hash.eq.${rawToken},token_hash.eq.${tokenHash}`)
        .maybeSingle();

      if (!error && data) {
        invite = data;
      }
    }

    if (!invite) {
      try {
        const { data: rpcResult } = await supabase.rpc('verify_invitation_token', {
          p_token: rawToken,
        });
        if (rpcResult?.success && rpcResult?.data) {
          invite = rpcResult.data;
        }
      } catch (e) {
        // RPC might not be installed
      }
    }

    if (!invite) {
      const { data, error } = await supabase
        .from('invitations')
        .select('*, organization:organizations(*)')
        .or(`token_hash.eq.${rawToken},token_hash.eq.${tokenHash}`)
        .maybeSingle();

      if (!error && data) {
        invite = data;
      }
    }

    if (!invite) {
      return NextResponse.json({ error: 'Invalid or expired invitation link.' }, { status: 404 });
    }

    if (invite.status === 'REVOKED' || invite.status === 'REJECTED') {
      return NextResponse.json({ error: 'This invitation has been revoked or rejected.' }, { status: 400 });
    }

    if (new Date(invite.expires_at) < new Date()) {
      return NextResponse.json({ error: 'This invitation link has expired.' }, { status: 400 });
    }

    // Determine target email
    const targetEmail = (customEmail || invite.email).trim().toLowerCase();

    // Check if user is currently logged in
    const {
      data: { user: currentUser },
    } = await supabase.auth.getUser();

    let targetUserId = currentUser?.id;

    // If not logged in and password provided, create/signup user
    if (!targetUserId && password) {
      if (adminClient) {
        // Try creating user with service role (auto-confirm email)
        const { data: newUser, error: createAuthErr } = await adminClient.auth.admin.createUser({
          email: targetEmail,
          password: password,
          email_confirm: true,
          user_metadata: {
            full_name: fullName || targetEmail.split('@')[0],
            initial_org_id: invite.organization_id,
            initial_org_role: invite.target_org_role || 'ADMIN',
          },
        });

        if (createAuthErr) {
          if (createAuthErr.message?.includes('already registered')) {
            const { data: existingUsers } = await adminClient.auth.admin.listUsers();
            const foundUser = existingUsers?.users?.find(
              (u) => u.email?.toLowerCase() === targetEmail.toLowerCase()
            );
            if (foundUser) {
              await adminClient.auth.admin.updateUserById(foundUser.id, {
                password: password,
                email_confirm: true,
              });
              targetUserId = foundUser.id;
            } else {
              return NextResponse.json({ error: createAuthErr.message }, { status: 400 });
            }
          } else {
            return NextResponse.json({ error: createAuthErr.message }, { status: 400 });
          }
        } else if (newUser?.user) {
          targetUserId = newUser.user.id;
        }
      } else {
        // Fallback without service role: use public supabase.auth.signUp
        const { data: signUpData, error: signUpErr } = await supabase.auth.signUp({
          email: targetEmail,
          password: password,
          options: {
            data: {
              full_name: fullName || targetEmail.split('@')[0],
              initial_org_id: invite.organization_id,
              initial_org_role: invite.target_org_role || 'ADMIN',
            },
          },
        });

        if (signUpErr) {
          return NextResponse.json({ error: signUpErr.message }, { status: 400 });
        }

        targetUserId = signUpData.user?.id;
      }
    }

    if (!targetUserId) {
      return NextResponse.json(
        { error: 'Please sign in or provide a password to activate your account.' },
        { status: 401 }
      );
    }

    // Try completing via RPC if available (bypasses RLS with security definer)
    let rpcCompleted = false;
    try {
      const { data: rpcRes, error: rpcErr } = await supabase.rpc('complete_invitation_acceptance', {
        p_token: rawToken,
        p_user_id: targetUserId,
        p_full_name: fullName || targetEmail.split('@')[0],
      });
      if (!rpcErr && rpcRes?.success) {
        rpcCompleted = true;
      }
    } catch (e) {
      // RPC might not be installed
    }

    // Fallback or adminClient completion: Ensure profile, member, and invitation updated
    const db = adminClient || supabase;

    if (!rpcCompleted) {
      // Ensure Profile exists and is active
      await db.from('profiles').upsert({
        id: targetUserId,
        email: targetEmail,
        full_name: fullName || targetEmail.split('@')[0],
        role: invite.invite_type === 'INTERNAL_TEAM' ? invite.target_app_role || 'SUB_SUPER_ADMIN' : 'CLIENT_USER',
        status: 'ACTIVE',
        updated_at: new Date().toISOString(),
      });

      // CLIENT MEMBER / ADMIN INVITATION FLOW
      if (invite.invite_type === 'CLIENT_MEMBER' && invite.organization_id) {
        const orgRole = invite.target_org_role || 'ADMIN';

        await db.from('organization_members').upsert(
          {
            organization_id: invite.organization_id,
            profile_id: targetUserId,
            role: orgRole,
            status: 'ACTIVE',
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'organization_id,profile_id' }
        );

        await db
          .from('organizations')
          .update({ status: 'ACTIVE', updated_at: new Date().toISOString() })
          .eq('id', invite.organization_id);
      }

      // Mark invite as ACCEPTED
      await db
        .from('invitations')
        .update({ status: 'ACCEPTED', updated_at: new Date().toISOString() })
        .eq('id', invite.id);
    }

    return NextResponse.json({
      success: true,
      type: invite.invite_type,
      requiresApproval: invite.invite_type === 'INTERNAL_TEAM',
      organizationId: invite.organization_id,
      email: targetEmail,
      message: 'Account activated successfully! You now have access to your organization dashboard.',
    });
  } catch (err: unknown) {
    console.error('Accept invitation error:', err);
    const message = err instanceof Error ? err.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
