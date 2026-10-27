/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Navbar } from './components/Navbar';
import { Hero } from './components/Hero';
import { StudioIntro } from './components/StudioIntro';
import { ProjectUniverse } from './components/ProjectUniverse';
import { HowWeBuild } from './components/HowWeBuild';
import { ExperimentsZone } from './components/ExperimentsZone';
import { StudioPrinciples } from './components/StudioPrinciples';
import { ContactSection } from './components/ContactSection';
import { Footer } from './components/Footer';
import { LabScene } from './components/3d/LabScene';

export default function App() {
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="relative min-h-screen bg-[#07090D] text-[#F5F7FA] overflow-x-hidden selection:bg-[#4D8DFF]/30 selection:text-white">
      {/* 3D WebGL Digital Laboratory Background Experience */}
      <div className="fixed inset-0 w-full h-full z-0 pointer-events-none opacity-85">
        <LabScene
          activeProjectId={activeProjectId}
          onSelectProject={(id) => setActiveProjectId(id || null)}
          className="w-full h-full"
        />
      </div>

      {/* Persistent Top Navigation */}
      <Navbar />

      {/* Main Content Sections Flow */}
      <main className="relative z-10">
        {/* Hero Section */}
        <Hero
          onExploreProjects={() => scrollToSection('projects')}
          onExploreAbout={() => scrollToSection('about')}
        />

        {/* 01 / Studio Introduction */}
        <StudioIntro />

        {/* 02 / Project Universe */}
        <ProjectUniverse
          activeProjectId={activeProjectId}
          onSelectProject={(id) => setActiveProjectId(id)}
        />

        {/* 03 / How We Build */}
        <HowWeBuild />

        {/* 04 / Experimental Zone */}
        <ExperimentsZone />

        {/* 05 / Studio Principles */}
        <StudioPrinciples />

        {/* 06 / Open Channel Contact */}
        <ContactSection />
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
}
