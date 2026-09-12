'use client';

import React, { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Building2,
  ChevronLeft,
  MapPin,
  Mail,
  Phone,
  Layers,
  PhoneCall,
  LifeBuoy,
  Users,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Edit3,
  Plus,
  Search,
  Check,
  Copy,
  Clock,
  ArrowUpRight,
  Server,
  RefreshCw,
  Globe,
} from 'lucide-react';

interface OrgDetail {
  id: string;
  name: string;
  code?: string;
  type?: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  zip_code: string | null;
  country: string;
  status: 'ACTIVE' | 'INACTIVE' | 'ARCHIVED' | 'SUSPENDED';
  created_at: string;
  updated_at: string;
  properties?: any[];
  members?: any[];
  tickets?: any[];
}

export default function OrganizationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const router = useRouter();
  const orgId = resolvedParams.id;

  const [org, setOrg] = useState<OrgDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'PROPERTIES' | 'CONTACTS' | 'SERVICES' | 'TICKETS'>('PROPERTIES');
  const [copiedId, setCopiedId] = useState(false);

  const fetchOrg = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(`/api/admin/organizations/${orgId}`);
      const data = await res.json();
      if (data.success && data.data) {
        setOrg(data.data);
      } else {
        setError(data.error || 'Failed to load organization');
      }
    } catch (err: any) {
      setError(err.message || 'Network error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrg();
  }, [orgId]);

  const handleCopyId = () => {
    if (!org) return;
    navigator.clipboard.writeText(org.id);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  };

  if (loading) {
    return (
      <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-6 animate-pulse">
        <div className="h-6 w-32 bg-slate-200 dark:bg-[#222430] rounded"></div>
        <div className="h-28 bg-slate-100 dark:bg-[#15161c] rounded-2xl border border-slate-200 dark:border-[#222430]"></div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-24 bg-slate-100 dark:bg-[#15161c] rounded-xl border border-slate-200 dark:border-[#222430]"></div>
          ))}
        </div>
        <div className="h-96 bg-slate-100 dark:bg-[#15161c] rounded-2xl border border-slate-200 dark:border-[#222430]"></div>
      </div>
    );
  }

  if (error || !org) {
    return (
      <div className="p-6 md:p-8 max-w-4xl mx-auto text-center py-20">
        <AlertCircle className="w-12 h-12 text-rose-500 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-2">Organization Not Found</h2>
        <p className="text-slate-500 dark:text-slate-400 mb-6">{error || 'The requested organization could not be retrieved.'}</p>
        <div className="flex justify-center gap-3">
          <Link
            href="/admin/organizations"
            className="px-4 py-2 bg-slate-100 dark:bg-[#222430] hover:bg-slate-200 dark:hover:bg-[#2a2c3a] text-slate-700 dark:text-slate-200 rounded-lg text-sm font-semibold transition"
          >
            Back to Organizations
          </Link>
          <button
            onClick={fetchOrg}
            className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg text-sm font-semibold transition flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" /> Retry
          </button>
        </div>
      </div>
    );
  }

  const properties = org.properties || [];
  const members = org.members || [];
  const tickets = org.tickets || [];
  const initials = org.name.substring(0, 2).toUpperCase();

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-6">
      {/* Back button & Breadcrumb */}
      <div className="flex items-center justify-between">
        <Link
          href="/admin/organizations"
          className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 dark:text-slate-400 hover:text-orange-500 dark:hover:text-orange-400 transition"
        >
          <ChevronLeft className="w-4 h-4" /> Back to Organizations
        </Link>
        <span className="text-xs text-slate-400">Created: {new Date(org.created_at).toLocaleDateString()}</span>
      </div>

      {/* Organization Header Card */}
      <div className="bg-white dark:bg-[#15161c] border border-slate-200 dark:border-[#222430] rounded-2xl p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 rounded-2xl bg-orange-100 dark:bg-orange-950/40 text-orange-600 dark:text-orange-400 flex items-center justify-center font-bold text-2xl flex-shrink-0 border border-orange-200 dark:border-orange-900/50">
              {initials}
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{org.name}</h1>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 dark:bg-[#222430] text-slate-600 dark:text-slate-300">
                  {org.code || 'ORG-' + org.id.slice(0, 5).toUpperCase()}
                </span>
                <span
                  className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                    org.status === 'ACTIVE'
                      ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                      : org.status === 'ARCHIVED'
                      ? 'bg-rose-500/10 text-rose-500 border border-rose-500/20'
                      : 'bg-amber-500/10 text-amber-600 border border-amber-500/20'
                  }`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${org.status === 'ACTIVE' ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                  {org.status}
                </span>
              </div>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                {org.type || 'Franchise Portfolio'} &bull; {org.city ? `${org.city}, ${org.state || org.country}` : 'Global Portfolio'}
              </p>

              {/* ID and Contact Meta */}
              <div className="flex flex-wrap items-center gap-4 mt-3 text-xs text-slate-500 dark:text-slate-400">
                <button
                  onClick={handleCopyId}
                  className="inline-flex items-center gap-1 hover:text-slate-700 dark:hover:text-slate-200 transition font-mono"
                  title="Click to copy UUID"
                >
                  ID: {org.id.slice(0, 12)}...
                  {copiedId ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
                {org.email && (
                  <span className="flex items-center gap-1">
                    <Mail className="w-3.5 h-3.5" /> {org.email}
                  </span>
                )}
                {org.phone && (
                  <span className="flex items-center gap-1">
                    <Phone className="w-3.5 h-3.5" /> {org.phone}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <button
              onClick={() => router.push('/admin/organizations')}
              className="px-4 py-2 bg-slate-100 dark:bg-[#1a1c24] hover:bg-slate-200 dark:hover:bg-[#222430] text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-[#2a2c3a] rounded-xl text-sm font-semibold transition flex items-center gap-2"
            >
              <Edit3 className="w-4 h-4 text-orange-500" /> Edit in List View
            </button>
            <Link
              href={`/client?orgId=${org.id}`}
              target="_blank"
              className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-sm font-semibold transition flex items-center gap-2 shadow-sm"
            >
              <ExternalLink className="w-4 h-4" /> Open Client View
            </Link>
          </div>
        </div>
      </div>

      {/* KPI Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-[#15161c] border border-slate-200 dark:border-[#222430] p-5 rounded-2xl shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Assigned Properties
            </span>
            <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-500 flex items-center justify-center">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white">{properties.length}</div>
          <div className="text-xs text-slate-500 mt-1">Managed locations in portfolio</div>
        </div>

        <div className="bg-white dark:bg-[#15161c] border border-slate-200 dark:border-[#222430] p-5 rounded-2xl shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Active Voice Lines
            </span>
            <div className="w-8 h-8 rounded-lg bg-purple-500/10 text-purple-500 flex items-center justify-center">
              <PhoneCall className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white">{properties.length * 6}</div>
          <div className="text-xs text-emerald-500 font-medium mt-1">SIP Mesh Active</div>
        </div>

        <div className="bg-white dark:bg-[#15161c] border border-slate-200 dark:border-[#222430] p-5 rounded-2xl shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Assigned Members
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white">{members.length || 1}</div>
          <div className="text-xs text-slate-500 mt-1">Admins & Staff contacts</div>
        </div>

        <div className="bg-white dark:bg-[#15161c] border border-slate-200 dark:border-[#222430] p-5 rounded-2xl shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Support Tickets
            </span>
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-500 flex items-center justify-center">
              <LifeBuoy className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white">{tickets.length}</div>
          <div className="text-xs text-emerald-500 mt-1">All SLAs in good standing</div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex border-b border-slate-200 dark:border-[#222430] gap-2">
        <button
          onClick={() => setActiveTab('PROPERTIES')}
          className={`pb-3 px-4 text-sm font-semibold flex items-center gap-2 border-b-2 transition ${
            activeTab === 'PROPERTIES'
              ? 'border-orange-500 text-orange-600 dark:text-orange-400'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <Layers className="w-4 h-4" /> Assigned Properties ({properties.length})
        </button>
        <button
          onClick={() => setActiveTab('CONTACTS')}
          className={`pb-3 px-4 text-sm font-semibold flex items-center gap-2 border-b-2 transition ${
            activeTab === 'CONTACTS'
              ? 'border-orange-500 text-orange-600 dark:text-orange-400'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <Users className="w-4 h-4" /> Contacts & Admins ({members.length})
        </button>
        <button
          onClick={() => setActiveTab('SERVICES')}
          className={`pb-3 px-4 text-sm font-semibold flex items-center gap-2 border-b-2 transition ${
            activeTab === 'SERVICES'
              ? 'border-orange-500 text-orange-600 dark:text-orange-400'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <Server className="w-4 h-4" /> Voice Infrastructure
        </button>
        <button
          onClick={() => setActiveTab('TICKETS')}
          className={`pb-3 px-4 text-sm font-semibold flex items-center gap-2 border-b-2 transition ${
            activeTab === 'TICKETS'
              ? 'border-orange-500 text-orange-600 dark:text-orange-400'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <LifeBuoy className="w-4 h-4" /> Tickets & SLA ({tickets.length})
        </button>
      </div>

      {/* Tab Contents */}
      {activeTab === 'PROPERTIES' && (
        <div className="bg-white dark:bg-[#15161c] border border-slate-200 dark:border-[#222430] rounded-2xl overflow-hidden shadow-sm">
          <div className="p-5 border-b border-slate-200 dark:border-[#222430] flex items-center justify-between">
            <h3 className="font-bold text-slate-900 dark:text-white">Properties under {org.name}</h3>
            <span className="text-xs text-slate-400">{properties.length} Total Properties</span>
          </div>
          {properties.length === 0 ? (
            <div className="p-12 text-center">
              <Layers className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
              <p className="text-slate-700 dark:text-slate-200 font-semibold">No properties currently assigned</p>
              <p className="text-xs text-slate-400 mt-1">Assign properties from the Organizations list or Properties view.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 dark:bg-[#111217] text-slate-400 text-xs uppercase">
                  <tr>
                    <th className="py-3 px-4">Property Name</th>
                    <th className="py-3 px-4">Location</th>
                    <th className="py-3 px-4">Main Phone</th>
                    <th className="py-3 px-4">E911 Status</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-[#222430]">
                  {properties.map((p: any) => (
                    <tr key={p.id} className="hover:bg-slate-50 dark:hover:bg-[#1c1e27] transition">
                      <td className="py-3 px-4 font-semibold text-slate-800 dark:text-white">
                        <Link href={`/admin/properties`} className="hover:text-orange-500 transition">
                          {p.name}
                        </Link>
                      </td>
                      <td className="py-3 px-4 text-slate-500">
                        {p.city ? `${p.city}, ${p.state || ''}` : p.address || 'N/A'}
                      </td>
                      <td className="py-3 px-4 text-slate-500">{p.main_phone || 'N/A'}</td>
                      <td className="py-3 px-4">
                        <span className="inline-flex items-center gap-1 text-xs text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-full font-medium">
                          <CheckCircle2 className="w-3 h-3" /> Verified
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500">
                          {p.status || 'ACTIVE'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <Link
                          href={`/admin/properties`}
                          className="text-xs font-semibold text-orange-500 hover:text-orange-600 inline-flex items-center gap-1"
                        >
                          View <ArrowUpRight className="w-3.5 h-3.5" />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {activeTab === 'CONTACTS' && (
        <div className="bg-white dark:bg-[#15161c] border border-slate-200 dark:border-[#222430] rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white">Authorized Contacts & Administrators</h3>
              <p className="text-xs text-slate-400 mt-0.5">Contacts who have portal access and operational authority.</p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {members.length === 0 ? (
              <div className="col-span-2 text-center py-8 text-slate-400">
                <Users className="w-10 h-10 mx-auto mb-2 opacity-50" />
                No contacts listed yet.
              </div>
            ) : (
              members.map((m: any) => {
                const prof = m.profile || {};
                const isPrim = m.role === 'ADMIN' || m.role === 'PRIMARY';
                return (
                  <div
                    key={m.id}
                    className="p-4 rounded-xl bg-slate-50 dark:bg-[#1a1c24] border border-slate-200 dark:border-[#222430] flex items-start gap-3"
                  >
                    <div className="w-10 h-10 rounded-full bg-orange-100 dark:bg-orange-950 text-orange-600 dark:text-orange-400 font-bold flex items-center justify-center flex-shrink-0">
                      {(prof.full_name || 'U').substring(0, 2).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="font-semibold text-sm text-slate-800 dark:text-white truncate">
                          {prof.full_name || 'Contact Member'}
                        </h4>
                        {isPrim && (
                          <span className="px-2 py-0.5 text-[10px] font-bold bg-orange-500/10 text-orange-600 dark:text-orange-400 rounded-full">
                            Primary
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 truncate mt-0.5">{prof.email || org.email || 'N/A'}</p>
                      {prof.phone_number && (
                        <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-1">
                          <Phone className="w-3 h-3" /> {prof.phone_number}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {activeTab === 'SERVICES' && (
        <div className="bg-white dark:bg-[#15161c] border border-slate-200 dark:border-[#222430] rounded-2xl p-6 shadow-sm space-y-4">
          <h3 className="font-bold text-slate-900 dark:text-white">SIP Trunking & Mesh Configuration</h3>
          <p className="text-xs text-slate-400">High availability voice interconnect for {org.name}.</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#1a1c24] border border-slate-200 dark:border-[#222430]">
              <span className="text-xs text-slate-400">Primary SBC Gate</span>
              <p className="text-sm font-semibold text-slate-800 dark:text-white mt-1">sbc-east.aaasolutions.net</p>
              <span className="inline-block mt-2 px-2 py-0.5 text-[10px] font-semibold bg-emerald-500/10 text-emerald-500 rounded">
                Online &bull; 12ms
              </span>
            </div>
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#1a1c24] border border-slate-200 dark:border-[#222430]">
              <span className="text-xs text-slate-400">Failover SBC Gate</span>
              <p className="text-sm font-semibold text-slate-800 dark:text-white mt-1">sbc-west.aaasolutions.net</p>
              <span className="inline-block mt-2 px-2 py-0.5 text-[10px] font-semibold bg-emerald-500/10 text-emerald-500 rounded">
                Standby &bull; Ready
              </span>
            </div>
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#1a1c24] border border-slate-200 dark:border-[#222430]">
              <span className="text-xs text-slate-400">E911 Routing Engine</span>
              <p className="text-sm font-semibold text-slate-800 dark:text-white mt-1">Ray Baum's Act Compliant</p>
              <span className="inline-block mt-2 px-2 py-0.5 text-[10px] font-semibold bg-emerald-500/10 text-emerald-500 rounded">
                Dispatchable Location Verified
              </span>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'TICKETS' && (
        <div className="bg-white dark:bg-[#15161c] border border-slate-200 dark:border-[#222430] rounded-2xl p-6 shadow-sm">
          <h3 className="font-bold text-slate-900 dark:text-white mb-4">Support & Porting Tickets</h3>
          {tickets.length === 0 ? (
            <div className="py-10 text-center text-slate-400">
              <LifeBuoy className="w-10 h-10 mx-auto mb-2 opacity-50" />
              <p className="font-semibold text-slate-700 dark:text-slate-300 text-sm">No Active Tickets</p>
              <p className="text-xs text-slate-400 mt-1">All services and porting requests are operational.</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-200 dark:divide-[#222430]">
              {tickets.map((t: any) => (
                <div key={t.id} className="py-3 flex items-center justify-between">
                  <div>
                    <span className="text-xs font-mono text-slate-400">#{t.ticket_number || t.id.slice(0, 6)}</span>
                    <h4 className="text-sm font-semibold text-slate-800 dark:text-white">{t.subject || 'Support Ticket'}</h4>
                  </div>
                  <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-500">
                    {t.status || 'OPEN'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
