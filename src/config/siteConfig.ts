export interface WebsiteProjectItem {
  id: string;
  name: string;
  description: string;
  category: string;
  url: string;
}

export interface CapabilityItem {
  id: string;
  title: string;
  description: string;
  iconName: string;
}

export const SITE_CONFIG = {
  brand: {
    name: "MK Labs",
    positioning: "Digital Products & Technology Studio",
    tagline: "Ideas into Digital Products.",
    description:
      "MK Labs creates practical digital products, web applications, and modern technology solutions designed to make everyday digital tasks easier.",
    aboutText:
      "MK Labs is a digital technology studio focused on developing practical, accessible, and user-friendly digital products. We build tools and web applications that simplify everyday tasks through thoughtful design and modern technology.",
    heroSupportingText:
      "MK Labs is an independent digital technology studio focused on creating useful web applications, innovative digital tools, and practical software solutions.",
    footerDescription:
      "MK Labs — Ideas into Digital Products. Practical digital products and technology solutions.",
    logoImage: "/assets/aistudio/MK_Labs_703312e1.jpg",
  },

  // Centralized Social & External Destinations
  social: {
    linkedin: "https://www.linkedin.com/company/mk-labs-2026",
  },

  // Centralized Contact Configuration
  contact: {
    email: "muhammadkamran4122@gmail.com",
    subjectPrefix: "[MK Labs Inquiry]",
    note: "Feel free to reach out directly via email or connect on LinkedIn. We are always open to discussing new ideas, product feedback, and collaboration opportunities.",
  },

  // Existing MK Labs Web Projects (Displayed in Footer under "Our Products & Websites")
  websites: [
    {
      id: "filebatch",
      name: "FileBatch",
      category: "Image Conversion",
      description:
        "Bulk image conversion and file utility web app.",
      url: "https://filebatch.netlify.app/",
    },
    {
      id: "mekit",
      name: "Mekit",
      category: "Online Tools",
      description:
        "Collection of fast browser-based digital utilities.",
      url: "https://mekit.muhammadkamran4122.workers.dev/",
    },
    {
      id: "imgkit",
      name: "ImgKit",
      category: "Image Tools",
      description:
        "Online image processing and editing utilities.",
      url: "https://imgkit.muhammadkamran4122.workers.dev/",
    },
    {
      id: "certificatestudio",
      name: "Certificate Studio",
      category: "Certificate Generator",
      description:
        "Create, customize, and generate professional certificates.",
      url: "https://certificatestudio.ai.studio/",
    },
  ] as WebsiteProjectItem[],

  // What We Do Capabilities
  capabilities: [
    {
      id: "digital-products",
      title: "Digital Product Development",
      description:
        "End-to-end development of practical digital solutions from core concept design to scalable web deployment.",
      iconName: "Boxes",
    },
    {
      id: "web-applications",
      title: "Web Applications",
      description:
        "Modern, responsive, and reliable web applications designed for optimum performance, clean architecture, and intuitive user experiences.",
      iconName: "Layout",
    },
    {
      id: "saas-solutions",
      title: "SaaS Solutions",
      description:
        "Focused software-as-a-service platforms engineered to streamline workflows and solve practical operational challenges.",
      iconName: "Cloud",
    },
    {
      id: "online-tools",
      title: "Online Tools & Utilities",
      description:
        "Fast, accessible, browser-based utilities that eliminate friction and simplify everyday digital and media tasks.",
      iconName: "Wrench",
    },
  ] as CapabilityItem[],

  // Clean Navigation Structure
  navLinks: [
    { label: "Home", href: "/#hero" },
    { label: "Digital Store", href: "/store" },
    { label: "Blog", href: "/blog" },
    { label: "About", href: "/#about" },
    { label: "What We Do", href: "/#capabilities" },
    { label: "Contact", href: "/#contact" },
  ],
};
