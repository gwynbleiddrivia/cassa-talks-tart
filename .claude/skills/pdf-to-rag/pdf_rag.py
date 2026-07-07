#!/usr/bin/env python3
"""pdf_rag.py — token-cheap PDF retrieval.

Convert a PDF into a local, searchable index ONCE (outside any model
context window), then pull back only the passages relevant to a question.
No embedding API, no network, no per-query token cost — retrieval is a
pure-Python BM25 ranker over on-disk chunks.

Usage:
    python pdf_rag.py index  <file.pdf> [--out INDEX.json] [--words N] [--overlap N]
    python pdf_rag.py query  <INDEX.json> "your question" [-k 5] [--json]
    python pdf_rag.py info   <INDEX.json>

Typical flow for an agent trying to save tokens:
    1. Run `index` once per PDF  -> produces <file>.rag.json
    2. Run `query` per question  -> read back only the top-k chunks
"""
from __future__ import annotations

import argparse
import json
import math
import re
import sys
from collections import Counter
from pathlib import Path

# ---------------------------------------------------------------------------
# PDF text extraction (best-effort across whatever is installed)
# ---------------------------------------------------------------------------

def extract_pages(pdf_path: Path) -> list[str]:
    """Return one string per page. Tries pypdf, then PyPDF2, then pdfplumber,
    then the `pdftotext` CLI. Raises RuntimeError if none work."""
    errors = []

    # pypdf / PyPDF2
    for mod in ("pypdf", "PyPDF2"):
        try:
            reader_mod = __import__(mod)
            PdfReader = reader_mod.PdfReader
            reader = PdfReader(str(pdf_path))
            pages = [(p.extract_text() or "") for p in reader.pages]
            if any(pg.strip() for pg in pages):
                return pages
        except Exception as e:  # noqa: BLE001
            errors.append(f"{mod}: {e}")

    # pdfplumber
    try:
        import pdfplumber  # type: ignore
        with pdfplumber.open(str(pdf_path)) as pdf:
            pages = [(pg.extract_text() or "") for pg in pdf.pages]
        if any(pg.strip() for pg in pages):
            return pages
    except Exception as e:  # noqa: BLE001
        errors.append(f"pdfplumber: {e}")

    # pdftotext CLI (poppler)
    try:
        import subprocess
        out = subprocess.run(
            ["pdftotext", "-layout", str(pdf_path), "-"],
            capture_output=True, text=True, check=True,
        ).stdout
        # split on form-feed which pdftotext emits between pages
        pages = out.split("\f")
        if any(pg.strip() for pg in pages):
            return pages
    except Exception as e:  # noqa: BLE001
        errors.append(f"pdftotext: {e}")

    raise RuntimeError(
        "Could not extract text. Install one of: pypdf, pdfplumber, or "
        "poppler's pdftotext.\nDetails:\n  " + "\n  ".join(errors)
    )


# ---------------------------------------------------------------------------
# Chunking
# ---------------------------------------------------------------------------

def clean(text: str) -> str:
    text = text.replace("­", "")          # soft hyphens
    text = re.sub(r"-\n(?=\w)", "", text)       # de-hyphenate line breaks
    text = re.sub(r"[ \t]+", " ", text)
    text = re.sub(r"\n{3,}", "\n\n", text)
    return text.strip()


def chunk_pages(pages: list[str], words_per_chunk: int, overlap: int) -> list[dict]:
    """Sliding-window chunks that remember which page(s) they came from."""
    chunks: list[dict] = []
    for page_no, raw in enumerate(pages, start=1):
        words = clean(raw).split()
        if not words:
            continue
        step = max(1, words_per_chunk - overlap)
        for start in range(0, len(words), step):
            window = words[start:start + words_per_chunk]
            if not window:
                break
            chunks.append({
                "id": len(chunks),
                "page": page_no,
                "text": " ".join(window),
            })
            if start + words_per_chunk >= len(words):
                break
    return chunks


# ---------------------------------------------------------------------------
# BM25 (pure Python, no numpy)
# ---------------------------------------------------------------------------

_TOKEN_RE = re.compile(r"[A-Za-z0-9]+")


def tokenize(text: str) -> list[str]:
    return _TOKEN_RE.findall(text.lower())


