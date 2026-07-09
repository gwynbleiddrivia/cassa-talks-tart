import React from 'react';
import { QRCodeSVG } from 'qrcode.react';
import './App.css';

const SLIDE_DATA = [
	  {
		      stage: "Basics of Interferometry",
		      title: "Measuring Visibilities",
		      content: "An interferometer does not capture an image directly. Instead, every pair of antennas measures a single Fourier component (a visibility) of the sky brightness distribution. The relationship is defined by the Van Cittert-Zernike theorem.",
		      formula: "V(u,v) = ∫∫ I(l,m) e^(-2πi(ul + vm)) dl dm",
		      notebookRef: "cab: raw-data-download -> ms-create"
		    },
	  {
		      stage: "Antenna Layout",
		      title: "The Spatial Baseline Grid",
		      content: "The Transient Array Radio Telescope (TART) utilizes a dense planar array. Each vector between two antennas forms a baseline (u, v) projected onto the incoming wavefront. More baselines equal denser sampling in the Fourier domain.",
		      formula: "N_baselines = N_antennas * (N_antennas - 1) / 2",
		      notebookRef: "cab: plot-antenna-layout"
		    },

{
  stage: "Pipeline · Stage 1 / 8",
  title: "Acquire Raw Visibilities",
  layout: "triptych",
  concept: {
    heading: "Why",
    points: [
      "The array records no image — only visibilities.",
      "Each antenna pair → one complex number (amp + phase).",
      "A visibility = correlation of two antennas' voltages.",
      "Stage 1 just pulls these raw numbers off the telescope."
    ]
  },
  algorithm: {
    heading: "Algorithm (Python)",
    code: `# pull raw visibilities from the TART REST API
assert GET {api}/mode/current == "vis"
vis  = GET {api}/imaging/vis       # re + i·im, per baseline
gain = GET {api}/calibration/gain  # published gains
info = GET {api}/info              # lat, lon, alt, time
save → rawdata/vis_<timestamp>.json`
  },
  recipe: {
    heading: "Stimela recipe",
    code: `download-hdf:
  cab: tart-download-data
  params:
    api: =recipe.api      # .../tart/bd-iub
    vis: true
    n:   =recipe.raw_data_nfile   # 10 files
    dir: =recipe.h5dir            # rawdata/`
  }
},

{
  stage: "Stage 2 / 8", title: "Build the Measurement Set", layout: "triptych",
  concept: { heading: "Why", points: [
    "Raw JSON → standard radio dataset (MS).",
    "Antenna positions give each baseline (u,v).",
    "Phase centre = zenith at snapshot time."
  ]},
  algorithm: { heading: "Algorithm", code: `for baseline (i,j):
    uvw  = ant[j] − ant[i]     # metres
    data = re + i·im
U,V = uvw / wavelength         # w ≈ 0 (coplanar)` },
  recipe: { heading: "Stimela recipe", code: `create-ms:
  cab: tart2ms
  params:
    ms: msdir/bd-iub.ms
    rephase: obs-midpoint` }
},
{
  stage: "Stage 3 / 8", title: "Model the Sky (RIME)", layout: "triptych",
  concept: { heading: "Why", points: [
    "Known GPS satellites = our 'guide stars'.",
    "Predict their visibilities as point sources.",
    "MODEL vs DATA drives calibration."
  ]},
  algorithm: { heading: "Algorithm", code: `for sat s above horizon:
    l,m = cos(el)·sin(az), cos(el)·cos(az)
MODEL_ij = Σ_s exp(−2πi(u·l + v·m))` },
  recipe: { heading: "Stimela recipe", code: `create-ms:
  cab: tart2ms
  params:
    add-model: true
    write-model-catalog: true` }
},
{
  stage: "Stage 4 / 8", title: "Calibrate the Gains", layout: "triptych",
  concept: { heading: "Why", points: [
    "Antennas have unknown gain + phase errors.",
    "Solve gₚ so DATA ≈ gₚ·conj(g_q)·MODEL.",
    "Amplitude first, then phase (StefCal)."
  ]},
  algorithm: { heading: "Algorithm", code: `# StefCal (alternating least squares)
repeat:
    z   = conj(g_q)·MODEL
    g_p = Σ(DATA·conj(z)) / Σ|z|²
normalise: mean|g| → 1` },
  recipe: { heading: "Stimela recipe", code: `calibrate_amplitude:
  cab: casa.gaincal
  params: {calmode: a, solnorm: true}
calibrate_phase:
  cab: casa.gaincal
  params: {calmode: p, solint: 10s}` }
},
{
  stage: "Stage 5 / 8", title: "Apply Calibration", layout: "triptych",
  concept: { heading: "Why", points: [
    "Correct every visibility with solved gains.",
    "CORRECTED = DATA / (gₚ·conj(g_q)).",
    "Dead antennas flagged — never ÷ by ~0."
  ]},
  algorithm: { heading: "Algorithm", code: `denom     = g[ant1]·conj(g[ant2])
CORRECTED = DATA / denom     # skip flagged` },
  recipe: { heading: "Stimela recipe", code: `applycal:
  cab: casa.applycal
  params:
    gaintable: [tart.G0a, tart.G0p]
    flagbackup: true` }
},
{
  stage: "Stage 6 / 8", title: "Weight the Visibilities", layout: "triptych",
  concept: { heading: "Why", points: [
    "Sparse (u,v) sampling → weight each sample.",
    "Briggs 'robust': resolution vs noise trade.",
    "robust = 0 → balanced."
  ]},
  algorithm: { heading: "Algorithm", code: `grid (u,v) → density Wₖ per cell
w = 1 / (1 + Wₖ · f2)
# f2 set by robust parameter` },
  recipe: { heading: "Stimela recipe", code: `snapshotimage:
  cab: wsclean
  params:
    weight: briggs 0.0` }
},
{
  stage: "Stage 7 / 8", title: "Make the Dirty Image", layout: "triptych",
  concept: { heading: "Why", points: [
    "Fourier-invert visibilities → sky image.",
    "Coplanar array (w=0) → exact direct DFT.",
    "PSF = image of all-ones (the beam)."
  ]},
  algorithm: { heading: "Algorithm", code: `I(l,m) = Σ_bl w·Re( V·exp(+2πi(u·l + v·m)) )
PSF    = same, with V = 1` },
  recipe: { heading: "Stimela recipe", code: `snapshotimage:
  cab: wsclean
  params: {size: 1024, scale: 600asec, pol: RR}` }
},
{
  stage: "Stage 8 / 8", title: "Deconvolve + Restore", layout: "triptych",
  concept: { heading: "Why", points: [
    "Dirty image = true sky ⊛ PSF.",
    "CLEAN peels off PSF sidelobes iteratively.",
    "Restore with clean beam → export FITS."
  ]},
  algorithm: { heading: "Algorithm", code: `# Cotton-Schwab CLEAN
minor: subtract gain·PSF at brightest peak
major: re-image exact residual
restored = model ⊛ beam + residual` },
  recipe: { heading: "Stimela recipe", code: `snapshotimage:
  cab: wsclean
  params: {niter: 5000, mgain: 0.95, auto-mask: 5}` }
},




];

