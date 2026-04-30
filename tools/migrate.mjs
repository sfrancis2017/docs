/**
 * One-shot migration: docs-inventory (Docsify) → docs-astro (Starlight).
 *
 * - Renames top-level SAP groups under `reference/` parent.
 * - Promotes SOFTWARE.ENGG to top-level `software-engineering/`.
 * - Lowercases + URL-safes subfolder names (selling&distribution → sd, etc.).
 * - Keeps each page as `index.md` inside its topic folder so co-located images
 *   resolve via existing relative paths.
 * - Generates Starlight frontmatter (title, description) per file.
 * - Skips _sidebar.md and README.md (regenerated separately).
 * - Copies non-MD assets (images) into the new locations.
 *
 * Usage: node tools/migrate.mjs
 */

import fs from 'node:fs';
import path from 'node:path';

const SRC = '/Users/sajivfrancis/Documents/docs-inventory';
const DEST = '/Users/sajivfrancis/Documents/docs-astro/src/content/docs';

// Top-level folder rename mapping
const TOP_LEVEL = {
  SAP: 'reference/sap',
  'SAPERP-ECC&S4HANA': 'reference/sap-erp-s4hana',
  SAPCENTRALFINANCE: 'reference/sap-central-finance',
  SAPFSCM: 'reference/sap-fscm',
  SAPFIORI: 'reference/sap-fiori',
  SAPS4CDSVIEWS: 'reference/sap-s4-cds-views',
  SAPINSTALLATION: 'reference/sap-installation',
  SAPACCSTANDARDS: 'reference/sap-accounting-standards',
  SAPNOTES: 'reference/sap-notes',
  'SOFTWARE.ENGG': 'software-engineering',
  documents: null, // skip — old TOC; new index.mdx replaces
};

// Subfolder special cases (within a top-level group)
const SUBFOLDER_OVERRIDES = {
  'selling&distribution': 'sd',
  'patches&fixes': 'patches-and-fixes',
  'cashnliquiditymgt': 'cash-and-liquidity-mgt',
  'collectionsmgt': 'collections-mgt',
  'creditmgt': 'credit-mgt',
  'disputemgt': 'dispute-mgt',
  'treasurynriskmgt': 'treasury-and-risk-mgt',
  'systemrequirements': 'system-requirements',
  'cdsviewabapadt': 'cds-view-abap-adt',
  'cdsviewsfiori': 'cds-views-fiori',
  'processsteps': 'process-steps',
  'fioriappdev': 'fiori-app-dev',
  'ERPtoS4Hana': 'erp-to-s4hana',
  'S4Implementation': 's4-implementation',
  'AWS': 'aws',
  'AZURE': 'azure',
  'GCLOUD': 'gcloud',
  'ONPREMISE': 'on-premise',
  'accountdetermination': 'account-determination',
  'assetaccounting': 'asset-accounting',
  'datamigration': 'data-migration',
  'migrationtemplates': 'migration-templates',
  'materialsmanagement': 'materials-management',
  'productcosting': 'product-costing',
  'productionplanning': 'production-planning',
  'userassistance': 'user-assistance',
  'financialstatements': 'financial-statements',
};

function mapSubfolder(name) {
  if (SUBFOLDER_OVERRIDES[name]) return SUBFOLDER_OVERRIDES[name];
  return name.toLowerCase();
}

function mapFullPath(relPath) {
  // relPath e.g. "SAPERP-ECC&S4HANA/finance/index.md"
  const parts = relPath.split('/').filter(Boolean);
  if (parts.length === 0) return null;

  const top = parts[0];
  const newTop = TOP_LEVEL[top];
  if (newTop === undefined) return null; // unknown top-level — skip
  if (newTop === null) return null; // explicitly skipped

  const rest = parts.slice(1, -1).map(mapSubfolder);
  const filename = parts[parts.length - 1];
  return path.join(newTop, ...rest, filename);
}

