#!/usr/bin/env python3
"""
Download embedded PDFs from MDX files and rewrite iframes to <PDFEmbed>.

For each .md file in src/content/docs/:
  1. Find all <iframe src="..."></iframe> with Google Drive or OneDrive URLs
  2. Download the PDF (gdown for Drive, direct HTTP for OneDrive)
  3. Save to public/pdf/{topic}/{id}.pdf
  4. Convert .md to .mdx (so we can use the PDFEmbed component)
  5. Add `import PDFEmbed from '@/components/PDFEmbed.astro'` after frontmatter
  6. Replace iframe with <PDFEmbed src="/pdf/{topic}/{id}.pdf" />
  7. Extract PDF text via pypdf and append a <details> block for searchability

Failures are logged but don't block the script. Original iframe stays if download fails.

Run:  python3 tools/pdf_migrate.py
"""

import os
import re
import sys
import shutil
from pathlib import Path
from urllib.parse import urlparse, parse_qs
from urllib.request import urlopen, Request
from urllib.error import HTTPError, URLError

try:
    import gdown
except ImportError:
    print('ERROR: pip3 install gdown', file=sys.stderr)
    sys.exit(1)

try:
    from pypdf import PdfReader
    from pypdf.errors import PdfReadError
except ImportError:
    print('ERROR: pip3 install pypdf', file=sys.stderr)
    sys.exit(1)

ROOT = Path('/Users/sajivfrancis/Documents/docs-astro')
DOCS = ROOT / 'src' / 'content' / 'docs'
PDF_DIR = ROOT / 'public' / 'pdf'
PDF_DIR.mkdir(parents=True, exist_ok=True)

# Iframe pattern (case-insensitive, captures src)
IFRAME_RE = re.compile(
    r'<iframe[^>]*\bsrc=["\']([^"\']+)["\'][^>]*>\s*</iframe>',
    re.IGNORECASE,
)

GDRIVE_RE = re.compile(r'drive\.google\.com/file/d/([a-zA-Z0-9_-]+)')
ONEDRIVE_RE = re.compile(r'onedrive\.live\.com/embed\?(.+)$')


def topic_from_path(md_path: Path) -> str:
    """Derive a topic slug from the file's parent directory chain."""
    rel = md_path.relative_to(DOCS)
    # Use the directory containing the .md file
    parts = list(rel.parts[:-1])  # exclude the filename
    # Use last 2 parts to keep folder hierarchy short but meaningful
    return '-'.join(parts[-2:]) if parts else 'misc'


def safe_filename(s: str) -> str:
    return re.sub(r'[^a-zA-Z0-9_.-]', '_', s)[:100]


def download_gdrive(file_id: str, dest: Path) -> bool:
    if dest.exists() and dest.stat().st_size > 0:
        print(f'  cached: {dest.name}')
        return True
    try:
        url = f'https://drive.google.com/uc?id={file_id}'
        gdown.download(url, str(dest), quiet=True, fuzzy=True)
        return dest.exists() and dest.stat().st_size > 0
    except Exception as e:
        print(f'  gdown FAIL: {e}', file=sys.stderr)
        return False


def download_onedrive(embed_url: str, dest: Path) -> bool:
    """OneDrive: convert /embed? URL to /download? URL, fetch directly."""
    if dest.exists() and dest.stat().st_size > 0:
        print(f'  cached: {dest.name}')
        return True
    download_url = embed_url.replace('/embed?', '/download?')
    try:
        req = Request(download_url, headers={'User-Agent': 'Mozilla/5.0'})
        with urlopen(req, timeout=60) as r:
            data = r.read()
        if data[:4] == b'%PDF':
            dest.write_bytes(data)
            return True
        # Sometimes returns HTML error page
        print(f'  onedrive non-PDF response ({len(data)} bytes)', file=sys.stderr)
        return False
    except (HTTPError, URLError, TimeoutError) as e:
        print(f'  onedrive FAIL: {e}', file=sys.stderr)
        return False


