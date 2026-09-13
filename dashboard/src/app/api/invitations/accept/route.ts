import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { NextResponse } from 'next/server';
import crypto from 'crypto';

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const dbClient = createAdminClient() || supabase;
    const body = await request.json();
    const { rawToken, password, fullName } = body;

    if (!rawToken) {
      return NextResponse.json({ error: 'Invitation token is missing.' }, { status: 400 });
    }

    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');

    // Find invitation by token or token_hash
    const { data: invite, error: findErr } = await dbClient
      .from('invitations')
      .select('*, organization:organizations(*)')
      .or(`token_hash.eq.${rawToken},token_hash.eq.${tokenHash}`)
      .maybeSingle();

    if (findErr || !invite) {
      return NextResponse.json({ error: 'Invalid or expired invitation link.' }, { status: 404 });
    }

    if (invite.status === 'REVOKED' || invite.status === 'REJECTED') {
      return NextResponse.json({ error: 'This invitation has been revoked or rejected.' }, { status: 400 });
    }

    if (new Date(invite.expires_at) < new Date()) {
      return NextResponse.json({ error: 'This invitation link has expired.' }, { status: 400 });
    }

    // Check if user is currently logged in
    const {
      data: { user: currentUser },
    } = await supabase.auth.getUser();

    let targetUserId = currentUser?.id;

    // If not logged in and password provided, create/signup user
    if (!targetUserId && password) {
      const adminClient = createAdminClient();
      if (adminClient) {
        // Try creating or getting user with service role
        const { data: newUser, error: createAuthErr } = await adminClient.auth.admin.createUser({
          email: invite.email,
          password: password,
          email_confirm: true,
          user_metadata: {
            full_name: fullName || invite.email.split('@')[0],
            initial_org_id: invite.organization_id,
            initial_org_role: invite.target_org_role || 'ADMIN',
          },
        });

        if (createAuthErr) {
          // If user already exists in auth, attempt updating password
          if (createAuthErr.message?.includes('already registered')) {
            const { data: existingUsers } = await adminClient.auth.admin.listUsers();
            const foundUser = existingUsers?.users?.find(
              (u) => u.email?.toLowerCase() === invite.email.toLowerCase()
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
      }
    }

    if (!targetUserId) {
      return NextResponse.json(
        { error: 'Please sign in or provide a password to activate your account.' },
        { status: 401 }
      );
    }

    // Ensure Profile exists and is updated
    const { data: existingProfile } = await dbClient
      .from('profiles')
      .select('id')
      .eq('id', targetUserId)
      .maybeSingle();

    if (!existingProfile) {
      await dbClient.from('profiles').insert({
        id: targetUserId,
        full_name: fullName || invite.email.split('@')[0],
        email: invite.email.toLowerCase(),
        role: invite.invite_type === 'INTERNAL_TEAM' ? invite.target_app_role || 'SUB_SUPER_ADMIN' : 'CLIENT_USER',
        status: 'ACTIVE',
      });
    } else {
      await dbClient
        .from('profiles')
        .update({
          full_name: fullName || undefined,
          status: 'ACTIVE',
          updated_at: new Date().toISOString(),
        })
        .eq('id', targetUserId);
    }

    // INTERNAL TEAM INVITATION FLOW
    if (invite.invite_type === 'INTERNAL_TEAM') {
      const { error: updateErr } = await dbClient
        .from('invitations')
        .update({ status: 'ACCEPTED', updated_at: new Date().toISOString() })
        .eq('id', invite.id);

      if (updateErr) {
        return NextResponse.json({ error: updateErr.message }, { status: 500 });
      }

      return NextResponse.json({
        success: true,
        type: 'INTERNAL_TEAM',
        requiresApproval: true,
        message: 'Invitation accepted! Your access is now pending Super Admin approval.',
      });
    }

    // CLIENT MEMBER / ADMIN INVITATION FLOW
    if (invite.invite_type === 'CLIENT_MEMBER') {
      const orgRole = invite.target_org_role || 'ADMIN';

      // If invited as ADMIN, ensure any previous primary role is properly configured
      const { error: memberErr } = await dbClient
        .from('organization_members')
        .upsert(
          {
            organization_id: invite.organization_id,
            profile_id: targetUserId,
            role: orgRole,
            status: 'ACTIVE',
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'organization_id,profile_id' }
        );

      if (memberErr) {
        console.error('Member upsert error:', memberErr);
      }

      // Update organization status to ACTIVE if it was PENDING_ONBOARDING
      if (invite.organization_id) {
        await dbClient
          .from('organizations')
          .update({ status: 'ACTIVE', updated_at: new Date().toISOString() })
          .eq('id', invite.organization_id);
      }

      // Mark invite as APPROVED / COMPLETED
      await dbClient
        .from('invitations')
        .update({ status: 'APPROVED', updated_at: new Date().toISOString() })
        .eq('id', invite.id);

      return NextResponse.json({
        success: true,
        type: 'CLIENT_MEMBER',
        requiresApproval: false,
        organization: invite.organization,
        message: 'Account activated successfully! You now have access to your organization dashboard.',
      });
    }

    return NextResponse.json({ error: 'Unhandled invitation flow.' }, { status: 400 });
  } catch (err: unknown) {
    console.error('Accept invitation error:', err);
    const message = err instanceof Error ? err.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