def build_index(chunks: list[dict], source: str) -> dict:
    docs_tokens = [tokenize(c["text"]) for c in chunks]
    doc_len = [len(t) for t in docs_tokens]
    n = len(chunks)
    avgdl = (sum(doc_len) / n) if n else 0.0

    df: Counter[str] = Counter()
    postings: list[dict] = []
    for toks in docs_tokens:
        tf = Counter(toks)
        postings.append(dict(tf))
        for term in tf:
            df[term] += 1

    idf = {
        term: math.log(1 + (n - d + 0.5) / (d + 0.5))
        for term, d in df.items()
    }

    return {
        "source": source,
        "n_chunks": n,
        "avgdl": avgdl,
        "doc_len": doc_len,
        "idf": idf,
        "postings": postings,
        "chunks": chunks,
    }


def bm25_search(index: dict, query: str, k: int, k1: float = 1.5, b: float = 0.75):
    q_terms = tokenize(query)
    avgdl = index["avgdl"] or 1.0
    idf = index["idf"]
    postings = index["postings"]
    doc_len = index["doc_len"]

    scores = [0.0] * index["n_chunks"]
    for term in q_terms:
        term_idf = idf.get(term)
        if term_idf is None:
            continue
        for i, tf_map in enumerate(postings):
            tf = tf_map.get(term)
            if not tf:
                continue
            denom = tf + k1 * (1 - b + b * doc_len[i] / avgdl)
            scores[i] += term_idf * (tf * (k1 + 1)) / denom

    ranked = sorted(
        (i for i in range(len(scores)) if scores[i] > 0),
        key=lambda i: scores[i],
        reverse=True,
    )[:k]
    return [(index["chunks"][i], scores[i]) for i in ranked]


# ---------------------------------------------------------------------------
# CLI
# ---------------------------------------------------------------------------

def cmd_index(args) -> int:
    pdf_path = Path(args.pdf)
    if not pdf_path.exists():
        print(f"error: no such file: {pdf_path}", file=sys.stderr)
        return 1
    out = Path(args.out) if args.out else pdf_path.with_suffix(".rag.json")

    pages = extract_pages(pdf_path)
    chunks = chunk_pages(pages, args.words, args.overlap)
    if not chunks:
        print("error: extracted 0 chunks (is this a scanned/image PDF? "
              "OCR it first)", file=sys.stderr)
        return 1
    index = build_index(chunks, source=str(pdf_path))
    out.write_text(json.dumps(index), encoding="utf-8")
    print(f"indexed {len(pages)} pages -> {len(chunks)} chunks")
    print(f"wrote {out}")
    return 0


def _load(index_path: str) -> dict:
    return json.loads(Path(index_path).read_text(encoding="utf-8"))


def cmd_query(args) -> int:
    index = _load(args.index)
    hits = bm25_search(index, args.question, args.k)
    if args.json:
        print(json.dumps([
            {"page": c["page"], "score": round(s, 3), "text": c["text"]}
            for c, s in hits
        ], ensure_ascii=False, indent=2))
        return 0
    if not hits:
        print("(no matching passages — try different keywords)")
        return 0
    for c, s in hits:
        print(f"\n=== p.{c['page']}  (score {s:.2f}) ===")
        print(c["text"])
    return 0


def cmd_info(args) -> int:
    index = _load(args.index)
    print(f"source:   {index['source']}")
    print(f"chunks:   {index['n_chunks']}")
    print(f"avg len:  {index['avgdl']:.0f} tokens/chunk")
    print(f"vocab:    {len(index['idf'])} unique terms")
    return 0


def main(argv=None) -> int:
    p = argparse.ArgumentParser(description=__doc__,
                                formatter_class=argparse.RawDescriptionHelpFormatter)
    sub = p.add_subparsers(dest="cmd", required=True)

    pi = sub.add_parser("index", help="build a searchable index from a PDF")
    pi.add_argument("pdf")
    pi.add_argument("--out", help="index path (default: <pdf>.rag.json)")
    pi.add_argument("--words", type=int, default=220, help="words per chunk")
    pi.add_argument("--overlap", type=int, default=40, help="word overlap")
    pi.set_defaults(func=cmd_index)

    pq = sub.add_parser("query", help="retrieve top-k passages for a question")
    pq.add_argument("index")
    pq.add_argument("question")
    pq.add_argument("-k", type=int, default=5, help="number of passages")
    pq.add_argument("--json", action="store_true", help="machine-readable output")
    pq.set_defaults(func=cmd_query)

    pf = sub.add_parser("info", help="show index stats")
    pf.add_argument("index")
    pf.set_defaults(func=cmd_info)

    args = p.parse_args(argv)
    return args.func(args)


if __name__ == "__main__":
    raise SystemExit(main())
