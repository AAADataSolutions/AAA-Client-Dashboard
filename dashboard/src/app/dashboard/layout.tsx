'use client';

import React, { useState } from 'react';
import { AuthProvider } from '@/lib/auth/auth-context';
import { ToastProvider } from '@/components/client/ClientToast';
import { ClientSidebar } from '@/components/client/ClientSidebar';
import { ClientHeader } from '@/components/client/ClientHeader';

export default function ClientDashboardLayout({ children }: { children: React.ReactNode }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  return (
    <AuthProvider>
      <ToastProvider>
        <div className="client-scope min-h-screen bg-[#f8f9fa] dark:bg-[#0d0e12] text-[#181c22] dark:text-[#f4f4f6] flex flex-col font-sans transition-colors duration-200">
          {/* Client Navigation Sidebar */}
          <ClientSidebar
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
            <ClientHeader
              onOpenSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
              isSidebarOpen={isSidebarOpen}
            />
            <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
              {children}
            </main>
          </div>
        </div>
      </ToastProvider>
    </AuthProvider>
  );
}
