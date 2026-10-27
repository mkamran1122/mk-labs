import React, { useState } from 'react';
import { SITE_CONFIG } from '../config/siteConfig';
import { Check, ChevronRight, Sparkles } from 'lucide-react';

export const HowWeBuild: React.FC = () => {
  const [activeStep, setActiveStep] = useState(0);

  const stages = SITE_CONFIG.processStages;

  return (
    <section id="process" className="relative py-28 border-t border-[#1E2638] bg-[#0D1118]/60 z-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="max-w-2xl space-y-4">
          <div className="flex items-center gap-2 text-xs font-mono tracking-widest text-[#4D8DFF] uppercase font-semibold">
            <span>03 / OUR PROCESS</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-[#F5F7FA]">
            From Curiosity to Something Real.
          </h2>
          <p className="text-base sm:text-lg text-[#9AA6B5] leading-relaxed">
            Every project begins with a question, an idea, or a problem worth exploring. Our
            process is dynamic and iterative rather than rigid assembly.
          </p>
        </div>

        {/* Process Flow Interactive Timeline */}
        <div className="mt-16">
          {/* Desktop Timeline Bar & Nodes */}
          <div className="hidden lg:block relative mb-12">
            {/* Background connecting rail */}
            <div className="absolute top-1/2 left-0 right-0 h-[2px] bg-[#1E2638] -translate-y-1/2 z-0" />
            {/* Active connecting rail */}
            <div
              className="absolute top-1/2 left-0 h-[2px] bg-gradient-to-r from-[#4D8DFF] to-[#55F2E3] -translate-y-1/2 z-0 transition-all duration-500"
              style={{ width: `${(activeStep / (stages.length - 1)) * 100}%` }}
            />

            <div className="relative z-10 grid grid-cols-4 gap-4">
              {stages.map((stage, idx) => {
                const isActive = activeStep === idx;
                const isPast = activeStep > idx;

                return (
                  <button
                    key={stage.step}
                    onClick={() => setActiveStep(idx)}
                    className="flex flex-col items-center text-center group cursor-pointer focus:outline-none"
                    aria-label={`Go to stage ${stage.step}: ${stage.title}`}
                  >
                    <div
                      className={`w-12 h-12 rounded-full flex items-center justify-center font-mono font-bold text-sm transition-all duration-300 border-2 ${
                        isActive
                          ? 'border-[#55F2E3] bg-[#07090D] text-[#55F2E3] shadow-[0_0_20px_rgba(85,242,227,0.4)] scale-110'
                          : isPast
                          ? 'border-[#4D8DFF] bg-[#4D8DFF] text-white'
                          : 'border-[#1E2638] bg-[#07090D] text-[#9AA6B5] group-hover:border-[#4D8DFF]'
                      }`}
                    >
                      {isPast ? <Check className="w-5 h-5" /> : stage.step}
                    </div>

                    <span
                      className={`mt-3 font-semibold text-sm transition-colors ${
                        isActive ? 'text-[#F5F7FA]' : 'text-[#9AA6B5] group-hover:text-[#F5F7FA]'
                      }`}
                    >
                      Stage {stage.step} — {stage.title}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Active Stage Detailed Spotlight (Desktop & Mobile) */}
          <div className="rounded-2xl border border-[#1E2638] bg-[#07090D] p-6 sm:p-10 shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-96 h-96 bg-[#4D8DFF]/5 rounded-full blur-3xl pointer-events-none" />

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              <div className="lg:col-span-8 space-y-4">
                <div className="flex items-center gap-3">
                  <span className="font-mono text-xs uppercase px-2.5 py-1 rounded bg-[#4D8DFF]/10 text-[#4D8DFF] font-semibold border border-[#4D8DFF]/30">
                    STAGE {stages[activeStep].step}
                  </span>
                  <span className="font-mono text-xs text-[#9AA6B5]">PRACTICE ARCHITECTURE</span>
                </div>

                <h3 className="text-3xl font-bold text-[#F5F7FA] tracking-tight">
                  {stages[activeStep].title}
                </h3>

                <p className="text-base sm:text-lg text-[#9AA6B5] leading-relaxed">
                  {stages[activeStep].description}
                </p>

                <div className="pt-4 flex items-center gap-2 text-xs font-mono text-[#55F2E3]">
                  <Sparkles className="w-4 h-4 text-[#55F2E3]" />
                  <span>OUTPUT: {stages[activeStep].deliverable}</span>
                </div>
              </div>

              {/* Navigation controls for timeline */}
              <div className="lg:col-span-4 flex flex-col sm:flex-row lg:flex-col gap-3 justify-end">
                <div className="flex items-center gap-2">
                  {stages.map((_, idx) => (
                    <button
                      key={idx}
                      onClick={() => setActiveStep(idx)}
                      className={`h-2 flex-1 rounded-full transition-all cursor-pointer ${
                        activeStep === idx ? 'bg-[#4D8DFF] w-8' : 'bg-[#1E2638] hover:bg-[#9AA6B5]'
                      }`}
                      aria-label={`Jump to stage ${idx + 1}`}
                    />
                  ))}
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <button
                    disabled={activeStep === 0}
                    onClick={() => setActiveStep((prev) => Math.max(0, prev - 1))}
                    className="flex-1 py-2 px-3 rounded-lg border border-[#1E2638] text-xs font-mono text-[#9AA6B5] hover:text-[#F5F7FA] hover:border-[#4D8DFF] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  >
                    ← Previous
                  </button>
                  <button
                    disabled={activeStep === stages.length - 1}
                    onClick={() => setActiveStep((prev) => Math.min(stages.length - 1, prev + 1))}
                    className="flex-1 py-2 px-3 rounded-lg bg-[#0D1118] border border-[#1E2638] text-xs font-mono text-[#F5F7FA] hover:border-[#4D8DFF] disabled:opacity-30 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-1"
                  >
                    <span>Next</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Mobile Vertical Timeline (Accessible fallback list) */}
          <div className="lg:hidden mt-8 space-y-4">
            <span className="text-xs font-mono text-[#9AA6B5] uppercase tracking-wider block">
              All Stages at a Glance:
            </span>
            <div className="space-y-3">
              {stages.map((stage, idx) => (
                <div
                  key={stage.step}
                  onClick={() => setActiveStep(idx)}
                  className={`p-4 rounded-xl border transition-colors cursor-pointer ${
                    activeStep === idx
                      ? 'border-[#4D8DFF] bg-[#0D1118]'
                      : 'border-[#1E2638] bg-[#07090D]'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-mono text-xs text-[#4D8DFF] font-semibold">
                      {stage.step}. {stage.title}
                    </span>
                    {activeStep === idx && (
                      <span className="w-1.5 h-1.5 rounded-full bg-[#55F2E3]" />
                    )}
                  </div>
                  <p className="text-xs text-[#9AA6B5]">{stage.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
