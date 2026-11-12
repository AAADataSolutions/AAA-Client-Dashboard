import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { computeFinancialMetrics } from './_helpers/computeFinancialMetrics';
import { computeOperationalMetrics } from './_helpers/computeOperationalMetrics';

export async function GET() {
  try {
    const supabase = await createClient();
    const adminClient = createAdminClient();
    const db = adminClient || supabase;

    // Check user authentication
    const {
      data: { user },
      error: authErr,
    } = await supabase.auth.getUser();

    if (authErr || !user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    // Parallel fetch of core data collections
    const [
      orgsRes,
      propsRes,
      partnersRes,
      servicesRes,
      orgPropsRes,
      onboardingsRes,
      portingsRes,
      ticketsRes,
      e911Res,
      activityRes,
    ] = await Promise.all([
      // 1. Organizations with properties
      db
        .from('organizations')
        .select(`
          id,
          name,
          status,
          created_at,
          org_properties:organization_properties(
            id,
            property:properties(id, name, monthly_price, status, partner_id)
          )
        `)
        .order('created_at', { ascending: false }),

      // 2. Properties with financials and partner assignments
      db
        .from('properties')
        .select('id, name, city, state, address, status, monthly_price, partner_id, partner_commission_override, ray_baud_and_logs_enabled, ray_baum_status, created_at')
        .order('created_at', { ascending: false }),

      // 3. Partners
      db
        .from('partners')
        .select('*')
        .order('created_at', { ascending: false }),

      // 4. Provisioned services with property links (same as Finances)
      db
        .from('services')
        .select(`
          id,
          status,
          price,
          monthly_price,
          created_at,
          property_links:organization_property_services(
            id,
            org_property:organization_properties(
              id,
              property_id
            )
          )
        `),

      // 5. Organization Properties (Junction for assigned status)
      db
        .from('organization_properties')
        .select('id, organization_id, property_id, status'),

      // 6. Onboardings with property & org
      db
        .from('onboardings')
        .select(`
          *,
          org_property:organization_properties(
            id,
            property:properties(id, name, city, state, monthly_price),
            organization:organizations(id, name)
          )
        `)
        .order('created_at', { ascending: false }),

      // 6. Porting requests with property & org
      db
        .from('porting_requests')
        .select(`
          *,
          organization:organizations(id, name),
          organization_property:organization_properties(
            id,
            property:properties(id, name, city, state, address, monthly_price, ray_baud_and_logs_enabled),
            organization:organizations(id, name),
            onboardings(
              id,
              status,
              target_date
            )
          )
        `)
        .order('created_at', { ascending: false }),

      // 7. Tickets
      db
        .from('tickets')
        .select(`
          id,
          title,
          priority,
          status,
          created_at,
          updated_at,
          org_property:organization_properties(
            property:properties(name)
          )
        `)
        .order('created_at', { ascending: false }),

      // 8. E911 Records
      db
        .from('e911_records')
        .select(`
          id,
          status,
          emergency_address,
          psap_id,
          created_at,
          org_property:organization_properties(
            property:properties(id, name, address, ray_baud_and_logs_enabled)
          )
        `)
        .order('created_at', { ascending: false }),

      // 9. Recent Audit Logs
      db
        .from('audit_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10),
    ]);

    const orgs = orgsRes.data || [];
    const props = propsRes.data || [];
    const partners = partnersRes.data || [];
    const services = servicesRes.data || [];
    const orgProps = orgPropsRes.data || [];
    const onboardings = onboardingsRes.data || [];
    let portings = portingsRes.data || [];
    const tickets = ticketsRes.data || [];
    let e911Records = e911Res.data || [];
    const auditLogs = activityRes.data || [];

    // Fallbacks if joins failed
    if (!portingsRes.data && portingsRes.error) {
      const { data: fbPortings } = await db.from('porting_requests').select('*').order('created_at', { ascending: false });
      portings = fbPortings || [];
    }

    if (!e911Res.data && e911Res.error) {
      const { data: fbE911 } = await db.from('e911_records').select('*').order('created_at', { ascending: false });
      e911Records = fbE911 || [];
    }

    const financialData = computeFinancialMetrics({
      orgs,
      props,
      partners,
      services,
      orgProps,
    });

    const operationalData = computeOperationalMetrics({
      orgs,
      props,
      servicesCount: servicesRes.count ?? 0,
      onboardings,
      portings,
      tickets,
      e911Records,
      auditLogs,
      managementGroups: financialData.managementGroups,
    });

    return NextResponse.json({
      success: true,
      data: {
        ...financialData,
        ...operationalData,
      },
    });
  } catch (err: any) {
    console.error('Admin Overview API error:', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
