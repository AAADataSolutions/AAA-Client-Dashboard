'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Phone, ShieldCheck, Wifi, Building2 } from 'lucide-react';

export const BrandPanel: React.FC = () => {
  return (
    <section className="relative w-full h-full flex flex-col justify-between p-6 sm:p-10 lg:p-14 select-none text-white z-10">
      {/* Top Header & Badge */}
      <div className="space-y-2">
        <h3 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
          AAA Data Solutions
        </h3>
    
        <div className="pt-1">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-950/60 backdrop-blur-md border border-blue-500/30 shadow-xs">
            <span className="text-[11px] font-medium text-blue-200">
              Voice <span className="text-blue-400 mx-1">•</span> Video <span className="text-blue-400 mx-1">•</span> Data
            </span>
          </div>
        </div>
      </div>

      {/* Center: Hero Headings, Subtitle & 2x2 Feature Cards */}
      <div className="my-auto py-6 max-w-[540px] w-full space-y-5">
        {/* Main Headings */}
        <div className="space-y-1">
          <h1 className="text-3xl sm:text-4xl lg:text-[44px] font-extrabold tracking-tight text-white leading-[1.15]">
            Decades of Trust.
          </h1>
          <h1 className="text-3xl sm:text-4xl lg:text-[44px] font-extrabold tracking-tight text-sky-400 leading-[1.15]">
            Built for Hospitality.
          </h1>
        </div>

        {/* Subtitle */}
        <p className="text-xs sm:text-sm text-blue-100/85 leading-relaxed font-normal">
          Enterprise telephony, carrier-grade E911 compliance, and high-performance communication infrastructure trusted by leading hotels, clubs, and property groups nationwide.
        </p>

        {/* 4 Feature Cards (2x2 Grid) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
          {/* Card 1: Voice, Cloud and on Premise PBX */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.05 }}
            className="p-3.5 rounded-2xl bg-[#091b3b]/60 backdrop-blur-md border border-white/10 text-white shadow-lg flex items-start gap-3"
          >
            <div className="w-9 h-9 rounded-xl bg-blue-600/25 text-blue-400 flex items-center justify-center shrink-0 border border-blue-400/20">
              <Phone className="w-4 h-4" />
            </div>
            <div className="space-y-0.5">
              <h4 className="text-xs font-bold text-white leading-snug">
                Voice, Cloud and on Premise PBX
              </h4>
              <p className="text-[11px] text-blue-200/70 font-normal">
                Carrier SIP trunking &amp; DIDs
              </p>
            </div>
          </motion.div>

          {/* Card 2: Kary's Law & RAY BAUM'S */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
            className="p-3.5 rounded-2xl bg-[#091b3b]/60 backdrop-blur-md border border-white/10 text-white shadow-lg flex items-start gap-3"
          >
            <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-400/20">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div className="space-y-0.5">
              <h4 className="text-xs font-bold text-white leading-snug">
                Kary&apos;s Law &amp; RAY BAUM&apos;S
              </h4>
              <p className="text-[11px] text-blue-200/70 font-normal">
                Automated E911 compliance
              </p>
            </div>
          </motion.div>

          {/* Card 3: Hospitality Data & Wi-Fi */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.15 }}
            className="p-3.5 rounded-2xl bg-[#091b3b]/60 backdrop-blur-md border border-white/10 text-white shadow-lg flex items-start gap-3"
          >
            <div className="w-9 h-9 rounded-xl bg-sky-500/20 text-sky-400 flex items-center justify-center shrink-0 border border-sky-400/20">
              <Wifi className="w-4 h-4" />
            </div>
            <div className="space-y-0.5">
              <h4 className="text-xs font-bold text-white leading-snug">
                Hospitality Data &amp; Wi-Fi
              </h4>
              <p className="text-[11px] text-blue-200/70 font-normal">
                Dedicated high-speed fiber
              </p>
            </div>
          </motion.div>

          {/* Card 4: Turnkey Multi-Property */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.2 }}
            className="p-3.5 rounded-2xl bg-[#091b3b]/60 backdrop-blur-md border border-white/10 text-white shadow-lg flex items-start gap-3"
          >
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0 border border-amber-400/20">
              <Building2 className="w-4 h-4" />
            </div>
            <div className="space-y-0.5">
              <h4 className="text-xs font-bold text-white leading-snug">
                Turnkey Multi-Property
              </h4>
              <p className="text-[11px] text-blue-200/70 font-normal">
                Centralized tenant management
              </p>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Footer Section */}
      <div className="pt-4 border-t border-white/15 text-blue-200/70 text-xs font-normal">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px]">
          <span>Support: <strong className="text-white font-medium">203-599-0500</strong></span>
          <span className="text-white/30">|</span>
          <a href="mailto:support@aaadatasolutions.com" className="text-blue-200 hover:text-white transition-colors">
            support@aaadatasolutions.com
          </a>
          <span className="text-white/30">|</span>
          <span>Billing: <a href="mailto:billing@aaadatasolutions.com" className="text-blue-200 hover:text-white transition-colors">billing@aaadatasolutions.com</a></span>
        </div>
      </div>
    </section>
  );
};
