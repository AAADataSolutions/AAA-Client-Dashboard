import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { logAuditEvent } from '@/lib/audit/logger';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: propertyId } = await params;
    const supabase = await createClient();

    // 1. Fetch Property details
    const { data: prop, error: propErr } = await supabase
      .from('properties')
      .select('id, name, contact_person_name, contact_person_email, main_phone, general_manager_name, general_manager_phone, general_manager_email, created_at')
      .eq('id', propertyId)
      .single();

    if (propErr) {
      return NextResponse.json({ success: false, error: propErr.message }, { status: 400 });
    }

    // 2. Fetch contacts from property_contacts table
    const { data: dbContacts, error: contactsErr } = await supabase
      .from('property_contacts')
      .select('*')
      .eq('property_id', propertyId)
      .order('is_primary', { ascending: false })
      .order('created_at', { ascending: false });

    if (!contactsErr && dbContacts && dbContacts.length > 0) {
      return NextResponse.json({
        success: true,
        data: dbContacts.map((c: any) => ({
          id: c.id,
          name: c.name,
          email: c.email,
          phone: c.phone || '',
          role: c.role || 'Property Contact',
          is_primary: Boolean(c.is_primary),
          status: 'ACTIVE',
          created_at: c.created_at,
        })),
      });
    }

    // 3. Fallback to GM / Contact Person from property record
    const contacts: any[] = [];
    if (prop.general_manager_name || prop.contact_person_name) {
      contacts.push({
        id: `prop-gm-${prop.id}`,
        name: prop.general_manager_name || prop.contact_person_name,
        email: prop.general_manager_email || prop.contact_person_email || `gm@${prop.name.toLowerCase().replace(/[^a-z0-9]/g, '')}.com`,
        phone: prop.general_manager_phone || prop.main_phone || '+1 (555) 019-2834',
        role: 'General Manager',
        is_primary: true,
        status: 'ACTIVE',
        created_at: prop.created_at,
      });

      if (prop.contact_person_name && prop.contact_person_name !== prop.general_manager_name) {
        contacts.push({
          id: `prop-contact-${prop.id}`,
          name: prop.contact_person_name,
          email: prop.contact_person_email || `contact@${prop.name.toLowerCase().replace(/[^a-z0-9]/g, '')}.com`,
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
        email: `manager@${prop.name.toLowerCase().replace(/[^a-z0-9]/g, '')}.com`,
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

    const { full_name, name, email, phone_number, phone, role, is_primary } = body;
    const contactName = (full_name || name || '').trim();
    const contactEmail = (email || '').trim().toLowerCase();
    const contactPhone = (phone_number || phone || '').trim();
    const contactRole = (role || 'Property Contact').trim();

    if (!contactName || !contactEmail) {
      return NextResponse.json(
        { success: false, error: 'Full name and email are required.' },
        { status: 400 }
      );
    }

    // If marked as primary, unset other primaries on this property
    if (is_primary) {
      await supabase
        .from('property_contacts')
        .update({ is_primary: false })
        .eq('property_id', propertyId);
    }

    // Insert into property_contacts
    const { data: newContact, error: insertErr } = await supabase
      .from('property_contacts')
      .insert({
        property_id: propertyId,
        name: contactName,
        email: contactEmail,
        phone: contactPhone || null,
        role: contactRole,
        is_primary: Boolean(is_primary),
      })
      .select()
      .single();

    if (insertErr) {
      // If table doesn't exist yet, fallback to property record update
      if (is_primary) {
        await supabase
          .from('properties')
          .update({
            contact_person_name: contactName,
            contact_person_email: contactEmail,
            main_phone: contactPhone || undefined,
            updated_at: new Date().toISOString(),
          })
          .eq('id', propertyId);
      }
    } else {
      // If is_primary, sync with properties row
      if (is_primary) {
        await supabase
          .from('properties')
          .update({
            contact_person_name: contactName,
            contact_person_email: contactEmail,
            main_phone: contactPhone || undefined,
            updated_at: new Date().toISOString(),
          })
          .eq('id', propertyId);
      }
    }

    // Audit Log
    await logAuditEvent({
      action: 'PROPERTY_CONTACT_ADDED',
      entity_type: 'PROPERTY',
      entity_id: propertyId,
      entity_name: contactName,
      changes: {
        property_id: propertyId,
        name: contactName,
        email: contactEmail,
        phone: contactPhone,
        role: contactRole,
        is_primary: Boolean(is_primary),
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Property contact saved successfully in database.',
      data: newContact || {
        id: `contact-${Date.now()}`,
        name: contactName,
        email: contactEmail,
        phone: contactPhone,
        role: contactRole,
        is_primary: Boolean(is_primary),
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: propertyId } = await params;
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    const contactId = searchParams.get('contactId');

    if (!contactId) {
      return NextResponse.json({ success: false, error: 'Contact ID is required.' }, { status: 400 });
    }

    // Check if it's a UUID from property_contacts
    if (!contactId.startsWith('prop-')) {
      const { error: delErr } = await supabase
        .from('property_contacts')
        .delete()
        .eq('id', contactId)
        .eq('property_id', propertyId);

      if (delErr) {
        return NextResponse.json({ success: false, error: delErr.message }, { status: 400 });
      }
    } else {
      // If deleting the synthetic GM/contact, clear fields on properties table
      await supabase
        .from('properties')
        .update({
          contact_person_name: null,
          contact_person_email: null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', propertyId);
    }

    // Audit Log
    await logAuditEvent({
      action: 'PROPERTY_CONTACT_REMOVED',
      entity_type: 'PROPERTY',
      entity_id: propertyId,
      entity_name: `Contact ID ${contactId}`,
      changes: { property_id: propertyId, contact_id: contactId },
    });

    return NextResponse.json({
      success: true,
      message: 'Property contact removed successfully.',
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
