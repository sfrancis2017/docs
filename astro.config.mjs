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
        // Client-side Mermaid renderer. Starlight + Shiki renders
        // ```mermaid fenced blocks as <pre data-language="mermaid">; we
        // swap those for <div class="mermaid"> and run mermaid.js from
        // CDN to produce inline SVG. Matches the lazy-load pattern used
        // by chat.sajivfrancis.com. Theme follows current data-theme.
        {
          tag: 'script',
          content: `(function(){
  function readMermaidText(pre){
    // Starlight uses Expressive Code: <pre><code><div class="ec-line"><div class="code">…</div></div>…
    var ecLines=pre.querySelectorAll('code .ec-line .code');
    if(ecLines.length){
      return Array.prototype.map.call(ecLines,function(l){return l.textContent;}).join('\\n');
    }
    // Fallback for plain Shiki (<span class="line">) just in case.
    var lines=pre.querySelectorAll('code .line');
    if(lines.length){
      return Array.prototype.map.call(lines,function(l){return l.textContent;}).join('\\n');
    }
    return pre.textContent||'';
  }
  function init(){
    var blocks=document.querySelectorAll('pre[data-language="mermaid"]');
    if(!blocks.length)return;
    var nodes=[];
    blocks.forEach(function(pre){
      var raw=readMermaidText(pre).replace(/\\n+$/,'');
      var div=document.createElement('div');
      div.className='mermaid';
      div.textContent=raw;
      // Swap the entire Expressive Code wrapper (figure + copy button)
      // when present, otherwise just the <pre>.
      var wrapper=pre.closest('.expressive-code')||pre;
      wrapper.replaceWith(div);
      nodes.push(div);
    });
    var s=document.createElement('script');
    s.type='module';
    s.textContent="import mermaid from 'https://cdn.jsdelivr.net/npm/mermaid@11/dist/mermaid.esm.min.mjs';"+
      "var isDark=document.documentElement.dataset.theme==='dark';"+
      "mermaid.initialize({startOnLoad:false,theme:isDark?'dark':'default',securityLevel:'loose'});"+
      "mermaid.run({nodes:document.querySelectorAll('.mermaid')});";
    document.head.appendChild(s);
  }
  if(document.readyState==='loading'){
    document.addEventListener('DOMContentLoaded',init);
  }else{
    init();
  }
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
