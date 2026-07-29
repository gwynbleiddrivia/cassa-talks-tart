import React from 'react';
import { QRCodeSVG } from 'qrcode.react';
import './App.css';
import BaselineExplorer from "./BaselineExplorer";
import FringeSlider from "./FringeSlider";

const SLIDE_DATA = [
  // ───────── SLIDES 1–5: interactive graphs (placeholders; you build these in Colab) ─────────
  {
    layout: "cover",
    theme: "Space Science & Astronomy for Outreach & Education",
    title: "Visualizing the Transient Sky: Real-Time All-Sky Imaging and Open Data in the TART Ecosystem",
    authors: [
      { name: "T Molteno" }, { name: "B Hugo" }, { name: "S Mirza" },
      { name: "MYA Khondoker", bold: true }, { name: "SR Diya" }, { name: "SH Abrar" },
      { name: "SH Muzaffar" }, { name: "MFH Sami" }, { name: "T Rahman" },
      { name: "MH Masum" }, { name: "KMB Asad" }
    ],
    meta: "PSSARC 2026 · Cebu, Philippines · CASSA / Independent University, Bangladesh"
  },
  { layout: "stack", title: "The TART Telescope", images: ["/tartpic.jpg"] },

  { layout: "gallery", title: "CASSA Workshop 2 · Building & Learning TART",
    photos: [
      { src: "/conf1.jpg", caption: "Students at the TART array" },
      { src: "/conf2.jpg", caption: "Working on TART's electronics" },
      { src: "/conf3.jpg", caption: "Prof. Tim Molteno lecturing" },
    ] },

  { layout: "agenda", title: "What the Next 13 Minutes Look Like",
    lead: "Interferometry: instead of one huge dish, link many small antennas — compare the waves each pair catches, and the maths turns them into a single giant telescope.",
    parts: [
      { num: "01", title: "Feel the Interferometry",
        kicker: "TART lets you build the radio sky by eye — no equations needed.",
        items: [
          "Two antennas, one interference pattern",
          "One baseline makes one fringe",
          "A fringe — the slice of sky a pair sees",
          "How the fringe changes with distance and angle",
          "A baseline becomes a point: the uv-plane",
          "Calibration rotates the arrows",
          "The conjugate twins, and the complete uv-map",
          "Add the fringes → the sky appears"
        ] },
      { num: "02", title: "Run the Software Pipeline",
        kicker: "The same picture, reproduced step by step from open data by open software.",
        items: [
          "Install the pipeline (Stimela)",
          "Download raw visibilities",
          "Create the measurement set",
          "Label and safeguard the data",
          "See what the array samples",
          "Solve the amplitudes",
          "Solve the phases",
          "Correct the visibilities",
          "Fourier-invert and CLEAN",
          "The final sky"
        ] },
      { num: "03", title: "The Hardware", later: true,
        kicker: "24 antennas, the correlator, the rooftop build.",
        items: ["Presented in the later talk"] }
    ] },


  {
    stage: "The Trick",
    title: "What a Fringe Is — and How It Changes with Distance and Angle",
    content: "A pair of antennas never sees a picture. It sees one striped pattern laid across the whole sky. Move the pair further apart and the stripes get finer; turn the pair and the stripes turn with it — always at a right angle to the line joining the two antennas.",
    layout: "img-interactive",
    image: "/fringe.png",
    caption: "Wavefronts arriving at two antennas: where they add, a bright band; where they cancel, a dark one. Close pair → bold bands. Far pair → fine bands.",
    sep: 1.20, ang: 163, size: 160
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
  

  // ───────── SLIDE 6: dependency install ─────────
  {
    stage: "Setup", title: "Install the Necessary packages and recipes", layout: "triptych",
    concept: { heading: "Why", points: [
      "Stimela runs each step inside a container.",
      "Reproducible on any WSL-2 machine.",
      "Install it once, then just run recipes.",
      "git clone https://github.com/gwynbleiddrivia/tart-stimela-run",
      "Detailed instruction on Stimela imaging and necessary files in this repo"
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
pip install tart_cargo cult_cargo stimela
cp /mnt/d/tart/tart_dl.yaml .
cp /mnt/d/tart/casacabs.yaml .
cp /mnt/d/tart/make_mov.py .
cp -r /mnt/d/tart/casa/ ./casa/` }
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

  {
    stage: "Stage 7 · Apply", title: "Correct the Visibilities", layout: "triptych",
    concept: { heading: "What this does", points: [
      "Divide the solved gains out of every visibility.",
      "Produces CORRECTED data, ready to image.",
      "Dead antennas dropped — never ÷ by zero."
    ]},
    algorithm: { heading: "Algorithm", code: `CORRECTED = DATA / (gain_p · conj(gain_q)
drop flagged / dead-antenna baselines` },
    recipe: { heading: "Command", code: `stimela run tart_dl.yaml tart=bd-iub -s applycal` }
  },

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
  
  { stage: "Stage 8 · Image", title: "The Final Sky", layout: "stack", images: ["/final.png"] },
    { stage: "Thanks", title: "Under One Sky",
    content: "Take the whole deck with you — and scan any slide to play with it live.",
    layout: "download", file: "/final_pdf.pdf" },


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
                                                            <span className="qr-label">SCAN THIS QR<br/>OR VISIT https://cassa-talks-tart-flame.vercel.app/ TO PLAY WITH THIS SLIDE</span>

						                </div>
						              </header>


{slide.layout === "gallery" ? (
  <div className="slide-content">
    {slide.title && <h1>{slide.title}</h1>}
    <div className="gallery">
      {slide.photos.map((p, i) => (
        <figure key={i}><img src={p.src} alt="" />
          {p.caption && <figcaption>{p.caption}</figcaption>}</figure>
      ))}
    </div>
  </div>
) : slide.layout === "agenda" ? (
  <div className="slide-content agenda">
    <h1>{slide.title}</h1>
    <p className="agenda-lead">{slide.lead}</p>
    <div className="agenda-cols">
      {slide.parts.map((p, k) => (
        <div key={k} className={p.later ? "agenda-part later" : "agenda-part"}>
          <span className="part-num">{p.num}</span>
          <h2 className="part-title">{p.title}</h2>
          <p className="part-kicker">{p.kicker}</p>
          <ol>{p.items.map((it, n) => <li key={n}>{it}</li>)}</ol>
        </div>
      ))}
    </div>
  </div>

) : slide.layout === "cover" ? (
  <div className="cover">
    <p className="cover-theme">{slide.theme}</p>
    <h1 className="cover-title">{slide.title}</h1>
    <p className="cover-authors">
      {slide.authors.map((au, i) => (
        <span key={i}>{au.bold ? <strong>{au.name}</strong> : au.name}
          {i < slide.authors.length - 1 ? ", " : ""}</span>
      ))}
    </p>
    <p className="cover-meta">{slide.meta}</p>
  </div>
) : slide.layout === "download" ? (

  <div className="slide-content">
    {
    //<p className="stage-label">{slide.stage}</p>
            }
    <h1>{slide.title}</h1>
    <p className="description">{slide.content}</p>
    <a href={slide.file} download className="dl-btn">⬇ Download the slides (PDF)</a>
  </div>
) : slide.layout === "stack" ? (

  <div className="slide-content">
    {
    //<p className="stage-label">{slide.stage}</p>
            }
    <h1>{slide.title}</h1>
    <div className="img-stack">
      {slide.after === "slider" && <FringeSlider />}
      {slide.images.map((src, k) => <img key={k} src={src} alt="" />)}
    </div>
  </div>
) : slide.layout === "img-interactive" ? (
  <div className="slide-content img-interactive">
    <h1>{slide.title}</h1>
    <p className="description">{slide.content}</p>
    <div className="ii-row">
      <figure className="ii-left">
        <img src={slide.image} alt="" />
        {slide.caption && <figcaption>{slide.caption}</figcaption>}
      </figure>
      <div className="ii-right">
        <BaselineExplorer sep={slide.sep} ang={slide.ang} size={slide.size ?? 160} />
      </div>
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
