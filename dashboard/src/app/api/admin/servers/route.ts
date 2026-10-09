import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { logAuditEvent } from '@/lib/audit/logger';

export async function GET(request: NextRequest) {
  try {
    const supabase = createAdminClient() || (await createClient());
    const { searchParams } = new URL(request.url);

    const provider = searchParams.get('provider')?.trim() || '';
    const status = searchParams.get('status')?.trim() || ''; // 'ACTIVE' | 'DECOMMISSIONED' | ''
    const search = searchParams.get('search')?.trim().toLowerCase() || '';

    // Query active properties count from real database
    const { count: activePropsCount } = await supabase
      .from('properties')
      .select('id', { count: 'exact', head: true })
      .in('status', ['ACTIVE', 'ONBOARDED', 'COMPLETED']);

    const propCount = activePropsCount || 0;

    // Fetch servers strictly from Supabase database
    const { data: dbServers, error: serverErr } = await supabase
      .from('servers')
      .select('*')
      .order('monthly_cost', { ascending: false });

    if (serverErr) {
      console.error('[Servers API] Query error:', serverErr);
      return NextResponse.json({
        success: true,
        data: [],
        metrics: {
          totalMonthlyCost: 0,
          activeServersCount: 0,
          totalServersCount: 0,
          costPerActiveProperty: 0,
          activePropertiesCount: propCount,
          renewingWithin7DaysCount: 0,
          renewingSoonList: [],
        },
      });
    }

    const servers = dbServers || [];

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const enriched = servers.map((s: any) => {
      let daysUntilRenewal: number | null = null;
      let isRenewingSoon = false;
      let renewalDisplay = '—';

      if (s.renewal_date) {
        const renDate = new Date(s.renewal_date);
        renDate.setHours(0, 0, 0, 0);
        const diffMs = renDate.getTime() - today.getTime();
        daysUntilRenewal = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
        isRenewingSoon = s.status === 'ACTIVE' && daysUntilRenewal !== null && daysUntilRenewal >= 0 && daysUntilRenewal <= 7;
        
        renewalDisplay = renDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      }

      return {
        ...s,
        monthly_cost: Number(s.monthly_cost || 0),
        status: s.status || 'ACTIVE',
        days_until_renewal: daysUntilRenewal,
        is_renewing_soon: isRenewingSoon,
        renewal_display: renewalDisplay,
      };
    });

    let filtered = enriched;
    if (search) {
      filtered = filtered.filter(
        (s: any) =>
          s.name?.toLowerCase().includes(search) ||
          s.provider?.toLowerCase().includes(search) ||
          s.purpose?.toLowerCase().includes(search) ||
          s.ip_address?.toLowerCase().includes(search)
      );
    }
    if (provider) {
      filtered = filtered.filter((s: any) => s.provider?.toLowerCase() === provider.toLowerCase());
    }
    if (status) {
      filtered = filtered.filter((s: any) => s.status?.toUpperCase() === status.toUpperCase());
    }

    const activeServers = enriched.filter((s: any) => s.status === 'ACTIVE');
    const totalActiveMonthlyCost = activeServers.reduce((sum: number, s: any) => sum + s.monthly_cost, 0);
    const costPerActiveProperty = propCount > 0 ? totalActiveMonthlyCost / propCount : 0;
    const renewingSoonServers = activeServers.filter((s: any) => s.is_renewing_soon);

    return NextResponse.json({
      success: true,
      data: filtered,
      metrics: {
        totalMonthlyCost: Math.round(totalActiveMonthlyCost * 100) / 100,
        activeServersCount: activeServers.length,
        totalServersCount: enriched.length,
        costPerActiveProperty: Math.round(costPerActiveProperty * 100) / 100,
        activePropertiesCount: propCount,
        renewingWithin7DaysCount: renewingSoonServers.length,
        renewingSoonList: renewingSoonServers.map((s: any) => ({
          id: s.id,
          name: s.name,
          provider: s.provider,
          days_left: s.days_until_renewal,
          renewal_display: s.renewal_display,
        })),
      },
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message || 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createAdminClient() || (await createClient());
    const body = await request.json();
    const { name, provider, purpose, ip_address, monthly_cost, status, renewal_date, notes } = body;

    if (!name || !name.trim()) {
      return NextResponse.json({ success: false, error: 'Server name is required.' }, { status: 400 });
    }
    if (!provider || !provider.trim()) {
      return NextResponse.json({ success: false, error: 'Provider is required.' }, { status: 400 });
    }

    const { data: newServer, error: insertErr } = await supabase
      .from('servers')
      .insert({
        name: name.trim(),
        provider: provider.trim(),
        purpose: purpose?.trim() || null,
        ip_address: ip_address?.trim() || null,
        monthly_cost: monthly_cost !== undefined && monthly_cost !== '' ? Number(monthly_cost) : 0,
        status: status || 'ACTIVE',
        renewal_date: renewal_date || null,
        notes: notes?.trim() || null,
      })
      .select()
      .single();

    if (insertErr) {
      return NextResponse.json({ success: false, error: insertErr.message }, { status: 400 });
    }

    await logAuditEvent({
      action: 'SERVER_CREATED',
      entity_type: 'SERVER',
      entity_id: newServer.id,
      entity_name: newServer.name,
      changes: newServer,
    });

    return NextResponse.json({ success: true, data: newServer });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message || 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const supabase = createAdminClient() || (await createClient());
    const body = await request.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json({ success: false, error: 'Server ID is required for update.' }, { status: 400 });
    }

    if (updates.monthly_cost !== undefined) {
      updates.monthly_cost = updates.monthly_cost === '' ? 0 : Number(updates.monthly_cost);
    }

    const { data: updated, error: updateErr } = await supabase
      .from('servers')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (updateErr) {
      return NextResponse.json({ success: false, error: updateErr.message }, { status: 400 });
    }

    await logAuditEvent({
      action: 'SERVER_UPDATED',
      entity_type: 'SERVER',
      entity_id: updated.id,
      entity_name: updated.name,
      changes: updates,
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message || 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = createAdminClient() || (await createClient());
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ success: false, error: 'Server ID is required for deletion.' }, { status: 400 });
    }

    const { error: delErr } = await supabase.from('servers').delete().eq('id', id);

    if (delErr) {
      return NextResponse.json({ success: false, error: delErr.message }, { status: 400 });
    }

    await logAuditEvent({
      action: 'SERVER_DELETED',
      entity_type: 'SERVER',
      entity_id: id,
      changes: { deleted: true },
    });

    return NextResponse.json({ success: true, deletedId: id });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message || 'Internal server error' }, { status: 500 });
  }
}
