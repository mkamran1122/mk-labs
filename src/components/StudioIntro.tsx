import React, { useState } from 'react';
import { Lightbulb, FlaskConical, Hammer, Rocket, ArrowRight } from 'lucide-react';

export const StudioIntro: React.FC = () => {
  const [activeStage, setActiveStage] = useState<number | null>(0);

  const stages = [
    {
      title: 'Think',
      icon: Lightbulb,
      tag: '01. INTENT',
      color: 'border-[#4D8DFF] text-[#4D8DFF]',
      bgGlow: 'bg-[#4D8DFF]/10',
      short: 'Every initiative begins with an honest curiosity or a genuine browser friction point.',
      detail:
        'We look for practical internet needs that can be streamlined through browser-native tools, questioning how to eliminate bloat and friction.',
    },
    {
      title: 'Experiment',
      icon: FlaskConical,
      tag: '02. TESTING',
      color: 'border-[#55F2E3] text-[#55F2E3]',
      bgGlow: 'bg-[#55F2E3]/10',
      short: 'Testing technical feasibility through interactive prototypes and lightweight sandboxes.',
      detail:
        'Before committing full architectural resources, we prototype core mechanisms, measure browser limits, and evaluate user ergonomics.',
    },
    {
      title: 'Build',
      icon: Hammer,
      tag: '03. CRAFT',
      color: 'border-[#4D8DFF] text-[#4D8DFF]',
      bgGlow: 'bg-[#4D8DFF]/10',
      short: 'Constructing robust, accessible, high-performance web products.',
      detail:
        'We write clean, purposeful code that runs fast on everyday hardware, respecting user privacy, device battery, and web standards.',
    },
    {
      title: 'Launch',
      icon: Rocket,
      tag: '04. RELEASE',
      color: 'border-[#55F2E3] text-[#55F2E3]',
      bgGlow: 'bg-[#55F2E3]/10',
      short: 'Deploying openly to the internet for anyone to experience and use freely.',
      detail:
        'A launch is merely the beginning of the feedback loop. We observe real usage, fix quirks, and keep refining over time.',
    },
  ];

  return (
    <section id="about" className="relative py-28 border-t border-[#1E2638] bg-[#07090D]/90 z-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="max-w-3xl space-y-4">
          <div className="flex items-center gap-2 text-xs font-mono tracking-widest text-[#4D8DFF] uppercase font-semibold">
            <span>01 / THE STUDIO</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-[#F5F7FA]">
            A Small Studio for Big Internet Ideas.
          </h2>
          <div className="space-y-4 text-base sm:text-lg text-[#9AA6B5] leading-relaxed pt-2">
            <p>
              MK Labs is an independent internet projects studio focused on exploring ideas and
              building useful digital experiences.
            </p>
            <p>
              From practical browser-based tools to experimental web platforms, we turn concepts
              into things people can actually use. We believe the internet is a place to
              experiment, create, and make useful things available to more people.
            </p>
          </div>
        </div>

        {/* Supporting statement & Connected Illuminated Stages */}
        <div className="mt-16 pt-10 border-t border-[#1E2638]">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
            <div>
              <span className="font-mono text-xs uppercase tracking-wider text-[#9AA6B5] block">
                CORE CADENCE
              </span>
              <h3 className="text-2xl sm:text-3xl font-bold text-[#F5F7FA] tracking-tight mt-1">
                Think. Experiment. Build. Launch.
              </h3>
            </div>
            <p className="text-xs font-mono text-[#9AA6B5]">
              Hover or select a stage to explore our working rhythm
            </p>
          </div>

          {/* 4 Connected Illuminated Nodes */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 relative">
            {stages.map((stage, idx) => {
              const Icon = stage.icon;
              const isSelected = activeStage === idx;

              return (
                <div
                  key={stage.title}
                  onMouseEnter={() => setActiveStage(idx)}
                  onFocus={() => setActiveStage(idx)}
                  tabIndex={0}
                  className={`relative p-6 rounded-xl border transition-all duration-300 cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-[#4D8DFF] ${
                    isSelected
                      ? `bg-[#0D1118] border-[#4D8DFF] shadow-[0_0_30px_rgba(77,141,255,0.15)]`
                      : 'bg-[#07090D] border-[#1E2638] hover:border-[#1E2638] hover:bg-[#0D1118]/60'
                  }`}
                  role="button"
                  aria-pressed={isSelected}
                  aria-label={`Stage ${idx + 1}: ${stage.title}`}
                >
                  {/* Top Node Indicator & Number */}
                  <div className="flex items-center justify-between mb-4">
                    <span className="font-mono text-xs font-medium text-[#9AA6B5]">{stage.tag}</span>
                    <div
                      className={`w-9 h-9 rounded-lg flex items-center justify-center border transition-all ${
                        isSelected
                          ? `${stage.color} ${stage.bgGlow}`
                          : 'border-[#1E2638] text-[#9AA6B5] bg-[#07090D]'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                    </div>
                  </div>

                  <h4 className="text-xl font-bold text-[#F5F7FA] tracking-tight">{stage.title}</h4>
                  <p className="mt-2 text-sm text-[#9AA6B5] leading-normal">{stage.short}</p>

                  {/* Detailed explanation revealed when active */}
                  <div
                    className={`mt-4 pt-3 border-t border-[#1E2638] text-xs text-[#F5F7FA]/90 transition-all duration-300 ${
                      isSelected ? 'opacity-100 max-h-32' : 'opacity-40 max-h-20'
                    }`}
                  >
                    {stage.detail}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
};
