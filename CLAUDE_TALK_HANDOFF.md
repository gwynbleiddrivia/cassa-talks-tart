# TART TALK — BUILD HANDOFF (paste this first in any new session)
# ►► v5: read "SESSION-4 UPDATE (v5)" at the BOTTOM first — it has the CURRENT state and the one
#      OPEN question (CAL_SOURCE). Then SESSION-3 (v4) for architecture. The physics below is all
#      still valid; the FILENAME lists in v4 were wrong and have been corrected in place.

## Session start checklist
Re-attach these (files do NOT persist across sessions):
1. `tart_stimela_pythonized_ecdf.py`  ← the real pipeline, ground truth
2. `App.jsx`                          ← the React deck being built
3. this file
(The TART mini-course does NOT need re-uploading — distilled here.)
4. talk_abstract.txt

## Who / what
Dreyfus (CASSA, Independent University of Bangladesh) presents at **PSSARC 2026,
Cebu, Philippines** — theme "Under One Sky: Expanding Horizon Together". National
space-science conference with an outreach/education track. **Audience is MIXED:
students, educators, researchers, public.** → OUTREACH REGISTER: story over rigor.
**13 minutes.** Slides exported as PDF; a QR on each slide links to an interactive
web version (Vercel) that Dreyfus invites the audience to play with. So: heavy
interactivity lives behind the QR; slides stay clean.

Hook to open/close with: TART proves you don't need a giant dish — 24 tiny
antennas + math = a radio telescope a university can build. That IS "expanding
horizon together."

## Working mode
Dreyfus builds every graph himself in a Colab notebook (he has live TART API +
network). Claude directs, explains, supplies plotting snippets. One graph + one
plain sentence per slide. Guided learning: explain at concrete, no-assumed-
knowledge level. Dreyfus wants to VISUALIZE every numerical state change.

## THE SLIDE PLAN (Dreyfus's own, agreed — this is the spine)
S1. **24-hour slider** — sky image per hour; user drags time, sky distribution
    changes. (Opens with the RESULT; the rest of the talk explains how.)
    ! CORRECTION BAKED IN: these are 24 INDEPENDENT snapshots. uv-coverage is
    IDENTICAL every frame; only the sky changes (satellites moved). NOT Earth-
    rotation synthesis.
S2. **TART array** — antenna layout (cell 10). 24 antennas, 4 dead.
S3. **Baselines** — draw lines between every pair of antennas. N(N-1)/2 = 276.
S4. **uv-plane** — each baseline vector replotted from (0,0) at centre of the uv
    diagram. Frozen geometry.
S5. **Hermitian mirror** — add (-u,-v) for each point (sky is real => 
    V(-u,-v)=conj(V(u,v))). 276 -> 552.
S6. **Arrows** — every uv point is an ARROW: length=|V|, angle=phase(V).
    BEFORE vs AFTER calibration. (Bigger arrows than the draft figure.)
S7. **Fringes superimpose** — the interactive slider adding fringes one by one
    until S1's image reappears. THE payoff slide. Dreyfus loved this one.
S8. (later) dirty beam / CLEAN — App.jsx's current 3-box triptych gets replaced;
    "that is for later."

## PHYSICS RESOLVED — carry these verbatim, they ARE the talk's clarity

**Fringe direction (S3/S4/S7).** Baseline = DIFFERENCE vector b = ant_j - ant_i.
NOT a "resultant" of two directions (points have no direction). **Fringe stripes
run PERPENDICULAR to b**, because phase = 2*pi*(b.s_hat)/lambda changes fastest
ALONG b and is constant across it. E-W baseline -> N-S stripes. Spacing ~ 1/|b|
in (l,m): long baseline -> fine stripes. Arrow length -> fringe fineness; arrow
direction -> stripe orientation (at 90 deg to the arrow).

**Earth rotation (S1).** Classical synthesis (VLA/Ryle): track a source for hours;
(u,v) is defined w.r.t. the SKY phase centre, so as Earth turns each baseline
sweeps an ELLIPSE in uv -> densely filled uv-plane -> clean beam. That's the
textbook artwork. **TART CANNOT do this**: rotation synthesis requires a STATIC
sky, but GNSS satellites cross the sky in MINUTES. So TART is a SNAPSHOT
instrument — it buys uv-coverage with MANY ANTENNAS AT ONCE (24 -> 276 baselines
instantly) instead of ONE BASELINE OVER TIME. Talk beat: "big telescopes buy
coverage with patience; TART buys it with numbers."

