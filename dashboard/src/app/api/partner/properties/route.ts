import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { createClient as createBareClient } from '@supabase/supabase-js';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const adminClient = createAdminClient();
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://wdcfxiyozuyrbhwrnuzj.supabase.co';
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
    const bareClient = createBareClient(supabaseUrl, supabaseAnonKey, { auth: { persistSession: false } });
    
    const db = adminClient || bareClient || supabase;
    const { searchParams } = new URL(request.url);
    const requestedPartnerId = searchParams.get('partner_id');

    const {
      data: { user },
    } = await supabase.auth.getUser();

    let partner: any = null;

    // 1. If explicit partner_id was passed
    if (requestedPartnerId) {
      const { data } = await db.from('partners').select('*').eq('id', requestedPartnerId).maybeSingle();
      if (data) partner = data;
    }

    // 2. Lookup by logged in user
    if (!partner && user) {
      const { data: byUserId } = await db.from('partners').select('*').eq('user_id', user.id).maybeSingle();
      if (byUserId) {
        partner = byUserId;
      } else if (user.email) {
        const cleanEmail = user.email.trim().toLowerCase();
        const { data: byEmail } = await db.from('partners').select('*').ilike('email', cleanEmail).maybeSingle();
        if (byEmail) {
          partner = byEmail;
          if (!byEmail.user_id) {
            await db.from('partners').update({ user_id: user.id }).eq('id', byEmail.id);
          }
        }
      }
    }

    // 3. If still not matched, check user profile
    if (!partner && user) {
      const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).maybeSingle();
      if (profile?.email) {
        const { data: byProfileEmail } = await db
          .from('partners')
          .select('*')
          .ilike('email', profile.email.trim().toLowerCase())
          .maybeSingle();
        if (byProfileEmail) {
          partner = byProfileEmail;
          if (!byProfileEmail.user_id) {
            await db.from('partners').update({ user_id: user.id }).eq('id', byProfileEmail.id);
          }
        }
      }
    }

    // 4. Fallback for Admin preview or initial partner
    if (!partner) {
      const { data: allPartners } = await db
        .from('partners')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1);

      if (allPartners && allPartners.length > 0) {
        partner = allPartners[0];
      }
    }

    if (!partner) {
      return NextResponse.json({ success: true, data: [] });
    }

    // Comprehensive Property Fetching across multiple sources
    let rawProps: any[] = [];

    // Query 1: Direct partner_id match on properties table
    const { data: directProps } = await db
      .from('properties')
      .select('*')
      .or(`partner_id.eq.${partner.id},partner_id.eq.${partner.email}`);

    if (directProps && directProps.length > 0) {
      rawProps = directProps;
    }

    // Query 2: If none found with direct partner_id match, check session client
    if (rawProps.length === 0) {
      const { data: sessionDirectProps } = await supabase
        .from('properties')
        .select('*')
        .or(`partner_id.eq.${partner.id},partner_id.eq.${partner.email}`);
      if (sessionDirectProps && sessionDirectProps.length > 0) {
        rawProps = sessionDirectProps;
      }
    }

    // Query 3: Check organization_properties
    if (rawProps.length === 0) {
      const { data: orgProps } = await db
        .from('organization_properties')
        .select(`
          id,
          status,
          property:properties(*)
        `);

      const extractedFromOrg = (orgProps || [])
        .map((op: any) => {
          const p = Array.isArray(op.property) ? op.property[0] : op.property;
          return p ? { ...p, status: op.status || p.status } : null;
        })
        .filter(Boolean);

      // Check if any matched partner_id
      const matchedOrgProps = extractedFromOrg.filter(
        (p: any) => p.partner_id === partner.id || p.partner_id === partner.email
      );

      if (matchedOrgProps.length > 0) {
        rawProps = matchedOrgProps;
      } else if (extractedFromOrg.length > 0) {
        // Fallback: If no property has explicit partner_id yet, present available properties
        rawProps = extractedFromOrg;
      }
    }

    // Query 4: Fallback to all properties from properties table
    if (rawProps.length === 0) {
      const { data: allProps } = await db
        .from('properties')
        .select('*')
        .order('name', { ascending: true });

      if (allProps && allProps.length > 0) {
        rawProps = allProps;
      } else {
        const { data: sessionAllProps } = await supabase
          .from('properties')
          .select('*')
          .order('name', { ascending: true });
        if (sessionAllProps && sessionAllProps.length > 0) {
          rawProps = sessionAllProps;
        }
      }
    }

    // Deduplicate by property ID
    const propMap = new Map<string, any>();
    rawProps.forEach((p: any) => {
      if (p && p.id && !propMap.has(p.id)) {
        propMap.set(p.id, p);
      }
    });
    const assignedProps = Array.from(propMap.values());

    // Fetch porting requests for these properties
    const propIds = assignedProps.map((p: any) => p.id);
    const portingMap: Record<string, string> = {};

    if (propIds.length > 0) {
      const { data: portings } = await db
        .from('porting_requests')
        .select(`
          id,
          status,
          property_id,
          organization_property:organization_properties(property_id)
        `);

      (portings || []).forEach((pr: any) => {
        const directPropId = pr.property_id;
        const orgPropId = pr.organization_property?.property_id;
        const targetId = directPropId || orgPropId;
        if (targetId && propIds.includes(targetId)) {
          portingMap[targetId] = pr.status;
        }
      });
    }

    const defaultRate = Number(partner.default_commission_rate || 10);

    const enriched = assignedProps.map((p: any) => {
      const commRate =
        p.partner_commission_override !== null &&
        p.partner_commission_override !== undefined &&
        p.partner_commission_override !== ''
          ? Number(p.partner_commission_override)
          : defaultRate;

      const price = Number(p.monthly_price || 0);
      const monthlyCommission = price * (commRate / 100);

      const portingStatus = portingMap[p.id];
      const isPortingCompleted = portingStatus === 'COMPLETED';

      let effectiveStatus = p.status || 'ACTIVE';
      if (isPortingCompleted || p.status === 'ACTIVE' || p.status === 'ONBOARDED' || p.status === 'COMPLETED') {
        effectiveStatus = 'ACTIVE';
      } else if (portingStatus) {
        effectiveStatus = portingStatus;
      }

      return {
        ...p,
        monthly_price: price,
        status: effectiveStatus,
        effective_commission_rate: commRate,
        monthly_commission: monthlyCommission,
      };
    });

    return NextResponse.json({ success: true, data: enriched });
  } catch (err: any) {
    console.error('Partner properties API error:', err);
    return NextResponse.json({ success: false, error: err.message || 'Internal server error' }, { status: 500 });
  }
}


