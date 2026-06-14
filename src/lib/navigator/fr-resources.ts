export type FrResourceLink = {
  id: string;
  label: string;
  description: string;
  href: string;
  external?: boolean;
  icon?: string;
};

export const FR_VIDEO_LINKS: FrResourceLink[] = [
  {
    id: "video-zoom",
    label: "Join video consultation",
    description: "Connect face-to-face with your Financial Representative (demo link)",
    href: "https://zoom.us/j/5551234567?pwd=demo",
    external: true,
    icon: "📹",
  },
  {
    id: "video-teams",
    label: "Microsoft Teams meeting",
    description: "Alternative video option if your rep shared a Teams invite",
    href: "https://teams.microsoft.com/l/meetup-join/demo",
    external: true,
    icon: "💻",
  },
];

export const FR_INFO_LINKS: FrResourceLink[] = [
  {
    id: "role-fr",
    label: "Role of your Financial Representative",
    description: "What your rep can help with — and what requires a personal review",
    href: "https://www.prudential.com/personal/life-insurance/why-prudential/financial-professionals",
    external: true,
    icon: "👤",
  },
  {
    id: "prepare",
    label: "Prepare for your consultation",
    description: "Documents, goals, and questions to bring to your meeting",
    href: "https://www.prudential.com/personal/life-insurance/learn",
    external: true,
    icon: "📋",
  },
  {
    id: "privacy",
    label: "Privacy & data security",
    description: "How we protect your information during consultations",
    href: "https://www.prudential.com/privacy",
    external: true,
    icon: "🔒",
  },
  {
    id: "claims",
    label: "Claims support",
    description: "Life claims line — Mon–Fri 8 AM–8 PM ET",
    href: "tel:1-800-496-1035",
    icon: "📞",
  },
  {
    id: "support",
    label: "Customer service",
    description: "General policy questions — 1-800-778-2255",
    href: "tel:1-800-778-2255",
    icon: "☎️",
  },
];
