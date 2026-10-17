import nextPlugin from "eslint-config-next";

const config = [
  ...nextPlugin,
  {
    ignores: ["node_modules/**", ".next/**", "out/**", "coverage/**"],
  },
  {
    rules: {
      // We intentionally use <img> for external/untrusted image URLs
      // (next/image offers no benefit for arbitrary remote sources here).
      "@next/next/no-img-element": "off",
      // Toast/UX copy uses typographic quotes and emoji deliberately.
      "react/no-unescaped-entities": "off",
    },
  },
];

export default config;
