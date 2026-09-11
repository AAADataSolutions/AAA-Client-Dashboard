'use client';

import React, { useState } from 'react';
import { AuthProvider } from '@/lib/auth/auth-context';
import { AdminSidebar } from '@/components/admin/AdminSidebar';
import { AdminHeader } from '@/components/admin/AdminHeader';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  return (
    <AuthProvider>
      <div className="min-h-screen bg-[#f8f9fa] text-[#181c22] flex flex-col font-sans">
        {/* Sidebar */}
        <AdminSidebar
          isOpen={isSidebarOpen}
          onToggle={() => setIsSidebarOpen(!isSidebarOpen)}
          onClose={() => setIsSidebarOpen(false)}
        />

        {/* Main Workspace Column */}
        <div
          className={`flex-1 flex flex-col transition-all duration-300 ease-in-out ${
            isSidebarOpen ? 'lg:pl-64' : 'lg:pl-16'
          }`}
        >
          <AdminHeader
            onOpenSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
            isSidebarOpen={isSidebarOpen}
          />
          <main className="flex-1 p-5 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
            {children}
          </main>
        </div>
      </div>
    </AuthProvider>
  );
}
