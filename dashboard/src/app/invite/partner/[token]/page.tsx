'use client';

import React, { use } from 'react';
import { AuthProvider } from '@/lib/auth/auth-context';
import { InviteForm } from '@/components/auth/InviteForm';

export default function PartnerInvitePage({ params }: { params: Promise<{ token: string }> }) {
  const resolvedParams = use(params);
  return (
    <AuthProvider>
      <InviteForm token={resolvedParams.token} kind="partner" />
    </AuthProvider>
  );
}