function extractTitle(content, fallback) {
  // Find first `# ` heading
  const match = content.match(/^#\s+(.+)$/m);
  if (match) {
    return match[1]
      .trim()
      // Keep all-caps words of 2-5 chars (acronyms: SAP, ERP, ECC, ABAP, CDS, etc.)
      // Title-case longer all-caps words (FINANCE, MODULE, INSTALLATION)
      .replace(/\b([A-Z]{6,})\b/g, (m) =>
        m.charAt(0) + m.slice(1).toLowerCase()
      );
  }
  return fallback;
}

function extractDescription(content) {
  // First non-empty paragraph that's not a heading or code fence
  const lines = content.split('\n');
  let inFence = false;
  for (const line of lines) {
    if (line.startsWith('```')) {
      inFence = !inFence;
      continue;
    }
    if (inFence) continue;
    const t = line.trim();
    if (!t) continue;
    if (t.startsWith('#')) continue;
    if (t.startsWith('!') || t.startsWith('[')) continue;
    if (t.startsWith('<')) continue;
    // Strip markdown formatting roughly
    return t
      .replace(/[*_`]/g, '')
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
      .slice(0, 200);
  }
  return '';
}

function prettifyFolderName(name) {
  return name
    .replace(/-/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function buildFrontmatter(title, description, order) {
  const lines = ['---'];
  lines.push(`title: ${JSON.stringify(title)}`);
  if (description) {
    lines.push(`description: ${JSON.stringify(description)}`);
  }
  if (typeof order === 'number') {
    lines.push('sidebar:');
    lines.push(`  order: ${order}`);
  }
  lines.push('---', '');
  return lines.join('\n');
}

// ---- Walk and migrate -----------------------------------------------------

let migratedMD = 0;
let copiedAssets = 0;
let skipped = 0;
const log = [];

function walk(dir, relBase = '') {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.name.startsWith('.')) continue; // .git, .nojekyll
    const abs = path.join(dir, entry.name);
    const rel = relBase ? path.join(relBase, entry.name) : entry.name;
    if (entry.isDirectory()) {
      walk(abs, rel);
    } else if (entry.isFile()) {
      handleFile(abs, rel);
    }
  }
}

function handleFile(absSrc, rel) {
  const ext = path.extname(rel).toLowerCase();
  const baseName = path.basename(rel);

  // Skip top-level meta files
  if (rel === 'README.md' || rel === '_sidebar.md' || rel === 'CNAME' ||
      rel === 'index.html' || rel === '.nojekyll' || baseName === 'favicon.ico' ||
      baseName === 'favicon.png') {
    skipped++;
    log.push(`SKIP ${rel} (meta)`);
    return;
  }

  const newRel = mapFullPath(rel);
  if (!newRel) {
    skipped++;
    log.push(`SKIP ${rel} (no mapping)`);
    return;
  }

  const absDest = path.join(DEST, newRel);
  fs.mkdirSync(path.dirname(absDest), { recursive: true });

  if (ext === '.md') {
    const raw = fs.readFileSync(absSrc, 'utf8');
    // Use parent folder as title fallback
    const folderName = path.basename(path.dirname(newRel));
    const fallback = prettifyFolderName(folderName);
    const title = extractTitle(raw, fallback);
    const description = extractDescription(raw);
    const frontmatter = buildFrontmatter(title, description);

    // Strip leading H1 if it matches the title (Starlight renders title from frontmatter)
    let body = raw.replace(/^#\s+.+\n+/, '');
    fs.writeFileSync(absDest, frontmatter + body);
    migratedMD++;
    log.push(`MD   ${rel} → ${newRel}  (title: "${title}")`);
  } else {
    // Copy non-MD assets verbatim
    fs.copyFileSync(absSrc, absDest);
    copiedAssets++;
    log.push(`ASSET ${rel} → ${newRel}`);
  }
}

walk(SRC);

// ---- Write placeholder index files for new top-level groups --------------

const placeholders = {
  'index.mdx': {
    title: 'Sajiv Francis — Docs',
    description:
      'Architecture, AI, and software engineering notes by Sajiv Francis.',
    body: `Welcome. This is a working knowledge base — short notes and longer pieces on enterprise architecture, AI systems, and the software engineering work that surrounds them.

## What's here

- **[Architecture](/architecture/)** — enterprise, cloud, and solution architecture notes; ADRs.
- **[AI](/ai/)** — LLMs, RAG, document intelligence, agents, prompt engineering.
- **[Software Engineering](/software-engineering/)** — frontend, backend, DevOps, testing.
- **[Reference](/reference/)** — earlier SAP work; kept for completeness.

Most of the *Architecture* and *AI* sections are being curated from working notes — content lands as it's reviewed.
`,
  },
  'architecture/index.mdx': {
    title: 'Architecture',
    description:
      'Enterprise, cloud, and solution architecture notes — and architecture decision records.',
    body: `Notes and decisions across the architecture practice. Subsections fill in as content is curated from working notes.

- **Enterprise Architecture** — frameworks, capability models, AI-EA practice.
- **Cloud Architecture** — multi-cloud patterns, integration, scaling.
- **Solution Architecture** — domain-specific design.
- **Decisions** — architecture decision records (ADRs).
`,
  },
  'architecture/enterprise-architecture/index.mdx': {
    title: 'Enterprise Architecture',
    description: 'Notes on EA frameworks, capabilities, and AI-augmented practice.',
    body: `Working notes on enterprise architecture — frameworks (TOGAF, ArchiMate), capability modelling, and the emerging AI-EA practice.\n\n_Content being curated._\n`,
  },
  'architecture/cloud-architecture/index.mdx': {
    title: 'Cloud Architecture',
    description: 'Multi-cloud patterns, integration, and scaling notes.',
    body: `Cloud architecture notes — patterns, integration, scaling, cost.\n\n_Content being curated._\n`,
  },
  'architecture/solution-architecture/index.mdx': {
    title: 'Solution Architecture',
    description: 'Domain-specific solution design notes.',
    body: `Solution architecture notes by domain.\n\n_Content being curated._\n`,
  },
  'architecture/decisions/index.mdx': {
    title: 'Architecture Decision Records',
    description: 'ADRs documenting key architecture decisions.',
    body: `Architecture decision records.\n\n_Content being curated._\n`,
  },
  'ai/index.mdx': {
    title: 'AI',
    description:
      'LLMs, retrieval, document intelligence, agents, and prompt engineering.',
    body: `Working notes on the AI side of the practice.

- **LLMs & Foundation Models** — capabilities, evaluation, integration.
- **RAG & Retrieval** — patterns, evaluation, production lessons.
- **Document Intelligence** — document AI lineage, including the Optey work.
- **Agents & Tools** — agentic patterns, tool design.
- **Prompt Engineering** — system prompts, templates, eval harnesses.
`,
  },
  'ai/llms-and-foundation-models/index.mdx': {
    title: 'LLMs & Foundation Models',
    description: 'Notes on LLMs, foundation models, and their integration.',
    body: `_Content being curated._\n`,
  },
  'ai/rag-and-retrieval/index.mdx': {
    title: 'RAG & Retrieval',
    description: 'Retrieval-augmented generation patterns and lessons.',
    body: `_Content being curated._\n`,
  },
  'ai/document-intelligence/index.mdx': {
    title: 'Document Intelligence',
    description:
      'Document AI — chunking, layout, extraction, and the Optey lineage.',
    body: `_Content being curated._\n`,
  },
  'ai/agents-and-tools/index.mdx': {
    title: 'Agents & Tools',
    description: 'Agentic patterns, tool design, and orchestration.',
    body: `_Content being curated._\n`,
  },
  'ai/prompt-engineering/index.mdx': {
    title: 'Prompt Engineering',
    description: 'System prompts, templates, and evaluation harnesses.',
    body: `_Content being curated._\n`,
  },
  'software-engineering/index.mdx': {
    title: 'Software Engineering',
    description: 'Frontend, backend, DevOps, and testing notes.',
    body: `Working notes across the software engineering practice.\n`,
  },
  'software-engineering/devops/index.mdx': {
    title: 'DevOps',
    description: 'CI/CD, infrastructure, and platform notes.',
    body: `_Content being curated._\n`,
  },
  'software-engineering/testing/index.mdx': {
    title: 'Testing',
    description: 'Testing strategies, automation, and quality notes.',
    body: `_Content being curated._\n`,
  },
  'reference/index.mdx': {
    title: 'Reference',
    description:
      'Earlier SAP work — kept for completeness. New work lives under Architecture, AI, and Software Engineering.',
    body: `Earlier SAP-focused work. Useful as reference. Newer content sits under [Architecture](/architecture/), [AI](/ai/), and [Software Engineering](/software-engineering/).
`,
  },
};

for (const [rel, { title, description, body }] of Object.entries(placeholders)) {
  const abs = path.join(DEST, rel);
  // Only write if the file doesn't already exist (so migrated content wins)
  if (fs.existsSync(abs)) {
    log.push(`KEEP ${rel} (migrated content present)`);
    continue;
  }
  fs.mkdirSync(path.dirname(abs), { recursive: true });
  const fm = buildFrontmatter(title, description);
  fs.writeFileSync(abs, fm + body);
  log.push(`PLACEHOLDER ${rel}`);
}

// ---- Summary --------------------------------------------------------------

console.log(`Migrated ${migratedMD} MD files`);
console.log(`Copied ${copiedAssets} assets`);
console.log(`Skipped ${skipped}`);
console.log(`Placeholders written: ${Object.keys(placeholders).length}`);
console.log('---');
console.log(log.join('\n'));
