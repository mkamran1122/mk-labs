import React, { useState } from 'react';
import { ArrowUpRight, CheckCircle2, Eye, Layers, Maximize2, MessageSquare, Sparkles } from 'lucide-react';
import { SITE_CONFIG, ProjectItem } from '../config/siteConfig';

interface ProjectUniverseProps {
  activeProjectId?: string | null;
  onSelectProject: (id: string) => void;
}

export const ProjectUniverse: React.FC<ProjectUniverseProps> = ({
  activeProjectId,
  onSelectProject,
}) => {
  const [inspectedProject, setInspectedProject] = useState<ProjectItem | null>(null);

  return (
    <section id="projects" className="relative py-28 border-t border-[#1E2638] bg-[#07090D] z-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="max-w-2xl space-y-4">
            <div className="flex items-center gap-2 text-xs font-mono tracking-widest text-[#4D8DFF] uppercase font-semibold">
              <span>02 / PROJECT UNIVERSE</span>
            </div>
            <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-[#F5F7FA]">
              Things We've Put Into the Internet.
            </h2>
            <p className="text-base sm:text-lg text-[#9AA6B5] leading-relaxed">
              A growing collection of tools, platforms, and digital experiments built to solve
              practical problems and explore new possibilities.
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs font-mono text-[#9AA6B5] bg-[#0D1118] border border-[#1E2638] px-3 py-2 rounded-lg">
            <span className="w-2 h-2 rounded-full bg-[#4D8DFF]" />
            <span>Select any project to align the 3D lab focus</span>
          </div>
        </div>

        {/* 3 Projects Showcase Cards */}
        <div className="mt-16 grid grid-cols-1 lg:grid-cols-3 gap-8">
          {SITE_CONFIG.projects.map((project) => {
            const isActive = activeProjectId === project.id;

            return (
              <div
                key={project.id}
                onMouseEnter={() => onSelectProject(project.id)}
                className={`relative rounded-2xl border transition-all duration-300 flex flex-col justify-between overflow-hidden group ${
                  isActive
                    ? 'border-[#4D8DFF] bg-[#0D1118] shadow-[0_0_35px_rgba(77,141,255,0.2)]'
                    : 'border-[#1E2638] bg-[#07090D] hover:border-[#1E2638]/90 hover:bg-[#0D1118]/70'
                }`}
              >
                {/* Visual Representation Canvas Preview / Concept Graphic */}
                <div className="relative h-56 bg-gradient-to-b from-[#0D1118] to-[#07090D] border-b border-[#1E2638] p-6 flex flex-col justify-between overflow-hidden">
                  {/* Subtle Grid overlay */}
                  <div className="absolute inset-0 lab-grid opacity-30 pointer-events-none" />

                  {/* Project Category and Studio Mark */}
                  <div className="relative z-10 flex items-center justify-between text-xs font-mono">
                    <span className="text-[#9AA6B5] uppercase tracking-wider">{project.category}</span>
                    <span className="text-[#55F2E3] font-semibold">{project.badge}</span>
                  </div>

                  {/* Original Abstract 3D/Visual Concept Representation */}
                  <div className="relative z-10 flex items-center justify-center my-auto py-2">
                    {project.id === 'filebatch' && (
                      <div className="relative flex items-center justify-center w-full">
                        {/* Futuristic file conversion portal animation */}
                        <div className="w-24 h-24 rounded-full border border-[#4D8DFF]/40 border-dashed animate-[spin_20s_linear_infinite] flex items-center justify-center">
                          <div className="w-16 h-16 rounded-full border border-[#55F2E3]/50 flex items-center justify-center bg-[#4D8DFF]/10">
                            <Layers className="w-7 h-7 text-[#55F2E3]" />
                          </div>
                        </div>
                        {/* Floating format badges */}
                        <div className="absolute -left-1 text-[10px] font-mono bg-[#0D1118] border border-[#1E2638] px-2 py-0.5 rounded text-[#9AA6B5]">
                          .PDF
                        </div>
                        <div className="absolute -right-1 text-[10px] font-mono bg-[#0D1118] border border-[#4D8DFF]/40 px-2 py-0.5 rounded text-[#4D8DFF]">
                          .WEBP
                        </div>
                      </div>
                    )}

                    {project.id === 'mekit' && (
                      <div className="relative flex items-center justify-center w-full">
                        {/* Image dimensional resizing matrix */}
                        <div className="relative w-28 h-20 border-2 border-[#55F2E3]/60 rounded flex items-center justify-center group-hover:scale-105 transition-transform duration-300">
                          <div className="absolute inset-1 border border-dashed border-[#4D8DFF]/40" />
                          <div className="w-16 h-12 bg-[#4D8DFF]/20 rounded border border-[#55F2E3] flex items-center justify-center">
                            <Maximize2 className="w-5 h-5 text-[#55F2E3]" />
                          </div>
                        </div>
                        <span className="absolute bottom-0 right-2 text-[10px] font-mono text-[#9AA6B5]">
                          4K → 1080p
                        </span>
                      </div>
                    )}

                    {project.id === 'sayhola' && (
                      <div className="relative flex items-center justify-center w-full">
                        {/* Real-time chat signal constellation */}
                        <div className="relative flex items-center justify-center">
                          <div className="w-20 h-20 rounded-full border border-[#6366F1]/40 flex items-center justify-center">
                            <div className="w-12 h-12 rounded-full bg-[#6366F1]/20 border border-[#6366F1] flex items-center justify-center">
                              <MessageSquare className="w-6 h-6 text-[#6366F1]" />
                            </div>
                          </div>
                          {/* Satellite nodes */}
                          <div className="absolute top-0 right-2 w-2 h-2 rounded-full bg-[#55F2E3]" />
                          <div className="absolute bottom-1 left-2 w-2 h-2 rounded-full bg-[#4D8DFF]" />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* 3D Focus Status */}
                  <div className="relative z-10 flex items-center justify-between text-[11px] font-mono text-[#9AA6B5]">
                    <span>SPATIAL VECTOR</span>
                    <button
                      onClick={() => onSelectProject(project.id)}
                      className="text-[#4D8DFF] hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <Eye className="w-3 h-3" />
                      <span>{isActive ? 'Centered in Lab' : 'Align View'}</span>
                    </button>
                  </div>
                </div>

                {/* Card Content */}
                <div className="p-6 space-y-6 flex-1 flex flex-col justify-between">
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-2xl font-bold text-[#F5F7FA] tracking-tight">
                        {project.title}
                      </h3>
                      <p className="mt-2 text-sm text-[#9AA6B5] leading-relaxed">
                        {project.description}
                      </p>
                    </div>

                    {/* Feature Highlights */}
                    <div className="space-y-2 pt-2">
                      <span className="text-[11px] font-mono text-[#9AA6B5] uppercase tracking-wider block">
                        Capabilities:
                      </span>
                      <ul className="space-y-1.5">
                        {project.features.map((feature) => (
                          <li
                            key={feature}
                            className="flex items-start gap-2 text-xs text-[#F5F7FA]/90"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5 text-[#55F2E3] shrink-0 mt-0.5" />
                            <span>{feature}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {/* Action Buttons & Studio Ownership */}
                  <div className="pt-6 border-t border-[#1E2638] space-y-3">
                    <div className="flex items-center gap-3">
                      <a
                        href={project.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-[#4D8DFF] hover:bg-[#3d7ae6] text-white text-xs font-semibold transition-all shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
                        aria-label={`Visit ${project.name} (opens in new tab)`}
                      >
                        <span>Visit {project.name}</span>
                        <ArrowUpRight className="w-3.5 h-3.5" />
                      </a>

                      <button
                        onClick={() => setInspectedProject(project)}
                        className="px-3 py-2.5 rounded-lg bg-[#07090D] border border-[#1E2638] text-xs font-medium text-[#9AA6B5] hover:text-[#F5F7FA] hover:border-[#4D8DFF] transition-colors cursor-pointer"
                        title="Inspect Architecture"
                        aria-label={`Inspect ${project.name} details`}
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Exact Studio Ownership Label */}
                    <p className="text-[11px] font-mono text-[#9AA6B5] text-center pt-1">
                      {project.ownership}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Project Architecture Deep Inspection Modal */}
      {inspectedProject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div
            className="w-full max-w-xl bg-[#0D1118] border border-[#1E2638] rounded-2xl p-6 sm:p-8 space-y-6 shadow-2xl relative"
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-title"
          >
            <div className="flex items-start justify-between">
              <div>
                <span className="font-mono text-xs text-[#55F2E3] uppercase tracking-wider">
                  {inspectedProject.category}
                </span>
                <h3 id="modal-title" className="text-2xl font-bold text-[#F5F7FA] mt-1">
                  {inspectedProject.name}
                </h3>
              </div>
              <button
                onClick={() => setInspectedProject(null)}
                className="p-1.5 rounded-lg text-[#9AA6B5] hover:text-[#F5F7FA] hover:bg-[#1E2638] transition-colors cursor-pointer"
                aria-label="Close dialog"
              >
                ✕
              </button>
            </div>

            <p className="text-sm text-[#9AA6B5] leading-relaxed">
              {inspectedProject.description}
            </p>

            <div className="space-y-3 p-4 rounded-xl bg-[#07090D] border border-[#1E2638]">
              <span className="text-xs font-mono text-[#4D8DFF] uppercase tracking-wider block">
                Visual & Architectural Blueprint
              </span>
              <p className="text-xs text-[#F5F7FA]/90 leading-relaxed">
                {inspectedProject.visualConcept}
              </p>
              <div className="pt-2 border-t border-[#1E2638] flex items-center justify-between text-[11px] font-mono text-[#9AA6B5]">
                <span>DESTINATION HOST</span>
                <span className="text-[#F5F7FA] truncate max-w-[280px]">
                  {inspectedProject.url}
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <span className="text-xs font-mono text-[#9AA6B5] uppercase tracking-wider block">
                Verified Features
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {inspectedProject.features.map((item) => (
                  <div
                    key={item}
                    className="flex items-center gap-2 p-2 rounded-lg bg-[#07090D] border border-[#1E2638] text-xs text-[#F5F7FA]"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#55F2E3] shrink-0" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-[#1E2638]">
              <span className="text-xs font-mono text-[#9AA6B5]">
                {inspectedProject.ownership}
              </span>
              <a
                href={inspectedProject.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#4D8DFF] text-white text-xs font-semibold hover:bg-[#3d7ae6] transition-colors shadow-sm"
              >
                <span>Launch {inspectedProject.name}</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
