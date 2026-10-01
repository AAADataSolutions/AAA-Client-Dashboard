'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { PhoneCall, ShieldCheck, Wifi, Building2 } from 'lucide-react';

export const BrandPanel: React.FC = () => {
  return (
    <section className="relative w-full h-full min-h-[580px] lg:min-h-screen bg-gradient-to-r from-blue-900 to-blue-800 flex flex-col justify-between p-8 sm:p-12 lg:p-16 overflow-hidden select-none text-white">
      {/* Top Header & Badge */}
      <div className="relative z-10 space-y-2.5">
        <h3 className="text-xl sm:text-2xl font-black tracking-tight text-white">
          AAA Data Solutions
        </h3>
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-white/15 backdrop-blur-md border border-white/25 shadow-2xs">
          <span className="text-xs font-semibold text-white">
            Voice <span className="text-blue-300 mx-1">•</span> Video <span className="text-blue-300 mx-1">•</span> Data
          </span>
        </div>
      </div>

      {/* Center: Hero Headings, Subtitle & 2x2 Feature Cards */}
      <div className="relative z-10 my-auto py-8 max-w-[560px] w-full space-y-6">
        {/* Main Headings */}
        <div className="space-y-1">
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-white leading-[1.12]">
            Decades of Trust.
          </h1>
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-sky-300 leading-[1.12]">
            Built for Hospitality.
          </h1>
        </div>

        {/* Subtitle */}
        <p className="text-sm sm:text-[15px] text-blue-100/90 leading-relaxed font-normal">
          Enterprise telephony, carrier-grade E911 compliance, and high-performance communication infrastructure trusted by leading hotels, clubs, and property groups nationwide.
        </p>

        {/* 4 Feature Cards (2x2 Grid) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-2">
          {/* Card 1: Voice, Cloud and on Premise PBX */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: 0.05 }}
            className="p-4 rounded-2xl bg-white border border-white/90 text-slate-900 shadow-xl shadow-blue-950/30 flex items-start gap-3.5"
          >
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 border border-blue-100">
              <PhoneCall className="w-5 h-5" />
            </div>
            <div className="space-y-0.5">
              <h4 className="text-[13px] font-bold text-slate-900 leading-snug">
                Voice, Cloud and on Premise PBX
              </h4>
              <p className="text-[11.5px] text-slate-500 font-medium">
                Carrier SIP trunking &amp; DIDs
              </p>
            </div>
          </motion.div>

          {/* Card 2: Kary's Law & RAY BAUM'S */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: 0.1 }}
            className="p-4 rounded-2xl bg-white border border-white/90 text-slate-900 shadow-xl shadow-blue-950/30 flex items-start gap-3.5"
          >
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 border border-blue-100">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div className="space-y-0.5">
              <h4 className="text-[13px] font-bold text-slate-900 leading-snug">
                Kary&apos;s Law &amp; RAY BAUM&apos;S
              </h4>
              <p className="text-[11.5px] text-slate-500 font-medium">
                Automated E911 compliance
              </p>
            </div>
          </motion.div>

          {/* Card 3: Hospitality Data & Wi-Fi */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: 0.15 }}
            className="p-4 rounded-2xl bg-white border border-white/90 text-slate-900 shadow-xl shadow-blue-950/30 flex items-start gap-3.5"
          >
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 border border-blue-100">
              <Wifi className="w-5 h-5" />
            </div>
            <div className="space-y-0.5">
              <h4 className="text-[13px] font-bold text-slate-900 leading-snug">
                Hospitality Data &amp; Wi-Fi
              </h4>
              <p className="text-[11.5px] text-slate-500 font-medium">
                Dedicated high-speed fiber
              </p>
            </div>
          </motion.div>

          {/* Card 4: Turnkey Multi-Property */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: 0.2 }}
            className="p-4 rounded-2xl bg-white border border-white/90 text-slate-900 shadow-xl shadow-blue-950/30 flex items-start gap-3.5"
          >
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 border border-blue-100">
              <Building2 className="w-5 h-5" />
            </div>
            <div className="space-y-0.5">
              <h4 className="text-[13px] font-bold text-slate-900 leading-snug">
                Turnkey Multi-Property
              </h4>
              <p className="text-[11.5px] text-slate-500 font-medium">
                Centralized tenant management
              </p>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Footer Section */}
      <div className="relative z-10 pt-4 border-t border-white/20 space-y-2 text-blue-100/80 text-xs font-normal">
        {/* <div className="flex flex-wrap items-center justify-end">
          <span className="text-blue-100/90 font-medium">Decades of Trust. Built for Hospitality.</span>
        </div> */}
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[11.5px]">
          <span>Support: <strong className="text-white font-semibold">203-599-0500</strong></span>
          <span>•</span>
          <a href="mailto:support@aaadatasolutions.com" className="text-white font-semibold hover:text-sky-300 transition-colors">
            support@aaadatasolutions.com
          </a>
          <span className="text-white/40">|</span>
          <span>Billing: <a href="mailto:billing@aaadatasolutions.com" className="text-white font-semibold hover:text-sky-300 transition-colors">billing@aaadatasolutions.com</a></span>
        </div>
      </div>
    </section>
  );
};
