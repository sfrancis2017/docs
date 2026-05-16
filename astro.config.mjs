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
        // Client-side Mermaid renderer + expand-to-fullscreen modal.
        // Starlight + Shiki renders ```mermaid fenced blocks as
        // <pre data-language="mermaid">; we swap those for
        // <div class="mermaid"> and run mermaid.js from CDN.
        // After render, each rendered SVG gets a small expand button
        // that opens a shared fullscreen modal with the diagram at
        // intrinsic size + scroll (so dense architecture diagrams are
        // actually readable).
        {
          tag: 'script',
          content: `(function(){
  function readMermaidText(pre){
    var ecLines=pre.querySelectorAll('code .ec-line .code');
    if(ecLines.length){
      return Array.prototype.map.call(ecLines,function(l){return l.textContent;}).join('\\n');
    }
    var lines=pre.querySelectorAll('code .line');
    if(lines.length){
      return Array.prototype.map.call(lines,function(l){return l.textContent;}).join('\\n');
    }
    return pre.textContent||'';
  }

  // Inject CSS for the expand button + modal once per page load.
  function injectStyles(){
    if(document.getElementById('mermaid-expand-styles'))return;
    var st=document.createElement('style');
    st.id='mermaid-expand-styles';
    st.textContent=
      '.mermaid{position:relative;}'+
      '.mermaid-expand{position:absolute;top:.4rem;right:.4rem;display:inline-flex;align-items:center;justify-content:center;width:28px;height:28px;padding:0;border:1px solid var(--sl-color-hairline,#888);border-radius:6px;background:var(--sl-color-bg,#fff);color:var(--sl-color-text-accent,#555);cursor:pointer;opacity:.5;transition:opacity .15s,background .15s,color .15s;}'+
      '.mermaid:hover .mermaid-expand{opacity:1;}'+
      '.mermaid-expand:hover{background:var(--sl-color-bg-nav,#eee);color:var(--sl-color-text,#000);}'+
      '.mermaid-modal{position:fixed;inset:0;z-index:9999;display:flex;align-items:center;justify-content:center;}'+
      '.mermaid-modal[hidden]{display:none;}'+
      '.mermaid-modal-backdrop{position:absolute;inset:0;background:rgba(0,0,0,.65);}'+
      '.mermaid-modal-panel{position:relative;width:min(96vw,1600px);height:min(94vh,1100px);background:var(--sl-color-bg,#fff);border:1px solid var(--sl-color-hairline,#888);border-radius:10px;box-shadow:0 30px 60px -10px rgba(0,0,0,.4);overflow:hidden;display:flex;flex-direction:column;}'+
      '.mermaid-modal-close{position:absolute;top:.4rem;right:.5rem;z-index:1;width:32px;height:32px;padding:0;border:none;border-radius:6px;background:transparent;color:var(--sl-color-text-accent,#555);cursor:pointer;font-size:1.5rem;line-height:1;}'+
      '.mermaid-modal-close:hover{background:var(--sl-color-bg-nav,#eee);color:var(--sl-color-text,#000);}'+
      '.mermaid-modal-svg{flex:1;overflow:auto;padding:1.2rem;display:grid;place-items:center;}'+
      '.mermaid-modal-svg svg{max-width:none!important;height:auto!important;}';
    document.head.appendChild(st);
  }

  function ensureModal(){
    var modal=document.getElementById('mermaid-modal');
    if(modal)return modal;
    modal=document.createElement('div');
    modal.id='mermaid-modal';
    modal.className='mermaid-modal';
    modal.setAttribute('role','dialog');
    modal.setAttribute('aria-modal','true');
    modal.setAttribute('aria-label','Diagram fullscreen view');
    modal.hidden=true;
    modal.innerHTML=
      '<div class="mermaid-modal-backdrop" data-close></div>'+
      '<div class="mermaid-modal-panel">'+
        '<button type="button" class="mermaid-modal-close" data-close aria-label="Close">\\u00d7</button>'+
        '<div class="mermaid-modal-svg"></div>'+
      '</div>';
    document.body.appendChild(modal);
    modal.addEventListener('click',function(e){
      var t=e.target;
      if(t&&t.dataset&&t.dataset.close!==undefined)closeModal();
    });
    document.addEventListener('keydown',function(e){
      if(e.key==='Escape'&&!modal.hidden)closeModal();
    });
    return modal;
  }

  function openModal(source){
    var modal=ensureModal();
    var slot=modal.querySelector('.mermaid-modal-svg');
    var svg=source.querySelector('svg');
    if(!svg)return;
    slot.innerHTML='';
    var clone=svg.cloneNode(true);
    clone.removeAttribute('width');
    clone.removeAttribute('height');
    clone.removeAttribute('style');
    slot.appendChild(clone);
    modal.hidden=false;
    document.body.style.overflow='hidden';
  }

  function closeModal(){
    var modal=document.getElementById('mermaid-modal');
    if(!modal)return;
    modal.hidden=true;
    document.body.style.overflow='';
  }

  function addExpandButton(div){
    if(div.querySelector('.mermaid-expand'))return;
    var btn=document.createElement('button');
    btn.type='button';
    btn.className='mermaid-expand';
    btn.setAttribute('aria-label','Expand diagram');
    btn.title='Expand diagram';
    btn.innerHTML='<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="15 3 21 3 21 9"/><polyline points="9 21 3 21 3 15"/><line x1="21" y1="3" x2="14" y2="10"/><line x1="3" y1="21" x2="10" y2="14"/></svg>';
    btn.addEventListener('click',function(){openModal(div);});
    div.appendChild(btn);
  }

  function init(){
    var blocks=document.querySelectorAll('pre[data-language="mermaid"]');
    if(!blocks.length)return;
    injectStyles();
    var nodes=[];
    blocks.forEach(function(pre){
      var raw=readMermaidText(pre).replace(/\\n+$/,'');
      var div=document.createElement('div');
      div.className='mermaid';
      div.textContent=raw;
      var wrapper=pre.closest('.expressive-code')||pre;
      wrapper.replaceWith(div);
      nodes.push(div);
    });
    var s=document.createElement('script');
    s.type='module';
    // Run mermaid then add expand buttons. The inline-module gets the
    // node list via window so we can call addExpandButton from outside.
    window.__mermaidNodes=nodes;
    window.__mermaidAddExpand=addExpandButton;
    s.textContent=
      "import mermaid from 'https://cdn.jsdelivr.net/npm/mermaid@11/dist/mermaid.esm.min.mjs';"+
      "var isDark=document.documentElement.dataset.theme==='dark';"+
      "mermaid.initialize({startOnLoad:false,theme:isDark?'dark':'default',securityLevel:'loose'});"+
      "mermaid.run({nodes:window.__mermaidNodes}).then(function(){"+
        "window.__mermaidNodes.forEach(function(d){window.__mermaidAddExpand(d);});"+
      "});";
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
