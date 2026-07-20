# TART Imaging & Radio Interferometry — A Complete Course (zero → expert)

This is a **course**, not a reference. It starts from "what is a telescope?" and
ends with you able to defend, in front of hostile experts, every line of the TART
imaging pipeline *and* the interferometry it rests on. It teaches the **theory**
from first principles and, in the same breath, the **TART instance** of that
theory — the hardware, the API, `tart2ms`, CASA, WSClean, the overlay, the movie,
and every parameter choice.

Two companion documents in this folder are used by this course:
- **`IMAGING_GUIDE.md`** — the rigorous reference + the no-mercy adversarial Q&A
  (the "exam answers" for the TART-specific attacks). This course *teaches you to
  derive* those answers.
- **`STIMELA_RUN.md`** / **`AUTOMATION.md`** — the hands-on run walkthrough.

### How to read this course

- Work **in order**. Each Part depends on the ones before it.
- Every lesson has four beats: **Intuition → The math (rigorous) → TART (the
  concrete instance) → Check yourself (with answers)**.
- All TART numbers are **real** — measured from the live `bd-iub` API and the
  2026-06-11 run artifacts (reproduce them with Appendix A of `IMAGING_GUIDE.md`).
- "No mercy" means: no step is skipped, no factor is fudged, and every
  approximation is named and bounded.
- Part XI is a graduated **exam** (trivial → brutal) with model answers. If you
  can do it cold, you are an expert.

### The dependency map

```
  I  Why interferometry ─┐
 II  Two-element rig ─────┼─► III  van Cittert–Zernike ─► IV  Aperture synthesis ─┐
                          │                                                        │
                          └─────────────────────────────► V  Calibration & RIME ──┤
                                                           VI Polarization ────────┤
 VII Coordinates/time/projections ─────────────────────────────────────────────────┤
 VIII Sensitivity & artifacts ──────────────────────────────────────────────────────┤
                                                                                     ▼
 IX TART instrument ─► X Software stack & pipeline ─► XI Mastery (problems + exam)
```

### What background do you actually need?

Trigonometry, complex numbers (`e^{iθ} = cosθ + i sinθ`), vectors and dot
products, and the idea of an integral. That's the floor. Everything else —
Fourier transforms, coordinate frames, least squares — is built here.

---

# PART I — Why interferometry exists

## Lesson 1 — Telescopes and the diffraction limit

**Intuition.** A telescope's sharpness (angular resolution) is limited by
diffraction: light of wavelength `λ` passing through an aperture of diameter `D`
spreads by roughly `λ/D` radians. Bigger aperture or shorter wavelength → sharper.

**The math.** A uniformly illuminated circular aperture has an Airy pattern; the
first null (the classic "resolution") is at

```
   θ_min ≈ 1.22 · λ / D            [radians]
```

**Worked example (why radio needs arrays).** You want 1 arcsecond resolution
(`θ = 4.85×10⁻⁶ rad`) at `λ = 0.20 m` (radio L-band). Required dish:

```
   D = 1.22 λ / θ = 1.22 × 0.20 / 4.85e-6 ≈ 50 000 m = 50 km.
```

A 50-km steel dish is impossible. **So instead of one giant aperture, we use many
small antennas spread over a region of size `B` and synthesize the resolution of
an aperture of diameter `B`.** That is aperture synthesis, and `θ ≈ λ/B`.

**TART.** TART works at `λ = 0.1903 m` (the GNSS L1 band, `ν = 1.57542 GHz`). Its
widest antenna separation is `B_max = 3.153 m`, so its synthesized resolution is

```
   θ_syn ≈ λ / B_max = 0.1903 / 3.153 = 0.0603 rad = 3.46° .
```

(The real fitted beam in the FITS header is `BMAJ = 3.82°`, `BMIN = 3.09°` — same
order, the spread reflecting non-uniform baseline coverage.) A *single* 3-m TART
dish would resolve only `1.22 × 0.1903/3 = 0.077 rad = 4.4°` and could not
synthesize anything; the 24-element array does.

**Two different "λ/something" — burn this in now:**
- **Resolution** (synthesized beam) `≈ λ / B_max` ← set by the *largest baseline*.
- **Field of view** (primary beam) `≈ λ / D_element` ← set by *one antenna's
  size*. TART's elements are tiny near-omnidirectional patches, so the primary
  beam is essentially the whole sky — that's why TART makes **all-sky** images.

**Check yourself.**
> Q: TART's primary beam is ~all-sky but its resolution is ~3.8°. Reconcile.
> A: Field of view ~ λ/D_element (tiny element → huge FoV); resolution ~ λ/B_max
> (3-m baseline → 3.8° beam). Different lengths in the denominator. No conflict.

## Lesson 2 — Two antennas and the fringe (the whole idea, intuitively)

**Intuition.** Point two antennas at the same source. Because they sit at
different places, a wavefront hits one slightly before the other. As the source
moves across the sky (or you change the geometry), that path difference cycles
through whole- and half-wavelengths, so the *combined* (multiplied) signal
oscillates — **interference fringes**, exactly like Young's double-slit. The
*rate and phase* of those fringes encodes *where* the source is and *how* the
brightness is distributed. A radio interferometer is a fringe-measuring machine.

**The leap.** A single dish measures one number (total power). A *pair* measures a
fringe whose amplitude and phase is one **Fourier component** of the sky image.
Measure enough pairs and you can Fourier-invert to get the image. That sentence is
the entire field; Parts II–IV make it exact.

**TART.** 24 antennas → `24·23/2 = 276` pairs measured **simultaneously**, every
~1-second integration. Each pair is one Fourier component; 276 of them, plus their
mirror images (Hermitian symmetry, Lesson 11), is enough to form a coarse all-sky
picture from a single snapshot.

## Lesson 3 — What we are ultimately solving for

We want the **sky brightness distribution** `I(l,m)` — how much radio power comes
from each direction `(l,m)` — as an image. Interferometry gives us samples of its
**Fourier transform** `V(u,v)` (the visibilities). Imaging is the inverse Fourier
transform plus cleanup. Keep this triangle in mind throughout:

```
   sky  I(l,m)  ──(van Cittert–Zernike, Part III)──►  visibilities V(u,v)
         ▲                                                     │
         └────────────  imaging / deconvolution  ◄─────────────┘  (Part IV)
```

---

# PART II — The two-element interferometer, rigorously

## Lesson 4 — Geometric delay and the fringe

**Setup.** Baseline vector **b** points from antenna 1 to antenna 2 (metres). A
distant source lies in unit direction **ŝ**. The wavefront reaches the two
antennas at times differing by the **geometric delay**

```
   τ_g = ( b · ŝ ) / c .
```

**The correlator.** The interferometer multiplies the two antenna voltages and
time-averages: `r = ⟨ v₁(t) · v₂(t) ⟩`. With `v₂` delayed by `τ_g` relative to
`v₁`, for a quasi-monochromatic signal at frequency `ν` the *real* correlator
output is the cosine fringe

```
   r ∝ cos( 2π ν τ_g ) = cos( 2π (b·ŝ)/λ ) .
```

A **complex correlator** also forms the 90°-shifted product, giving both cosine
and sine, i.e. the **complex visibility**

```
   V ∝ exp( i 2π (b·ŝ)/λ ) .
```

The exponent `(b·ŝ)/λ` is the baseline length measured **in wavelengths**,
projected onto the source direction. That is the central quantity.

**TART.** The on-site FPGA correlator computes these complex products in hardware
for all 276 pairs; the API serves them as `vis` (you never see raw voltages —
Lesson 33). The classic TART digitizes at low bit-depth (1-bit in the original
design), so the visibilities are essentially normalized *correlation
coefficients*, not absolutely-scaled powers — remember this when we get to "TART
has no absolute flux scale" (Lesson 30, 41).

## Lesson 5 — Phase tracking and the phase centre

