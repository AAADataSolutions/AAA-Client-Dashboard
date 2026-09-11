'use client';

import React from 'react';
import { Hotel, Search, Plus, MapPin, Phone } from 'lucide-react';

export default function AdminPropertiesPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#212833]">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#e8ecf2]">Properties &amp; Locations</h1>
          <p className="text-sm text-[#8d97a8]">
            Manage client hotel properties, voice trunks, and E911 binding locations.
          </p>
        </div>
      </div>

      <div className="p-12 text-center rounded-xl bg-[#10141b] border border-[#212833] space-y-3">
        <Hotel className="w-8 h-8 text-[#4c7cf3] mx-auto opacity-80" />
        <h3 className="text-base font-semibold text-[#e8ecf2]">Property Registry Ready</h3>
        <p className="text-xs text-[#8d97a8] max-w-md mx-auto">
          Properties associated with client organizations will be populated during organization setup or property onboarding phases.
        </p>
      </div>
    </div>
  );
}
