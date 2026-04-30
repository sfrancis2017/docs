#!/usr/bin/env python3
"""
Post-fix the MDX files written by pdf_migrate.py:

1. Ensure a blank line between the `import PDFEmbed` statement and the body —
   MDX requires it; without it, parser tries to read the body as JS.
2. Wrap content inside `<details><summary>Show extracted text</summary> ... </details>`
   in a fenced code block so MDX treats it as literal text. Free PDF prose
   often contains `#`, `<`, `{`, etc. that MDX otherwise mis-parses as JSX.
3. Convert remaining failed-download `<iframe>` tags from raw HTML to JSX-safe
   form (self-closing).

Run:  python3 tools/fix_mdx.py
"""

import re
from pathlib import Path

ROOT = Path('/Users/sajivfrancis/Documents/docs-astro')
DOCS = ROOT / 'src' / 'content' / 'docs'

DETAILS_RE = re.compile(
    r'(<details>\s*\n<summary>[^<]*</summary>\s*\n)(.*?)(\n</details>)',
    re.DOTALL,
)

# Match raw <iframe ...></iframe> tags that may still exist (failed downloads)
IFRAME_RE = re.compile(
    r'<iframe([^>]*?)>\s*</iframe>', re.IGNORECASE
)

# Match HTML <img ...> (not self-closing). MDX requires JSX self-closing.
# Captures everything except an existing trailing slash.
IMG_RE = re.compile(
    r'<img\s+([^>]*?)(?<!/)>', re.IGNORECASE
)

# Match HTML <br>, <hr> (also need self-closing for JSX)
BR_HR_RE = re.compile(
    r'<(br|hr)\s*>', re.IGNORECASE
)


def fix_file(path: Path) -> bool:
    raw = path.read_text(encoding='utf-8')
    original = raw

    # 1. Ensure blank line between import and body.
    raw = re.sub(
        r"^(import PDFEmbed from '@/components/PDFEmbed\.astro';)\n([^\n])",
        r'\1\n\n\2',
        raw,
        flags=re.MULTILINE,
    )

    # 2. Wrap details body in a code fence.
    def wrap_details(m: re.Match) -> str:
        head, body, tail = m.group(1), m.group(2), m.group(3)
        # Skip if already fenced
        body_stripped = body.strip()
        if body_stripped.startswith('```') and body_stripped.endswith('```'):
            return m.group(0)
        # Strip stray control chars that confuse MDX
        cleaned = re.sub(r'[\x00-\x08\x0b\x0c\x0e-\x1f]', '', body).strip()
        return f"{head}\n```text\n{cleaned}\n```\n{tail}"

    raw = DETAILS_RE.sub(wrap_details, raw)

    # 3. Convert lingering raw iframes (failed downloads) to self-closing JSX form
    #    so MDX treats them as JSX elements and doesn't trip on the closing tag.
    def fix_iframe(m: re.Match) -> str:
        attrs = m.group(1).strip()
        return f'<iframe {attrs} />'

    raw = IFRAME_RE.sub(fix_iframe, raw)

    # 4. Convert <img ...> to <img ... />, and <br> / <hr> to self-closing.
    raw = IMG_RE.sub(lambda m: f'<img {m.group(1).strip()} />', raw)
    raw = BR_HR_RE.sub(lambda m: f'<{m.group(1).lower()} />', raw)

    if raw != original:
        path.write_text(raw, encoding='utf-8')
        return True
    return False


def main():
    fixed = 0
    for p in sorted(DOCS.rglob('*.mdx')):
        if fix_file(p):
            fixed += 1
            print(f'fixed: {p.relative_to(ROOT)}')
    print(f'\nFixed {fixed} files.')


if __name__ == '__main__':
    main()
