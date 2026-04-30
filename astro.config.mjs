// @ts-check
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';
import { fileURLToPath } from 'node:url';

// https://astro.build/config
export default defineConfig({
  site: 'https://docs.sajivfrancis.com',
  vite: {
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
      },
    },
  },
  integrations: [
    starlight({
      title: 'Sajiv Francis',
      description:
        'Architecture, AI, and software engineering notes by Sajiv Francis.',
      logo: {
        src: './public/img/logo.png',
        replacesTitle: false,
      },
      favicon: '/favicon-32x32.png',
      head: [
        {
          tag: 'script',
          attrs: {
            'data-goatcounter': 'https://sajivfrancis.goatcounter.com/count',
            async: true,
            src: '//gc.zgo.at/count.js',
          },
        },
      ],
      customCss: ['./src/styles/custom.css'],
      components: {
        Header: './src/components/Header.astro',
        SiteTitle: './src/components/SiteTitle.astro',
      },
      social: [
        {
          icon: 'github',
          label: 'GitHub',
          href: 'https://github.com/sfrancis2017/docs',
        },
      ],
      sidebar: [
        {
          label: 'Current',
          items: [
            {
              label: 'Architecture',
              collapsed: true,
              autogenerate: { directory: 'architecture' },
            },
            {
              label: 'AI',
              collapsed: true,
              autogenerate: { directory: 'ai' },
            },
            {
              label: 'Software Engineering',
              collapsed: true,
              autogenerate: { directory: 'software-engineering' },
            },
          ],
        },
        {
          label: 'Reference (SAP — earlier work)',
          collapsed: true,
          items: [
            { label: 'Overview', slug: 'reference' },
            {
              label: 'SAP',
              collapsed: true,
              autogenerate: { directory: 'reference/sap' },
            },
            {
              label: 'SAP ERP — ECC & S4HANA',
              collapsed: true,
              autogenerate: { directory: 'reference/sap-erp-s4hana' },
            },
            {
              label: 'SAP Central Finance',
              collapsed: true,
              autogenerate: { directory: 'reference/sap-central-finance' },
            },
            {
              label: 'SAP FSCM',
              collapsed: true,
              autogenerate: { directory: 'reference/sap-fscm' },
            },
            {
              label: 'SAP Fiori',
              collapsed: true,
              autogenerate: { directory: 'reference/sap-fiori' },
            },
            {
              label: 'SAP S4 CDS Views',
              collapsed: true,
              autogenerate: { directory: 'reference/sap-s4-cds-views' },
            },
            {
              label: 'SAP Installation',
              collapsed: true,
              autogenerate: { directory: 'reference/sap-installation' },
            },
            {
              label: 'SAP Accounting Standards',
              collapsed: true,
              autogenerate: { directory: 'reference/sap-accounting-standards' },
            },
            {
              label: 'SAP Notes',
              collapsed: true,
              autogenerate: { directory: 'reference/sap-notes' },
            },
          ],
        },
      ],
    }),
  ],
});
