import { defineConfig } from 'vitepress';

export default defineConfig({
  title: 'Cardplay',
  description: 'Docs and internal plan',
  themeConfig: {
    nav: [{ text: 'Plan', link: '/plan' }],
    sidebar: [
      { text: 'Home', link: '/' },
      { text: 'Plan', link: '/plan' },
      { text: 'Architecture', link: '/architecture' },
      { text: 'Glossary', link: '/glossary' },
      { text: 'Debugging', link: '/debugging' },
      { text: 'WASM', link: '/wasm' },
      { text: 'CardScript', link: '/cardscript' },
      { text: 'AI: Prolog engine choice', link: '/ai/prolog-engine-choice' },
      { text: 'AI: Prolog deck reasoning', link: '/ai/prolog-deck-reasoning' },
      { text: 'Release', link: '/release' },
      { text: 'Coding style', link: '/coding-style' },
      { text: 'Policies: npm audit', link: '/policies/npm-audit' },
      { text: 'Policies: dependency updates', link: '/policies/dependency-updates' },
    ],
  },
});
