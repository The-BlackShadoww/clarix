"use client";

import React from "react";
import Link from "next/link";
import { ArrowRight, Activity, Users, Settings } from "lucide-react";
import { motion, useMotionValue, useTransform } from "framer-motion";

export default function LandingPage() {
  const ax = useMotionValue(0); const ay = useMotionValue(0);
  const bx = useMotionValue(0); const by = useMotionValue(0);
  const cx = useMotionValue(0); const cy = useMotionValue(0);
  const dx = useMotionValue(0); const dy = useMotionValue(0);
  const ex = useMotionValue(0); const ey = useMotionValue(0);
  const fx = useMotionValue(0); const fy = useMotionValue(0);

  const useDynamicPath = (n1x: any, n1y: any, n2x: any, n2y: any, startX: number, startY: number, endX: number, endY: number, qX: number, qY: number) => {
    return useTransform(() => {
      const dx1 = n1x.get();
      const dy1 = n1y.get();
      const dx2 = n2x.get();
      const dy2 = n2y.get();

      const sx = startX + dx1;
      const sy = startY + dy1;
      const end_x = endX + dx2;
      const end_y = endY + dy2;
      
      const origMidX = startX + (endX - startX) / 2;
      const origMidY = startY + (endY - startY) / 2;
      const qOffsetX = qX - origMidX;
      const qOffsetY = qY - origMidY;
      
      const newMidX = sx + (end_x - sx) / 2;
      const newMidY = sy + (end_y - sy) / 2;

      return `M ${sx} ${sy} Q ${newMidX + qOffsetX} ${newMidY + qOffsetY} ${end_x} ${end_y}`;
    });
  };

  const pathA_B = useDynamicPath(ax, ay, bx, by, 400, 400, 200, 250, 250, 300);
  const pathA_C = useDynamicPath(ax, ay, cx, cy, 400, 400, 650, 200, 600, 350);
  const pathA_D = useDynamicPath(ax, ay, dx, dy, 400, 400, 500, 650, 550, 550);
  const pathA_E = useDynamicPath(ax, ay, ex, ey, 400, 400, 150, 450, 200, 500);
  const pathC_F = useDynamicPath(cx, cy, fx, fy, 650, 200, 700, 450, 750, 300);

  const useLabelOffset = (n1v: any, n2v: any) => {
    return useTransform(() => (n1v.get() + n2v.get()) / 2);
  };

  const labelAB_x = useLabelOffset(ax, bx);
  const labelAB_y = useLabelOffset(ay, by);
  const labelAC_x = useLabelOffset(ax, cx);
  const labelAC_y = useLabelOffset(ay, cy);
  const labelAD_x = useLabelOffset(ax, dx);
  const labelAD_y = useLabelOffset(ay, dy);

  return (
    <div className="min-h-screen bg-white text-[#1c1c1e] font-sans selection:bg-[#5b76fe] selection:text-white">
      {/* Navigation */}
      <nav className="flex items-center justify-between px-8 py-6 max-w-7xl mx-auto">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-[#5b76fe] flex items-center justify-center">
             <Activity className="w-5 h-5 text-white" />
          </div>
          <span className="font-semibold tracking-[-0.36px] text-xl">Clarix</span>
        </div>
        <div className="flex items-center gap-6 text-[#555a6a] font-medium text-[16px]">
          <Link href="#features" className="hover:text-[#1c1c1e] transition-colors">Features</Link>
          <Link href="#how-it-works" className="hover:text-[#1c1c1e] transition-colors">How it works</Link>
          <Link 
            href="/canvas" 
            className="px-5 py-2.5 bg-[#f5f6f8] hover:bg-[#e0e2e8] text-[#1c1c1e] rounded-[8px] transition-colors ring-shadow"
          >
            Log in
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="max-w-7xl mx-auto px-8 pt-20 pb-32 flex flex-col lg:flex-row items-center gap-16">
        
        {/* Left: Text Content */}
        <div className="flex-1 space-y-8 z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#f5f6f8] text-[#555a6a] text-[14px] font-medium ring-shadow">
            <span className="w-2 h-2 rounded-full bg-[#00b473]"></span>
            Now available in public tracking
          </div>
          <h1 className="text-[56px] leading-[1.15] font-medium tracking-[-1.68px] text-[#1c1c1e] lg:max-w-[600px]">
            Visualize connections that spark new ideas.
          </h1>
          <p className="text-[22px] leading-[1.35] tracking-[-0.44px] text-[#555a6a] lg:max-w-[540px]">
            The intuitive relation builder for structuring networks, family trees, and complex organizational webs on a seamless infinite canvas.
          </p>
          <div className="flex items-center gap-4 pt-4">
            <Link 
              href="/canvas"
              className="inline-flex flex-row items-center justify-center gap-2 bg-[#5b76fe] hover:bg-[#2a41b6] text-white px-8 py-4 rounded-[8px] font-bold text-[17.5px] tracking-[0.175px] leading-[1.29] transition-all duration-300 shadow-[0_8px_24px_rgba(91,118,254,0.25)] hover:shadow-[0_12px_32px_rgba(91,118,254,0.35)] hover:-translate-y-0.5"
            >
              Get Started Free <ArrowRight className="w-5 h-5" />
            </Link>
            <span className="text-[14px] text-[#a5a8b5] font-medium hidden sm:inline-block">No credit card required</span>
          </div>
        </div>

        {/* Right: Animated SVG Illustration */}
        <div className="flex-1 relative w-full aspect-square max-w-[600px] lg:max-w-none translate-x-4 lg:translate-x-12">
          {/* Subtle background glow */}
          <div className="absolute inset-0 bg-[#fde0f0]/30 rounded-full blur-[100px] transform -translate-x-10 translate-y-10"></div>
          <div className="absolute inset-0 bg-[#c3faf5]/30 rounded-full blur-[100px] transform translate-x-20 -translate-y-10"></div>

          <svg viewBox="0 0 800 800" className="w-full h-full drop-shadow-xl overflow-visible">
            <defs>
              <filter id="shadow" x="-50%" y="-50%" width="200%" height="200%">
                <feDropShadow dx="0" dy="16" stdDeviation="40" floodColor="#1c1c1e" floodOpacity="0.08"/>
                <feDropShadow dx="0" dy="2" stdDeviation="8" floodColor="#1c1c1e" floodOpacity="0.04"/>
              </filter>
            </defs>

            {/* Connecting Lines */}
            <g stroke="#c7cad5" strokeWidth="3" fill="none" strokeDasharray="8 6" strokeLinecap="round">
              <motion.path d={pathA_B}>
                <animate attributeName="stroke-dashoffset" values="14;0" dur="1s" repeatCount="indefinite" />
              </motion.path>
              <motion.path d={pathA_C}>
                <animate attributeName="stroke-dashoffset" values="0;14" dur="1.2s" repeatCount="indefinite" />
              </motion.path>
              <motion.path d={pathA_D}>
                <animate attributeName="stroke-dashoffset" values="14;0" dur="1.5s" repeatCount="indefinite" />
              </motion.path>
              <motion.path d={pathA_E}>
                <animate attributeName="stroke-dashoffset" values="0;14" dur="0.8s" repeatCount="indefinite" />
              </motion.path>
              <motion.path d={pathC_F}>
                <animate attributeName="stroke-dashoffset" values="14;0" dur="2s" repeatCount="indefinite" />
              </motion.path>
            </g>

            {/* Labels on paths */}
            <g fontSize="14" fontWeight="600" fill="#555a6a" textAnchor="middle" transform="translate(0, -10)">
              <motion.g style={{ x: labelAB_x, y: labelAB_y }}>
                <rect x="250" y="310" width="70" height="28" rx="8" fill="white" stroke="#e0e2e8"/>
                <text x="285" y="329">manages</text>
              </motion.g>

              <motion.g style={{ x: labelAC_x, y: labelAC_y }}>
                <rect x="500" y="340" width="60" height="28" rx="8" fill="white" stroke="#e0e2e8"/>
                <text x="530" y="359">reports</text>
              </motion.g>

              <motion.g style={{ x: labelAD_x, y: labelAD_y }}>
                <rect x="420" y="520" width="60" height="28" rx="8" fill="white" stroke="#e0e2e8"/>
                <text x="450" y="539">sibling</text>
              </motion.g>
            </g>

            {/* Central Node */}
            <motion.g drag dragSnapToOrigin style={{ cursor: "grab", x: ax, y: ay }} whileTap={{ cursor: "grabbing" }}>
              <g transform="translate(400, 400)" filter="url(#shadow)">
                <circle r="64" fill="#ffffff" stroke="#e0e2e8" strokeWidth="2"/>
                <circle r="56" fill="#ffc6c6" />
                <text y="8" fontSize="32" fontWeight="700" fill="#1c1c1e" textAnchor="middle">A</text>
                <animateTransform attributeName="transform" type="translate" values="400,400; 400,385; 400,400" dur="4s" repeatCount="indefinite" />
                
                <rect x="-40" y="80" width="80" height="24" rx="12" fill="white" stroke="#e0e2e8"/>
                <text y="96" fontSize="12" fontWeight="600" fill="#1c1c1e" textAnchor="middle">Alice</text>
              </g>
            </motion.g>

            {/* Node 2 (Top Left) */}
            <motion.g drag dragSnapToOrigin style={{ cursor: "grab", x: bx, y: by }} whileTap={{ cursor: "grabbing" }}>
              <g transform="translate(200, 250)" filter="url(#shadow)">
                <circle r="48" fill="#ffffff" stroke="#e0e2e8" strokeWidth="2"/>
                <circle r="42" fill="#c3faf5" />
                <text y="6" fontSize="24" fontWeight="700" fill="#1c1c1e" textAnchor="middle">B</text>
                <animateTransform attributeName="transform" type="translate" values="200,250; 190,260; 200,250" dur="5s" repeatCount="indefinite" />
                
                <rect x="-35" y="60" width="70" height="24" rx="12" fill="white" stroke="#e0e2e8"/>
                <text y="76" fontSize="12" fontWeight="600" fill="#1c1c1e" textAnchor="middle">Bob</text>
              </g>
            </motion.g>

            {/* Node 3 (Top Right) */}
            <motion.g drag dragSnapToOrigin style={{ cursor: "grab", x: cx, y: cy }} whileTap={{ cursor: "grabbing" }}>
              <g transform="translate(650, 200)" filter="url(#shadow)">
                <circle r="56" fill="#ffffff" stroke="#e0e2e8" strokeWidth="2"/>
                <circle r="48" fill="#ffe6cd" />
                <text y="8" fontSize="28" fontWeight="700" fill="#1c1c1e" textAnchor="middle">C</text>
                <animateTransform attributeName="transform" type="translate" values="650,200; 660,190; 650,200" dur="4.5s" repeatCount="indefinite" />
                
                <rect x="-45" y="70" width="90" height="24" rx="12" fill="white" stroke="#e0e2e8"/>
                <text y="86" fontSize="12" fontWeight="600" fill="#1c1c1e" textAnchor="middle">Charlie</text>
              </g>
            </motion.g>

            {/* Node 4 (Bottom Right) */}
            <motion.g drag dragSnapToOrigin style={{ cursor: "grab", x: dx, y: dy }} whileTap={{ cursor: "grabbing" }}>
              <g transform="translate(500, 650)" filter="url(#shadow)">
                <circle r="44" fill="#ffffff" stroke="#e0e2e8" strokeWidth="2"/>
                <circle r="38" fill="#ffd8f4" />
                <text y="6" fontSize="22" fontWeight="700" fill="#1c1c1e" textAnchor="middle">D</text>
                <animateTransform attributeName="transform" type="translate" values="500,650; 500,665; 500,650" dur="3.8s" repeatCount="indefinite" />
                
                <rect x="-40" y="55" width="80" height="24" rx="12" fill="white" stroke="#e0e2e8"/>
                <text y="71" fontSize="12" fontWeight="600" fill="#1c1c1e" textAnchor="middle">Diana</text>
              </g>
            </motion.g>

            {/* Node 5 (Mid Left) */}
            <motion.g drag dragSnapToOrigin style={{ cursor: "grab", x: ex, y: ey }} whileTap={{ cursor: "grabbing" }}>
              <g transform="translate(150, 450)" filter="url(#shadow)">
                <circle r="40" fill="#ffffff" stroke="#e0e2e8" strokeWidth="2"/>
                <circle r="34" fill="#d4e4ff" />
                <text y="5" fontSize="20" fontWeight="700" fill="#1c1c1e" textAnchor="middle">E</text>
                <animateTransform attributeName="transform" type="translate" values="150,450; 165,440; 150,450" dur="6s" repeatCount="indefinite" />
                
                <rect x="-35" y="52" width="70" height="24" rx="12" fill="white" stroke="#e0e2e8"/>
                <text y="68" fontSize="12" fontWeight="600" fill="#1c1c1e" textAnchor="middle">Eve</text>
              </g>
            </motion.g>
            
            {/* Node 6 (Far Right) */}
            <motion.g drag dragSnapToOrigin style={{ cursor: "grab", x: fx, y: fy }} whileTap={{ cursor: "grabbing" }}>
              <g transform="translate(700, 450)" filter="url(#shadow)">
                <circle r="36" fill="#ffffff" stroke="#e0e2e8" strokeWidth="2"/>
                <circle r="30" fill="#e0f5d0" />
                <text y="5" fontSize="18" fontWeight="700" fill="#1c1c1e" textAnchor="middle">F</text>
                <animateTransform attributeName="transform" type="translate" values="700,450; 690,460; 700,450" dur="5.5s" repeatCount="indefinite" />
              </g>
            </motion.g>
          </svg>
        </div>
      </main>

      {/* Feature highlight section */}
      <section className="border-t border-[#e0e2e8] bg-[#f5f6f8]/50 overflow-hidden">
        <div className="max-w-7xl mx-auto px-8 py-24">
          <div className="text-center mb-16">
            <h2 className="text-[48px] leading-[1.15] font-medium tracking-[-1.44px] text-[#1c1c1e]">
              Everything you need to organize.
            </h2>
            <p className="mt-4 text-[22px] text-[#555a6a] tracking-[-0.44px] lg:max-w-2xl mx-auto">
              Visual collaboration powered by an intuitive toolkit for structuring people and ideas precisely how they relate in reality.
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white p-8 rounded-[24px] ring-shadow hover:-translate-y-1 transition-transform duration-300">
              <div className="w-14 h-14 rounded-[12px] bg-[#fde0f0] flex items-center justify-center mb-6">
                 <Activity className="w-6 h-6 text-[#1c1c1e]" />
              </div>
              <h3 className="text-[24px] font-medium tracking-[-0.72px] mb-3">Live Infinite Canvas</h3>
              <p className="text-[16px] text-[#555a6a] leading-relaxed">
                Pan, zoom, and expand without limits. The visual workspace adapts and expands dynamically as your network grows.
              </p>
            </div>
            <div className="bg-white p-8 rounded-[24px] ring-shadow hover:-translate-y-1 transition-transform duration-300">
              <div className="w-14 h-14 rounded-[12px] bg-[#c3faf5] flex items-center justify-center mb-6">
                 <Users className="w-6 h-6 text-[#1c1c1e]" />
              </div>
              <h3 className="text-[24px] font-medium tracking-[-0.72px] mb-3">Dynamic Entities</h3>
              <p className="text-[16px] text-[#555a6a] leading-relaxed">
                Connect and arrange items with smart routing lines, dynamic colors, and rich contextual tooltips to show intricate relationships perfectly.
              </p>
            </div>
            <div className="bg-white p-8 rounded-[24px] ring-shadow hover:-translate-y-1 transition-transform duration-300">
              <div className="w-14 h-14 rounded-[12px] bg-[#ffe6cd] flex items-center justify-center mb-6">
                 <Settings className="w-6 h-6 text-[#1c1c1e]" />
              </div>
              <h3 className="text-[24px] font-medium tracking-[-0.72px] mb-3">Real-time Layout Engine</h3>
              <p className="text-[16px] text-[#555a6a] leading-relaxed">
                Effortlessly draw complex connections between nodes. Interactive lines bend automatically to prevent visual clutter.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-32 px-8 text-center max-w-4xl mx-auto">
        <h2 className="text-[48px] leading-[1.15] font-medium tracking-[-1.44px] text-[#1c1c1e] mb-6">
          Ready to untangle the complexity?
        </h2>
        <Link 
          href="/canvas"
          className="inline-flex flex-row items-center justify-center gap-2 bg-[#5b76fe] hover:bg-[#2a41b6] text-white px-8 py-4 rounded-[8px] font-bold text-[17.5px] tracking-[0.175px] transition-colors shadow-[0_8px_24px_rgba(91,118,254,0.25)]"
        >
          Open Relation Builder
        </Link>
      </section>
    </div>
  );
}
