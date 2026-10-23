/**
 * Recalculate and synchronize a property's monthly_price based on:
 * - base_price (or initial monthly_price)
 * - Active services (status != 'DISCONNECTED') attached via organization_properties -> organization_property_services
 * - Ray Baum dispatch records total prices attached to this property
 */
export async function syncPropertyMonthlyPrice(
  supabaseOrAdmin: any,
  propertyId: string
): Promise<number | null> {
  if (!propertyId) return null;

  // 1. Try calling the stored procedure recalculate_property_monthly_price if defined in DB
  try {
    const { error: rpcErr } = await supabaseOrAdmin.rpc('recalculate_property_monthly_price', {
      target_property_id: propertyId,
    });

    if (!rpcErr) {
      const { data: updated } = await supabaseOrAdmin
        .from('properties')
        .select('monthly_price')
        .eq('id', propertyId)
        .single();
      if (updated && updated.monthly_price !== undefined) {
        return Number(updated.monthly_price);
      }
    }
  } catch {
    // Proceed to JavaScript fallback calculation
  }

  // 2. Direct JavaScript fallback calculation
  try {
    // A. Base Price
    const { data: prop, error: pErr } = await supabaseOrAdmin
      .from('properties')
      .select('base_price, monthly_price')
      .eq('id', propertyId)
      .single();

    if (pErr || !prop) return null;
    const basePrice = Number(
      prop.base_price !== null && prop.base_price !== undefined
        ? prop.base_price
        : prop.monthly_price || 0
    );

    // B. Services Total (supports both legacy org links and direct property_id assignments)
    const { data: opData } = await supabaseOrAdmin
      .from('organization_properties')
      .select(`
        id,
        organization_property_services (
          service:services (
            id,
            price,
            status
          )
        )
      `)
      .eq('property_id', propertyId);

    const { data: directServices } = await supabaseOrAdmin
      .from('services')
      .select('id, price, status')
      .eq('property_id', propertyId)
      .neq('status', 'DISCONNECTED');

    const servicePriceMap = new Map<string, number>();

    if (directServices && Array.isArray(directServices)) {
      for (const ds of directServices) {
        if (ds.id && ds.status !== 'DISCONNECTED') {
          servicePriceMap.set(ds.id, Number(ds.price || 0));
        }
      }
    }

    if (opData && Array.isArray(opData)) {
      for (const op of opData) {
        const ops = op.organization_property_services || [];
        for (const item of ops) {
          const srv = item.service;
          if (srv && srv.id && srv.status !== 'DISCONNECTED' && !servicePriceMap.has(srv.id)) {
            servicePriceMap.set(srv.id, Number(srv.price || 0));
          }
        }
      }
    }

    let servicesTotal = 0;
    for (const p of servicePriceMap.values()) {
      servicesTotal += p;
    }

    // C. Ray Baum Records Total
    const { data: rayBaumRecords } = await supabaseOrAdmin
      .from('ray_baum_records')
      .select('price')
      .eq('property_id', propertyId);

    const rayBaumTotal = (rayBaumRecords || []).reduce(
      (sum: number, r: any) => sum + Number(r.price || 0),
      0
    );

    // D. Compute total
    const totalMonthlyPrice = Math.round((basePrice + servicesTotal + rayBaumTotal) * 100) / 100;

    // E. Persist to properties table
    await supabaseOrAdmin
      .from('properties')
      .update({
        monthly_price: totalMonthlyPrice,
        updated_at: new Date().toISOString(),
      })
      .eq('id', propertyId);

    return totalMonthlyPrice;
  } catch (err) {
    console.error(`[syncPropertyMonthlyPrice] Failed for property ${propertyId}:`, err);
    return null;
  }
}