**Problem.** As the Earth turns, `τ_g` changes by many wavelengths per second, so
the raw fringe whizzes. We choose a reference direction `ŝ₀` — the **phase
centre** — and instruct the correlator to insert a compensating delay so that a
source *exactly at* `ŝ₀` produces zero fringe phase. We then measure everything
*relative to* `ŝ₀`.

**Result.** Writing the offset `σ = ŝ − ŝ₀`, the visibility of an extended sky
with brightness `I` seen through primary beam `A` becomes

```
          ⌠
   V(b) = ⎮ A(σ) I(σ) · exp( −2πi (b·σ)/λ ) dΩ .
          ⌡
```

(The sign convention here — `−2πi` for sky→visibility — is the one used
throughout this course and in `IMAGING_GUIDE.md`. Texts differ; state yours.)

**TART.** `tart2ms` chooses `ŝ₀ = the zenith at the observation midpoint` and
**rephases** every visibility to it (log line: *"Rephase all data to 10h18m55.26s
23d56m47.85s"*). Two reasons: (1) the zenith is the most sensitive direction for a
horizontal array; (2) it makes the w-coordinate vanish (Lesson 10, Lesson 39).

## Lesson 6 — Direction cosines and the (u,v,w) frame

We need coordinates. Put the **w-axis along the phase centre** `ŝ₀`, and `u` (East)
and `v` (North) in the plane perpendicular to it (the "uv-plane", tangent to the
sky at `ŝ₀`).

- Baseline in wavelengths: `(u, v, w) = b / λ`.
- Sky direction: `ŝ = (l, m, n)` with `l, m` the **direction cosines** measured
  from `ŝ₀` toward East and North, and `n = √(1 − l² − m²)` along `ŝ₀`.

Then `(b·ŝ)/λ = u l + v m + w n`. Subtracting the phase-centre term (`l=m=0,
n=1 ⇒ w`) and including the obliquity factor `dΩ = dl dm / n`:

```
              ⌠⌠   A(l,m) I(l,m)
   V(u,v,w) = ⎮⎮  ───────────────  · exp[ −2πi ( u l + v m + w(n−1) ) ] dl dm .
              ⌡⌡        n
```

This is the **full 3-D measurement equation** (van Cittert–Zernike with the
w-term). Everything in Part III and IV is reading this equation correctly.

**TART.** `(u,v,w)` for every baseline and integration is computed by `tart2ms`
and stored in the MS `UVW` column. Because TART's antennas are coplanar (all
`z = 0`) and `ŝ₀` is the zenith, `w ≈ 0` (proved in Lesson 10/39), so the `w(n−1)`
term drops and TART's equation is effectively the clean 2-D Fourier transform.

## Lesson 7 — One baseline = one spatial frequency

Read the equation: a baseline `(u,v)` multiplies the sky by `exp[−2πi(ul+vm)]` and
integrates. That is **exactly** the definition of the 2-D Fourier component of
`I(l,m)` at spatial frequency `(u,v)` (cycles per radian on the sky). So:

- A **short** baseline (small `u,v`) samples **large** angular structure.
- A **long** baseline samples **fine** structure.
- The visibility's **amplitude** = how much of that Fourier component is present;
  its **phase** = where that structure sits.

