export interface ProjectItem {
  id: string;
  name: string;
  category: string;
  title: string;
  description: string;
  features: string[];
  url: string;
  visualConcept: string;
  badge: string;
  ownership: string;
  color: string;
  accentHex: string;
}

export interface ExperimentItem {
  id: string;
  code: string;
  title: string;
  category: string;
  status: 'Exploring' | 'Prototyping' | 'Archived Learning';
  summary: string;
  explorationQuestion: string;
  learnings: string;
}

export interface ProcessStage {
  step: string;
  title: string;
  description: string;
  deliverable: string;
}

export interface StudioPrinciple {
  number: string;
  title: string;
  statement: string;
  detail: string;
}

export const SITE_CONFIG = {
  brand: {
    name: "MK Labs",
    category: "Internet Projects Studio",
    tagline: "Ideas into Digital Products.",
    positioning: "MK Labs is an independent studio focused on creating useful internet projects, experimenting with new ideas, and turning concepts into working digital experiences.",
    coreMessage: "We explore ideas, experiment with technology, and build things for the internet.",
    logoImage: "/assets/aistudio/MK_Labs_703312e1.jpg",
    statusLabel: "DIGITAL LAB / OPEN TO NEW IDEAS",
    subLabel: "INDEPENDENT INTERNET PROJECTS STUDIO",
  },

  contact: {
    email: "muhammadkamran4122@gmail.com",
    subjectPrefix: "[MK Labs Studio Inquiry]",
    note: "Direct transmission channel to the MK Labs studio desk. All thoughtful inquiries, technical ideas, and collaboration proposals receive direct response.",
  },

  projects: [
    {
      id: "filebatch",
      name: "FileBatch",
      category: "Browser-Based File Tools",
      title: "FileBatch",
      description: "A browser-based file conversion tool designed to make everyday file tasks simpler and more accessible.",
      features: [
        "File conversion workflows",
        "Image and PDF-related tools",
        "Batch-processing experience, where supported",
        "Local browser-side processing for supported operations",
      ],
      url: "https://filebatch.netlify.app/",
      visualConcept: "A floating stack of digital files passing through a futuristic conversion portal with subtle transformation sequences.",
      badge: "LIVE PRODUCT",
      ownership: "FileBatch is a product by MK Labs.",
      color: "from-blue-500/20 to-cyan-500/10",
      accentHex: "#4D8DFF",
    },
    {
      id: "mekit",
      name: "Mekit.online",
      category: "Image Utilities",
      title: "Mekit.online",
      description: "A collection of practical image tools for resizing, compressing, and preparing images for everyday use.",
      features: [
        "Image compression",
        "Image resizing",
        "Batch tools where supported",
        "Simple browser-based workflows",
      ],
      url: "https://mekit.online",
      visualConcept: "Floating image tiles transform between different dimensional proportions with frame-shift animations.",
      badge: "LIVE PRODUCT",
      ownership: "Mekit.online is a product by MK Labs.",
      color: "from-cyan-500/20 to-teal-500/10",
      accentHex: "#55F2E3",
    },
    {
      id: "sayhola",
      name: "SayHola",
      category: "Online Chat Platform",
      title: "SayHola",
      description: "A web-based chat platform designed to make online conversations simple and accessible.",
      features: [
        "Browser-based chat experience",
        "Real-time message updates, where implemented",
        "Simple interface for connected users",
      ],
      url: "https://sayhola.online",
      visualConcept: "Floating message nodes and connected orbital communication signals pulsating softly.",
      badge: "LIVE PRODUCT",
      ownership: "SayHola is a product by MK Labs.",
      color: "from-indigo-500/20 to-blue-500/10",
      accentHex: "#6366F1",
    },
  ] as ProjectItem[],

  processStages: [
    {
      step: "01",
      title: "Discover",
      description: "We identify a problem, explore an idea, and understand what would make it useful.",
      deliverable: "Clear friction point and tangible hypothesis",
    },
    {
      step: "02",
      title: "Experiment",
      description: "We test concepts, explore possible approaches, and learn what works.",
      deliverable: "Rapid interactive prototypes & browser benchmarks",
    },
    {
      step: "03",
      title: "Build",
      description: "We turn the strongest ideas into working digital experiences.",
      deliverable: "Robust, performant production implementation",
    },
    {
      step: "04",
      title: "Improve",
      description: "We refine the experience, address problems, and keep making it better.",
      deliverable: "Refinement cycles driven by actual real-world usage",
    },
  ] as ProcessStage[],

  principles: [
    {
      number: "01",
      title: "Build With Purpose",
      statement: "We aim to create things that serve a real use or explore a meaningful idea.",
      detail: "No gimmicks or bloat. We favor clean utility, fast load times, and tools that genuinely solve a browser task.",
    },
    {
      number: "02",
      title: "Keep It Accessible",
      statement: "We value clear interfaces, practical functionality, and accessible experiences.",
      detail: "Internet software should be immediately usable without steep learning curves, paywalls, or friction.",
    },
    {
      number: "03",
      title: "Experiment Often",
      statement: "We learn by exploring ideas, testing approaches, and improving what we build.",
      detail: "Curiosity is our compass. Testing unorthodox mechanics and architectural ideas keeps software vibrant.",
    },
    {
      number: "04",
      title: "Keep Improving",
      statement: "A launch is a beginning, not the end of a product's journey.",
      detail: "We listen to real behavioral signals, fix edge cases, and continuously polish usability over time.",
    },
  ] as StudioPrinciple[],

  experiments: [
    {
      id: "exp-01",
      code: "EXP-801",
      title: "Client-Side WASM Format Transcoding",
      category: "Local Processing",
      status: "Exploring",
      explorationQuestion: "Can multi-megabyte media conversions occur entirely in browser memory with zero server uploads?",
      learnings: "WebAssembly SIMD enables near-native conversion speeds on typical laptops, radically preserving user privacy.",
    },
    {
      id: "exp-02",
      code: "EXP-802",
      title: "Decentralized Ephemeral Peer Sync",
      category: "Real-Time Mesh",
      status: "Prototyping",
      explorationQuestion: "How lightweight can peer-to-peer browser communication become without recurring signaling overhead?",
      learnings: "WebRTC data channels provide sub-40ms synchronization for concurrent whiteboard and text sessions.",
    },
    {
      id: "exp-03",
      code: "EXP-803",
      title: "Canvas Micro-Geometry Rasterizer",
      category: "Web Graphics",
      status: "Exploring",
      explorationQuestion: "How to deliver complex spatial feedback in browsers without heavy 3D engine overhead?",
      learnings: "Procedural geometry generation in 2D/3D dual pipelines lowers battery consumption by 65%.",
    },
  ] as ExperimentItem[],

  navLinks: [
    { label: "Home", href: "#hero" },
    { label: "About", href: "#about" },
    { label: "Projects", href: "#projects" },
    { label: "Process", href: "#process" },
    { label: "Experiments", href: "#experiments" },
    { label: "Principles", href: "#principles" },
    { label: "Contact", href: "#contact" },
  ],
};