**Superposition, not convergence (S7).** Fringes do NOT travel inward and meet.
Each is a full-sky sinusoid; the PSF is their POINTWISE SUM. "Convergence" is in
PHASE not space: at field centre every cosine = 1 -> they add coherently -> peak.
Off-centre they drift out of step -> cancel. Residue = sidelobes.
1 baseline = endless comb of ridges (no localization). 2 = lattice of peaks
(grating lobes). MANY incommensurate baselines -> off-centre peaks wash out, ONE
peak survives. THAT washing-out IS aperture synthesis.

**Calibration destination (S6) — the recurring confusion, now settled.**
Fringe DIRECTION is perpendicular to the baseline = fixed by antenna geometry =
**calibration can never move it.** Calibration only rotates/rescales the ARROW
(phase/amplitude), which slides that fringe's crests SIDEWAYS. Destination =
"the phase this baseline would have read IF THE ANTENNA CLOCKS WERE SYNCED" —
NOT "aimed at a satellite." No arrow ever points at a source. A source's position
lives only in the PATTERN ACROSS ALL 552 ARROWS, and appears only in the sum.
CLOCK METAPHOR (use this on the slide): each antenna has its own clock, all off by
unknown amounts. A baseline reads (true sky phase) + (clock_i - clock_j).
Calibration = find each clock error, subtract it. Then crests line up -> sources
focus.

**Not circular — BENT RULER (Q&A only, do NOT slide it).** To calibrate a ruler you
suspect is stretched, measure a known 1-metre rod -> learn the stretch factor ->
now measure unknown things correctly. Known satellites (positions from EXTERNAL
ephemerides, nothing to do with your data) = the 1-m rod. You correct the
INSTRUMENT, not the sky. Airtight three ways: (1) only 24 antenna gains (~23
independent offsets) — far too few knobs to fake 5-10 sources at independent
positions; (2) calibrate on satellites A,B,C -> D,E still image correctly;
(3) closure phases around antenna triangles are gain-INDEPENDENT and still show
the sources. For a mixed PSSARC audience, raising the doubt costs a minute and
confuses students — keep the bent-ruler line in the back pocket.

**Also settled earlier:**
- WEIGHT = `Wbriggs[k]`, a real per-baseline multiplier (resolution vs noise).
  Nearly flat for TART. (Not "rho" — that rename was a mistake.)
- Complex gain = |g|*exp(i*phi): exp(i*phi) rotates, |g| scales. Gains come from
  StefCal (cell 12) or the API (cell 8) — never invented by hand.
- StefCal fits 24 per-antenna gains so g_i*conj(g_j)*MODEL ~ DATA (least squares).
  API gains = same idea, solved server-side over many snapshots -> more robust.
  YES the API also uses the satellite model — as the calibration REFERENCE, exactly
  like the 1-m rod. Neither injects the image.
- Direct DFT loops every baseline over every pixel (~65M complex exp @ NG=512).
  Fine for a snapshot; big arrays use gridding+FFT. Fringe is exponential =
  cos + i*sin (carries phase); Re() extracts real brightness. The fancy R = "real
  part".
- Image is natively in (l,m). SIN WCS header (cell 21) only lets EXTERNAL tools
  read pixel->RA/Dec; TART's own overlay never needs RA/Dec.
- Direction cosines: look straight down on the hemisphere; (l,m) = flattened
  east/north coords; n=sqrt(1-l^2-m^2) = height flattened away. Horizon = the
  circle l^2+m^2=1. Rim piles up -> equal pixel != equal angle. Corners = below
  horizon.
- 1-bit correlator (sign only) -> |V| <~ 1 (Van Vleck). solnorm sets mean gain = 1,
  removing absolute scale -> brightness is RELATIVE (Jy/beam label, arbitrary
  zero-point). Positions (phase = geometry) trustworthy; absolute flux NOT.
