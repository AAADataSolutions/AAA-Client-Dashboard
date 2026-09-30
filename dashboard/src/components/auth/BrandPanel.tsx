'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const SLIDES = [
  {
    title: 'Welcome to your new dashboard',
    desc: "Sign in to explore changes we've made across your hospitality portfolio.",
    metricTitle: 'Active properties',
    metricValue: '1,000+',
    chartTitle: 'Property traffic & voice calls',
  },
  {
    title: 'Real-Time Carrier Porting',
    desc: 'Track 7-stage LSR cutovers and FOC dates with 100% transparency.',
    metricTitle: 'Carrier cuts',
    metricValue: '99.8%',
    chartTitle: 'LSR & DID trunk migrations',
  },
  {
    title: 'Automated E911 Compliance',
    desc: 'Automated Kari’s Law and RAY BAUM’S Act location dispatch records.',
    metricTitle: 'Compliance rate',
    metricValue: '100%',
    chartTitle: 'E911 verified endpoints',
  },
  {
    title: 'Multi-Property Hospitality PBX',
    desc: 'Centralized telecom management for hotel General Managers & regional teams.',
    metricTitle: 'Active lines',
    metricValue: '25,000+',
    chartTitle: 'Enterprise PBX uptime',
  },
];

export const BrandPanel: React.FC = () => {
  const [currentSlide, setCurrentSlide] = useState(0);

  // Auto-advance slide every 6 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % SLIDES.length);
    }, 6000);
    return () => clearInterval(timer);
  }, []);

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + SLIDES.length) % SLIDES.length);
  };

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % SLIDES.length);
  };

  const slide = SLIDES[currentSlide];

  return (
    <section className="relative w-full h-full min-h-[560px] lg:min-h-screen bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 flex flex-col justify-between p-8 sm:p-12 lg:p-16 overflow-hidden select-none text-white">
      {/* Decorative Radial Grid Ticks (White on Blue Background) */}
      <div className="absolute top-4 right-4 w-72 h-72 opacity-20 pointer-events-none">
        <svg viewBox="0 0 200 200" className="w-full h-full stroke-white" strokeWidth="1.5">
          {Array.from({ length: 24 }).map((_, i) => {
            const angle = (i * 360) / 24;
            const rad = (angle * Math.PI) / 180;
            const x1 = 100 + Math.cos(rad) * 45;
            const y1 = 100 + Math.sin(rad) * 45;
            const x2 = 100 + Math.cos(rad) * 90;
            const y2 = 100 + Math.sin(rad) * 90;
            return (
              <line
                key={i}
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                strokeDasharray="2 4"
                transform={`rotate(${i * 6} 100 100)`}
              />
            );
          })}
        </svg>
      </div>

      <div className="absolute -bottom-10 -left-10 w-80 h-80 opacity-15 pointer-events-none">
        <svg viewBox="0 0 200 200" className="w-full h-full stroke-white" strokeWidth="1.5">
          {Array.from({ length: 28 }).map((_, i) => {
            const angle = (i * 360) / 28;
            const rad = (angle * Math.PI) / 180;
            const x1 = 100 + Math.cos(rad) * 40;
            const y1 = 100 + Math.sin(rad) * 40;
            const x2 = 100 + Math.cos(rad) * 95;
            const y2 = 100 + Math.sin(rad) * 95;
            return (
              <line
                key={i}
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                strokeDasharray="2 5"
              />
            );
          })}
        </svg>
      </div>

      {/* Top Branding Pill */}
      <div className="relative z-10">
        <div className="inline-flex items-center gap-2.5 px-3.5 py-1.5 rounded-full bg-white/15 backdrop-blur-md border border-white/25 shadow-xs">
          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-xs font-bold tracking-tight text-white">
            AAA Data Solutions
          </span>
          <span className="text-[10px] uppercase tracking-wider font-semibold text-white bg-white/20 px-2 py-0.5 rounded-full border border-white/30">
            Enterprise Portal
          </span>
        </div>
      </div>

      {/* Center: Floating White Dashboard Preview KPI Cards */}
      <div className="relative z-10 my-auto py-8 max-w-[460px] mx-auto w-full">
        <div className="relative">
          {/* Main Card: Line Analytics Chart (Crisp White Card) */}
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
            className="w-full bg-white text-slate-900 border border-white/80 rounded-2xl p-5 shadow-2xl shadow-blue-950/40 relative z-10"
          >
            <div className="flex items-center justify-between pb-3 mb-2 border-b border-slate-100">
              <span className="text-xs font-bold text-slate-900">
                {slide.chartTitle}
              </span>
              <span className="text-[11px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                +14.8% this month
              </span>
            </div>

            {/* SVG Spline Curves Graph */}
            <div className="w-full h-36 pt-2">
              <svg className="w-full h-full overflow-visible" viewBox="0 0 320 120">
                <defs>
                  <linearGradient id="chartBlueGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#2563eb" stopOpacity="0.25" />
                    <stop offset="100%" stopColor="#2563eb" stopOpacity="0.0" />
                  </linearGradient>
                </defs>

                {/* Horizontal Grid lines */}
                <line x1="0" y1="20" x2="320" y2="20" stroke="#f1f5f9" strokeDasharray="3 3" />
                <line x1="0" y1="60" x2="320" y2="60" stroke="#f1f5f9" strokeDasharray="3 3" />
                <line x1="0" y1="100" x2="320" y2="100" stroke="#f1f5f9" strokeDasharray="3 3" />

                {/* Area 1: Blue */}
                <path
                  d="M 0,85 C 40,75 70,80 110,65 C 160,45 200,60 250,35 C 285,18 305,22 320,15 L 320,110 L 0,110 Z"
                  fill="url(#chartBlueGrad)"
                />

                {/* Spline Line 1 (Top vibrant royal blue) */}
                <path
                  d="M 0,85 C 40,75 70,80 110,65 C 160,45 200,60 250,35 C 285,18 305,22 320,15"
                  fill="none"
                  stroke="#2563eb"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                />

                {/* Spline Line 2 (Middle light blue) */}
                <path
                  d="M 0,98 C 45,95 80,90 120,80 C 170,68 210,74 260,54 C 290,42 305,48 320,38"
                  fill="none"
                  stroke="#93c5fd"
                  strokeWidth="2"
                  strokeLinecap="round"
                />

                {/* Spline Line 3 (Bottom subtle line) */}
                <path
                  d="M 0,108 C 50,104 90,102 130,96 C 180,88 220,92 270,78 C 295,70 310,72 320,65"
                  fill="none"
                  stroke="#cbd5e1"
                  strokeWidth="1.5"
                  strokeDasharray="2 2"
                  strokeLinecap="round"
                />
              </svg>
            </div>

            {/* X-Axis Labels */}
            <div className="flex justify-between text-[10px] font-medium text-slate-400 pt-2 border-t border-slate-100 mt-1">
              <span>Jan</span>
              <span>Mar</span>
              <span>May</span>
              <span>Jul</span>
              <span>Sep</span>
              <span>Nov</span>
            </div>
          </motion.div>

          {/* Overlaid Card: Circular Concentric Progress Ring */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8, x: 20, y: 20 }}
            animate={{ opacity: 1, scale: 1, x: 0, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2, ease: 'easeOut' }}
            className="absolute -bottom-8 -right-4 sm:-right-6 w-44 bg-white text-slate-900 border border-slate-100 rounded-2xl p-4 shadow-2xl z-20"
          >
            <div className="relative w-28 h-28 mx-auto flex items-center justify-center">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                {/* Track background */}
                <circle cx="18" cy="18" r="14" fill="transparent" stroke="#f1f5f9" strokeWidth="3.5" />
                {/* Outer Ring - Royal Blue */}
                <circle
                  cx="18"
                  cy="18"
                  r="14"
                  fill="transparent"
                  stroke="#2563eb"
                  strokeWidth="3.5"
                  strokeDasharray="88 100"
                  strokeLinecap="round"
                />
                {/* Middle Ring - Indigo */}
                <circle
                  cx="18"
                  cy="18"
                  r="10.5"
                  fill="transparent"
                  stroke="#818cf8"
                  strokeWidth="2.5"
                  strokeDasharray="72 100"
                  strokeLinecap="round"
                />
                {/* Inner Ring - Sky Blue */}
                <circle
                  cx="18"
                  cy="18"
                  r="7.5"
                  fill="transparent"
                  stroke="#38bdf8"
                  strokeWidth="2"
                  strokeDasharray="60 100"
                  strokeLinecap="round"
                />
              </svg>

              {/* Center Counter */}
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center leading-tight">
                <span className="text-[9px] uppercase tracking-wider font-bold text-slate-500">
                  {slide.metricTitle}
                </span>
                <span className="text-sm font-black text-slate-900">
                  {slide.metricValue}
                </span>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Bottom: Carousel Text & Pagination Controls */}
      <div className="relative z-10 space-y-4 pt-6 max-w-[460px] mx-auto w-full">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentSlide}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.25 }}
            className="space-y-1.5"
          >
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
              {slide.title}
            </h2>
            <p className="text-xs sm:text-sm text-blue-100 leading-relaxed">
              {slide.desc}
            </p>
          </motion.div>
        </AnimatePresence>

        {/* Carousel Dots + Arrows */}
        <div className="flex items-center justify-between pt-2">
          <div className="flex items-center gap-2">
            {SLIDES.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentSlide(idx)}
                aria-label={`Slide ${idx + 1}`}
                className={`h-2 rounded-full transition-all cursor-pointer ${
                  currentSlide === idx
                    ? 'w-6 bg-white'
                    : 'w-2 bg-white/40 hover:bg-white/60'
                }`}
              />
            ))}
          </div>

          <div className="flex items-center gap-1.5 text-white">
            <button
              onClick={prevSlide}
              aria-label="Previous slide"
              className="w-8 h-8 rounded-full border border-white/30 hover:bg-white/20 flex items-center justify-center transition-colors cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={nextSlide}
              aria-label="Next slide"
              className="w-8 h-8 rounded-full border border-white/30 hover:bg-white/20 flex items-center justify-center transition-colors cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Footer Copyright */}
        <div className="pt-4 border-t border-white/20 text-[11px] text-blue-100/70">
          <span>&copy; {new Date().getFullYear()} AAA Data Solutions &bull; An Active Telephones Company</span>
        </div>
      </div>
    </section>
  );
};
