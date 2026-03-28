import { themes as prismThemes } from "prism-react-renderer";
import type { Config } from "@docusaurus/types";
import type * as Preset from "@docusaurus/preset-classic";

const config: Config = {
  title: "Cleft",
  tagline: "Journaling for AI agents. Persistent, autonomous memory on Filecoin.",
  favicon: "img/favicon.svg",

  url: "https://yazraso.github.io",
  baseUrl: "/penn-blockchain-hackathon/",
  organizationName: "YazRaso",
  projectName: "penn-blockchain-hackathon",
  deploymentBranch: "gh-pages",
  trailingSlash: false,

  onBrokenLinks: "warn",

  i18n: {
    defaultLocale: "en",
    locales: ["en"],
  },

  plugins: [
    [
      "docusaurus-plugin-typedoc",
      {
        entryPoints: ["../src"],
        entryPointStrategy: "expand",
        out: "./docs/api",
        exclude: ["**/*.test.ts", "tests/**", "node_modules/**"],
        excludePrivate: true,
        excludeInternal: true,
        skipErrorChecking: true,
        validation: {
          notDocumented: false,
        },
      },
    ],
  ],

  presets: [
    [
      "classic",
      {
        docs: {
          sidebarPath: "./sidebars.ts",
          editUrl: undefined,
        },
        blog: false,
        theme: {
          customCss: "./src/css/custom.css",
        },
      } satisfies Preset.Options,
    ],
  ],

  themeConfig: {
    colorMode: {
      defaultMode: "light",
      disableSwitch: false,
      respectPrefersColorScheme: true,
    },
    navbar: {
      title: "Cleft",
      items: [
        {
          type: "docSidebar",
          sidebarId: "tutorialSidebar",
          position: "left",
          label: "Docs",
        },
        {
          type: "docSidebar",
          sidebarId: "apiSidebar",
          position: "left",
          label: "API Reference",
        },
        {
          href: "https://github.com/YazRaso/penn-blockchain-hackathon",
          position: "right",
          className: "header-github-link",
          "aria-label": "GitHub repository",
        },
      ],
    },
    footer: {
      style: "dark",
      links: [
        {
          title: "Docs",
          items: [
            {
              label: "Getting Started",
              to: "/docs/getting-started",
            },
            {
              label: "API Reference",
              to: "/docs/api",
            },
          ],
        },
        {
          title: "More",
          items: [
            {
              label: "GitHub",
              href: "https://github.com/YazRaso/penn-blockchain-hackathon",
            },
            {
              label: "Filecoin",
              href: "https://filecoin.io",
            },
          ],
        },
      ],
      copyright: `Copyright © ${new Date().getFullYear()} Cleft contributors. Built with Docusaurus.`,
    },
    prism: {
      theme: prismThemes.github,
      darkTheme: prismThemes.dracula,
      additionalLanguages: ["typescript", "bash", "json"],
    },
  } satisfies Preset.ThemeConfig,
};

export default config;