- zeta = Omega_earth * dt: Omega_earth = 7.29e-5 rad/s (Earth spin), dt = 30.75 s
  (half snapshot) -> zeta = 0.128 deg = how far the sky turns -> nudges w off zero.
  Worst w = 0.037 lambda -> <=13 deg phase -> negligible vs the 3.8 deg beam -> one
  w-layer is EXACT, not a fudge.
- Dirty image = true sky (convolved with) dirty beam. A point source is NOT one
  pixel — it's the whole PSF splatter. "Bright points on a plane" = the CLEAN
  MODEL, three stages downstream, not the FT output.
- CLEAN (cell 20): brightest residual pixel -> record gain*peak into model ->
  subtract gain*(shifted PSF) -> repeat (peels source AND its sidelobes). Major
  cycle recomputes exact residual from visibilities. Restore: model convolved with
  Gaussian beam + residual.
- sigma = robust MAD noise (1.4826*median|img-median|). auto-mask=5 -> stop
  cleaning at 5 sigma so noise isn't mistaken for sources.

## PIPELINE FACTS (ground truth = `tart_stimela_pythonized_ecdf.py`)
Pure-NumPy re-implementation of the Stimela `tart-image` recipe, station `bd-iub`.
- 24 antennas, coplanar (z=0 -> w=0 exactly), lambda=0.1903 m (GPS L1, 1.575 GHz).
- 4 dead antennas (|gain|~0) -> baselines flagged; ~250 survive of 276.
- API: `https://api.elec.ac.nz/tart/bd-iub/api/v1/{mode/current, calibration/gain,
  imaging/vis, info}`. `calibration/gain` -> published `gain` (mag) +
  `phase_offset` (phase) = TART's OWN server-side calibration.
- Cell map: 10 antenna layout | 9 uv-coverage | 6 MODEL (satellite point sources) |
  12 StefCal amplitude (G0a, solnorm) | 14 StefCal phase (G0p) | 17 applycal
  (CORRECTED = DATA/(G_p*conj(G_q))) | 18 Briggs weight (Wbriggs) | 19 direct-DFT
  dirty image + PSF | 20 Cotton-Schwab CLEAN + restore | 21 FITS.
- Imager (cell 19): I(l,m) = sum_bl Re( V_bl * Wbriggs_bl * exp(+2i*pi*(u*l+v*m)) ).
- Overlay in (l,m) directly: sat_lm: l=cos(el)*sin(az), m=cos(el)*cos(az).
- CAL_SOURCE default "api-phase" (trust published phases, mag=1); alt "solved".

## FIGURES ALREADY GENERATED (regenerable from tart_visual_state_trace.ipynb)
- fig1_fringe.png — one (u,v) -> one stripe pattern, 3 examples
- fig2_visibility_calib.png — V as an arrow on the complex plane, raw vs corrected
- fig3_uv_cloud.png — antennas -> baselines -> uv points
- fig4_image_assembles.png — 1/8/40/all fringes overlaid, sources emerge
- fig5_dirty_beam.png — PSF splatter
- arrows_uv.png — arrows on uv, BEFORE vs AFTER calibration (needs BIGGER arrows
  per Dreyfus; this is S6)

## SNIPPETS NEEDED (Claude supplies, Dreyfus runs in Colab on REAL data)
A. Single fringe: cos(2*pi*(u*L+v*M)) on the l,m disk for chosen (u,v).
B. Arrows on uv: quiver at (u,v), U=|V|*cos(phase), V=|V|*sin(phase), coloured by
   np.angle; DATA vs CORRECTED (from ms["DATA"] vs ms["CORRECTED"]). BIG arrows.
C. Fringe build-up: dft_image summing only the first n baselines, n=1..552 -> the
   S7 slider, on the REAL image (Dreyfus explicitly wants this on his own data).
D. 24-hour: loop snapshots over 24 h, one image per hour -> the S1 slider.

## CURRENT STATE / NEXT ACTION
- All conceptual fog cleared (fringe direction, Earth rotation, calibration
  destination, circularity, weights, real-part, WCS, 1-bit, w-term, CLEAN,
  auto-mask).
- Slide plan S1-S7 agreed. S8+ (dirty/CLEAN) deferred; App.jsx triptych to be
  replaced "later".
