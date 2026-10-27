import React, { useState } from 'react';
import { SITE_CONFIG, ExperimentItem } from '../config/siteConfig';
import { Beaker, Cpu, Terminal, ArrowRight, Activity, Network, Sliders } from 'lucide-react';

export const ExperimentsZone: React.FC = () => {
  const [selectedExp, setSelectedExp] = useState<ExperimentItem>(SITE_CONFIG.experiments[0]);
  const [simDensity, setSimDensity] = useState(24);
  const [simPulseSpeed, setSimPulseSpeed] = useState(1.5);

  return (
    <section id="experiments" className="relative py-28 border-t border-[#1E2638] bg-[#07090D] z-20 overflow-hidden">
      {/* Background ambient grid with lab glow */}
      <div className="absolute inset-0 lab-grid opacity-20 pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Section Header */}
        <div className="max-w-3xl space-y-4">
          <div className="flex items-center gap-2 text-xs font-mono tracking-widest text-[#55F2E3] uppercase font-semibold">
            <span>04 / EXPERIMENTAL ZONE</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-[#F5F7FA]">
            Not Every Idea Starts With an Answer.
          </h2>
          <p className="text-base sm:text-lg text-[#9AA6B5] leading-relaxed">
            Some ideas become useful tools. Others teach us something new. This is where we
            explore concepts, test possibilities, and discover what the internet can become.
          </p>
        </div>

        {/* Studio Experimental Lab Sandbox & Log */}
        <div className="mt-16 grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Column: Configurable Experiments List */}
          <div className="lg:col-span-5 space-y-4">
            <span className="text-xs font-mono text-[#9AA6B5] uppercase tracking-wider block">
              Exploratory Log & Prototypes:
            </span>

            <div className="space-y-3">
              {SITE_CONFIG.experiments.map((exp) => {
                const isSelected = selectedExp.id === exp.id;

                return (
                  <div
                    key={exp.id}
                    onClick={() => setSelectedExp(exp)}
                    tabIndex={0}
                    role="button"
                    aria-pressed={isSelected}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        setSelectedExp(exp);
                      }
                    }}
                    className={`p-5 rounded-xl border transition-all duration-200 cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-[#55F2E3] ${
                      isSelected
                        ? 'border-[#55F2E3] bg-[#0D1118] shadow-[0_0_25px_rgba(85,242,227,0.12)]'
                        : 'border-[#1E2638] bg-[#07090D] hover:border-[#1E2638]/90 hover:bg-[#0D1118]/50'
                    }`}
                  >
                    <div className="flex items-center justify-between text-xs font-mono mb-2">
                      <span className="text-[#55F2E3] font-semibold">{exp.code}</span>
                      <span className="text-[#9AA6B5]">{exp.status}</span>
                    </div>

                    <h4 className="text-base font-bold text-[#F5F7FA] tracking-tight">
                      {exp.title}
                    </h4>

                    <p className="mt-2 text-xs text-[#9AA6B5] line-clamp-2">
                      {exp.explorationQuestion}
                    </p>

                    <div className="mt-3 pt-3 border-t border-[#1E2638]/60 flex items-center justify-between text-[11px] font-mono text-[#9AA6B5]">
                      <span>CATEGORY: {exp.category}</span>
                      <span className="text-[#4D8DFF] flex items-center gap-1">
                        <span>Inspect Hypothesis</span>
                        <ArrowRight className="w-3 h-3" />
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Column: Live Conceptual Sandbox Simulation */}
          <div className="lg:col-span-7 flex flex-col justify-between rounded-2xl border border-[#1E2638] bg-[#0D1118] p-6 sm:p-8 shadow-2xl relative">
            <div className="space-y-6">
              {/* Terminal-like status bar */}
              <div className="flex items-center justify-between pb-4 border-b border-[#1E2638]">
                <div className="flex items-center gap-2">
                  <Terminal className="w-4 h-4 text-[#55F2E3]" />
                  <span className="font-mono text-xs text-[#F5F7FA]">
                    CONCEPT SANDBOX // {selectedExp.code}
                  </span>
                </div>
                <div className="flex items-center gap-2 font-mono text-[11px] text-[#9AA6B5]">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#55F2E3]" />
                  <span>Interactive Node Field</span>
                </div>
              </div>

              {/* Experiment Focus Info */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-[11px] text-[#4D8DFF] uppercase bg-[#4D8DFF]/10 border border-[#4D8DFF]/30 px-2 py-0.5 rounded">
                    {selectedExp.category}
                  </span>
                  <span className="text-xs font-mono text-[#9AA6B5]">{selectedExp.title}</span>
                </div>
                <h3 className="text-xl sm:text-2xl font-bold text-[#F5F7FA]">
                  "{selectedExp.explorationQuestion}"
                </h3>
                <div className="p-3.5 rounded-lg bg-[#07090D] border border-[#1E2638] text-xs text-[#9AA6B5] leading-relaxed">
                  <span className="text-[#55F2E3] font-mono font-medium mr-1.5">OBSERVED LEARNING:</span>
                  {selectedExp.learnings}
                </div>
              </div>

              {/* Interactive Topological Canvas Simulation */}
              <div className="relative h-48 sm:h-56 rounded-xl border border-[#1E2638] bg-[#07090D] overflow-hidden flex items-center justify-center p-4">
                <div className="absolute inset-0 lab-grid opacity-40 pointer-events-none" />

                {/* Generative Interactive Coordinate Mesh */}
                <div className="relative w-full h-full flex items-center justify-center">
                  <svg
                    className="w-full h-full"
                    viewBox="0 0 400 200"
                    preserveAspectRatio="xMidYMid meet"
                  >
                    <defs>
                      <linearGradient id="expGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#4D8DFF" stopOpacity="0.8" />
                        <stop offset="100%" stopColor="#55F2E3" stopOpacity="0.8" />
                      </linearGradient>
                    </defs>

                    {/* Connecting constellation lines */}
                    {Array.from({ length: Math.min(simDensity, 20) }).map((_, i) => {
                      const x1 = 50 + (i * 28) % 300;
                      const y1 = 40 + ((i * 37) % 120);
                      const x2 = 80 + ((i * 43) % 280);
                      const y2 = 60 + ((i * 51) % 100);
                      return (
                        <line
                          key={i}
                          x1={x1}
                          y1={y1}
                          x2={x2}
                          y2={y2}
                          stroke="url(#expGrad)"
                          strokeWidth="0.8"
                          strokeOpacity="0.35"
                        />
                      );
                    })}

                    {/* Nodes */}
                    {Array.from({ length: simDensity }).map((_, i) => {
                      const cx = 40 + ((i * 31) % 320);
                      const cy = 30 + ((i * 47) % 140);
                      const isMain = i % 5 === 0;
                      return (
                        <g key={i}>
                          <circle
                            cx={cx}
                            cy={cy}
                            r={isMain ? 4 : 2}
                            fill={isMain ? '#55F2E3' : '#4D8DFF'}
                            opacity={isMain ? 0.9 : 0.6}
                          />
                          {isMain && (
                            <circle
                              cx={cx}
                              cy={cy}
                              r={8}
                              fill="none"
                              stroke="#55F2E3"
                              strokeWidth="0.5"
                              strokeDasharray="2,2"
                              opacity="0.4"
                            />
                          )}
                        </g>
                      );
                    })}
                  </svg>
                </div>

                <div className="absolute bottom-2 left-3 font-mono text-[10px] text-[#9AA6B5]/70">
                  TOPOLOGY // DENSITY: {simDensity} NODES
                </div>
              </div>
            </div>

            {/* Sandbox Simulation Sliders */}
            <div className="pt-6 border-t border-[#1E2638] space-y-4">
              <div className="flex items-center justify-between text-xs font-mono text-[#9AA6B5]">
                <div className="flex items-center gap-1.5">
                  <Sliders className="w-3.5 h-3.5 text-[#55F2E3]" />
                  <span>PROTOTYPE VARIABLES</span>
                </div>
                <span>LIVE ADJUSTMENT</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <div className="flex justify-between text-xs font-mono text-[#9AA6B5] mb-1">
                    <span>Node Density</span>
                    <span className="text-[#F5F7FA]">{simDensity}</span>
                  </div>
                  <input
                    type="range"
                    min="10"
                    max="40"
                    value={simDensity}
                    onChange={(e) => setSimDensity(Number(e.target.value))}
                    className="w-full accent-[#55F2E3] bg-[#07090D] h-1.5 rounded cursor-pointer"
                    aria-label="Adjust Node Density"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-xs font-mono text-[#9AA6B5] mb-1">
                    <span>Pulse Frequency</span>
                    <span className="text-[#F5F7FA]">{simPulseSpeed}x</span>
                  </div>
                  <input
                    type="range"
                    min="0.5"
                    max="3.0"
                    step="0.5"
                    value={simPulseSpeed}
                    onChange={(e) => setSimPulseSpeed(Number(e.target.value))}
                    className="w-full accent-[#4D8DFF] bg-[#07090D] h-1.5 rounded cursor-pointer"
                    aria-label="Adjust Pulse Frequency"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
