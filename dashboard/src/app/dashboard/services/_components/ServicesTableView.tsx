import React from 'react';
import { PhoneCall, Radio, Hotel, Eye, Copy, Check } from 'lucide-react';
import { ServiceItem } from './types';

interface ServicesTableViewProps {
  services: ServiceItem[];
  copiedId: string | null;
  onCopyPhone: (phone: string, id: string, e: React.MouseEvent) => void;
  onSelectService: (service: ServiceItem) => void;
}

export function ServicesTableView({
  services,
  copiedId,
  onCopyPhone,
  onSelectService,
}: ServicesTableViewProps) {
  return (
    <div className="bg-white dark:bg-[#15161c] border border-slate-200/80 dark:border-[#222430] rounded-xl shadow-xs overflow-hidden">
      <div className="overflow-x-auto [scrollbar-width:thin]">
        <table className="w-full text-left border-collapse min-w-[1000px]">
          <thead>
            <tr className="border-b border-slate-200/80 dark:border-[#222430] bg-slate-50/75 dark:bg-[#12131a]/80">
              <th className="py-3 px-4 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 whitespace-nowrap">
                SERVICE ID
              </th>
              <th className="py-3 px-4 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 whitespace-nowrap">
                SERVICE NAME
              </th>
              <th className="py-3 px-4 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 whitespace-nowrap">
                SERVICE NUMBER
              </th>
              <th className="py-3 px-4 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 whitespace-nowrap">
                SERVICE TYPE
              </th>
              <th className="py-3 px-4 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 whitespace-nowrap">
                MONTHLY PRICE
              </th>
              <th className="py-3 px-4 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 whitespace-nowrap">
                PROPERTY
              </th>
              <th className="py-3 px-4 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 whitespace-nowrap">
                STATUS
              </th>
              <th className="py-3 px-4 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 text-right whitespace-nowrap">
                ACTIONS
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-[#20222c] text-xs">
            {services.map((item) => {
              const serviceId = item.custom_service_id || `SVC-${item.id.slice(0, 6).toUpperCase()}`;
              const serviceName = item.service_name || item.description || 'Standard Voice Line';

              return (
                <tr
                  key={item.id}
                  onClick={() => onSelectService(item)}
                  className="hover:bg-slate-50/70 dark:hover:bg-[#181922] transition-colors cursor-pointer group"
                >
                  {/* Column 1: SERVICE ID */}
                  <td className="py-3.5 px-4 whitespace-nowrap font-mono text-xs font-bold text-blue-600 dark:text-blue-400">
                    {serviceId}
                  </td>

                  {/* Column 2: SERVICE NAME */}
                  <td className="py-3.5 px-4 whitespace-nowrap font-semibold text-slate-900 dark:text-white">
                    <span className="truncate max-w-[180px] block" title={serviceName}>
                      {serviceName}
                    </span>
                  </td>

                  {/* Column 3: SERVICE NUMBER */}
                  <td className="py-3.5 px-4 whitespace-nowrap font-medium text-slate-900 dark:text-white">
                    {item.phone_number ? (
                      <div className="flex items-center gap-1.5">
                        <span>{item.phone_number}</span>
                        <button
                          onClick={(e) => onCopyPhone(item.phone_number, item.id, e)}
                          className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition cursor-pointer"
                          title="Copy number"
                        >
                          {copiedId === item.id ? (
                            <Check className="w-3 h-3 text-emerald-500" />
                          ) : (
                            <Copy className="w-3 h-3" />
                          )}
                        </button>
                      </div>
                    ) : (
                      <span className="text-slate-400">—</span>
                    )}
                  </td>

                  {/* Column 4: SERVICE TYPE */}
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-semibold bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                      <Radio className="w-3 h-3 text-blue-500" />
                      <span>{item.service_type || 'Voice Line'}</span>
                    </span>
                  </td>

                  {/* Column 5: MONTHLY PRICE */}
                  <td className="py-3.5 px-4 whitespace-nowrap font-mono font-semibold text-emerald-600 dark:text-emerald-400">
                    ${Number(item.price || 0).toFixed(2)}/mo
                  </td>

                  {/* Column 6: PROPERTY */}
                  <td className="py-3.5 px-4 whitespace-nowrap text-slate-700 dark:text-slate-300 font-medium">
                    <div className="flex items-center gap-1.5">
                      <Hotel className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate max-w-[150px]">{item.property_name}</span>
                    </div>
                  </td>

                  {/* Column 7: STATUS */}
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${
                        item.status === 'ACTIVE'
                          ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/60'
                          : item.status === 'PORTING' || item.status === 'PENDING_PORT'
                          ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400 border border-amber-200 dark:border-amber-800/60'
                          : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400 border border-slate-200 dark:border-slate-700'
                      }`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          item.status === 'ACTIVE'
                            ? 'bg-emerald-500'
                            : item.status === 'PORTING' || item.status === 'PENDING_PORT'
                            ? 'bg-amber-500'
                            : 'bg-slate-400'
                        }`}
                      />
                      {item.status === 'PENDING_PORT' ? 'Pending Port' : item.status}
                    </span>
                  </td>

                  {/* Column 8: ACTIONS (View Service Only) */}
                  <td className="py-3.5 px-4 text-right whitespace-nowrap">
                    <div className="flex items-center justify-end" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => onSelectService(item)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-50 dark:bg-blue-950/50 hover:bg-blue-100 dark:hover:bg-blue-900/60 text-blue-600 dark:text-blue-400 text-xs font-semibold transition cursor-pointer border border-blue-200 dark:border-blue-900/40"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>View Service</span>
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
