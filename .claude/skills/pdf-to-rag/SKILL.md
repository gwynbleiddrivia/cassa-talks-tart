---
name: pdf-to-rag
description: >-
  Read and answer questions from a PDF while spending the fewest possible
  tokens. Use this INSTEAD of the Read tool whenever a PDF is more than a few
  pages, or whenever you only need specific facts from it. It builds a local
  BM25 index once (no tokens, no network, no embedding API) and then returns
  only the handful of passages relevant to each question. Triggers: "read this
  pdf", "what does the pdf say about X", "summarize this pdf", "learn from this
  document", any large .pdf.
---

# pdf-to-rag

## Why
`Read`-ing a whole PDF dumps every page into context — often tens of thousands
of tokens, most of them irrelevant. This skill moves the bulk work *outside*
the context window: a script extracts, chunks, and indexes the PDF locally,
then hands back only the top matching passages (with page numbers) per query.
Cost per question: just the few hundred tokens of the passages you actually read.

## The rule
**Do not `Read` a PDF that is more than ~3 pages.** Index it, then query it.

## Usage

The tool lives next to this file: `pdf_rag.py`. Run it with whatever Python is
available (in WSL use `python3`; from Windows you may need `wsl python3`).

1. **Index once** (cost: zero context tokens — output is tiny):
   ```
   python3 pdf_rag.py index "/path/to/doc.pdf"
   ```
   Produces `/path/to/doc.rag.json`. Re-running is idempotent.

2. **Query per question** (read back only what matches):
   ```
   python3 pdf_rag.py query "/path/to/doc.rag.json" "what is the refund policy?" -k 5
   ```
   Each hit is prefixed with its page number, e.g. `=== p.12 (score 8.31) ===`,
   so you can cite pages and, if truly needed, `Read` that exact page range.

3. **Stats** (optional): `python3 pdf_rag.py info "/path/to/doc.rag.json"`

Add `--json` to `query` for machine-readable output.

## How to use it well
- Ask **narrow, keyword-rich** questions — BM25 ranks by term overlap. Prefer the
  document's own likely vocabulary ("indemnification", not "who pays if sued").
- If a query misses, retry with synonyms or a higher `-k` before falling back to
  reading pages.
- To "summarize the whole PDF" cheaply: query for a spread of topics
  (introduction, conclusion, key terms) and synthesize from the returned chunks
  rather than reading everything.
- For a **scanned/image PDF**, `index` will report 0 chunks — OCR it first
  (e.g. `ocrmypdf in.pdf out.pdf`), then index `out.pdf`.

## How it works
Pure-Python BM25 over sliding-window chunks (~220 words, 40-word overlap),
page-tracked. Extraction tries `pypdf`/`PyPDF2` → `pdfplumber` → poppler
`pdftotext`. No embeddings, no API calls, deterministic, offline.

## Dependencies
Only a PDF text extractor is needed — any one of: `pypdf` (`pip install pypdf`),
`pdfplumber`, or poppler's `pdftotext`. BM25 and chunking use the standard
library only.