**TART.** Baselines span `0.322 m → 3.153 m`, i.e. `1.69 λ → 16.57 λ`. So TART
samples spatial frequencies from ~1.7 to ~16.6 cycles per radian — coarse,
which is why the synthesized beam (≈ 1/16.6 rad ≈ 3.5°) is broad. There is **no
zero-spacing** (you can't put two antennas at the same place), so the absolute
sky level (the `u=v=0` total power) is missing — a generic interferometer fact.

**Check yourself.**
> Q: Why can an interferometer never measure the mean brightness of the sky?
> A: That is the `(u,v)=(0,0)` Fourier component, which needs a zero-length
> baseline (two antennas at the same point) — impossible. Interferometers are
> blind to the absolute zero-spacing flux.

---

# PART III — Van Cittert–Zernike and the measurement equation

## Lesson 8 — Why visibility is the Fourier transform of the sky

**Heuristic derivation (the one to remember).** Treat the sky as a sum of
independent point sources (an *incoherent* source — different directions don't
maintain a fixed phase relationship). Each sky element at `(l,m)` with brightness
`I(l,m) dl dm` produces, on baseline `(u,v)`, an elementary fringe
`I(l,m) e^{−2πi(ul+vm)} dl dm`. Because the elements are incoherent, the
correlator **adds their fringes** (their cross terms average to zero), giving

```
   V(u,v) = ∬ I(l,m) e^{−2πi(ul+vm)} dl dm  =  FT{ I(l,m) } .
```

That is the **van Cittert–Zernike theorem**: *the visibility measured by an
interferometer is the Fourier transform of the sky brightness distribution* (under
the small-field, far-field, incoherent-source assumptions). The rigorous version
derives the spatial coherence function of the field radiated by an incoherent
source and shows it equals the FT of the brightness; the heuristic above captures
why.

## Lesson 9 — The full 3-D equation and the w-term

The clean FT is only the **2-D** truth. The exact equation (Lesson 6) carries the
extra factor `exp[−2πi w(n−1)]` and the obliquity `1/n`. Expand near the phase
centre: `n = √(1−l²−m²) ≈ 1 − (l²+m²)/2`, so

```
   n − 1 ≈ −(l² + m²)/2 .
```

The w-term phase is `2π w (n−1) ≈ −π w (l²+m²)`. It is negligible only when

```
   | w (n−1) | ≪ 1   over the whole field.
```

For a **small field** (`l,m` small) this is automatic and `V = FT{I}` exactly.
For an **all-sky field** (`n → 0` at the horizon) it is **not** automatic — unless
`w` itself is tiny. This is the crux for any wide-field instrument.

## Lesson 10 — Is the 2-D approximation valid for TART? (a proof, not a hope)

TART images the whole hemisphere, so we **cannot** assume small field. We instead
prove `w` is tiny.

**Coplanar-array theorem.** Write a baseline in the local East-North-Up frame as
`b = (b_E, b_N, b_U)`. The w-coordinate is the projection onto the phase centre
`ŝ₀`: `w = (b·ŝ₀)/λ`. **Measured fact:** every TART antenna has `b_U = 0` (the
array is flat; the API returns `z ≡ 0`). At the observation midpoint `ŝ₀ = Up =
(0,0,1)`, so

```
   w = b_U / λ = 0    for every baseline    (exact).
```

Off the midpoint, the fixed celestial phase centre drifts from the instantaneous
zenith by Earth rotation. Over the half-snapshot `Δt = 30.75 s`:

```
   ζ ≤ Ω⊕ Δt = 7.292e-5 × 30.75 = 2.24e-3 rad = 0.128° ,
   |w|_max ≈ (b_max sinζ)/λ = (3.153 × 0.00224)/0.1903 ≈ 0.037 λ ,
   worst-case w-phase = 2π|w||n−1| ≤ 2π(0.037)(1) ≈ 0.23 rad ≈ 13° .
```

So across the entire 61.5-s snapshot the w-term never exceeds ~13° of phase, and
only for horizon sources at the snapshot's ends. **TART's 2-D Fourier
approximation is therefore essentially exact**, which is *why* WSClean reports
`WSCNWLAY = 1` (one w-layer). This is the rigorous answer to "did you handle the
sky's curvature?": yes — it's provably negligible because the array is coplanar
and we phase to zenith. (Full treatment: `IMAGING_GUIDE.md` §5.)

**Check yourself.**
> Q: A colleague builds a TART on a 10° hillside and keeps zenith phasing. What
> breaks?
> A: `b_U ≠ 0`, so `w ≠ 0` even at midpoint; `w` can reach ~`B_max·sin(10°)/λ ≈
> 2.9 λ`, w-phase ~ many radians at the horizon → wide-field w-term errors.
> WSClean would auto-select many w-layers (w-stacking) to fix it, at higher cost.

---

# PART IV — Aperture synthesis: from samples to image

## Lesson 11 — The uv-plane, sampling, and Hermitian symmetry

Each baseline at each instant is one point `(u,v)` in the **uv-plane**. The set of
all sampled points is the **sampling function** `S(u,v)` (a sum of delta
functions). We only ever measure `V` where `S = 1`.

- **Counts:** `N` antennas → `N(N−1)/2` baselines (TART: 276). Each gives a point
  and, because the sky is real, its mirror `(−u,−v)` for free: `V(−u,−v) =
  V*(u,v)` (**Hermitian symmetry**). So 276 baselines populate 552 uv-points.
- **More/with longer baselines → denser uv-coverage → better image.**

**TART.** Plot the 276 points and you get TART's instantaneous uv-coverage
(`msdir/UV.png`). It is sparse, so the synthesized beam has high sidelobes
(Lesson 13).

## Lesson 12 — Earth-rotation synthesis vs snapshots

As the Earth turns, a fixed baseline's projection onto the sky changes, so its
`(u,v)` point **traces an ellipse** over hours. Big arrays exploit this — over a
long track each baseline sweeps out arcs and **fills** the uv-plane. This is
**Earth-rotation aperture synthesis**, and for sparse arrays it is *the* way to get
a good image.

**TART is a snapshot instrument.** In a 61.5-s observation the sky rotates only
`Ω⊕ T = 0.257°`, so the uv-tracks are essentially points — TART relies on its 276
*instantaneous* baselines, not on rotation. (This is also the rigorous content of
"how does Earth rotation affect this telescope?": for TART, negligibly within a
snapshot; across movie frames minutes apart, it's what makes satellites drift.)

## Lesson 13 — The dirty image and the synthesized beam

If we just inverse-Fourier-transform the *sampled* visibilities (zeros where we
didn't measure), we get the **dirty image**:

```
   I_dirty = FT⁻¹{ S · V } = FT⁻¹{S} ⊛ FT⁻¹{V} = B_dirty ⊛ I_true ,
```

by the **convolution theorem**. Here `B_dirty = FT⁻¹{S}` is the **synthesized
beam** (a.k.a. dirty beam / PSF) — the array's response to a point source. The
dirty image is the true sky **convolved** with this beam.

- Sparse `S` → `B_dirty` with a sharp core but **strong sidelobes** that smear
  every source across the field.
- A point source therefore appears as the full beam pattern, sidelobes and all.

**TART.** With only 276 baselines the dirty beam has high sidelobes; on the real
`bd-iub-image.fits` they fill the whole 1024² frame even though real sky only
lives in the central 343.8-px hemisphere disk (Lesson 28 / `IMAGING_GUIDE.md` §6).
`img/bd-iub-psf.fits` *is* this `B_dirty`.

## Lesson 14 — Gridding, the FFT, cell size and image size

To use the fast FT, visibilities are **gridded** (interpolated with a convolution
kernel onto a regular `(u,v)` grid), then **FFT**'d. Two grid rules:

- **Cell size (pixel scale)** must **oversample the synthesized beam** (Nyquist):
  `Δθ ≲ θ_syn / 3`. TART: `θ_syn ≈ 3.5°`, and the chosen `scale = 600″ = 0.167°`
  gives ~20 px across the beam — well oversampled.
- **Image extent** must cover the **field of view**: `N_pix · Δθ ≳ θ_FoV`. TART:
  `1024 × 0.167° = 170.6°` across — more than the whole hemisphere, with margin
  (the dark corners; Lesson 28).

## Lesson 15 — Weighting: sensitivity vs resolution

Before transforming we weight the visibilities. The choice trades noise against
resolution and sidelobes:

- **Natural** weighting (weight by `1/σ²`): maximum point-source sensitivity,
  fattest beam (favours the many short baselines).
- **Uniform** weighting (down-weight dense uv-regions): best resolution and lowest
  sidelobes, worst sensitivity.
- **Briggs / robust** weighting: a tunable knob `R` from `+2` (≈natural) to `−2`
  (≈uniform). `R = 0` is a balanced compromise.
- **Tapering**: extra Gaussian down-weighting of long baselines to emphasize
  extended structure.

**TART.** The recipe uses `weight briggs 0.0` — the balanced middle, sensible for
a sparse array where you want resolution without throwing away the (few) long
baselines' sensitivity.

## Lesson 16 — Deconvolution: CLEAN

The dirty image is `I_true ⊛ B_dirty`; we want `I_true`. **CLEAN** (Högbom 1974,
and the Clark / Cotton–Schwab variants) deconvolves it iteratively:

1. Find the brightest peak in the (residual) dirty image.
2. Record a fraction `g` (the **loop gain**) of it as a **CLEAN component** in a
   model.
3. Subtract a `g`-scaled, shifted copy of the **dirty beam** from the residual
   (this removes that source's sidelobes).
4. Repeat until a threshold or `niter` is hit.
5. **Restore**: convolve the model with an idealized clean Gaussian beam (`BMAJ,
   BMIN, BPA`) and add the residuals → the final **restored image**.

- **major/minor cycles**: minor cycles clean against a fixed dirty beam; major
  cycles periodically re-grid/re-FFT the exact residual to avoid error build-up.
  `mgain` sets how deep each major cycle cleans.
- **masking** (`auto-mask`): only clean above `Nσ` so CLEAN doesn't chase noise or
  sidelobes.

**TART (WSClean parameters, all in `tart_dl.yaml`):**
`niter 5000` (max components), `gain 0.1` (subtract 10% of each peak),
`mgain 0.95` (clean to 5% of peak per major cycle), `auto-mask 5` (only ≥5σ),
`size 1024`, `scale 600asec`, `pol RR`, `nchan 1`, `weight briggs 0.0`,
`column CORRECTED_DATA`, `intervals-out = nframes`. Outputs: `-image` (restored),
`-dirty`, `-psf` (`B_dirty`), `-model` (CLEAN components), `-residual`.

**Check yourself.**
> Q: Why restore with a *Gaussian* beam instead of leaving the CLEAN-component
> model?
> A: The model is a set of delta functions whose super-resolution is not
> trustworthy (the data don't constrain structure finer than `θ_syn`). Convolving
> with a clean Gaussian of the array's resolution presents the image at its honest
> resolution and lets you add back the residual noise map.

---

# PART V — Calibration and the measurement equation (RIME)

## Lesson 17 — Why calibration is unavoidable

The van Cittert–Zernike theorem relates the **true** visibility to the sky. But
every antenna corrupts the signal with its own **complex gain** `g_p` (an
amplitude scaling and a phase shift from cables, electronics, the atmosphere…).
What the correlator actually records on baseline (p,q) is

```
   V_pq^obs = g_p · g_q* · V_pq^true  +  noise .
```

If you image `V^obs` without removing the `g`'s, the phases are wrong and sources
land in the wrong place, smeared. **Calibration = estimate the `g_p` and divide
them out.** This is the single most important practical step; a perfect imager on
uncalibrated data produces garbage.

## Lesson 18 — The RIME: Jones matrices (the general law)

The general (full-polarization) statement is the **Radio Interferometer
Measurement Equation** (Hamaker–Bregman–Sault 1996). The signal from each antenna
passes through a chain of `2×2` **Jones matrices**, one per corrupting effect, and
the baseline coherency is

```
        ⌠
   V_pq = ⎮ J_p(s) · B(s) · J_qᴴ(s) · e^{−2πi b_pq·s/λ} dΩ ,
        ⌡
   J_p = G_p · D_p · E_p · P_p · K_p     (outer→inner along the signal path)
```

- **K** — geometric/Fourier phase (the fringe; the `e^{−2πi…}` term).
- **P** — parallactic-angle rotation (sky rotates w.r.t. an alt-az feed).
- **E** — primary beam / element voltage pattern (direction-dependent).
- **D** — polarization leakage between the two feeds.
- **G** — electronic complex gain (direction-*independent*).

`B` is the `2×2` sky **brightness/coherency matrix** built from Stokes `I,Q,U,V`.
Solving the RIME = estimating the relevant Jones terms.

## Lesson 19 — How the RIME collapses for TART (and what we actually solve)

TART has **one feed** and produces **one** correlation product (`RR`). So the
`2×2` machinery degenerates to scalars:

- **K** — *not a calibration unknown*; it is realized as the UVW geometry
  (`tart2ms`) and the gridding kernel (WSClean).
- **P** — irrelevant: one circular feed imaging one hand has no parallactic
  bookkeeping.
- **E** — the broad single-element pattern; **not corrected** here (an honest
  limitation: brightness falls toward the horizon for instrumental reasons).
- **D** — undefined: no second feed to leak into.
- **G** — the per-antenna complex gain `g_p`. **The only Jones term we solve.**

So TART's operative equation is the scalar `V_pq^obs = g_p g_q* V_pq^true`, and
"calibration" means estimating 24 complex numbers (per solution interval). *That*
is "where the RIME / Jones matrices are" in this pipeline — everything but the
scalar **G** is either pure geometry or doesn't exist for one feed.

## Lesson 20 — Solving for the gains (least squares & self-calibration)

We need a **reference sky model** `M_pq` to solve against. Given it, find the
gains minimizing the weighted residual

```
   χ² = Σ_{p<q,t} w_pq | V_pq^obs − g_p g_q* M_pq |² .
```

This is a non-linear least-squares problem (bilinear in the gains), solved
iteratively. When the model is *itself* derived from the data (image → model →
re-solve gains → re-image), it is called **self-calibration**. Self-cal is
powerful but can **bias the image toward the assumed model** — you cannot invent
flux the data don't support, but you can be pulled toward a wrong model. Guardrails:
solve **few** parameters (gains only), start from a trustworthy model, and check
independently.

**Amplitude vs phase, and solution intervals.** Phase errors vary *fast* (seconds),
amplitude errors *slowly* (minutes). So you solve phase on short intervals and
amplitude on long ones, to keep each solve well-conditioned (enough
signal-to-noise per solution).

**TART (two solves, real `.last` values):**
| | `tart.G0a` (amplitude) | `tart.G0p` (phase) |
|---|---|---|
| `calmode` | `a` | `p` (applies G0a first) |
| `solint` | `300 s` (→ one solution over the 61.5-s obs) | `10 s` (→ ~6 solutions) |
| `solnorm` | `true` (no absolute scale) | `false` |
| `gaintype` | `G` (scalar per-antenna) | `G` |
| `minsnr` | `1e-10` | `1e-10` |

The **model** `M_pq` is built by `tart2ms --add-model`: it DFTs the GNSS source
catalogue (positions from orbital elements) into the `MODEL_DATA` column. So
TART's calibration is **model-based**, anchored to satellites at *known* sky
positions — not blind self-cal. `applycal` writes
`CORRECTED_DATA = (g_p g_q*)⁻¹ DATA`.

## Lesson 21 — Closure quantities (the expert's safety net)

Some combinations of visibilities are **independent of the antenna gains** — pure
sky information that survives even with bad calibration.

**Closure phase** (three antennas p,q,r). Each measured phase is
`φ_pq^obs = φ_pq^true + (θ_p − θ_q)` where `θ` is the gain phase. Sum around the
triangle:

```
   Φ_pqr = φ_pq^obs + φ_qr^obs + φ_rp^obs
         = φ_pq^true + φ_qr^true + φ_rp^true   ← all θ cancel.
```

The gain phases telescope away. Closure phase is a **gain-independent observable**;
there are `(N−1)(N−2)/2` independent ones (TART: 253).

**Closure amplitude** (four antennas): the ratio
`(|V_pq||V_rs|)/(|V_pr||V_qs|)` cancels all gain *amplitudes*; there are
`N(N−3)/2` independent ones (TART: 252).

Why care? Closure quantities let you (a) assess data quality independent of
calibration, and (b) constrain images even when absolute gains are unknown (the
basis of VLBI imaging). They are the rigorous reason a poorly-gain-calibrated array
can *still* recover source structure.

**Check yourself.**
> Q: Your phase calibration is completely wrong. Is *any* sky information intact?
> A: Yes — the closure phases, which are independent of all antenna gain phases.
> They still constrain the source structure.

---

# PART VI — Polarization

## Lesson 22 — Stokes parameters and feeds

Radio polarization is described by the four **Stokes parameters**: `I` (total
intensity), `Q, U` (linear), `V` (circular). Antennas sense one basis:

- **Linear feeds** (X,Y) measure products `XX, XY, YX, YY`.
- **Circular feeds** (R,L) measure `RR, RL, LR, LL`.

The relations (circular basis): `I = (RR+LL)/2`, `V = (RR−LL)/2`,
`Q = Re(RL+LR)/2`, `U = Im(LR−RL)/2`. Full-Stokes imaging needs both feeds and the
cross-hands; that's where leakage (**D**-Jones) and parallactic angle (**P**) bite.

## Lesson 23 — Why TART is single-pol `RR`, and what that costs

**GNSS L1 is transmitted right-hand circularly polarized (RHCP).** A receiver with
a **right-circular feed** is matched to it; a left-circular feed would see almost
nothing. TART therefore uses a single R feed and the correlator forms only the
`RR` product — the FITS confirms `CRVAL4 = −1` (Stokes code −1 = RR) and `tart2ms`
logs `Pol Feeds ['RR']`.

**Consequences (all favourable or harmless here):**
- `RR` captures essentially the full GNSS power (matched polarization) — not a
  loss for these sources.
- No second hand ⇒ **no leakage term** to calibrate (D-Jones absent).
- One fixed feed, one hand ⇒ **no parallactic-angle** bookkeeping.
- We **cannot** form Stokes `I/Q/U/V` or measure source polarization — fine, since
  the science is satellite positions, not polarimetry.

**Check yourself.**
> Q: If TART had used an L feed by mistake, what would the images show?
> A: Almost nothing — the RHCP GNSS power is rejected by a left-circular feed, so
> the satellites would be ~30 dB down or worse. Polarization matching matters.

---

# PART VII — Coordinates, time, and projections (the "real sky" bookkeeping)

## Lesson 24 — Celestial coordinate frames

- **(RA, Dec)** — equatorial coordinates, the celestial analogue of
  longitude/latitude. Need an **epoch/realization**: **FK5 J2000**, or the modern
  **ICRS** (≈ J2000 to ~20 mas). MS fields here are tagged `J2000`.
- **(Az, El)** / Alt-Az — *topocentric* (observer-centred): compass bearing and
  height above the local horizon. Depends on where and *when* you stand.
- The **zenith** is `El = 90°`; its declination equals your *geodetic latitude* —
  at the current epoch.

## Lesson 25 — Precession, nutation, aberration (and their sizes)

The equatorial frame slowly moves, so a fixed direction's `(RA,Dec)` drifts:
- **Precession** ~`50″/yr` total; in declination `dδ/dt = 20.04″·cosα` per year.
- **Nutation** — periodic wobble, ≤ `9″`.
- **Aberration** — annual ≤ `20.5″` from Earth's velocity; diurnal ≪ that.
- **Proper motion** — irrelevant for satellites; matters for stars.

**TART worked example (the famous 0.131°).** The field declination is `23.9466°`
(J2000) but the station latitude is `23.8155°`. Gap = `0.131°`. That is precession
from J2000.0 to the 2026.44 epoch: `dδ/dt = 20.04″·cos(154.73°) = −18.1″/yr`, over
`26.44 yr` gives `−0.133°`, so `δ_J2000 = δ_date − (−0.133°) = 23.95°`. The header
is reproduced to the arcminute — proof the frames are handled right, not a bug.

## Lesson 26 — Time scales and Earth rotation

- **UTC** — civil time, kept within 0.9 s of UT1 by leap seconds.
- **UT1** — tied to the actual rotation of the Earth (irregular).
- **TAI / TT** — atomic, smooth; **GPS time** = TAI − 19 s.
- **Sidereal time / Earth Rotation Angle** — converts UT1 to the orientation of
  the sky; the sky moves at `Ω⊕ = 7.292×10⁻⁵ rad/s` (`15.04″/s`).

**Why it matters (and its size for TART).** You need UT1 to point the (u,v,w)
frame at the right sky. The catch is **UT1−UTC** (and polar motion), distributed by
the **IERS**; an out-of-date table is what triggers casacore's *"IERS/leap-second
out of date"* warning. Size of the error: `UT1−UTC ≤ 0.9 s → 0.9 × 15″ ≈ 13.5″ ≈
0.004°` — utterly below TART's 3.8° beam. **Harmless here**, but on a VLBI array
(milli-arcsecond beam) the same warning would be a serious problem. Scale always
decides relevance.

## Lesson 27 — Near-field vs far-field, and parallax

The visibility equation assumes **plane waves** (source at infinity). Validity:
source distance ≫ the **Fraunhofer distance** `d_F = 2D²/λ`.

**TART:** `d_F = 2(3.153)²/0.1903 ≈ 104 m`. GNSS satellites are at
`2×10⁷–4×10⁷ m`, i.e. `>10⁵×` farther — plane-wave approximation excellent; no
near-field/Fresnel correction needed across a 3-m aperture.

But satellites are *close enough* that their **topocentric** position differs from
the geocentric one by tens of degrees of **parallax**. The pipeline stays
**topocentric end-to-end** (the catalogue returns az/el *for the site*; the overlay
converts az/el→RA/Dec *at the station*), so parallax cancels and never needs
explicit handling.

## Lesson 28 — Map projections and FITS WCS

The curved sky must be flattened onto a pixel grid. A **projection** defines that
map; FITS encodes it in **WCS** keywords: `CTYPE` (projection + axis), `CRVAL`
(world value at the reference pixel), `CRPIX` (reference pixel), `CDELT` (scale),
`CUNIT`. astropy/CASA read these to convert pixel↔sky.

**SIN (orthographic)** is the radio all-sky standard because its plane coordinates
*are* the direction cosines `(l,m)` — the natural output of the 2-D Fourier
transform. Its defining property: a point at angular distance `ρ` from the
reference projects to plane radius `R(ρ) = (180/π) sinρ` degrees.

**TART worked example (the concentric disk).** Header: `CTYPE = RA---SIN`,
`CDELT = 0.16667°`, 1024 px, ref pixel 513. Because `sinρ ≤ 1`, the **whole
hemisphere** maps inside radius
`(180/π)·sin90° / 0.16667° = 57.296°/0.16667° = 343.8 px`, while the half-frame is
512 px. So the visible sky is a **central disk of radius 343.8 px (~67% of the
half-width)** and the corners are below-horizon (`n² < 0`, no real sky). Satellites
at `el ≥ 5°` land at `≤ 342.5 px` — *inside* that disk. **That is exactly why "the
satellites sit in a concentric circle smaller than the image."** It is projection
geometry, derivable in closed form, not a defect. (Full: `IMAGING_GUIDE.md` §6.)

**Check yourself.**
> Q: How would you make the horizon touch the frame edge?
> A: Set the pixel scale so `512 px = 57.296°`, i.e. `Δθ = 57.296/512 = 0.1119° =
> 403″/px` (instead of 600″), or crop the FITS to the inner 343.8-px disk.

---

# PART VIII — Sensitivity, smearing, and artifacts

## Lesson 29 — Image noise (the radiometer equation)

Point-source sensitivity (rms) of an array:

```
   ΔS ≈ SEFD / ( η_s · √( n_pol · N(N−1) · Δν · τ ) ) ,
```

where `SEFD` is the system-equivalent flux density (lower = more sensitive),
`η_s` an efficiency, `n_pol` the number of polarizations, `N(N−1)` the baseline
count ×2, `Δν` bandwidth, `τ` integration time. More antennas, bandwidth, and time
→ less noise. **Dynamic range** (peak/rms) is usually limited not by this thermal
noise but by calibration and deconvolution errors.

**TART:** `n_pol = 1` (RR only), `N(N−1) = 552`, `Δν = 2.5 MHz`, `τ ≈ 61.5 s`.
Sensitivity is modest and, crucially, the data are low-bit quantized and
`solnorm`'d, so **there is no absolute flux scale** — the `JY/BEAM` axis is
relative. Do not quote TART satellite "fluxes" as physical (Lesson 41 / Q19 in the
guide).

## Lesson 30 — Bandwidth smearing and time smearing

Two finite-resolution effects that blur sources *away from the phase centre*:

- **Bandwidth (chromatic) smearing**: a finite channel `Δν` smears a source at
  angular distance `θ` radially by `~ (Δν/ν)·(θ/θ_syn)` beams. TART: `Δν/ν =
  2.5/1575 = 1.6×10⁻³`; even ~90 beams out (the disk edge) the smear is ~0.14 beam
  — minor.
- **Time-average smearing**: a finite integration `τ` smears tangentially as the
  uv-point moves. TART's ~1-s integrations move the sky 15″ ≪ beam — negligible.

GNSS **Doppler** (≤ ±5 kHz at L1) sits well inside the 2.5-MHz channel and, for a
1-channel continuum image, only shifts power within the channel — invisible.

## Lesson 31 — Artifacts: sidelobes, aliasing, w-errors, confusion

- **Sidelobe confusion** — a sparse array's high dirty-beam sidelobes overlap
  sources; CLEAN removes them only partially. (TART's noisy corners are this.)
- **Aliasing** — emission outside the imaged field folds back in if cells/field
  are wrong; gridding kernels suppress it.
- **w-term smearing** — uncorrected wide-field curvature (Lesson 9); negligible for
  TART (Lesson 10).
- **Pointing / position errors** — calibration phase errors shift apparent
  positions; this was the historical TART misalignment (Lesson 20 / next).

## Lesson 32 — Case study: the TART misalignment bug (everything in Part V–VIII at once)

Earlier TART runs had the catalogue circles sitting *off* the bright peaks. The
overlay math was correct; the fault was **calibration**: a near-dead antenna can
solve a gain amplitude near zero, and `applycal` *divides* by `g_p g_q*` —
**dividing by ~0 amplifies that baseline's noise into spurious bright peaks**,
displacing the apparent sources (a position error, Lesson 31). Fixes now in place:
dead antennas are **zeroed upstream** by the station (multiply-to-zero, not
divide), the solve is **model-anchored** (Lesson 20), and an **always-on
validation gate** checks alignment every run. The residual risk to watch is
`minsnr = 1e-10`, which still accepts low-SNR solutions. (Full: `IMAGING_GUIDE.md`
§10.3, §12.)

---

# PART IX — The TART instrument, in full

## Lesson 33 — Hardware and the signal path

TART (`bd-iub` is a **TART-3**) is 24 small antennas on a flat ground plane.
Signal path, antenna → visibility:

1. **Antennas** — 24 near-omnidirectional **RHCP patch** elements (matched to GNSS
   L1). Layout: ENU coordinates, **all z = 0** (coplanar), E-extent 3.15 m,
   N-extent 2.98 m (a roughly circular spiral). 276 baselines, 0.32–3.15 m.
2. **RF front end** — each element amplifies the ~1.5 GHz signal and
   **downconverts** it. The station reports `operating_frequency = 1575.42 MHz`
   (L1), a local-oscillator-related `L0 = 1571.328 MHz`, and a `baseband =
   4.092 MHz` (the band centre after mixing down).
3. **Digitizer** — sampled at `16.368 MHz` (the `sampling_frequency`). Classic TART
   uses **1-bit** digitization, which is cheap and (for correlation) only costs a
   known efficiency factor (the **Van Vleck** relation links 1-bit correlation to
   true correlation). The price: amplitudes are not absolutely scaled →
   correlation coefficients, not Jansky (Lesson 29).
4. **FPGA correlator** — cross-multiplies all 24 streams in real time to produce
   the 276 complex **visibilities** over a `~2.5 MHz` band, **1 channel**, `RR`
   only. *These are what we download; we never see antenna voltages.*

This is the physical realization of Lessons 4–7: the hardware *is* the complex
correlator producing `V_pq ∝ ⟨v_p v_q*⟩`.

## Lesson 34 — GNSS as the radio sources

TART's "stars" are navigation satellites broadcasting at L1 (1575.42 MHz):
- **Constellations** — GPS (USA), GLONASS (Russia), Galileo (EU), BeiDou (China),
  QZSS (Japan), plus SBAS/GEO augmentation (e.g. GAGAN, INMARSAT). The catalogue
  names show all of these.
- **Signal** — RHCP, spread-spectrum (the C/A code is ~1.023 Mcps → ~2 MHz main
  lobe, matching TART's 2.5-MHz band).
- **Orbits** — mostly **MEO** (~20 000 km, period ~12 h) and some **GEO/IGSO**
  (~36 000 km). The catalogue's `r` field is the slant range (e.g. INMARSAT
  `r = 3.9×10⁷ m`).
- **Apparent motion** — a few degrees per *hour* across the sky → ~0.06°/min ≪ the
  3.8° beam within a snapshot, but clearly visible across movie frames minutes
  apart (Lessons 12, 30).

They are *artificial transmitters*, extremely bright and at *known* positions —
which is why they make an excellent, self-checking calibration sky.

## Lesson 35 — The TART REST API and the HDF format

Everything we ingest comes from the station's REST API (`https://api.elec.ac.nz/
tart/<station>`). The endpoints this pipeline uses:

| Endpoint | Returns | Used for |
|---|---|---|
| `/api/v1/info` | `location` (lat/lon/alt), frequencies, `num_antenna` | site geometry, station check |
| `/api/v1/imaging/antenna_positions` | 24 ENU triples (z=0) | antenna layout → ITRF |
| `/api/v1/calibration/gain` | `{gain[24], phase_offset[24]}` | the **instrumental** calibration (layer 1) |
| *(vis download)* | `vis_<UTC>.hdf` snapshots | the visibilities themselves |

A **vis HDF** file bundles, for a short buffer: the complex visibilities per
baseline per integration, the timestamps, the antenna positions, the frequency,
and the current gain solution. `tart2ms` reads all of this.

## Lesson 36 — The satellite catalogue service (overlay & model provenance)

A *separate* service supplies satellite positions:
`https://tart.elec.ac.nz/catalog/catalog?lat&lon&alt&date` → a list of
`{name, az, el, jy, r}`. The server **propagates public GNSS orbital elements
(TLE/almanac)** to the requested timestamp and returns **topocentric** az/el and
slant range for the site. Key properties for credibility:
- **Independent of TART's data** — pure ephemeris prediction, so overlaying it on a
  TART image is a genuine test, not circular (Lesson 20; Q8/Q9 in the guide).
- **Far more precise than TART** — ephemerides are good to metres → arcseconds,
  vs the 3.8° beam.
- **Time-matched** — the overlay queries with `&date = FITS DATE-OBS`, so sky and
  image share one UTC instant. `tart2ms` uses the same service to build
  `MODEL_DATA`.

---

# PART X — The software stack and the pipeline, line by line

## Lesson 37 — Stimela 2: recipes, cabs, containers

**Stimela** is a pipeline framework. Vocabulary:
- **Cab** — one tool wrapped as a step, with declared inputs/outputs and the
  container image it runs in (e.g. `tart2ms`, `wsclean`, `casa.gaincal`).
- **Recipe** — a YAML file (`tart_dl.yaml`) listing **steps** (instances of cabs)
  in order, wiring parameters with substitutions like `=recipe.tart` and
  `{recipe.msdir}`.
- **Cargo** — libraries of ready-made cabs: `tartcargo` (TART cabs), `cultcargo`
  (general radio cabs, e.g. WSClean), pulled in via `_include`.
- **Backend** — here **Singularity/apptainer**: every cab runs inside a prebuilt
  container image (auto-built into `stimela_images/`), so you don't install
  CASA/WSClean yourself.

This is how the pipeline stays reproducible: each step is a pinned container, and
the recipe is the single source of truth for parameters.

## Lesson 38 — The recipe `tart_dl.yaml`, step by step

Inputs (defaults): `tart` (station, required), `imgdir=img`, `h5dir=rawdata`,
`raw_data_nfile=10`, `cal_table_dir=caltables`, `msdir=msdir`, `do_download`,
`nframes=10`. It `assign`s `api = https://api.elec.ac.nz/tart/{recipe.tart}`.

Steps in order: `init*` (mkdir) → `download-hdf` → `create-ms` → `updateobservatory`
→ `flagsave` → `plotuv`/`plotants`/`lister` → `calibrate_amplitude` →
`calibrate_phase` → `applycal` → `snapshotimage`. (Map each to its theory: download
= get visibilities; create-ms = build the data model + geometry + model;
calibrate = Lesson 20; snapshotimage = Lessons 13–16.)

**Two load-bearing gotchas (do not "simplify" away):**
- **Parse-time GLOB.** `create-ms` finds inputs with `hdf: =GLOB(rawdata/*.hdf)`,
  evaluated when the recipe is *parsed*. So the orchestrator runs **download as a
  separate Stimela invocation first**, then `create-ms:snapshotimage`, guaranteeing
  files exist before the glob runs. The pattern is hardcoded to `rawdata/`.
- **`raw_data_nfile = nframes`.** N raw HDFs merge into one MS; WSClean's
  `intervals-out = nframes` splits the time range into N images → "N images from N
  snapshots".

## Lesson 39 — `tart2ms` internals (the densest cab)

From the real log, in order:
1. **Read** the vis HDF (visibilities, antenna ENU positions, gains, times, freq).
2. **Apply the station gains** (because `uncalibrated: false`) into `DATA` —
   calibration **layer 1**. Dead antennas (gain 0; live set: 1,3,21,22,23) are
   zeroed.
3. **Fetch GNSS orbital data** and build the source model.
4. **Convert ENU → ITRF/ECEF** using the WGS-84 site location; store in
   `ANTENNA::POSITION`.
5. **Compute UVW** toward the instantaneous zenith, then **rephase** all data to a
   single phase centre = **zenith at the obs midpoint** (`RA 154.7303°, Dec
   23.9466°`, J2000; field `J101855+235648`). Because the array is coplanar and the
   centre is the zenith, **w ≈ 0** (Lesson 10).
6. **DFT the model** into `MODEL_DATA` and write `model_sources_*.txt` (Tigger LSM:
   `name ra_d dec_d I spi freq0`).

**The dask-scheduler patch.** `tart2ms` hardcodes `dask.config.set(scheduler=
'processes')`, which *deadlocks* on a many-core host (the "Computing UVW…" loop:
minutes → hours). `container_patch/sitecustomize.py` is injected into every cab via
`APPTAINERENV_PYTHONPATH`; it rewrites any `processes`/`threads` request to
`synchronous`. Without it, `create-ms` hangs.

## Lesson 40 — CASA and the MeasurementSet

The **MeasurementSet (MS)** is the universal radio-data model: a directory of
casacore tables (`MAIN`, `ANTENNA`, `FIELD`, `SPECTRAL_WINDOW`, `POLARIZATION`,
`OBSERVATION`, …). The columns that matter (full table in `IMAGING_GUIDE.md`
Appendix B): `DATA` (layer-1-calibrated vis), `MODEL_DATA` (the DFT'd sky),
`CORRECTED_DATA` (post-`applycal`, what WSClean images), `UVW`, `WEIGHT`, `FLAG`,
`TIME`, `ANTENNA::POSITION`, `FIELD::PHASE_DIR`, `SPECTRAL_WINDOW::CHAN_FREQ`.

CASA tasks used: `gaincal` (solve `G0a`,`G0p` — Lesson 20), `applycal` (write
`CORRECTED_DATA`), `flagmanager` (flag backups), `listobs`/`plotms`/`plotants`
(diagnostics).

**The MeerKAT rename hack.** `updateobservatory` runs TaQL
`UPDATE …OBSERVATION SET TELESCOPE_NAME='MeerKAT'` so CASA/WSClean tasks that look
an observatory up *by name* don't choke on "TART". This is **safe only because
UVW are already computed and stored** by `tart2ms`; nothing downstream recomputes
geometry from the (now wrong) name. It is why the FITS says `TELESCOP = MeerKAT`.
A landmine: any future step deriving positions from the name would silently use
South Africa.

## Lesson 41 — WSClean: gridding, CLEAN, and the FITS output

`snapshotimage` runs WSClean on `CORRECTED_DATA`. It (a) **grids + inverse-FFTs**
to a dirty image (Lesson 14), (b) **w-stacks** (here `WSCNWLAY = 1` — one layer,
correct for the coplanar array, Lesson 10), (c) **CLEANs** (Lesson 16, with
`niter 5000`, `gain 0.1`, `mgain 0.95`, `auto-mask 5`, `briggs 0.0`), and (d)
writes FITS with a full **SIN-projection celestial WCS** plus `DATE-OBS` (interval
midpoint), `RESTFRQ`, the fitted clean beam (`BMAJ/BMIN/BPA`), and provenance
(`WSC*` keywords). `intervals-out = nframes` makes one image per time slice.
Outputs: `-image` (restored, the science frame), `-dirty`, `-psf`, `-model`,
`-residual`.

## Lesson 42 — `overlay_satellites.py`: the projection chain

For each `*-image.fits`: read `DATE-OBS` + celestial WCS → query the catalogue at
that instant (topocentric az/el) → **az/el → ICRS RA/Dec** with astropy `AltAz` at
the station location/time → **RA/Dec → pixel** with `wcs.world_to_pixel` → draw a
cyan circle + label. **No hand-tuned flip/scale/rotation** — both the image (via
WSClean's SIN WCS) and the markers pass through the *same* astronomical coordinate
system, so alignment is automatic *if calibration is right* (Lessons 17–20). A
direction-cosine fallback (`l = cosθ·sinA`, `m = cosθ·cosA`) handles headers
lacking a usable WCS.

## Lesson 43 — `validate_alignment.py`: the always-on gate

Validation is **part of imaging**, not a separate script — the orchestrator runs it
on every run, between WSClean and the overlay. Two layers:
- **(A) synthetic self-test** — fabricate the exact SIN FITS WSClean would write,
  paint Gaussians at the true catalogue RA/Dec, re-project with the overlay code,
  measure marker-vs-source distance (passes at **0.0000 px** → the math is exact).
- **(B) real-frame check** — on the actual FITS: assert a usable celestial WCS + an
  obs time; verify the WCS **round-trips** (residual ~`1e-13°` → invertible); count
  catalogue sources on-frame (`68/68`); test whether markers sit on systematically
  **brighter** pixels than random points *inside the visible-sky disk* (`z ≈ +0.6`).

Structural failures (no WCS, no time, non-invertible WCS, synthetic test fails)
**abort the run**; the brightness test is a warning (a noisy snapshot can be
inconclusive). Override with `VALIDATE=warn`.

## Lesson 44 — The orchestrator and the movie

`run_tart_imaging.sh` is the entry point: it activates the venv, injects the dask
patch, **cleans stale data** (a station-stamp guard force-cleans on station change;
`FRESH=1` wipes rawdata/img/MS/caltables/model_sources so no old *time* or
*telescope* leaks into the single GLOB'd MS — Lesson 38), runs Stimela in two
phases, **validates (gate)**, overlays, then `make_movie.py` encodes the annotated
PNGs to MP4 with a bundled ffmpeg. `make_movie.py` deliberately does **not**
re-render FITS — it stitches the already-annotated frames so the baked-in markers
stay put.

## Lesson 45 — The environment patches

- **`patches/fix_py314_asyncio.py`** — Python 3.14 removed
  `asyncio.get_event_loop()` auto-creating a loop; Stimela 2.0.3.x relies on the
  old behaviour. The patch idempotently rewrites the call site; re-run after any
  `pip install/upgrade stimela`. Harmless on ≤3.12.
- **`container_patch/sitecustomize.py`** — the dask synchronous-scheduler fix
  (Lesson 39), injected into containers via `APPTAINERENV_PYTHONPATH`.

These are not optional polish; without them `create-ms` either crashes (3.14) or
hangs for hours (dask), as documented in `IMAGING_GUIDE.md` and the run logs.

---

# PART XI — Mastery

## Lesson 46 — Worked problem set (do these with pen and paper)

**P1 (resolution).** TART at `λ = 0.1903 m`, `B_max = 3.153 m`. Resolution?
*Solution:* `θ ≈ λ/B_max = 0.1903/3.153 = 0.0603 rad = 3.46°`. (Beam fit gives
3.1–3.8°.) ∎

**P2 (baseline count & uv-points).** 24 antennas. Baselines? uv-points imaged?
*Solution:* `24·23/2 = 276` baselines; with Hermitian symmetry `(−u,−v)` each
contributes 2 → `552` uv-points (plus the missing `(0,0)`). ∎

**P3 (spatial frequency).** What angular scale does TART's *shortest* baseline
(0.322 m) sample? *Solution:* `0.322/0.1903 = 1.69 λ` → angular scale `≈ 1/1.69
rad = 0.59 rad = 34°`. So short baselines see very coarse all-sky structure. ∎

**P4 (w-term).** Prove TART's midpoint `w = 0` and bound it over the snapshot.
*Solution:* `w = b·ŝ₀/λ`; coplanar `b_U = 0`, midpoint `ŝ₀ = Up` ⇒ `w = b_U/λ = 0`.
Off-midpoint, `ζ ≤ Ω⊕·30.75 s = 0.128°`, `|w| ≤ B_max sinζ/λ = 0.037 λ`, phase
`≤ 13°`. ∎

**P5 (SIN disk).** With `CDELT = 0.16667°`, at what pixel radius does the horizon
land? *Solution:* `R = (180/π)sin90°/0.16667 = 57.296/0.16667 = 343.8 px`. ∎

**P6 (precession).** Predict the J2000 declination of the zenith for `bd-iub`
(geodetic lat 23.8155°) observed at epoch 2026.44. *Solution:* date-Dec ≈ lat ≈
23.815°; precession `dδ/dt = 20.04″cos(154.73°) = −18.1″/yr`, over 26.44 yr =
`−0.133°`; `δ_J2000 = 23.815 − (−0.133) = 23.95°`. Header: 23.9466°. ∎

**P7 (far-field).** Is a GPS satellite (20 200 km) in TART's far field?
*Solution:* `d_F = 2D²/λ = 2(3.153)²/0.1903 = 104 m`; `2.02×10⁷ ≫ 104` → yes,
plane-wave valid by 5 orders of magnitude. ∎

**P8 (UT1 error).** How big a position error from a 0.9-s UT1−UTC error?
*Solution:* `0.9 s × 15.04″/s = 13.5″ = 0.0038°` — negligible vs 3.8° beam (but
fatal for a mas-resolution VLBI array). ∎

**P9 (closure).** How many independent closure phases does TART have?
*Solution:* `(N−1)(N−2)/2 = 23·22/2 = 253`. ∎

**P10 (cell sampling).** Does `scale = 600″` oversample TART's beam?
*Solution:* `θ_syn ≈ 3.5° = 12600″`; `12600/600 ≈ 21` pixels across the beam ≫ 3
→ comfortably Nyquist-sampled. ∎

## Lesson 47 — The grand no-mercy exam

Four tiers, easy → brutal. Cover the answer and reconstruct it. (Tier-4 items
overlap the adversarial Q&A in `IMAGING_GUIDE.md` §13; here you must *derive*, not
recall.)

### Tier 1 — fundamentals (a sharp high-schooler should manage)
1. Why can't one small antenna make a sharp radio image? *(diffraction limit
   λ/D; need a large aperture.)*
2. What does a pair of antennas measure? *(a fringe = one Fourier component of the
   sky: amplitude + phase.)*
3. Why does TART image satellites and not stars? *(it works at GNSS L1, 1575 MHz;
   the bright L1 sources overhead are navigation satellites.)*
4. Why a movie? *(satellites drift across the sky frame-to-frame.)*
5. Why are TART's "stars" inside a circle smaller than the square image?
   *(SIN projection puts the hemisphere in a 343.8-px disk inside the 512-px
   half-frame; corners are below the horizon.)*

### Tier 2 — mechanics (a competent grad student)
6. Define the visibility and state the van Cittert–Zernike theorem.
7. What are `(u,v,w)` and `(l,m,n)`? Why is `w` "the height of the hemisphere"?
8. Derive that one baseline samples one spatial frequency.
9. Dirty image vs clean image; what is the synthesized beam?
10. Explain Briggs robust weighting and why `R = 0` was chosen.
11. Walk the CLEAN loop and define `gain`, `mgain`, `niter`, `auto-mask`.
12. Why does TART produce only an `RR` image, and what does that cost?
13. Where do the satellite *overlay* positions come from, and why is overlaying
    them not circular reasoning?

### Tier 3 — rigor (a strong postdoc)
14. Prove TART's `w ≈ 0` and bound the worst-case w-phase. State the assumption
    that would break it.
15. Derive the 0.131° gap between field declination and station latitude.
16. Write the gain least-squares problem and explain amplitude (300 s) vs phase
    (10 s) solution intervals.
17. Derive closure phase and count TART's independent closure phases.
18. The MS has `DATA`, `MODEL_DATA`, `CORRECTED_DATA`. What is in each, who writes
    it, and what does WSClean image?
19. Quantify bandwidth and time smearing for TART; are they limiting?
20. Why is there no absolute flux scale, and what would you need to get one?

### Tier 4 — brutal (the referee who wants you to fail)
21. "All-sky imaging with one w-layer is wrong." Defend or concede — with numbers.
22. "Your self-cal hallucinates the GNSS model into the image." Rebut precisely,
    using degrees-of-freedom and the independence of the ephemeris positions.
23. "Antennas 1,3,21,22,23 have gain 0 — division by zero in applycal." Explain
    why not, and connect to the historical misalignment bug.
24. "You renamed the telescope to MeerKAT; your geometry is South African."
    Explain why the UVW are still TART's, and name the exact future change that
    *would* make this fatal.
25. "GNSS are 20 000 km away — your plane-wave equation is invalid (near field)."
    Refute with the Fraunhofer distance; then explain why their *finite distance*
    still matters (topocentric parallax) and how you handle it.
26. "Earth rotation should smear or help your image." Explain why it does neither
    over 61.5 s, yet is essential for the VLA — contrast the two regimes.
27. Derive the radiometer-equation sensitivity for TART and explain why dynamic
    range, not thermal noise, limits the image.
28. The IERS table is out of date and casacore warns. For TART: harmless. For a
    different instrument: catastrophic. Give the quantitative crossover.

**Model answers** for every Tier-4 item, written out, are in `IMAGING_GUIDE.md`
§13 (Q1–Q21) and §5/§9/§10/§12. If your derivation matches the magnitudes there,
you have mastered it.

## Lesson 48 — Common misconceptions and traps

- "More integration time sharpens the image." *No* — time (and Earth rotation)
  improves **uv-coverage/sensitivity**, not the diffraction-limited resolution
  `λ/B_max`.
- "The dark corners are bad data / a calibration error." *No* — they are
  below-horizon directions a SIN projection cannot fill (Lesson 28).
- "The satellites line up because we drew them there." *No* — positions come from
  independent ephemerides; calibration has too few DOF to fake all of them
  (Lesson 20).
- "1 w-layer means w was ignored." *No* — `w ≈ 0` was *computed*; one layer is
  exact for a coplanar zenith-phased array (Lesson 10).
- "TART measures flux in Jansky." *No* — relative `JY/BEAM` only; 1-bit +
  `solnorm` (Lesson 29).
- "Telescope is MeerKAT — wrong geometry." *No* — a name hack; UVW were
  pre-computed (Lesson 40).
- "Resolution ~ λ/D_element." *No* — that's the **field of view** (primary beam);
  resolution is `λ/B_max` (Lesson 1).

## Lesson 49 — Glossary

**Aperture synthesis** — building a large effective aperture from many baselines.
**Baseline** — an antenna pair; its vector sets the sampled spatial frequency.
**Visibility** — complex cross-correlation of two antennas; a Fourier component of
the sky. **uv-plane** — the space of sampled spatial frequencies. **Dirty image**
— `FT⁻¹` of sampled visibilities = sky ⊛ dirty beam. **Synthesized/dirty beam
(PSF)** — array response to a point source = `FT⁻¹{S}`. **CLEAN** — iterative
deconvolution. **Primary beam** — single-element pattern; sets field of view.
**Jones matrix** — `2×2` per-antenna corruption; the RIME factors. **G/D/E/P/K** —
gain / leakage / element-beam / parallactic / geometric Jones terms. **Closure
phase** — gain-independent sum of phases around a triangle. **Direction cosines
(l,m,n)** — sky coordinates from the phase centre. **SIN projection** —
orthographic sky→plane map; plane coords *are* `(l,m)`. **WCS** — FITS
pixel↔sky mapping. **Measurement Set (MS)** — the standard radio data tables.
**SEFD** — system-equivalent flux density (sensitivity). **GNSS** — global
navigation satellites (GPS/GLONASS/Galileo/BeiDou/QZSS), TART's L1 sources.
**RHCP** — right-hand circular polarization (GNSS L1, TART's feed).

## Lesson 50 — Where to go next (canonical references)

- **Thompson, Moran & Swenson — *Interferometry and Synthesis in Radio
  Astronomy*** (the bible; free 3rd ed. open-access). Fringe, VCZ, the whole
  measurement formalism.
- **Taylor, Carilli & Perley (eds) — *Synthesis Imaging in Radio Astronomy II***
  (the NRAO summer-school lectures; superb on calibration, deconvolution,
  wide-field).
- **Hamaker, Bregman & Sault (1996)** — the RIME papers (Jones formalism).
- **Smirnov (2011), "Revisiting the RIME" (I–IV)** — the modern measurement
  equation.
- **Högbom (1974)**, **Clark (1980)**, **Cornwell (multi-scale CLEAN)**,
  **Offringa et al. (WSClean, 2014)** — deconvolution and the imager you use here.
- **TART**: the `tart2ms`, `tart_tools`, and Stimela/cult-cargo docs; this folder's
  `IMAGING_GUIDE.md` (rigorous reference + Q&A), `STIMELA_RUN.md` (hands-on).

---

*You now have the full chain: why interferometry exists → the fringe → van
Cittert–Zernike → aperture synthesis → calibration/RIME → polarization →
coordinates/time/projections → sensitivity/artifacts → the TART instrument → the
software, line by line → and an exam that mirrors a hostile defense. Re-derive,
don't memorize; the magnitudes are your guide. The recipe `tart_dl.yaml` and the
live API are the ground truth — where this course and the code disagree, the code
wins and that is a bug to file.*

