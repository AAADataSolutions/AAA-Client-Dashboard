import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const body = await request.json();

    const { content, is_internal } = body;
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!content || !content.trim()) {
      return NextResponse.json({ success: false, error: 'Comment content is required.' }, { status: 400 });
    }

    const { data: newComment, error } = await supabase
      .from('ticket_comments')
      .insert({
        ticket_id: id,
        author_id: user?.id,
        content: content.trim(),
        is_internal: is_internal ?? false,
      })
      .select(`
        *,
        author:profiles(id, full_name, email)
      `)
      .single();

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true, data: newComment });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message || 'Internal server error' }, { status: 500 });
  }
}
