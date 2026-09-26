'use client';

import React from 'react';
import { ShieldCheck, PhoneCall, Wifi, Building2 } from 'lucide-react';
import { motion } from 'framer-motion';

export const BrandPanel: React.FC = () => {
  return (
    <section className="relative flex flex-col justify-between min-h-[500px] select-none text-slate-900 space-y-10">
      {/* Top Content: Logo, Headline, Subheadline */}
      <div className="relative z-10 space-y-7 max-w-[560px]">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className="space-y-3"
        >
          <div>
            <span className="text-base font-bold tracking-tight text-slate-900 block">
              AAA Data Solutions
            </span>
          </div>

          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#1275e4]/10 border border-[#1275e2]/25 text-[#1275e4] text-xs font-semibold backdrop-blur-xs">
            <span>Voice</span>
            <span>•</span>
            <span>Video</span>
            <span>•</span>
            <span>Data</span>
          </div>
        </motion.div>

        <div className="space-y-4">
          <motion.h1
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.1, ease: 'easeOut' }}
            className="text-3xl sm:text-4xl lg:text-[2.75rem] font-bold tracking-[-0.02em] leading-[1.15] text-slate-900"
          >
            Decades of Trust. <br />
            <span className="text-[#1275e4]">
              Built for Hospitality.
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.2, ease: 'easeOut' }}
            className="text-[14px] sm:text-[15px] leading-relaxed text-slate-600 max-w-[520px]"
          >
            Enterprise telephony, carrier-grade E911 compliance, and high-performance communication infrastructure trusted by leading hotels, clubs, and property groups nationwide.
          </motion.p>
        </div>
      </div>

      {/* Bottom Content: Credibility Items */}
      <div className="relative z-10 space-y-7 max-w-[580px]">
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, delay: 0.3, ease: 'easeOut' }}
          className="grid grid-cols-1 sm:grid-cols-2 gap-3.5"
        >
          {/* Card 1: Voice & Cloud PBX */}
          <div className="flex items-center gap-3.5 p-3.5 rounded-2xl bg-white/85 hover:bg-white/95 backdrop-blur-md border border-white/80 shadow-md shadow-slate-900/5 transition-all hover:shadow-lg">
            <div className="w-9 h-9 rounded-xl bg-blue-50 border border-blue-100 text-[#1275e4] flex items-center justify-center flex-shrink-0">
              <PhoneCall className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <p className="text-[13px] font-semibold text-slate-900">Voice, Cloud and on Premise PBX</p>
              <p className="text-[11px] text-slate-500">Carrier SIP trunking &amp; DIDs</p>
            </div>
          </div>

          {/* Card 2: E911 Compliance */}
          <div className="flex items-center gap-3.5 p-3.5 rounded-2xl bg-white/85 hover:bg-white/95 backdrop-blur-md border border-white/80 shadow-md shadow-slate-900/5 transition-all hover:shadow-lg">
            <div className="w-9 h-9 rounded-xl bg-blue-50 border border-blue-100 text-[#1275e4] flex items-center justify-center flex-shrink-0">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <p className="text-[13px] font-semibold text-slate-900">Kary’s Law &amp; RAY BAUM’S</p>
              <p className="text-[11px] text-slate-500">Automated E911 compliance</p>
            </div>
          </div>

          {/* Card 3: Data & Wi-Fi */}
          <div className="flex items-center gap-3.5 p-3.5 rounded-2xl bg-white/85 hover:bg-white/95 backdrop-blur-md border border-white/80 shadow-md shadow-slate-900/5 transition-all hover:shadow-lg">
            <div className="w-9 h-9 rounded-xl bg-blue-50 border border-blue-100 text-[#1275e4] flex items-center justify-center flex-shrink-0">
              <Wifi className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <p className="text-[13px] font-semibold text-slate-900">Hospitality Data &amp; Wi-Fi</p>
              <p className="text-[11px] text-slate-500">Dedicated high-speed fiber</p>
            </div>
          </div>

          {/* Card 4: Multi-Property */}
          <div className="flex items-center gap-3.5 p-3.5 rounded-2xl bg-white/85 hover:bg-white/95 backdrop-blur-md border border-white/80 shadow-md shadow-slate-900/5 transition-all hover:shadow-lg">
            <div className="w-9 h-9 rounded-xl bg-blue-50 border border-blue-100 text-[#1275e4] flex items-center justify-center flex-shrink-0">
              <Building2 className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <p className="text-[13px] font-semibold text-slate-900">Turnkey Multi-Property</p>
              <p className="text-[11px] text-slate-500">Centralized tenant management</p>
            </div>
          </div>
        </motion.div>

        {/* Footer info line & Contact details */}
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, delay: 0.4, ease: 'easeOut' }}
          className="pt-4 border-t border-slate-300/60 flex flex-col gap-3 text-xs max-w-[580px]"
        >
          <div className="flex items-center justify-between text-slate-600">
            <span>An Active Telephones Company</span>
            <span className="text-slate-400">•</span>
            <span>Decades of Trust. Built for Hospitality.</span>
          </div>

          <div className="flex flex-col sm:flex-row items-center sm:justify-start gap-2 sm:gap-4 text-[11px] leading-5 text-slate-700 sm:text-xs">
            <div className="flex items-center gap-1.5">
              <span className="text-slate-500">Support:</span>
              <a href="tel:2035990500" className="font-semibold text-slate-900 hover:text-[#1275e4] transition-colors">
                203-599-0500
              </a>
              <span className="text-slate-400 px-0.5">•</span>
              <a href="mailto:support@aaadatasolutions.com" className="font-semibold text-slate-900 hover:text-[#1275e4] transition-colors">
                support@aaadatasolutions.com
              </a>
            </div>
            <div className="hidden sm:block text-slate-300">|</div>
            <div className="flex items-center gap-1.5">
              <span className="text-slate-500">Billing:</span>
              <a href="mailto:billing@aaadatasolutions.com" className="font-semibold text-slate-900 hover:text-[#1275e4] transition-colors">
                billing@aaadatasolutions.com
              </a>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};
