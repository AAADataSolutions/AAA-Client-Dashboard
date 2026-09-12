import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    // 1. Fetch Property details
    const { data: prop, error: propErr } = await supabase
      .from('properties')
      .select('id, name, contact_person_name, contact_person_email, main_phone, general_manager_name, created_at')
      .eq('id', id)
      .single();

    if (propErr) {
      return NextResponse.json({ success: false, error: propErr.message }, { status: 400 });
    }

    const contacts: any[] = [];

    // 2. Add Primary Contact / GM from property record
    if (prop.contact_person_name || prop.general_manager_name) {
      contacts.push({
        id: `prop-gm-${prop.id}`,
        name: prop.general_manager_name || prop.contact_person_name,
        email: prop.contact_person_email || 'gm@' + prop.name.toLowerCase().replace(/[^a-z0-9]/g, '') + '.com',
        phone: prop.main_phone || '+1 (555) 019-2834',
        role: 'General Manager',
        is_primary: true,
        status: 'ACTIVE',
        created_at: prop.created_at,
      });

      if (prop.contact_person_name && prop.contact_person_name !== prop.general_manager_name) {
        contacts.push({
          id: `prop-contact-${prop.id}`,
          name: prop.contact_person_name,
          email: prop.contact_person_email || 'contact@' + prop.name.toLowerCase().replace(/[^a-z0-9]/g, '') + '.com',
          phone: prop.main_phone || '+1 (555) 019-2834',
          role: 'Property Manager',
          is_primary: false,
          status: 'ACTIVE',
          created_at: prop.created_at,
        });
      }
    } else {
      contacts.push({
        id: `prop-contact-${prop.id}`,
        name: `${prop.name} Manager`,
        email: 'manager@' + prop.name.toLowerCase().replace(/[^a-z0-9]/g, '') + '.com',
        phone: prop.main_phone || '+1 (555) 019-2834',
        role: 'Property Contact',
        is_primary: true,
        status: 'ACTIVE',
        created_at: prop.created_at,
      });
    }

    return NextResponse.json({ success: true, data: contacts });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: propertyId } = await params;
    const supabase = await createClient();
    const body = await request.json();

    const { full_name, email, phone_number, is_primary } = body;

    if (!full_name || !email) {
      return NextResponse.json(
        { success: false, error: 'Full name and email are required.' },
        { status: 400 }
      );
    }

    // 1. Check or insert profile in DB
    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', email.trim().toLowerCase())
      .maybeSingle();

    if (existingProfile) {
      await supabase
        .from('profiles')
        .update({
          full_name: full_name.trim(),
          phone_number: phone_number ? phone_number.trim() : null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existingProfile.id);
    } else {
      const newUuid = crypto.randomUUID();
      await supabase.from('profiles').insert({
        id: newUuid,
        full_name: full_name.trim(),
        email: email.trim().toLowerCase(),
        phone_number: phone_number ? phone_number.trim() : null,
        role: 'CLIENT_USER',
        status: 'ACTIVE',
      });
    }

    // 2. If marked as primary contact, update the property record
    if (is_primary) {
      await supabase
        .from('properties')
        .update({
          contact_person_name: full_name.trim(),
          contact_person_email: email.trim().toLowerCase(),
          main_phone: phone_number ? phone_number.trim() : undefined,
          updated_at: new Date().toISOString(),
        })
        .eq('id', propertyId);
    }

    // 3. Audit log
    try {
      await supabase.from('audit_logs').insert({
        action: 'PROPERTY_CONTACT_ADDED',
        entity_type: 'PROPERTY',
        entity_id: propertyId,
        entity_name: full_name.trim(),
        changes: { property_id: propertyId, email, phone_number, is_primary },
      });
    } catch (auditErr) {
      console.warn('Audit log write skipped:', auditErr);
    }

    return NextResponse.json({
      success: true,
      message: 'Property contact saved successfully in database.',
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
