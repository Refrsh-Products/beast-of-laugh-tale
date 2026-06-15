export const POLICY_LINKS = {
  privacy: { slug: "privacy", label: "Privacy Policy", path: "/privacy-policy" },
  terms: { slug: "terms", label: "Terms of Service", path: "/terms-of-service" },
  refund: { slug: "refund", label: "Refund Policy", path: "/refund-policy" },
} as const;

export type PolicyKey = keyof typeof POLICY_LINKS;
