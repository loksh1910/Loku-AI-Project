export type TemplateDevice = "mobile" | "web";

export type Template = {
  slug: string;
  title: string;
  subtitle: string;
  device: TemplateDevice;
  screens: number;
  gradient: string;
  tags: string[];
  keyFeatures: string[];
  about: string;
};

export const templates: Template[] = [
  {
    slug: "enterprise-data-ai",
    title: "AI Company Landing Page",
    subtitle: "Enterprise Data Foundations for AI",
    device: "web",
    screens: 6,
    gradient: "from-[#0f1b3d] via-[#1c2b5e] to-[#0a1330]",
    tags: ["SaaS", "AI", "Landing Page", "B2B"],
    keyFeatures: [
      "Hero with product narrative",
      "Logo trust bar",
      "Feature deep-dives",
      "Pricing tiers",
      "Case studies",
    ],
    about:
      "A polished B2B SaaS marketing site built for an AI infrastructure company — hero, trust bar, feature sections, and pricing, ready to adapt to any enterprise product.",
  },
  {
    slug: "hiring-platform",
    title: "Hiring Platform",
    subtitle: "Applicant tracking dashboard",
    device: "web",
    screens: 8,
    gradient: "from-[#fdf2ff] via-[#f3e8ff] to-[#e0d8ff]",
    tags: ["Dashboard", "HR Tech", "Analytics", "SaaS"],
    keyFeatures: [
      "Candidate pipeline board",
      "Analytics charts",
      "Interview scheduling",
      "Team collaboration notes",
    ],
    about:
      "A recruiting dashboard template with pipeline tracking, analytics, and scheduling — built for HR tech products managing high applicant volume.",
  },
  {
    slug: "ecommerce-platform",
    title: "E-commerce platform",
    subtitle: "Your Store. The Stress-free way to shop.",
    device: "web",
    screens: 10,
    gradient: "from-[#7a2e0e] via-[#c2410c] to-[#fb923c]",
    tags: ["E-commerce", "Retail", "Mobile", "Storefront"],
    keyFeatures: [
      "Product discovery grid",
      "Cart & checkout flow",
      "Order tracking",
      "Responsive storefront",
    ],
    about:
      "A full storefront template — browse, cart, and checkout — paired with a companion mobile shopping experience for the same catalog.",
  },
  {
    slug: "hybrid-shopping",
    title: "Hybrid shopping experience",
    subtitle: "Grocery delivery, reimagined",
    device: "mobile",
    screens: 5,
    gradient: "from-[#fecaca] via-[#fca5a5] to-[#f87171]",
    tags: ["Grocery", "Delivery", "Mobile", "E-commerce"],
    keyFeatures: [
      "Deals of the day",
      "Category browsing",
      "Quick add to cart",
      "Persistent cart bar",
    ],
    about:
      "A grocery delivery app template with fast category browsing, deal highlights, and a persistent cart — optimized for quick repeat orders.",
  },
  {
    slug: "vidnio-notes",
    title: "Vidnio - Notes sharing marketplace",
    subtitle: "Turn academic ideas into income, communities, and real-world projects.",
    device: "mobile",
    screens: 5,
    gradient: "from-[#1a1333] via-[#2b2556] to-[#4c1d95]",
    tags: ["EdTech", "Student Marketplace", "Community App", "Peer Learning", "Monetization", "Mobile App"],
    keyFeatures: [
      "Monetize Notes",
      "Community Learning",
      "Doubt Solving System",
      "Verified Student Access",
      "Ratings & Reviews",
      "Multi-Mode Interaction",
    ],
    about:
      "A complete student-focused platform designed to help users earn, learn, and collaborate within their academic ecosystem. VidNio enables students to sell notes securely, join subject-based communities, solve doubts collaboratively, and explore opportunities for projects and income. Built with a scalable UX system, this template is ideal for edtech platforms, student startups, and peer-to-peer learning apps.",
  },
  {
    slug: "health-management",
    title: "Health management App",
    subtitle: "HealthVisor — care, organized",
    device: "mobile",
    screens: 14,
    gradient: "from-[#dbeafe] via-[#bfdbfe] to-[#93c5fd]",
    tags: ["Healthcare", "Wellness", "Mobile App", "Reminders"],
    keyFeatures: [
      "Prescription tracking",
      "Family profiles",
      "Emergency quick actions",
      "Medicine reminders",
    ],
    about:
      "A healthcare companion app template covering onboarding, family health profiles, prescriptions, and emergency actions in one connected flow.",
  },
];