- NEXT: Dreyfus runs the notebook end-to-end so real arrays exist (DATA,
  CORRECTED, U, V, dirty, psf, restored, visible/satlm). THEN build S1->S7 one at
  a time: matplotlib graph in Colab -> React slide in App.jsx.
- OPEN QUESTION: S1 needs 24 hourly snapshots from the API (or archived h5) —
  confirm data availability before committing to that opener.

---

# ═══════════ SESSION-2 UPDATE (v3) — read this SECOND, it is the CURRENT state ═══════════

## STATUS: deck is DEPLOYED & live; command slides BUILT; graphs are the next work.

### Who / deployment (all DONE — continuous deployment works)
- User = "Dreyfus" / Yasin (MYA Khondoker), Group 4, CASSA/IUB. Talk = the WHOLE
  `talk_abstract.txt` (imaging + open data); a separate hardware talk is NOT his.
- GitHub: `github.com/gwynbleiddrivia/cassa-talks-tart`, branch `main`, all pushed.
- Host: **Vercel**, auto-deploys on every push (~30 s). Live URL: vercel.com → project → Visit.
- Dev loop: WSL terminal → `npm run dev` (localhost:5173, hot reload) →
  `git add -A && git commit -m "…" && git push` → live. Run git INSIDE WSL
  (Windows git on `\\wsl$` throws "dubious ownership"). Docker dev is optional.
- Stack: Vite + React + `qrcode.react`.

### The deck (App.jsx / App.css) — current build
- `SLIDE_DATA` array drives everything. Two render branches:
  - simple (no `layout` field): centred title + description + grey math-box → the 5 intro graph placeholders.
  - `layout:"triptych"`: 2×2 grid — LEFT `concept` (spans both rows) | TOP-RIGHT `algorithm` | BOTTOM-RIGHT `recipe`.
- App.css: triptych grid; presentation fonts via `clamp(vw)` (KNOB = 3rd clamp value);
  mobile ≤600px → single column, borderless, code in grey boxes; desktop ≥601px →
  top-right LIGHT-GREY box + bottom-right DARK TERMINAL box.
- **STANDING RULE: Claude does NOT edit App.jsx/App.css.** Give paste-ready blocks +
  exact location; Dreyfus types them (learning full-stack). Graphs: Dreyfus runs
  matplotlib in Colab on live data; Claude supplies snippets → then port to React.

### REVISED SLIDE PLAN (this supersedes the S1–S7 *structure* above; the physics above still holds)
- **Slides 1–5**: interactive graphs = interferometry essence + how the TART image forms
  (built later in Colab; concepts = the old S1–S7: 24h slider, array, baselines, uv, fringe build-up).
- **Slide 6**: dependency install — triptych (left=why, top-right=requirements, bottom-right=install cmds from STIMELA_RUN.md).
- **Slides 7–14**: one interferometry stage each — triptych: LEFT = what the stage does,
  TOP-RIGHT = plain-language algorithm (**NO Python**), BOTTOM-RIGHT = the real
  `stimela run tart_dl.yaml tart=bd-iub -s <step>` command(s). Stages:
  1 download-hdf | 2 create-ms | 3 updateobservatory+flagsave | 4 plotuv+plotants+lister |
  5 calibrate_amplitude | 6 calibrate_phase | 7 applycal | 8 snapshotimage.
  (Full paste-ready SLIDE_DATA was delivered and is in App.jsx.)
- Stimela is SHOWN (commands) but **NOT run locally** (dependency horror). **ALL graphs
  come from the pythonized notebook** `tart_stimela_pythonized_ecdf.py` (Colab, live API).

### FOUR "after-stage" visualizations Dreyfus wants — ALL from the NOTEBOOK
1+2. **THE MEASUREMENT SET.** The notebook's `ms` dict IS a minimal MS (ANTENNA1/2, UVW,
   U, V, DATA, MODEL, CORRECTED). Show as a pandas table (amp+phase columns, not raw
   complex). `ms["CORRECTED"]` only exists after the applycal cell → that IS "the extra
   column calibration adds." ✅ tables generated (|DATA|==|CORRECTED|, phase moves).
   NEXT: style into a slide (React table or matplotlib-table screenshot).
