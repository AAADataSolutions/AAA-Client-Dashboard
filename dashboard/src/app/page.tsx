import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

export default async function HomePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/auth');
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle();

  const { data: partnerRec } = await supabase
    .from('partners')
    .select('id')
    .or(`user_id.eq.${user.id},email.ilike.${user.email?.toLowerCase()}`)
    .maybeSingle();

  const isInternal =
    profile?.role === 'SUPER_ADMIN' || profile?.role === 'SUB_SUPER_ADMIN';
  const isPartner =
    profile?.role === 'PARTNER' || Boolean(partnerRec);

  if (isInternal) {
    redirect('/admin');
  } else if (isPartner) {
    redirect('/partner');
  } else {
    redirect('/dashboard');
  }
}
