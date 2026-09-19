'use client';

import React from 'react';
import { ShieldCheck, PhoneCall, Radio, Wifi, Award, Building2 } from 'lucide-react';
import { NetworkCanvas } from './NetworkCanvas';
import { motion } from 'framer-motion';

export const BrandPanel: React.FC = () => {
  return (
    <section className="relative overflow-hidden bg-[#0d1017] p-8 lg:p-16 flex flex-col justify-between border-b lg:border-b-0 lg:border-r border-[#212833] min-h-[480px] lg:min-h-screen select-none">
      {/* Background Grid Pattern */}
      <div
        className="absolute inset-0 pointer-events-none opacity-40"
        style={{
          backgroundImage: `
            linear-gradient(rgba(255, 255, 255, 0.03) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255, 255, 255, 0.03) 1px, transparent 1px)
          `,
          backgroundSize: '40px 40px',
          maskImage: 'radial-gradient(ellipse at center, black 40%, transparent 80%)',
          WebkitMaskImage: 'radial-gradient(ellipse at center, black 40%, transparent 80%)',
        }}
      />

      {/* Subtle Glow Blurs */}
      <div
        className="absolute -left-20 top-1/4 w-80 h-80 rounded-full bg-[#1275e2]/15 filter blur-[90px] pointer-events-none"
        aria-hidden="true"
      />
      <div
        className="absolute right-0 bottom-1/4 w-64 h-64 rounded-full bg-indigo-600/10 filter blur-[80px] pointer-events-none"
        aria-hidden="true"
      />

      {/* Network Particle Canvas */}
      <NetworkCanvas />

      {/* Top Content: Logo, Headline, Subheadline */}
      <div className="relative z-10 space-y-8">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className="space-y-3"
        >
          <div className="flex items-center gap-3">
            {/* <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#1275e2]/25 to-indigo-600/25 text-[#4c8df5] flex items-center justify-center shadow-inner border border-[#1275e2]/40 p-1.5">
              <img src="/logo.png" alt="AAA Logo" className="w-full h-full object-contain" />
            </div> */}
            <div>
              <span className="text-base font-bold tracking-tight text-white block">
                AAA Data Solutions
              </span>
              <span className="text-[11px] font-medium text-slate-400 block tracking-wide">
                An Active Telephones Company
              </span>
            </div>
          </div>

          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#1275e2]/10 border border-[#1275e2]/30 text-blue-400 text-xs font-semibold">
            <span>Voice</span>
            <span>•</span>
            <span>Video</span>
            <span>•</span>
            <span>Data</span>
          </div>
        </motion.div>

        <div className="space-y-4 max-w-[500px]">
          <motion.h1
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.1, ease: 'easeOut' }}
            className="text-3xl sm:text-4xl lg:text-[2.5rem] font-bold tracking-[-0.02em] leading-[1.18] text-white"
          >
            Decades of Trust. <br />
            <span className="bg-gradient-to-r from-blue-400 via-indigo-300 to-white bg-clip-text text-transparent">
              Built for Hospitality.
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.2, ease: 'easeOut' }}
            className="text-[14.5px] sm:text-[15px] leading-relaxed text-slate-400"
          >
            Enterprise telephony, carrier-grade E911 compliance, and high-performance communication infrastructure trusted by leading hotels, clubs, and property groups nationwide.
          </motion.p>
        </div>
      </div>

      {/* Bottom Content: Credibility Items */}
      <div className="relative z-10 mt-10 lg:mt-14 space-y-7">
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, delay: 0.3, ease: 'easeOut' }}
          className="grid grid-cols-1 sm:grid-cols-2 gap-4"
        >
          <div className="flex items-start gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/[0.06]">
            <PhoneCall className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
            <div className="min-w-0">
              <p className="text-[13px] font-semibold text-slate-200">Voice &amp; Cloud PBX</p>
              <p className="text-[11px] text-slate-400">Carrier SIP trunking &amp; DIDs</p>
            </div>
          </div>
          <div className="flex items-start gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/[0.06]">
            <ShieldCheck className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
            <div className="min-w-0">
              <p className="text-[13px] font-semibold text-slate-200">Kari’s Law &amp; RAY BAUM’S</p>
              <p className="text-[11px] text-slate-400">Automated E911 compliance</p>
            </div>
          </div>
          <div className="flex items-start gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/[0.06]">
            <Wifi className="w-4 h-4 text-cyan-400 flex-shrink-0 mt-0.5" />
            <div className="min-w-0">
              <p className="text-[13px] font-semibold text-slate-200">Hospitality Data &amp; Wi-Fi</p>
              <p className="text-[11px] text-slate-400">Dedicated high-speed fiber</p>
            </div>
          </div>
          <div className="flex items-start gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/[0.06]">
            <Building2 className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
            <div className="min-w-0">
              <p className="text-[13px] font-semibold text-slate-200">Turnkey Multi-Property</p>
              <p className="text-[11px] text-slate-400">Centralized tenant management</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, delay: 0.4, ease: 'easeOut' }}
          className="pt-4 border-t border-[#212833]/80 flex items-center justify-between text-xs text-slate-400"
        >
          <span>An Active Telephones Company</span>
          <span className="text-slate-400">•</span>
          <span>Decades of Trust. Built for Hospitality</span>
        </motion.div>
      </div>
    </section>
  );
};
