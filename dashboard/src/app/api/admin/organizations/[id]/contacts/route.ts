import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { logAdminAction } from '@/lib/audit/logger';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: orgId } = await params;
    const supabase = await createClient();
    const dbClient = createAdminClient() || supabase;

    // 1. Fetch Organization metadata
    const { data: org } = await dbClient
      .from('organizations')
      .select('id, name, email, phone, contact_name, created_at')
      .eq('id', orgId)
      .single();

    // 2. Fetch direct Organization Contacts ONLY (completely separate from Client Portal Team Members)
    const { data: dbOrgContacts, error: ocErr } = await dbClient
      .from('organization_contacts')
      .select('*')
      .eq('organization_id', orgId)
      .order('is_primary', { ascending: false })
      .order('created_at', { ascending: false });

    if (ocErr) {
      console.warn('Error fetching organization_contacts:', ocErr.message);
    }

    const contacts: any[] = (dbOrgContacts || []).map((oc: any) => ({
      id: oc.id,
      name: oc.name,
      email: oc.email,
      phone: oc.phone || '—',
      role: oc.role || 'Contact',
      is_primary: Boolean(oc.is_primary),
      status: 'ACTIVE',
      created_at: oc.created_at,
    }));

    // If no contacts record yet in organization_contacts, fallback to organization's contact metadata
    if (contacts.length === 0 && org && (org.contact_name || org.email)) {
      contacts.push({
        id: `org-contact-default-${org.id}`,
        name: org.contact_name || `${org.name} Contact`,
        email: org.email || '—',
        phone: org.phone || '—',
        role: 'Primary Contact',
        is_primary: true,
        status: 'ACTIVE',
        created_at: org.created_at,
      });
    }

    contacts.sort((a, b) => (b.is_primary ? 1 : 0) - (a.is_primary ? 1 : 0));

    return NextResponse.json({ success: true, data: contacts });
  } catch (err: any) {
    console.error('Fetch organization contacts error:', err);
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
    const { id: organizationId } = await params;
    const supabase = await createClient();
    const dbClient = createAdminClient() || supabase;

    const body = await request.json();
    const { full_name, email, phone_number, is_primary, role } = body;

    if (!full_name || !email) {
      return NextResponse.json(
        { success: false, error: 'Full name and email are required.' },
        { status: 400 }
      );
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanName = full_name.trim();
    const cleanPhone = phone_number ? phone_number.trim() : null;
    const contactRole = role?.trim() || (is_primary ? 'Primary Contact' : 'Contact');
    const isPrimaryBool = Boolean(is_primary);

    // If marked as primary, unmark other contacts for this organization
    if (isPrimaryBool) {
      await dbClient
        .from('organization_contacts')
        .update({ is_primary: false, updated_at: new Date().toISOString() })
        .eq('organization_id', organizationId);
    }

    // Insert strictly into organization_contacts table (NO auth users, NO team members created)
    const { data: newContact, error: insertErr } = await dbClient
      .from('organization_contacts')
      .insert({
        organization_id: organizationId,
        name: cleanName,
        email: cleanEmail,
        phone: cleanPhone,
        role: contactRole,
        is_primary: isPrimaryBool,
      })
      .select()
      .single();

    if (insertErr) {
      throw insertErr;
    }

    // If primary, update organization primary metadata
    if (isPrimaryBool) {
      await dbClient
        .from('organizations')
        .update({
          contact_name: cleanName,
          email: cleanEmail,
          phone: cleanPhone || undefined,
          updated_at: new Date().toISOString(),
        })
        .eq('id', organizationId);
    }

    // Audit log
    await logAdminAction({
      action: isPrimaryBool ? 'PRIMARY_CONTACT_ASSIGNED' : 'CONTACT_ADDED',
      entityType: 'ORGANIZATION_CONTACT',
      entityId: newContact.id,
      entityName: cleanName,
      organizationId,
      description: `Added organization contact ${cleanName} (${cleanEmail})${isPrimaryBool ? ' as Primary Contact' : ''}`,
      changes: { name: cleanName, email: cleanEmail, is_primary: isPrimaryBool, role: contactRole },
    });

    return NextResponse.json({
      success: true,
      data: {
        id: newContact.id,
        name: newContact.name,
        email: newContact.email,
        phone: newContact.phone || '—',
        role: newContact.role,
        is_primary: newContact.is_primary,
        status: 'ACTIVE',
        created_at: newContact.created_at,
      },
      message: 'Contact added successfully.',
    });
  } catch (err: any) {
    console.error('Add organization contact error:', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: organizationId } = await params;
    const supabase = await createClient();
    const dbClient = createAdminClient() || supabase;
    const body = await request.json();

    const { id, member_id, role, full_name, name, phone_number, phone, email, is_primary } = body;
    const contactId = id || member_id;

    if (!contactId) {
      return NextResponse.json({ success: false, error: 'Contact id is required.' }, { status: 400 });
    }

    const isPrimaryBool = Boolean(is_primary);

    if (isPrimaryBool) {
      await dbClient
        .from('organization_contacts')
        .update({ is_primary: false, updated_at: new Date().toISOString() })
        .eq('organization_id', organizationId);
    }

    const updates: any = { updated_at: new Date().toISOString() };
    if (full_name || name) updates.name = (full_name || name).trim();
    if (email) updates.email = email.trim().toLowerCase();
    if (phone_number !== undefined || phone !== undefined) updates.phone = (phone_number ?? phone)?.trim() || null;
    if (role) updates.role = role.trim();
    if (is_primary !== undefined) updates.is_primary = isPrimaryBool;

    const { data: updatedContact, error: patchErr } = await dbClient
      .from('organization_contacts')
      .update(updates)
      .eq('id', contactId)
      .eq('organization_id', organizationId)
      .select()
      .single();

    if (patchErr) throw patchErr;

    if (isPrimaryBool && updates.name && updates.email) {
      await dbClient
        .from('organizations')
        .update({
          contact_name: updates.name,
          email: updates.email,
          phone: updates.phone || undefined,
          updated_at: new Date().toISOString(),
        })
        .eq('id', organizationId);
    }

    await logAdminAction({
      action: 'CONTACT_UPDATED',
      entityType: 'ORGANIZATION_CONTACT',
      entityId: contactId,
      entityName: updatedContact.name,
      organizationId,
      description: `Updated organization contact ${updatedContact.name}`,
      changes: updates,
    });

    return NextResponse.json({
      success: true,
      data: updatedContact,
      message: 'Contact updated successfully.',
    });
  } catch (err: any) {
    console.error('Update organization contact error:', err);
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
    const { id: organizationId } = await params;
    const supabase = await createClient();
    const dbClient = createAdminClient() || supabase;
    const { searchParams } = new URL(request.url);
    let contactId = searchParams.get('id') || searchParams.get('member_id') || searchParams.get('contactId');

    if (!contactId) {
      try {
        const body = await request.json();
        contactId = body?.id || body?.member_id || body?.contactId;
      } catch (e) {
        // No json body
      }
    }

    if (!contactId) {
      return NextResponse.json({ success: false, error: 'Contact ID is required' }, { status: 400 });
    }

    if (contactId.startsWith('org-contact-default-')) {
      // Clear contact_name & email on organization table
      await dbClient
        .from('organizations')
        .update({ contact_name: null, email: null, phone: null, updated_at: new Date().toISOString() })
        .eq('id', organizationId);

      return NextResponse.json({ success: true, message: 'Contact record cleared.' });
    }

    // Strictly delete from organization_contacts (DO NOT delete from organization_members or profiles)
    const { error: delErr } = await dbClient
      .from('organization_contacts')
      .delete()
      .eq('id', contactId)
      .eq('organization_id', organizationId);

    if (delErr) throw delErr;

    await logAdminAction({
      action: 'CONTACT_REMOVED',
      entityType: 'ORGANIZATION_CONTACT',
      entityId: contactId,
      organizationId,
      description: `Removed organization contact ${contactId}`,
    });

    return NextResponse.json({ success: true, message: 'Contact removed successfully.' });
  } catch (err: any) {
    console.error('Delete organization contact error:', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