export default function App() {
	  const currentUrl = typeof window !== 'undefined' ? window.location.href : 'https://stimela-talk.vercel.app';

	  return (
		      <main className="deck-viewport">
		        {SLIDE_DATA.map((slide, i) => {
				        const slideIndex = i + 1;
				        const formattedNumber = String(slideIndex).padStart(2, '0');

				        return (
						          <section key={slideIndex} className="slide-page">
						            <div className="minimalist-frame">
						              
						              <header className="slide-header">
						                <span className="slide-num">{formattedNumber}</span>
						                <div className="qr-container">
						                  <QRCodeSVG value={currentUrl} size={70} level={"L"} />
						                  <span className="qr-label">SCAN TO FOLLOW</span>
						                </div>
						              </header>
({/** 
 * 
 * 
						              <div className="slide-content">
						                <p className="stage-label">{slide.stage}</p>
						                <h1>{slide.title}</h1>
						                <p className="description">{slide.content}</p>
						                <div className="math-box">
						                  <code>{slide.formula}</code>
						                </div>
						                <p className="ref-text">Stimela Step: {slide.notebookRef}</p>
						              </div>

*/})
{slide.layout === "triptych" ? (
  <div className="triptych">
    <div className="block concept">
      <p className="stage-label">{slide.stage}</p>
      <h1>{slide.title}</h1>
      <h2>{slide.concept.heading}</h2>
      <ul>{slide.concept.points.map((p, k) => <li key={k}>{p}</li>)}</ul>
    </div>
    <div className="block algorithm">
      <h2>{slide.algorithm.heading}</h2>
      <pre>{slide.algorithm.code}</pre>
    </div>
    <div className="block recipe">
      <h2>{slide.recipe.heading}</h2>
      <pre>{slide.recipe.code}</pre>
    </div>
  </div>
) : (
  <div className="slide-content">
    <p className="stage-label">{slide.stage}</p>
    <h1>{slide.title}</h1>
    <p className="description">{slide.content}</p>
    <div className="math-box"><code>{slide.formula}</code></div>
    <p className="ref-text">Stimela Step: {slide.notebookRef}</p>
  </div>
)}


						            </div>
						          </section>
						        );
				      })}
		      </main>
		    );
}
