import React from 'react';
import { QRCodeSVG } from 'qrcode.react';
import './App.css';
import BaselineExplorer from "./BaselineExplorer";
import FringeSlider from "./FringeSlider";

const SLIDE_DATA = [
  // ───────── SLIDES 1–5: interactive graphs (placeholders; you build these in Colab) ─────────

    { stage: "The Trick", title: "Two Antennas, Their Waves Interfere",
    layout: "stack", images: ["/interference.png"] },

    { stage: "The Trick", title: "One Baseline Makes One Fringe",
    layout: "stack", images: ["/baseline.png"] },

   {
    stage: "The Trick", title: "One Baseline → One Fringe",
    content: "Two pairs, two fringes. Wider apart → dot further out → finer stripes.",
    layout: "interactive",
    instances: [ { sep: 0.30, ang: 40 }, { sep: 0.72, ang: 60 } ]
  },
  {
    stage: "The Trick", title: "Longer Baselines, Finer Fringes",
    content: "Keep going — the longer the pair, the finer and more tilted the fringe.",
    layout: "interactive",
    instances: [ { sep: 0.87, ang: 109 }, { sep: 1.20, ang: 163 } ]
  },


    { stage: "The Map", title: "A Baseline Becomes a Point",
    layout: "stack", images: ["/uv1.png"] },
  { stage: "The Map", title: "Calibration Rotates the Arrows",
    layout: "stack", images: ["/uv2.png"] },
  { stage: "The Map", title: "Corrected, Plus the Conjugate Twins",
    layout: "stack", images: ["/uv3.png"] },
  { stage: "The Map", title: "The Complete uv-Map — and the To-Do List",
    layout: "stack", images: ["/uv4.png"] },

  { stage: "The Payoff", title: "Add the Fringes → the Sky Appears",
    layout: "stack", images: [], after: "slider" },
  { stage: "The Payoff", title: "1 Baseline — Just Stripes",        layout: "stack", images: ["/sumsteps/sum1.png"] },
  { stage: "The Payoff", title: "2 Baselines — a Lattice Appears",  layout: "stack", images: ["/sumsteps/sum2.png"] },
  { stage: "The Payoff", title: "30 Baselines — the Centre Wins",   layout: "stack", images: ["/sumsteps/sum30.png"] },
  { stage: "The Payoff", title: "150 Baselines — Sidelobes Fade",   layout: "stack", images: ["/sumsteps/sum150.png"] },
  { stage: "The Payoff", title: "All Baselines — the Sky",          layout: "stack", images: ["/sumsteps/sumfull.png"] },


 
  // ───────── SLIDE 6: dependency install ─────────
  {
    stage: "Setup", title: "Install the Pipeline", layout: "triptych",
    concept: { heading: "Why", points: [
      "Stimela runs each step inside a container.",
      "Reproducible on any WSL-2 machine.",
      "Install it once, then just run recipes."
    ]},
    algorithm: { heading: "Requirements", code: `WSL 2
Apptainer 1.4.4 (+ suid)
squashfuse, fuse2fs, gocryptfs
Python venv: tart_cargo, cult_cargo, stimela
Recipe files: tart_dl.yaml, casacabs.yaml, casa/` },
    recipe: { heading: "Install", code: `sudo apt install -y ./apptainer_1.4.4_amd64.deb
sudo dpkg -i ./apptainer-suid_1.4.4_amd64.deb
sudo apt install -y squashfuse fuse2fs gocryptfs
python3 -m venv start && source start/bin/activate
pip install tart_cargo cult_cargo stimela` }
  },

  // ───────── SLIDES 7+: one interferometry stage each ─────────
  {
    stage: "Stage 1 · Acquire", title: "Download Raw Visibilities", layout: "triptych",
    concept: { heading: "What this does", points: [
      "Interferometry starts from correlations, not images.",
      "Each antenna pair → one complex visibility.",
      "Pull a batch of snapshots off the telescope.",
      "https://api.elec.ac.nz/tart/bd-iub/api/v1/info",
      "https://api.elec.ac.nz/tart/bd-iub/api/v1/mode/current",
      "https://api.elec.ac.nz/tart/bd-iub/api/v1/calibration/gain",
      "https://api.elec.ac.nz/tart/bd-iub/api/v1/imaging/vis",
    ]},
    algorithm: { heading: "Algorithm", code: `make the working folders
ask the TART API for N raw snapshots
each snapshot = 276 baselines × complex vis` },
    recipe: { heading: "Command", code: `mkdir stimela_images img rawdata caltables msdir
stimela run tart_dl.yaml tart=bd-iub -s download-hdf` }
  },
  {
    stage: "Stage 2 · Build", title: "Create the Measurement Set", layout: "triptych",
    concept: { heading: "What this does", points: [
      "Raw JSON → the standard radio dataset (MS).",
      "Compute each baseline's (u,v) geometry.",
      "Predict the known-satellite sky model."
    ]},
    algorithm: { heading: "Algorithm", code: `baseline (u,v) = position_j − position_i
fetch GNSS catalogue (known positions)
predict their model visibilities
rephase everything to the zenith` },
    recipe: { heading: "Command", code: `stimela run tart_dl.yaml tart=bd-iub -s create-ms` }
  },
    { stage: "Stage 2 · Build", title: "The Measurement Set", layout: "stack", images: ["/ms.png"] },

  {
    stage: "Stage 3 · Prep", title: "Label & Safeguard", layout: "triptych",
    concept: { heading: "What this does", points: [
      "Tag the data so standard tools accept it.",
      "Save a restore-point before we alter anything.",
      "Every later step stays reversible."
    ]},
    algorithm: { heading: "Algorithm", code: `rename observatory → CASA/WSClean accept it
snapshot the current flags as 'ORIGINAL'` },
    recipe: { heading: "Command", code: `stimela run tart_dl.yaml tart=bd-iub -s updateobservatory
stimela run tart_dl.yaml tart=bd-iub -s flagsave` }
  },
  {
    stage: "Stage 4 · Inspect", title: "See What the Array Samples", layout: "triptych",
    concept: { heading: "What this does", points: [
      "The baselines ARE the Fourier sampling.",
      "Plot the uv-coverage and antenna layout.",
      "This sparse set of points is all we know."
    ]},
    algorithm: { heading: "Algorithm", code: `plot each baseline as a point in the uv-plane
plot the 24 antenna positions
print an observation summary` },
    recipe: { heading: "Command", code: `stimela run tart_dl.yaml tart=bd-iub -s plotuv
stimela run tart_dl.yaml tart=bd-iub -s plotants
stimela run tart_dl.yaml tart=bd-iub -s lister` }
  },
    { stage: "Stage 5 · Calibrate", title: "How Does It Know? — the Known Satellites",
    content: "GPS satellite positions are published to the metre — from orbit data that has nothing to do with our measurement. So we can predict what every baseline SHOULD read: the model. Calibration then finds each antenna's gain and clock offset that makes the real data best match that prediction — like checking a scale against a known 1-kg weight. It corrects the instrument, never the sky.",
    formula: "find gains g so that   g_i · conj(g_j) · MODEL ≈ DATA   (all 24 antennas at once)" },

  {
    stage: "Stage 5 · Calibrate", title: "Solve the Amplitudes", layout: "triptych",
    concept: { heading: "What this does", points: [
      "Each antenna has an unknown gain.",
      "Match the data to the known-satellite model.",
      "Normalise mean gain to 1 (no absolute flux)."
    ]},
    algorithm: { heading: "Algorithm", code: `find gain a_p so |a_p·a_q|·MODEL ≈ DATA
average over the snapshot
normalise mean |gain| → 1` },
    recipe: { heading: "Command", code: `stimela run tart_dl.yaml tart=bd-iub -s calibrate_amplitude
stimela run tart_dl.yaml tart=bd-iub -s plotcaltable_amp` }
  },
    { stage: "Stage 5 · Calibrate", title: "The Amplitude Gains", layout: "stack", images: ["/gain.png"] },

  {
    stage: "Stage 6 · Calibrate", title: "Solve the Phases", layout: "triptych",
    concept: { heading: "What this does", points: [
      "Each antenna's clock is off by an unknown phase.",
      "That's why sources don't focus.",
      "Solve the offsets so fringe crests line up."
    ]},
    algorithm: { heading: "Algorithm", code: `baseline phase = true phase + (clock_p − clock_q)
solve each antenna's clock offset (every 10 s)
subtract it` },
    recipe: { heading: "Command", code: `stimela run tart_dl.yaml tart=bd-iub -s calibrate_phase
stimela run tart_dl.yaml tart=bd-iub -s plotcaltable_phase` }
  },
    { stage: "Stage 6 · Calibrate", title: "The Phase Solutions", layout: "stack", images: ["/phase.png"] },

  {
    stage: "Stage 7 · Apply", title: "Correct the Visibilities", layout: "triptych",
    concept: { heading: "What this does", points: [
      "Divide the solved gains out of every visibility.",
      "Produces CORRECTED data, ready to image.",
      "Dead antennas dropped — never ÷ by zero."
    ]},
    algorithm: { heading: "Algorithm", code: `CORRECTED = DATA / (gain_p · conj(gain_q))
drop flagged / dead-antenna baselines` },
    recipe: { heading: "Command", code: `stimela run tart_dl.yaml tart=bd-iub -s applycal` }
  },
    { stage: "Stage 7 · Apply", title: "The CORRECTED Column", layout: "stack", images: ["/ms_cal.png"] },

  {
    stage: "Stage 8 · Image", title: "Fourier-Invert & CLEAN", layout: "triptych",
       concept: { heading: "What this does", points: [
      "Fourier-sum the visibilities → the 'dirty' image: the true sky smeared by the array's messy beam.",
      "Gaps in the uv-map make every source drag a splatter of rings and spikes (sidelobes).",
      "CLEAN finds the brightest spot, records it as a point source, and subtracts that spot's known splatter — over and over.",
      "Finally it repaints the recorded sources with one smooth, clean beam → the final image."
    ]},
    algorithm: { heading: "How CLEAN works", code: `dirty image = true sky ✳ dirty beam (PSF)
loop:
  find the brightest pixel
  add a fraction of it to the model
  subtract that fraction × shifted PSF
until only noise remains
restore: model ✳ clean beam + leftover noise` },

    recipe: { heading: "Command", code: `stimela run tart_dl.yaml tart=bd-iub -s snapshotimage` }
  },
    { stage: "Stage 8 · Image", title: "Dirty → CLEAN", layout: "stack", images: ["/clean.png"] },
  { stage: "Stage 8 · Image", title: "The Final Sky", layout: "stack", images: ["/final.png"] },
    { stage: "Thanks", title: "Under One Sky",
    content: "Take the whole deck with you — and scan any slide to play with it live.",
    layout: "download", file: "/tart-talk.pdf" },


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
({/**
 * 
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

 */})

{slide.layout === "download" ? (
  <div className="slide-content">
    <p className="stage-label">{slide.stage}</p>
    <h1>{slide.title}</h1>
    <p className="description">{slide.content}</p>
    <a href={slide.file} download className="dl-btn">⬇ Download the slides (PDF)</a>
  </div>
) : slide.layout === "stack" ? (

  <div className="slide-content">
    <p className="stage-label">{slide.stage}</p>
    <h1>{slide.title}</h1>
    <div className="img-stack">
      {slide.after === "slider" && <FringeSlider />}
      {slide.images.map((src, k) => <img key={k} src={src} alt="" />)}
    </div>
  </div>
) : slide.layout === "interactive" ? (

  <div className="slide-content">
    <p className="stage-label">{slide.stage}</p>
    <h1>{slide.title}</h1>
    <p className="description">{slide.content}</p>
    <div className="pair-row">
      {(slide.instances ?? [{ size: 240 }]).map((it, k) => (
        <BaselineExplorer key={k} sep={it.sep} ang={it.ang} size={it.size ?? 150} />
      ))}
    </div>

  </div>
) : slide.layout === "triptych" ? (
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
