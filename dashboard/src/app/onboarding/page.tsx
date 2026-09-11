'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Building2, ShieldCheck, MapPin, Phone, Mail, ArrowRight, Loader2, AlertCircle } from 'lucide-react';
import { AuthProvider, useAuth } from '@/lib/auth/auth-context';

function OnboardingContent() {
  const router = useRouter();
  const { user, profile, refreshProfile, loading } = useAuth();

  const [orgName, setOrgName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [zipCode, setZipCode] = useState('');
  const [country, setCountry] = useState('USA');

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orgName.trim()) {
      setError('Please provide your organization name.');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch('/api/organizations/onboard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: orgName,
          email: email || user?.email,
          phone,
          address,
          city,
          state,
          zip_code: zipCode,
          country,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to complete setup.');
      }

      await refreshProfile();
      router.push('/dashboard');
      router.refresh();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Something went wrong.';
      setError(message);
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f8f9fa] flex items-center justify-center text-[#64748b]">
        <Loader2 className="w-6 h-6 animate-spin text-[#1275e2]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8f9fa] flex flex-col justify-center items-center p-4 sm:p-8">
      <div className="w-full max-w-2xl bg-white border border-[#e2e8f0] rounded-2xl p-6 sm:p-10 shadow-lg relative z-10 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3.5 pb-6 border-b border-[#e2e8f0]">
          <div className="w-10 h-10 rounded-xl bg-[#1275e2]/10 text-[#1275e2] flex items-center justify-center border border-[#1275e2]/20">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10.5px] font-bold px-2 py-0.2 rounded bg-blue-50 text-[#1275e2] border border-blue-100 uppercase">
                Phase 5 Setup
              </span>
              <span className="text-xs text-[#64748b]">Organization Onboarding</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#181c22] mt-0.5">
              Set up your Organization
            </h1>
          </div>
        </div>

        <p className="text-xs text-[#64748b] leading-relaxed">
          Welcome, <strong className="text-[#181c22]">{profile?.full_name || 'Client'}</strong>. Register your company profile to activate telecom management, property porting, and E911 dispatch workspaces.
        </p>

        {error && (
          <div className="p-3.5 rounded-lg bg-rose-50 border border-rose-200 flex items-start gap-2 text-xs text-rose-700">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="block text-xs font-semibold text-[#181c22]">
              Organization / Company Name <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={orgName}
              onChange={(e) => setOrgName(e.target.value)}
              placeholder="e.g. Grandview Hospitality Group"
              required
              className="w-full bg-[#f8f9fa] border border-[#e2e8f0] focus:border-[#1275e2] focus:bg-white focus:ring-2 focus:ring-[#1275e2]/15 rounded-lg px-3.5 py-2.5 text-xs text-[#181c22] placeholder-[#94a3b8] outline-none transition-all"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div className="space-y-1">
              <label className="block text-xs font-semibold text-[#181c22] flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-[#1275e2]" />
                Billing / Operations Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={user?.email || 'ops@company.com'}
                className="w-full bg-[#f8f9fa] border border-[#e2e8f0] focus:border-[#1275e2] focus:bg-white rounded-lg px-3.5 py-2 text-xs text-[#181c22] placeholder-[#94a3b8] outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-semibold text-[#181c22] flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-[#1275e2]" />
                Main Contact Phone
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+1 (555) 000-0000"
                className="w-full bg-[#f8f9fa] border border-[#e2e8f0] focus:border-[#1275e2] focus:bg-white rounded-lg px-3.5 py-2 text-xs text-[#181c22] placeholder-[#94a3b8] outline-none"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="block text-xs font-semibold text-[#181c22] flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-[#1275e2]" />
              Street Address
            </label>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="123 Business Parkway, Suite 400"
              className="w-full bg-[#f8f9fa] border border-[#e2e8f0] focus:border-[#1275e2] focus:bg-white rounded-lg px-3.5 py-2 text-xs text-[#181c22] placeholder-[#94a3b8] outline-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            <div className="space-y-1">
              <label className="block text-xs font-semibold text-[#181c22]">City</label>
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="New York"
                className="w-full bg-[#f8f9fa] border border-[#e2e8f0] focus:border-[#1275e2] focus:bg-white rounded-lg px-3.5 py-2 text-xs text-[#181c22] outline-none"
              />
            </div>
            <div className="space-y-1">
              <label className="block text-xs font-semibold text-[#181c22]">State</label>
              <input
                type="text"
                value={state}
                onChange={(e) => setState(e.target.value)}
                placeholder="NY"
                className="w-full bg-[#f8f9fa] border border-[#e2e8f0] focus:border-[#1275e2] focus:bg-white rounded-lg px-3.5 py-2 text-xs text-[#181c22] outline-none"
              />
            </div>
            <div className="space-y-1">
              <label className="block text-xs font-semibold text-[#181c22]">ZIP Code</label>
              <input
                type="text"
                value={zipCode}
                onChange={(e) => setZipCode(e.target.value)}
                placeholder="10001"
                className="w-full bg-[#f8f9fa] border border-[#e2e8f0] focus:border-[#1275e2] focus:bg-white rounded-lg px-3.5 py-2 text-xs text-[#181c22] outline-none"
              />
            </div>
          </div>

          <div className="pt-4 flex items-center justify-between border-t border-[#e2e8f0]">
            <span className="text-xs text-[#64748b] flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              Tenant boundary isolated
            </span>
            <button
              type="submit"
              disabled={submitting}
              className="h-10 px-5 rounded-lg bg-[#1275e2] hover:bg-[#005cb8] text-white font-semibold text-xs flex items-center gap-1.5 transition-colors disabled:opacity-60 shadow-xs"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Registering...</span>
                </>
              ) : (
                <>
                  <span>Complete Setup</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function OnboardingPage() {
  return (
    <AuthProvider>
      <OnboardingContent />
    </AuthProvider>
  );
}
