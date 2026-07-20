# CASSA · TART · Claude Skills

These are the custom **Claude Code skills** built for the CASSA/IUB TART work in
this repo. They live in `.claude/skills/` and are invoked automatically by Claude
when relevant (or on request).

---

## 1. `pdf-to-rag` — token-cheap document reading

**Location:** `.claude/skills/pdf-to-rag/` (`SKILL.md` + `pdf_rag.py`)

**What it does.** Instead of reading a whole PDF into the model's context (tens of
thousands of tokens), it builds a **local BM25 search index once** — no embedding
API, no network, no per-query token cost — then returns only the handful of
passages relevant to each question. Reading a long document drops from ~15k tokens
to a few hundred.

**How it was used for this project.** Every source doc was indexed to
`resources/*.rag.json` (these indexes are git-ignored — see `.gitignore`):

| Index | Source |
|---|---|
| `radio_astronomy.rag.json` | Burke & Graham-Smith textbook (background theory) |
| `tart_calibration.rag.json` | Continuous Calibration of TART (Molteno et al.) |
| `tart_instr_calib.rag.json` | Instrumentation & Calibration of TART (214-pg thesis) |
| `tart_modelling.rag.json` | Modelling a Nonlinearly-Spaced 24-Element Array |
| `tart_antenna.rag.json` | Newly Designed Antenna Platform for TART |
| `tart_group3/4/5.rag.json` | CASSA Workshop 2 group reports (IUB rooftop TART) |

**Usage:**
```bash
# index once (WSL): python3 = the interpreter, pdftotext is the extractor here
python3 .claude/skills/pdf-to-rag/pdf_rag.py index "resources/<file>.pdf" --out resources/<name>.rag.json
# then query only what you need
python3 .claude/skills/pdf-to-rag/pdf_rag.py query resources/<name>.rag.json "your question" -k 5
```

---

## Reference material Claude has learned for TART (not skills, but ground truth)

- `TART_IMAGING_COURSE.md` — full interferometry course + TART instance + Q&A defense.
- `STIMELA_RUN.md` — install + step-by-step `stimela run` commands.
- `tart_stimela_pythonized_ecdf.py` — the pipeline reimplemented in pure NumPy (the
  ground-truth logic behind each Stimela step).
- `all_recipes.txt` — the Stimela `tart_dl.yaml` recipe + CASA cab schemas.

The live TART: station `bd-iub`, API `https://api.elec.ac.nz/tart/bd-iub`,
GPS L1 (1.575 GHz), 24 antennas (4 dead), coplanar (w ≈ 0), all-sky, ~3.8° beam.