3. **VISIBILITY ARROWS** on the uv-plane, BEFORE (`ms["DATA"]`) vs AFTER (`ms["CORRECTED"]`).
   CRITICAL distinction: the uv DOT = baseline vector (fixed, calibration never moves it);
   the ARROW drawn at it = the VISIBILITY (length=|V|, angle=phase(V)) — THAT rotates/rescales.
   `quiver(u,v, |V|cos∠, |V|sin∠, color=∠)` + Hermitian mirror (−u,−v). BIG arrows.
   In api-phase mode arrows only ROTATE (|V| unchanged). ← THE NEXT GRAPH TO BUILD.
4. **FRINGE SUPERPOSITION slider** — sum the first n baselines' fringes (notebook `dft_image`
   over first n), n=1→276 (→552 with mirrors); at n=all → the dirty image. THE payoff.
   Interactive React slider on the real image.

### PHASE-ONLY vs gain+phase (StefCal "solved") — SETTLED, use on the calibration slide
- Proof in the table: |DATA| == |CORRECTED| to the last digit; only phase° moved → phase-only.
- Two knobs per antenna: amplitude (loudness) + phase (clock offset). POSITION lives in PHASE
  → phase must be right → phase-only nails positions.
- Amplitude cal = DIVIDE by each antenna's gain; 4 dead antennas (gain≈0) → blows noise into
  fake sources (the historical misalignment bug) → phase-only is the SAFE path.
- TART has NO absolute flux scale (1-bit + solnorm) → amplitude cal buys no science.
  StefCal "solved" fits BOTH |g| and phase (would rescale |V|), guarded by solnorm + flagging.