def extract_text(pdf_path: Path, max_chars: int = 8000) -> str:
    try:
        reader = PdfReader(str(pdf_path))
        chunks = []
        total = 0
        for page in reader.pages:
            try:
                t = page.extract_text() or ''
            except Exception:
                continue
            chunks.append(t.strip())
            total += len(t)
            if total >= max_chars:
                break
        text = '\n\n'.join(c for c in chunks if c)
        # Light cleanup
        text = re.sub(r'\s+\n', '\n', text)
        text = re.sub(r'\n{3,}', '\n\n', text)
        return text[:max_chars]
    except (PdfReadError, Exception) as e:
        print(f'  text extract FAIL: {e}', file=sys.stderr)
        return ''


def add_import_to_mdx(content: str) -> str:
    """Insert PDFEmbed import after frontmatter if not already present."""
    if 'PDFEmbed' in content and 'import PDFEmbed' in content:
        return content
    # Find end of frontmatter
    m = re.match(r'^(---\n.*?\n---\n)', content, re.DOTALL)
    if not m:
        return f"import PDFEmbed from '@/components/PDFEmbed.astro';\n\n{content}"
    head, body = m.group(1), content[m.end():]
    return f"{head}\nimport PDFEmbed from '@/components/PDFEmbed.astro';\n{body}"


def process_file(md_path: Path, stats: dict) -> None:
    content = md_path.read_text(encoding='utf-8')
    iframes = list(IFRAME_RE.finditer(content))
    if not iframes:
        return

    print(f'\n{md_path.relative_to(ROOT)}: {len(iframes)} iframes')
    topic = topic_from_path(md_path)
    topic_dir = PDF_DIR / topic
    topic_dir.mkdir(parents=True, exist_ok=True)

    new_content = content
    success_count = 0

    for m in iframes:
        full_match = m.group(0)
        url = m.group(1)
        gd = GDRIVE_RE.search(url)
        od = ONEDRIVE_RE.search(url)

        if gd:
            file_id = gd.group(1)
            filename = f'{file_id}.pdf'
            dest = topic_dir / filename
            print(f'  drive: {file_id} → {topic}/{filename}')
            ok = download_gdrive(file_id, dest)
        elif od:
            qs = parse_qs(od.group(1))
            resid = qs.get('resid', [''])[0].split('!')[-1] or 'onedrive'
            filename = f'od-{safe_filename(resid)}.pdf'
            dest = topic_dir / filename
            print(f'  onedrive: {resid} → {topic}/{filename}')
            ok = download_onedrive(url, dest)
        else:
            print(f'  unknown URL pattern: {url}', file=sys.stderr)
            stats['unknown'] += 1
            continue

        if ok:
            public_path = f'/pdf/{topic}/{filename}'
            text = extract_text(dest)
            replacement = f'<PDFEmbed src="{public_path}" />'
            if text and len(text) > 100:
                # Append a details block beneath each embed for searchability
                replacement += (
                    f'\n\n<details>\n<summary>Show extracted text</summary>\n\n'
                    f'{text}\n\n</details>'
                )
            new_content = new_content.replace(full_match, replacement, 1)
            success_count += 1
            stats['downloaded'] += 1
        else:
            stats['failed'] += 1

    if success_count == 0:
        return

    # Convert .md to .mdx and add import
    new_content = add_import_to_mdx(new_content)
    new_path = md_path.with_suffix('.mdx')
    new_path.write_text(new_content, encoding='utf-8')
    if new_path != md_path:
        md_path.unlink()
    stats['files_updated'] += 1
    print(f'  ✓ wrote {new_path.relative_to(ROOT)}  ({success_count} embeds replaced)')


def main():
    md_files = sorted(DOCS.rglob('*.md'))
    print(f'Scanning {len(md_files)} MD files for iframe embeds...')

    stats = {'downloaded': 0, 'failed': 0, 'unknown': 0, 'files_updated': 0}
    for md in md_files:
        process_file(md, stats)

    print('\n=== summary ===')
    print(f'PDFs downloaded:  {stats["downloaded"]}')
    print(f'PDFs failed:      {stats["failed"]}')
    print(f'Unknown URLs:     {stats["unknown"]}')
    print(f'MD → MDX files updated: {stats["files_updated"]}')
    print(f'PDF root: {PDF_DIR}')


if __name__ == '__main__':
    main()
