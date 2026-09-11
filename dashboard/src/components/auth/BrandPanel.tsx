'use client';

import React from 'react';
import { ShieldCheck, Shield, Radio, Wifi, Award } from 'lucide-react';
import { NetworkCanvas } from './NetworkCanvas';
import { motion } from 'framer-motion';

export const BrandPanel: React.FC = () => {
  return (
    <section className="relative overflow-hidden bg-[#10141b] p-8 lg:p-16 flex flex-col justify-between border-b lg:border-b-0 lg:border-r border-[#212833] min-h-[480px] lg:min-h-screen select-none">
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

      {/* Subtle Glow Blur */}
      <div
        className="absolute -left-20 top-1/3 w-72 h-72 rounded-full bg-[#4c7cf3]/10 filter blur-[80px] pointer-events-none"
        aria-hidden="true"
      />

      {/* Network Particle Canvas (animated connected nodes) */}
      <NetworkCanvas />

      {/* Top Content: Logo, Headline, Subheadline */}
      <div className="relative z-10 space-y-8">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className="flex items-center gap-3"
        >
          <div className="w-8 h-8 rounded-lg bg-[#4c7cf3]/15 text-[#6e96f8] flex items-center justify-center shadow-inner border border-[#4c7cf3]/30">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <span className="text-[15px] font-medium tracking-tight text-[#e8ecf2]">
            AAA Data Solutions
          </span>
        </motion.div>

        <div className="space-y-4 max-w-[500px]">
          <motion.h1
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.1, ease: 'easeOut' }}
            className="text-3xl sm:text-4xl lg:text-[2.6rem] font-semibold tracking-[-0.02em] leading-[1.15] text-[#e8ecf2]"
          >
            Building the infrastructure behind better communication.
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.2, ease: 'easeOut' }}
            className="text-[14.5px] sm:text-[15px] leading-relaxed text-[#8d97a8]"
          >
            Trusted Voice, Data &amp; Video communication infrastructure built with security, reliability, and connectivity at its core.
          </motion.p>
        </div>
      </div>

      {/* Bottom Content: Credibility Items & Founder Note */}
      <div className="relative z-10 mt-12 lg:mt-16 space-y-8">
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, delay: 0.3, ease: 'easeOut' }}
          className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6"
        >
          <div className="flex items-start gap-3">
            <Shield className="w-4 h-4 text-[#6e96f8] flex-shrink-0 mt-0.5" />
            <span className="text-[13.5px] leading-snug text-[#8d97a8]">
              Cybersecurity &amp; networks
            </span>
          </div>
          <div className="flex items-start gap-3">
            <Radio className="w-4 h-4 text-[#6e96f8] flex-shrink-0 mt-0.5" />
            <span className="text-[13.5px] leading-snug text-[#8d97a8]">
              Voice, data &amp; video infrastructure
            </span>
          </div>
          <div className="flex items-start gap-3">
            <Wifi className="w-4 h-4 text-[#6e96f8] flex-shrink-0 mt-0.5" />
            <span className="text-[13.5px] leading-snug text-[#8d97a8]">
              ISP &amp; connectivity expertise
            </span>
          </div>
          <div className="flex items-start gap-3">
            <Award className="w-4 h-4 text-[#6e96f8] flex-shrink-0 mt-0.5" />
            <span className="text-[13.5px] leading-snug text-[#8d97a8]">
              Certified Ethical Hacker
            </span>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, delay: 0.4, ease: 'easeOut' }}
          className="pt-5 border-t border-[#212833]"
        >
          <p className="text-[13px] leading-relaxed text-[#5b6472] max-w-[460px]">
            Founded by an <strong className="text-[#8d97a8] font-medium">MS in Cybersecurity &amp; Networks</strong> graduate who also built <strong className="text-[#8d97a8] font-medium">Ronbi Net</strong>, an ISP delivering fiber and broadband connectivity across Mumbai.
          </p>
        </motion.div>
      </div>
    </section>
  );
};