### NEXT ACTION (resume exactly here)
1. Style the MS table (#1/#2) into a slide.
2. Build **#3 arrows** (spec above) in Colab → verify on real data → port to React.
3. Build **#4 fringe-superposition slider** (the payoff).
4. Later: real CASA MS screenshot (run `create-ms` somewhere) for authenticity; the 5 intro graphs.

### Claude's TART skills & learned docs
- Skills doc: `CASSA_TART_CLAUDE_SKILLS.md` (the `pdf-to-rag` skill; indexes at `resources/*.rag.json`, git-ignored).
- Ground truth in repo: `TART_IMAGING_COURSE.md` (50-lesson course + Q&A), `STIMELA_RUN.md`
  (install + per-step commands), `all_recipes.txt` (Stimela recipe), `tart_stimela_pythonized_ecdf.py` (pipeline logic).
- Claude also persists cross-session memory (MEMORY.md index): user-yasin, tart-project-focus,
  tart-imaging-pipeline, tart-talk-deck, pdf-token-efficiency.

---

# ═══════════ SESSION-3 UPDATE (v4) — CURRENT STATE, read this FIRST ═══════════

## STATUS: deck heavily expanded; graphs built on bd-iub; calibration switched to StefCal "solved".

### Big changes this session
- **Station: hamskraal → `bd-iub`.** All uv/sum/frame graphs regenerated on bd-iub. Re-running the
  notebook cells + re-copying PNGs is all that's needed if data changes.
- **Calibration: `CAL_SOURCE="api-phase"` → `"solved"`** (StefCal, `G=G0a*G0p`). Now CORRECTED differs
  from DATA in BOTH amplitude and phase → `|DATA| != |CORR|` (the old phase-only proof is GONE).
  Watch dead-antenna amplitude blowups (clip amplitudes by percentile when scaling arrows).
- **Frequency corrected: GPS L1 = 1.575 GHz** (NOT 1.5 MHz), λ = 0.19 m.

### App.jsx architecture (STANDING RULE: Claude gives paste-ready blocks + location; Dreyfus types. Never edit App.jsx/App.css directly.)
`SLIDE_DATA` array → render ternary switching on `slide.layout`. Layouts implemented:
- `cover` — theme + big title + authors[{name,bold}] + meta. (page 1; MYA Khondoker bold+blue)
- `stack` — images[] stacked; `.slide-content:has(.img-stack){max-width:100%}` lets them fill width.
- `gallery` — photos[{src,caption}] in a row (workshop photos). Full-bleed since session 4:
  `flex:1 1 0` per figure + `height:clamp(240px,58vh,760px)` + `object-fit:cover` → equal-height row.
- `agenda` — the talk's roadmap (slide 4). lead (one-line interferometry definition) +
  parts[{num,title,kicker,items[],later?}] → 3 columns; `later:true` greys a column out
  (used for "The Hardware — presented in the later talk"). **REPLACED `overview`**, which is gone.
- `interactive` — instances[] of <BaselineExplorer>; single instance auto-sizes to 300, pairs to 150.
  Currently UNUSED (the one slide that used it became `img-interactive`).
- `img-interactive` — image left + one <BaselineExplorer> right. Fields: image, caption, sep, ang, size.
  `size` MUST be ~160 in this half-width column or the explorer's 3 panels silently wrap 2-over-1.
- `triptych` — concept(heading,points[]) | algorithm(code) | recipe(code). Stage slides.
- `download` — file → <a download> button (needs public/tart-talk.pdf; PDF made via Ctrl+P print CSS).
- default(simple) — stage/title/content/formula.
Recurring App.jsx bug: leftover `({/** ... */})` comment blocks render literal `()` — delete them.

### App.css notables
`.slide-content{margin:auto;max-width:900px}` — the 900px cap is THE thing that makes a slide look
cramped. Escape it per-layout: `.slide-content:has(.img-stack), .slide-content:has(.gallery){max-width:100%}`
and `.slide-content.agenda{max-width:100%}` / `.slide-content.img-interactive{max-width:100%}`.
Print CSS `@media print`: each `.slide-page` = one page, landscape, `.slide-content{max-height:100vh;
overflow:hidden}`, `.img-stack img{max-height:60vh}`. NOTE: the `.pair-row{display:none}` print rule
described in v3 is NOT actually in App.css — interactives DO currently print.
Classes: cover*, gallery, agenda/agenda-lead/agenda-cols/agenda-part(.later)/part-num/part-title/
part-kicker, img-interactive/ii-row/ii-left/ii-right, pair-row, img-stack, dl-btn, chips/chip/roadmap/pill
(the chip+pill CSS survives but `overview` no longer uses it).

### Components
- `BaselineExplorer.jsx` — props {sep,ang,size}. 3 panels: ground (baseline CENTERED, symmetric ax/bx;
  GROUND_SCALE=(2*(C-16))/MAX_SEP), uv dot, fringe canvas. Two sliders. size 150 in pairs / 300 solo.
- `FringeSlider.jsx` — pre-rendered frames `/frames/frame_NNN.png` (ONE `frames/` level).
  `N = 34`, matching the 34 files on disk for bd-iub — VERIFIED 2026-07-30. Range slider + caption
  (no play/pause in the current build). Still the payoff slide; the static sum slides were never built.

### Colab graph cells (all read notebook `ms`/`u`/`v`; keep a SELF-CONTAINED setup block on top of each,
because single-letter globals get clobbered — `k` (interference cell set k=2π/λ; rename kw), `L/M`
(meshgrid; rename Lg/Mg), `u/v`, and `arrows()` got redefined). Setup defines: mask, u, v, phd, phc,
k (AUTO-picked = argmax(phase-change × min-amp) so the zoom shows both amp & phase change), uk/vk,
Vd_k/Vc_k, ampd/ampc, BLUE/HL/MIR, L, lim, uvbox(), arrows(ax,U,V,PH,color,alpha), ghost(), cfmt().
Images — VERIFIED against `public/` on 2026-07-30. These are the REAL filenames; earlier
drafts of this list used names that were never on disk (see "renamed / never existed" below).
- `uv1.png` Slide1: ① antenna layout (⟂-offset length label, white bbox) | ② baseline→uv dot (orange line).
- `uv2.png` Slide2: ③ ALL dots, both orange(before)+blue(after) arrows via arrows() FIXED length |
  ④ Argand zoom of one point — before(orange dotted)/after(blue) arrows, 2 boxes (complex #s | amplitude & phase).
- `uv3.png` Slide3: ⑤ + conjugate twins (mirror −u,−v) | ⑥ Argand V+V*=real (green sum on real axis).
- `uv4.png` Slide4: ⑦ full uv-map (blue+mirror) | ⑧ hollow-circle "to-do list".
- `frames/frame_NNN.png` — 34 files, `frame_000`…`frame_033`. 3-panel, log-spaced, for FringeSlider.
  NOTE: **one** `frames/` level, i.e. `public/frames/frame_000.png` → served as `/frames/frame_000.png`.
- `fringe.png` — line-art: antennas + wavefronts + bright-band lines + eye, close/far side by side.
  (**`.png`, NOT `.jpg`** — the old note said `fringe.jpg` and the image silently failed to render.)
- `interference.png` — two in-phase sources close/far → bold/fine bands.
- `baseline.png` — line→dot→fringe, short/long. (Was listed as `baseline_to_fringe.png`.)
- `argand.png` — complex-plane figure.
- `ms.png` / `ms_cal.png` — pandas MS tables as images, before/after applycal (corr now differs in |V| too).
  (Were listed as `mstable.png` / `mstable_corr.png`.)
- `gain.png` / `phase.png` — from plotcal outputs (Dreyfus supplies).
- `clean.png`, `final.png`, `tartpic.jpg`, `conf1.jpg`, `conf2.jpg`, `conf3.jpg`, `final_pdf.pdf`.

RENAMED / NEVER EXISTED — do not reference these, they are not in `public/`:
`fringe.jpg` (→ `fringe.png`), `baseline_to_fringe.png` (→ `baseline.png`),
`mstable.png`/`mstable_corr.png` (→ `ms.png`/`ms_cal.png`), `baseline_origin.png` (absent),
`sumsteps/sum{1,2,30,150,full}.png` (absent — the sum-step slides were never added to SLIDE_DATA;
the payoff slide uses FringeSlider instead).

### CURRENT SLIDE ORDER — read straight off App.jsx, VERIFIED 2026-07-30 (19 slides)
1 cover · 2 "The TART Telescope" (tartpic) · 3 workshop gallery · 4 **agenda** ·
5 "What a Fringe Is — and How It Changes with Distance and Angle" (img-interactive: fringe.png + explorer) ·
6 uv1 · 7 uv2 · 8 uv3 · 9 uv4 · 10 payoff (FringeSlider) · 11 Install the Pipeline ·
12 Stage 1 Download · 13 Stage 2 Create MS · 14 ms.png · 15 Stage 3 Label & Safeguard ·
16 Stage 4 Inspect · 17 "How Does It Know?" · 18 Stage 5 Amplitudes · 19 gain.png ·
20 Stage 6 Phases · 21 phase.png · 22 Stage 7 Applycal · 23 ms_cal.png · 24 Stage 8 CLEAN ·
25 clean.png · 26 final.png · 27 download.
NOT YET BUILT but promised by the slide-4 agenda: "Two antennas, one interference pattern"
(interference.png), "One baseline makes one fringe" (baseline.png), "A fringe — the slice of sky a pair
sees". Either add them between 4 and 5, or trim those three lines from the agenda's part 01.

### PHYSICS SETTLED THIS SESSION (carry verbatim)
- uv-plane is NOT the complex plane: u,v are REAL coords (baseline gap ÷ λ, in wavelengths). The
  visibility is the complex number (phasor) drawn as an arrow AT each dot. Two origins: antenna-map
  origin arbitrary (cancels in the difference); uv-centre = zero baseline (physical).
- Arrow A = baseline vector (geometry, fixed, sets fringe orientation ⟂ + spacing ∝1/|b|). Arrow B =
  visibility (rotates+rescales in calibration; length=amplitude, angle=phase). Different things.
- Hermitian mirror = point reflection through origin (u,v)→(−u,−v), phase negated (conjugate). SAME
  fact as orientation 0–180° (swap the two antennas). V+V*=2Re(V)=real → the sky is real.
- Fringe bolder/finer = band SPACING (≈ λ ÷ antenna separation), not line thickness. Farther → finer.
- Calibration reasons: per-antenna cable/electronics path, clock offsets, gains, antenna-position survey
  error. NOT the ionosphere (3 m baselines look through the same patch → cancels). Bent-ruler answers
  circularity: satellite positions from external ephemerides, only ~23 gains solved, closure phases check.
- inverse Fourier IS fringes superimposing; the sum washes out everywhere except real sources.

### Ionosphere/scintillation paper idea (Q&A / side project, NOT the talk)
All-sky GNSS scintillation over Bangladesh (northern EIA crest, under-instrumented, near solar max) with
TART's imaging = the novel angle. Hard limits: 1-bit amplitude (S4 needs validation vs a real receiver),
Fresnel scale ~250–400 m ≫ 3 m array (single coherence patch, no spatial resolving), single frequency
(no dual-freq TEC). Y-values: S4, σφ, ROTI, TEC. Email Tim Molteno before committing.

---

# ═══════════ SESSION-4 UPDATE (v5) — 2026-07-30 — CURRENT STATE, read this FIRST ═══════════

## What changed
1. **Gallery slide (3) now full-bleed.** The `900px` `.slide-content` cap was the culprit; escaped via
   `:has(.gallery)`, plus `flex:1 1 0` + `height:clamp(240px,58vh,760px)` + `object-fit:cover`.
   Knob = the `58vh`. Cropping is centre-weighted; swap to `object-fit:contain` if an edge matters.
2. **Slide 4 rebuilt as `agenda`** — replaces `overview` entirely (that layout is now dead code).
   It is the talk's contract with the audience: a one-line interferometry definition, then EVERY
   slide title listed under three parts — 01 Feel the Interferometry (graphical) / 02 Run the
   Software Pipeline (Stimela on open data) / 03 The Hardware, greyed out via `later:true` because
   it is a SEPARATE later talk. That 3-part shape IS the talk's spine; keep it.
3. **Slide 5 became `img-interactive`** — `fringe.png` left, `<BaselineExplorer size={160}>` right,
   title "What a Fringe Is — and How It Changes with Distance and Angle". Both the layout branch and
   the `.ii-*` CSS were NEW this session (v4 claimed they existed; they did not).
4. **All `public/` filenames verified** and the stale names above corrected. See the "RENAMED /
   NEVER EXISTED" list — `fringe.jpg` was the live bug: the `<img>` rendered nothing.

## OPEN — resolve before regenerating any graph
**`CAL_SOURCE` disagrees between this handoff and the code.** v4 says calibration was switched to
StefCal `"solved"`, but `tart_stimela_pythonized_ecdf.py` has `CAL_SOURCE = "api-phase"` on the
ACTIVE line with `#CAL_SOURCE = "solved"` commented out beneath it. So the file as committed images
on api-phase (phase-only, `|DATA| == |CORRECTED|`). Decide which is true, set it once, and note it
here — the uv2/uv3 arrow graphs mean different things under each (phase-only → arrows only ROTATE;
solved → they rotate AND rescale, and dead antennas can blow amplitudes up).

## NEXT ACTIONS
1. Decide the `CAL_SOURCE` question above.
2. Either build the three missing part-01 slides (interference.png, baseline.png, the fringe-slice
   slide) or trim them from the agenda so slide 4 doesn't promise what doesn't play.
3. Re-check slide 4 and slide 5 at PROJECTION width, not laptop width: the agenda's 19 list items and
   the explorer's 3 panels are both things that degrade quietly rather than visibly breaking.
4. Regenerate `final_pdf.pdf` (Ctrl+P) once slides 3–5 are settled — the shipped PDF predates them.

## PROCESS NOTE FOR THE NEXT SESSION
Line numbers in this file and in any Claude reply go stale the moment Dreyfus pastes a block in —
he pasted three this session and every subsequent line reference was off by ~30. Anchor edits to
**quoted surrounding text** ("the object whose title is …"), not line numbers, and re-read App.jsx
before citing a location.

### GOTCHAS
- Single-letter global clobbers (see above) — the #1 source of errors; use self-contained setup blocks.
- FringeSlider `N` MUST equal the printed frame count or you get blank frames.
- Paths: `uv*.png` etc → `public/` (served from `/`); frames → `public/frames/` (served `/frames/…`).
  There is NO `public/sumsteps/`. **Check the real filename in `public/` before writing a `src`** —
  `fringe.jpg` vs the actual `fringe.png` cost a debugging round in session 4.
- git INSIDE WSL (Windows git on \\wsl$ throws dubious-ownership). Push → Vercel auto-deploy ~30s.
- Token-saving: don't re-paste whole cells — reference "the uv2 cell, panel ④"; use /compact between
  chunks; new session for a new topic with a 3-line handoff.
