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
        // Cross-subdomain theme sync. Reads `theme` cookie (scoped to
        // .sajivfrancis.com) on load and overrides the resolved Starlight
        // theme; observes data-theme changes (Starlight's own toggle)
        // and writes them back to the cookie. Result: toggling on
        // sajivfrancis.com or chat.sajivfrancis.com carries here, and
        // toggling here carries to them.
        {
          tag: 'script',
          content: `(function(){
  function readCookie(){var m=document.cookie.match(/(?:^|;\\s*)theme=(light|dark)/);return m?m[1]:null;}
  function writeCookie(v){document.cookie='theme='+v+'; Domain=.sajivfrancis.com; Path=/; Max-Age=31536000; SameSite=Lax; Secure';}
  var c=readCookie();
  if(c){document.documentElement.dataset.theme=c;try{localStorage.setItem('starlight-theme',c);}catch(_){} }
  new MutationObserver(function(muts){
    for(var i=0;i<muts.length;i++){
      if(muts[i].attributeName==='data-theme'){
        var v=document.documentElement.dataset.theme;
        if(v==='light'||v==='dark'){if(v!==readCookie())writeCookie(v);}
      }
    }
  }).observe(document.documentElement,{attributes:true,attributeFilter:['data-theme']});
})();`,
        },
      ],
      customCss: ['./src/styles/custom.css'],
      components: {
        Header: './src/components/Header.astro',
        SkipLink: './src/components/SkipLink.astro',
        Footer: './src/components/Footer.astro',
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
