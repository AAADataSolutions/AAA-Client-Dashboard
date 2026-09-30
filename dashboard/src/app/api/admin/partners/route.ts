import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { logAuditEvent } from '@/lib/audit/logger';
import crypto from 'crypto';

export async function GET(request: NextRequest) {
  try {
    const supabase = createAdminClient() || (await createClient());
    const { searchParams } = new URL(request.url);

    const search = searchParams.get('search')?.trim().toLowerCase() || '';
    const status = searchParams.get('status') || 'ALL';

    let query = supabase.from('partners').select('*').order('created_at', { ascending: false });

    if (status !== 'ALL') {
      query = query.eq('status', status);
    }

    const { data: partnersData, error: partnersErr } = await query;

    if (partnersErr) {
      return NextResponse.json({
        success: true,
        data: [],
        metrics: { totalPartners: 0, activePartners: 0, totalCommissionPayout: 0, assignedPropertiesCount: 0 },
      });
    }

    const partners = partnersData || [];

    // Fetch all properties with partner_id assigned
    const { data: propsData } = await supabase
      .from('properties')
      .select('id, name, monthly_price, partner_id, partner_commission_override, status');

    const allProps = propsData || [];

    // Fetch pending invitations for partners
    const { data: invitesData } = await supabase
      .from('invitations')
      .select('id, email, token_hash, status, expires_at, target_app_role, invite_type')
      .or('target_app_role.eq.PARTNER,invite_type.eq.PARTNER')
      .order('created_at', { ascending: false });

    const allInvites = invitesData || [];

    // Map properties and calculations per partner
    const enriched = partners.map((partner: any) => {
      const assignedProps = allProps.filter((p: any) => p.partner_id === partner.id);
      const activeProps = assignedProps.filter((p: any) => p.status === 'ACTIVE' || p.status === 'ONBOARDED' || p.status === 'COMPLETED');

      const monthlyGross = assignedProps.reduce((sum: number, p: any) => sum + Number(p.monthly_price || 0), 0);

      const estimatedCommission = assignedProps.reduce((sum: number, p: any) => {
        const rate =
          p.partner_commission_override !== null && p.partner_commission_override !== undefined
            ? Number(p.partner_commission_override)
            : Number(partner.default_commission_rate || 10);
        return sum + Number(p.monthly_price || 0) * (rate / 100);
      }, 0);

      const pendingInvite = allInvites.find(
        (inv: any) => inv.email?.toLowerCase() === partner.email?.toLowerCase() && inv.status === 'PENDING'
      );

      return {
        ...partner,
        total_properties_count: assignedProps.length,
        active_properties_count: assignedProps.length,
        monthly_gross_revenue: monthlyGross,
        monthly_commission_estimated: estimatedCommission,
        has_pending_invite: Boolean(pendingInvite),
      };
    });

    let filtered = enriched;
    if (search) {
      filtered = enriched.filter(
        (p: any) =>
          p.name?.toLowerCase().includes(search) ||
          p.email?.toLowerCase().includes(search) ||
          p.company_name?.toLowerCase().includes(search) ||
          p.phone?.toLowerCase().includes(search)
      );
    }

    const metrics = {
      totalPartners: enriched.length,
      activePartners: enriched.filter((p: any) => p.status === 'ACTIVE').length,
      totalCommissionPayout: enriched.reduce((sum: number, p: any) => sum + p.monthly_commission_estimated, 0),
      assignedPropertiesCount: enriched.reduce((sum: number, p: any) => sum + p.active_properties_count, 0),
    };

    return NextResponse.json({
      success: true,
      data: filtered,
      metrics,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message || 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createAdminClient() || (await createClient());
    const body = await request.json();

    const { name, email, phone, company_name, default_commission_rate, status, notes } = body;

    if (!name || !name.trim()) {
      return NextResponse.json({ success: false, error: 'Partner name is required.' }, { status: 400 });
    }
    if (!email || !email.trim()) {
      return NextResponse.json({ success: false, error: 'Partner email is required.' }, { status: 400 });
    }

    const cleanEmail = email.trim().toLowerCase();

    // 1. Insert or update partner in partners table
    const { data: newPartner, error: createErr } = await supabase
      .from('partners')
      .insert({
        name: name.trim(),
        email: cleanEmail,
        phone: phone ? phone.trim() : null,
        company_name: company_name ? company_name.trim() : null,
        default_commission_rate: default_commission_rate !== undefined ? Number(default_commission_rate) : 10.0,
        status: status || 'ACTIVE',
        notes: notes ? notes.trim() : null,
      })
      .select()
      .single();

    if (createErr) {
      return NextResponse.json({ success: false, error: createErr.message }, { status: 400 });
    }

    // 2. Generate secure random invitation token for partner
    const rawToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');

    // Invalidate any existing pending invites for this email
    await supabase
      .from('invitations')
      .update({ status: 'REVOKED', updated_at: new Date().toISOString() })
      .eq('email', cleanEmail)
      .eq('status', 'PENDING');

    // Create invitation record in DB
    const { data: inviteRecord, error: inviteErr } = await supabase
      .from('invitations')
      .insert({
        email: cleanEmail,
        token_hash: tokenHash,
        invite_type: 'INTERNAL_TEAM',
        target_app_role: 'PARTNER',
        organization_id: null,
        status: 'PENDING',
        expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      })
      .select()
      .maybeSingle();

    if (inviteErr) {
      console.error('Partner invitation creation error:', inviteErr);
    }

    const origin = process.env.NEXT_PUBLIC_APP_URL || new URL(request.url).origin;
    const inviteUrl = `${origin}/invite/${rawToken}`;

    await logAuditEvent({
      action: 'PARTNER_CREATED',
      entity_type: 'PARTNER',
      entity_id: newPartner.id,
      entity_name: newPartner.name,
      changes: { ...newPartner, invite_created: Boolean(inviteRecord) },
    });

    return NextResponse.json({
      success: true,
      data: newPartner,
      inviteUrl,
      rawToken,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message || 'Internal server error' }, { status: 500 });
  }
}
