'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  DollarSign,
  Lock,
  Loader2,
  Building2,
  Radio,
  Users,
  FileText,
} from 'lucide-react';
import { useAuth } from '@/lib/auth/auth-context';

import {
  containerVariants,
  itemVariants,
  type EmailQueueState,
  type EmailQueueMeta,
} from './_components/types';
import FinancesKpisAndCharts from './_components/FinancesKpisAndCharts';
import FinancesLedgerTable from './_components/FinancesLedgerTable';
import FinancesModals from './_components/FinancesModals';

export default function AdminFinancesPage() {
  const router = useRouter();
  const { profile, effectiveRole, loading: authLoading } = useAuth();
  const isSuperAdmin = effectiveRole === 'SUPER_ADMIN' || profile?.role === 'SUPER_ADMIN';

  const now = new Date();
  const defaultMonthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

  // State
  const [invoicesMonth, setInvoicesMonth] = useState(defaultMonthKey);
  const [data, setData] = useState<any>(null);
  const [dataLoading, setDataLoading] = useState(true);

  // Backorder modal
  const [showBackorderModal, setShowBackorderModal] = useState(false);
  const [partnersList, setPartnersList] = useState<any[]>([]);

  // Email Queue States
  const [finEmailQueueStates, setFinEmailQueueStates] = useState<Record<string, EmailQueueState>>({});
  const [finEmailQueueMeta, setFinEmailQueueMeta] = useState<EmailQueueMeta>({
    isProcessing: false,
    pendingCount: 0,
  });
  const [finDispatchingIds, setFinDispatchingIds] = useState<Record<string, boolean>>({});

  // Strict route protection
  useEffect(() => {
    if (!authLoading && !isSuperAdmin) {
      router.replace('/admin');
    }
  }, [authLoading, isSuperAdmin, router]);

  const fetchFinances = async () => {
    try {
      setDataLoading(true);
      const res = await fetch(`/api/admin/finances`);
      const json = await res.json();
      if (json.success) {
        setData(json);
      }
    } catch (err) {
      console.error('Failed to fetch finances:', err);
    } finally {
      setDataLoading(false);
    }
  };

  const fetchPartners = async () => {
    try {
      const res = await fetch('/api/admin/partners');
      const json = await res.json();
      if (json.success) {
        setPartnersList(json.data || []);
      }
    } catch (e) {
      console.error('Failed to fetch partners:', e);
    }
  };

  useEffect(() => {
    if (isSuperAdmin) {
      fetchFinances();
      fetchPartners();
    }
  }, [isSuperAdmin]);

  const fetchFinEmailQueue = async () => {
    try {
      const res = await fetch('/api/admin/partners/invoices/send-email');
      const json = await res.json();
      if (json.success) {
        setFinEmailQueueStates(json.states || {});
        setFinEmailQueueMeta({
          isProcessing: Boolean(json.isProcessing),
          pendingCount: Number(json.pendingCount || 0),
        });
      }
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    if (!finEmailQueueMeta.isProcessing && finEmailQueueMeta.pendingCount === 0) return;
    const timer = setInterval(() => {
      fetchFinEmailQueue();
    }, 1200);
    return () => clearInterval(timer);
  }, [finEmailQueueMeta.isProcessing, finEmailQueueMeta.pendingCount]);

  const handleSendFinInvoiceEmail = async (invoiceIds: string[]) => {
    if (!invoiceIds || invoiceIds.length === 0) return;
    try {
      setFinDispatchingIds((prev) => {
        const next = { ...prev };
        invoiceIds.forEach((id) => (next[id] = true));
        return next;
      });
      const res = await fetch('/api/admin/partners/invoices/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ invoice_ids: invoiceIds }),
      });
      const json = await res.json();
      if (json.snapshot) {
        setFinEmailQueueStates(json.snapshot.states || {});
        setFinEmailQueueMeta({
          isProcessing: Boolean(json.snapshot.isProcessing),
          pendingCount: Number(json.snapshot.pendingCount || 0),
        });
      } else {
        fetchFinEmailQueue();
      }
    } catch (e) {
      console.error('Failed to queue invoice email:', e);
    } finally {
      setFinDispatchingIds((prev) => {
        const next = { ...prev };
        invoiceIds.forEach((id) => delete next[id]);
        return next;
      });
    }
  };

  const monthlyDataMap = data?.monthlyDataMap || {};
  const availableMonths = data?.availableMonths || [];
  const defaultMonthData = data?.defaultMonthData || {};
  const invoicesDataObj = monthlyDataMap[invoicesMonth] || defaultMonthData;
  const invoicesItems: any[] = invoicesDataObj.invoiceList || [];

  if (authLoading || (dataLoading && !data)) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
        <p className="text-xs text-slate-500 dark:text-[#71717a] font-medium">
          Loading live financial ledger &amp; database records...
        </p>
      </div>
    );
  }

  if (!isSuperAdmin) return null;

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6 pb-20 font-sans max-w-7xl mx-auto"
    >
      {/* Top Header */}
      <motion.div
        variants={itemVariants}
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-[#222430]"
      >
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-2.5">
              <DollarSign className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              Finances &amp; Revenue Analytics
            </h1>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
              <Lock className="w-2.5 h-2.5" />
              Super Admin Only
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-[#71717a] mt-1">
            Dynamic revenue analytics, real partner disbursements, and independent working month filters on every component.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => setShowBackorderModal(true)}
            className="px-3 py-2 bg-white dark:bg-[#15161c] hover:bg-slate-50 dark:hover:bg-[#1c1e27] text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-[#222430] rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition cursor-pointer"
          >
            <FileText className="w-3.5 h-3.5 text-amber-500" /> Back-Order Invoice
          </button>
          <Link
            href="/admin/vendors"
            className="px-3 py-2 bg-white dark:bg-[#15161c] hover:bg-slate-50 dark:hover:bg-[#1c1e27] text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-[#222430] rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition"
          >
            <Building2 className="w-3.5 h-3.5 text-blue-500" /> Vendors Ledger
          </Link>
          <Link
            href="/admin/servers"
            className="px-3 py-2 bg-white dark:bg-[#15161c] hover:bg-slate-50 dark:hover:bg-[#1c1e27] text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-[#222430] rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition"
          >
            <Radio className="w-3.5 h-3.5 text-emerald-500" /> Servers &amp; Infra
          </Link>
          <Link
            href="/admin/partners"
            className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition"
          >
            <Users className="w-3.5 h-3.5" /> Manage Partners
          </Link>
        </div>
      </motion.div>

      {/* Row 1-4 & 6: KPIs & Charts */}
      <FinancesKpisAndCharts
        monthlyDataMap={monthlyDataMap}
        defaultMonthData={defaultMonthData}
        availableMonths={availableMonths}
        defaultMonthKey={defaultMonthKey}
        nowYear={now.getFullYear()}
      />

      {/* Row 5: Partner Invoices Table */}
      <FinancesLedgerTable
        invoicesMonth={invoicesMonth}
        setInvoicesMonth={setInvoicesMonth}
        invoicesDataObj={invoicesDataObj}
        invoicesItems={invoicesItems}
        finEmailQueueStates={finEmailQueueStates}
        finDispatchingIds={finDispatchingIds}
        handleSendFinInvoiceEmail={handleSendFinInvoiceEmail}
        availableMonths={availableMonths}
      />

      {/* Back-Order Invoice Modal */}
      <FinancesModals
        showBackorderModal={showBackorderModal}
        setShowBackorderModal={setShowBackorderModal}
        partnersList={partnersList}
        defaultMonthKey={defaultMonthKey}
        onSuccess={(emailQueued) => {
          if (emailQueued) fetchFinEmailQueue();
          fetchFinances();
        }}
      />
    </motion.div>
  );
}
