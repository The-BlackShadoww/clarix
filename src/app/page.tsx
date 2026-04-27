"use client";

import React from "react";
import Link from "next/link";
import { ArrowRight, Activity, Users, Settings } from "lucide-react";
import { HeroGraphic } from "@/components/features/landing/HeroGraphic";

/**
 * The public-facing landing page route (`/`).
 * Displays marketing copy, feature highlights, and the interactive HeroGraphic.
 */
export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white text-[#1c1c1e] font-sans selection:bg-[#5b76fe] selection:text-white">
      {/* Navigation */}
      <nav className="flex items-center justify-between px-8 py-6 max-w-7xl mx-auto">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-[#5b76fe] flex items-center justify-center">
            <Activity className="w-5 h-5 text-white" />
          </div>
          <span className="font-semibold tracking-[-0.36px] text-xl">
            Clarix
          </span>
        </div>
        <div className="flex items-center gap-6 text-[#555a6a] font-medium text-[16px]">
          <Link
            href="#features"
            className="hover:text-[#1c1c1e] transition-colors"
          >
            Features
          </Link>
          <Link
            href="#how-it-works"
            className="hover:text-[#1c1c1e] transition-colors"
          >
            How it works
          </Link>
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
            The intuitive relation builder for structuring networks, family
            trees, and complex organizational webs on a seamless infinite
            canvas.
          </p>
          <div className="flex items-center gap-4 pt-4">
            <Link
              href="/canvas"
              className="inline-flex flex-row items-center justify-center gap-2 bg-[#5b76fe] hover:bg-[#2a41b6] text-white px-8 py-4 rounded-[8px] font-bold text-[17.5px] tracking-[0.175px] leading-[1.29] transition-all duration-300 shadow-[0_8px_24px_rgba(91,118,254,0.25)] hover:shadow-[0_12px_32px_rgba(91,118,254,0.35)] hover:-translate-y-0.5"
            >
              Get Started Free <ArrowRight className="w-5 h-5" />
            </Link>
            <span className="text-[14px] text-[#a5a8b5] font-medium hidden sm:inline-block">
              No credit card required
            </span>
          </div>
        </div>

        {/* Right: Animated SVG Illustration */}
        <HeroGraphic />
      </main>

      {/* Feature highlight section */}
      <section className="border-t border-[#e0e2e8] bg-[#f5f6f8]/50 overflow-hidden">
        <div className="max-w-7xl mx-auto px-8 py-24">
          <div className="text-center mb-16">
            <h2 className="text-[48px] leading-[1.15] font-medium tracking-[-1.44px] text-[#1c1c1e]">
              Everything you need to organize.
            </h2>
            <p className="mt-4 text-[22px] text-[#555a6a] tracking-[-0.44px] lg:max-w-2xl mx-auto">
              Visual collaboration powered by an intuitive toolkit for
              structuring people and ideas precisely how they relate in reality.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white p-8 rounded-[24px] ring-shadow hover:-translate-y-1 transition-transform duration-300">
              <div className="w-14 h-14 rounded-[12px] bg-[#fde0f0] flex items-center justify-center mb-6">
                <Activity className="w-6 h-6 text-[#1c1c1e]" />
              </div>
              <h3 className="text-[24px] font-medium tracking-[-0.72px] mb-3">
                Live Infinite Canvas
              </h3>
              <p className="text-[16px] text-[#555a6a] leading-relaxed">
                Pan, zoom, and expand without limits. The visual workspace
                adapts and expands dynamically as your network grows.
              </p>
            </div>
            <div className="bg-white p-8 rounded-[24px] ring-shadow hover:-translate-y-1 transition-transform duration-300">
              <div className="w-14 h-14 rounded-[12px] bg-[#c3faf5] flex items-center justify-center mb-6">
                <Users className="w-6 h-6 text-[#1c1c1e]" />
              </div>
              <h3 className="text-[24px] font-medium tracking-[-0.72px] mb-3">
                Dynamic Entities
              </h3>
              <p className="text-[16px] text-[#555a6a] leading-relaxed">
                Connect and arrange items with smart routing lines, dynamic
                colors, and rich contextual tooltips to show intricate
                relationships perfectly.
              </p>
            </div>
            <div className="bg-white p-8 rounded-[24px] ring-shadow hover:-translate-y-1 transition-transform duration-300">
              <div className="w-14 h-14 rounded-[12px] bg-[#ffe6cd] flex items-center justify-center mb-6">
                <Settings className="w-6 h-6 text-[#1c1c1e]" />
              </div>
              <h3 className="text-[24px] font-medium tracking-[-0.72px] mb-3">
                Real-time Layout Engine
              </h3>
              <p className="text-[16px] text-[#555a6a] leading-relaxed">
                Effortlessly draw complex connections between nodes. Interactive
                lines bend automatically to prevent visual clutter.
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
