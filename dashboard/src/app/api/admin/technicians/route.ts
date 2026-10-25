import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function GET(request: NextRequest) {
  try {
    const supabase = createAdminClient() || (await createClient());
    const { searchParams } = new URL(request.url);

    const search = searchParams.get('search')?.trim().toLowerCase() || '';
    const area = searchParams.get('area') || 'ALL';
    const status = searchParams.get('status') || 'ALL';
    const sortBy = searchParams.get('sortBy') || 'NAME_ASC';
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '50', 10);

    const { data: dbRows, error } = await supabase
      .from('technicians')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      // Graceful response if table is not created yet
      const isMissingTable = error.message?.includes('does not exist') || error.message?.includes('schema cache');
      return NextResponse.json({
        success: true,
        data: [],
        pagination: { totalCount: 0, totalPages: 1, currentPage: page, limit },
        metrics: { totalTechnicians: 0, totalAreas: 0, activeTechnicians: 0 },
        areas: [],
        tableMissing: isMissingTable,
        message: isMissingTable ? 'Technicians table has not been initialized in Supabase yet.' : error.message,
      });
    }

    let rows = dbRows || [];

    // Distinct Areas
    const allAreasSet = new Set<string>();
    rows.forEach((r: any) => {
      if (r.area_name?.trim()) allAreasSet.add(r.area_name.trim());
    });
    const areas = Array.from(allAreasSet).sort();

    // In-memory Filter by search
    if (search) {
      rows = rows.filter(
        (r: any) =>
          (r.name || '').toLowerCase().includes(search) ||
          (r.area_name || '').toLowerCase().includes(search) ||
          (r.phone_no || '').toLowerCase().includes(search)
      );
    }

    // Filter by Area
    if (area !== 'ALL') {
      rows = rows.filter((r: any) => (r.area_name || '').toLowerCase() === area.toLowerCase());
    }

    // Filter by Status
    if (status !== 'ALL') {
      rows = rows.filter((r: any) => (r.status || 'ACTIVE').toUpperCase() === status.toUpperCase());
    }

    // Sorting
    rows.sort((a: any, b: any) => {
      switch (sortBy) {
        case 'NAME_ASC':
          return (a.name || '').localeCompare(b.name || '');
        case 'NAME_DESC':
          return (b.name || '').localeCompare(a.name || '');
        case 'AREA_ASC':
          return (a.area_name || '').localeCompare(b.area_name || '');
        case 'NEWEST':
          return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime();
        default:
          return (a.name || '').localeCompare(b.name || '');
      }
    });

    // Metrics
    const totalTechnicians = (dbRows || []).length;
    const totalAreas = areas.length;
    const activeTechnicians = (dbRows || []).filter((r: any) => (r.status || 'ACTIVE').toUpperCase() === 'ACTIVE').length;

    // Pagination
    const totalCount = rows.length;
    const totalPages = Math.ceil(totalCount / limit) || 1;
    const startIndex = (page - 1) * limit;
    const paginated = rows.slice(startIndex, startIndex + limit);

    return NextResponse.json({
      success: true,
      data: paginated,
      pagination: {
        totalCount,
        totalPages,
        currentPage: page,
        limit,
      },
      metrics: {
        totalTechnicians,
        totalAreas,
        activeTechnicians,
      },
      areas,
    });
  } catch (err: any) {
    console.error('[Technicians GET Error]:', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createAdminClient() || (await createClient());
    const body = await request.json();

    const name = body.name?.trim();
    const area_name = body.area_name?.trim();
    const phone_no = body.phone_no?.trim();
    const status = body.status?.trim() || 'ACTIVE';

    if (!name || !area_name || !phone_no) {
      return NextResponse.json(
        { success: false, error: 'Technician Name, Area Name, and Phone Number are required.' },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from('technicians')
      .insert({
        name,
        area_name,
        phone_no,
        status,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error('[Technicians POST Error]:', error);
      return NextResponse.json({ success: false, error: error.message }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      data,
      message: 'Technician created successfully',
    });
  } catch (err: any) {
    console.error('[Technicians POST Catch]:', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
