# TART TALK — BUILD HANDOFF v2 (paste this first in any new session)

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
