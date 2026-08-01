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
    note: "↑ These two sliders are live — scan the QR and drag them yourself.",

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
  

  // ───────── SLIDE 6: the whole pipeline in one picture ─────────
  {
    stage: "Setup", title: "Software Pipeline for Producing an Image", layout: "flowchart",
    steps: [
      { name: "Installation" },
      { name: "Downloading Visibilities", step: "download-hdf" },
      { name: "Measurement Set",          step: "create-ms" },
      { name: "Antenna and UV plane",     step: "plotuv · plotants" },
      { name: "Amplitude Calibration",    step: "calibrate_amplitude" },
      { name: "Phase Calibration",        step: "calibrate_phase" },
      { name: "Apply Calibration",        step: "applycal" },
      { name: "CLEAN" }
    ]
  },

  // ───────── SLIDE 7: Installation (flowchart node 1) ─────────
  {
    stage: "Setup", title: "Installation", layout: "converge",
    hub: "Installation",
    sources: [
      { head: "Apptainer", body: ["1.4.4  (+ suid)"] },
      { body: ["squashfuse, fuse2fs,", "gocryptfs"] },
      { body: ["tart_cargo, cult_cargo,", "stimela", "inside a Python venv"] },
      { head: "Recipe files",
        body: ["tart_dl.yaml,", "casacabs.yaml,", "casa/  (all CASA tools)"] }
    ]
  },

  // ───────── SLIDE 8: Downloading Visibilities (flowchart node 2) ─────────
  {
    stage: "Stage 1 · Acquire", title: "Downloading Visibilities", layout: "hub-aside",
    hub: ["Downloading", "Visibilities"],
    hubStep: "download-hdf",
    source: { body: ["Pulls a bunch of snapshots", "off the telescope."] },
    aside: {
      head: "Explore the raw data",
      base: "https://api.elec.ac.nz/tart/bd-iub",
      paths: ["/api/v1/info",
              "/api/v1/mode/current",
              "/api/v1/calibration/gain",
              "/api/v1/imaging/vis"]
    }
  },

  // ───────── SLIDE 9: Measurement Set (flowchart node 3) ─────────
  {
    stage: "Stage 2 · Build", title: "Measurement Set", layout: "hub-table",
    hub: "Measurement Set", hubStep: "create-ms",
    lead: "One row per antenna pair. 24 antennas make 276 rows — here are the first 10, all of them antenna 0 paired with someone else.",
    groups: [
      { label: "which pair",   span: 2, tone: "a" },
      { label: "where it sits in the uv-plane", span: 2, tone: "b" },
      { label: "what we measured", span: 2, tone: "c" },
      { label: "what the sky predicts", span: 1, tone: "d" }
    ],
    cols: ["ANT1", "ANT2", "U (λ)", "V (λ)", "|DATA|", "phase°", "|MODEL|"],
    highlight: 5,
    rows: [
      ["0", "1",  "0.54",  "2.80", "0.383",   "65.7",  "8.602"],
      ["0", "2",  "1.88",  "4.37", "0.077", "-125.4", "11.071"],
      ["0", "3",  "3.47",  "5.13", "0.158",   "42.4",  "8.544"],
      ["0", "4",  "5.15",  "5.37", "0.101",  "118.1",  "6.074"],
      ["0", "5",  "1.77", "-1.07", "0.212",  "-52.4", "10.236"],
      ["0", "6",  "4.61", "-0.73", "0.190", "-145.6",  "9.615"],
      ["0", "7",  "6.52", "-1.52", "0.125", "-110.3",  "0.992"],
      ["0", "8",  "7.71", "-2.81", "0.126",  "-42.5",  "1.256"],
      ["0", "9",  "8.43", "-4.34", "0.173",   "90.3", "14.141"],
      ["0", "10", "1.29", "-3.10", "0.110",  "-46.2",  "9.976"]
    ],
    note: "The highlighted row is antennas 0 and 6 — a pair sitting 4.7 wavelengths apart. It measured 0.190 at -145.6°. That single complex number is one dot in the uv-plane; the whole table is the telescope's raw output."
  },

  // ───────── SLIDE 8: Downloading Visibilities (flowchart node 2) ─────────
  {
    stage: "Stage 1 · Acquire", title: "Downloading Visibilities", layout: "hub-aside",
    hub: ["Downloading", "Visibilities"],
    source: ["Pulls a bunch of", "snapshots off", "the telescope"],
    aside: {
      head: "Explore the raw data",
      base: "https://api.elec.ac.nz/tart/bd-iub",
      paths: ["/api/v1/info",
              "/api/v1/mode/current",
              "/api/v1/calibration/gain",
              "/api/v1/imaging/vis"]
    }
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
    layout: "download", file: "/SSAEO-CT04_Khondoker.pdf" },


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
                                                                                                                <span className="qr-label">
                                <span className="qr-cta">SCAN TO PLAY WITH THIS SLIDE</span>
                                <span className="qr-or">— or visit —</span>
                                <span className="qr-url">cassa-talks-tart-flame.vercel.app</span>
                              </span>

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
        {slide.note && <p className="ii-note">{slide.note}</p>}
      </div>

    </div>
  </div>

) : slide.layout === "hub-table" ? (
  <div className="slide-content hubtable">
    <p className="stage-label">{slide.stage}</p>
    <h1>{slide.title}</h1>
    <div className="ht-head">
      <div className="ht-hub">
        <span className="ht-hub-name">{slide.hub}</span>
        <span className="ht-hub-step">{slide.hubStep}</span>
      </div>
      <p className="ht-lead">{slide.lead}</p>
    </div>
    <table className="ht-table">
      <colgroup>
        {slide.groups.map((g, i) => (
          <col key={i} span={g.span} className={"ht-" + g.tone} />
        ))}
      </colgroup>
      <thead>
        <tr>
          {slide.groups.map((g, i) => (
            <th key={i} colSpan={g.span} className={"ht-group ht-" + g.tone}>{g.label}</th>
          ))}
        </tr>
        <tr>
          {slide.cols.map((c, i) => <th key={i} className="ht-col">{c}</th>)}
        </tr>
      </thead>
      <tbody>
        {slide.rows.map((r, i) => (
          <tr key={i} className={i === slide.highlight ? "ht-hl" : undefined}>
            {r.map((val, j) => <td key={j}>{val}</td>)}
          </tr>
        ))}
      </tbody>
    </table>
    {slide.note && <p className="ht-note">{slide.note}</p>}
  </div>
) : slide.layout === "hub-aside" ? (
  <div className="slide-content converge">
    <p className="stage-label">{slide.stage}</p>
    <h1>{slide.title}</h1>
    <svg className="cv-svg" viewBox="0 0 1100 560" role="img">
      <defs>
        <marker id="haArrow" viewBox="0 0 10 10" refX="9" refY="5"
                markerWidth="6" markerHeight="6" orient="auto">
          <path d="M 0 0 L 10 5 L 0 10 z" fill="#1f6feb" />
        </marker>
      </defs>

      <path className="cv-link" d="M 330 440 C 385 437, 425 420, 430 344"
            markerEnd="url(#haArrow)" />

      <rect className="cv-hub-box" x="380" y="170" width="310" height="170" rx="10" />
      {slide.hub.map((ln, n) => (
        <text key={n} className="cv-hub" x="535" y={238 + n * 42}
              textAnchor="middle" fontSize="34">{ln}</text>
      ))}
      <text className="cv-sub" x="535" y="392" textAnchor="middle" fontSize="20">
        {slide.hubStep}
      </text>

      <rect className="cv-box" x="40" y="380" width="290" height="120" rx="8" />
      {slide.source.body.map((ln, n) => (
        <text key={n} className="cv-body" x="185" y={424 + n * 26}
              textAnchor="middle" fontSize="16">{ln}</text>
      ))}

      <rect className="cv-aside-box" x="740" y="130" width="330" height="300" rx="8" />
      <text className="cv-head" x="905" y="186" textAnchor="middle" fontSize="20">
        {slide.aside.head}
      </text>
      <text className="cv-body" x="905" y="222" textAnchor="middle" fontSize="14">
        {slide.aside.base}
      </text>
      {slide.aside.paths.map((p, n) => (
        <text key={n} className="cv-path" x="768" y={264 + n * 32}
              fontSize="17">{p}</text>
      ))}
    </svg>
  </div>
) : slide.layout === "converge" ? (
  <div className="slide-content converge">
    <p className="stage-label">{slide.stage}</p>
    <h1>{slide.title}</h1>
    <svg className="cv-svg" viewBox="0 0 1100 560" role="img">
      <defs>
        <marker id="cvArrow" viewBox="0 0 10 10" refX="9" refY="5"
                markerWidth="6" markerHeight="6" orient="auto">
          <path d="M 0 0 L 10 5 L 0 10 z" fill="#1f6feb" />
        </marker>
      </defs>

      <rect className="cv-hub-box" x="400" y="190" width="300" height="180" rx="10" />
      <text className="cv-hub" x="550" y="292" textAnchor="middle" fontSize="38">
        {slide.hub}
      </text>

      {slide.sources.map((s, k) => {
        const G = [
          { bx:30,  by:40,  bw:300, bh:95,  cx:180, hy:78,  ly:104,
            d:"M 330 87 C 400 95, 455 125, 460 188" },
          { bx:30,  by:420, bw:300, bh:110, cx:180, hy:0,   ly:466,
            d:"M 330 475 C 400 468, 455 437, 460 372" },
          { bx:770, by:40,  bw:300, bh:110, cx:920, hy:0,   ly:72,
            d:"M 770 95 C 700 103, 645 125, 640 188" },
          { bx:770, by:400, bw:300, bh:130, cx:920, hy:432, ly:460,
            d:"M 770 465 C 700 458, 645 437, 640 372" }
        ][k];
        return (
          <g key={k}>
            <path className="cv-link" d={G.d} markerEnd="url(#cvArrow)" />
            <rect className="cv-box" x={G.bx} y={G.by} width={G.bw} height={G.bh} rx="8" />
            {s.head && (
              <text className="cv-head" x={G.cx} y={G.hy} textAnchor="middle" fontSize="22">
                {s.head}
              </text>
            )}
            {s.body.map((ln, n) => (
              <text key={n} className="cv-body" x={G.cx} y={G.ly + n * 25}
                    textAnchor="middle" fontSize="17">{ln}</text>
            ))}
          </g>
        );
      })}
    </svg>
  </div>
) : slide.layout === "flowchart" ? (
  <div className="slide-content flowchart">
    <p className="stage-label">{slide.stage}</p>
    <h1>{slide.title}</h1>
    <div className="fc-grid">
      {slide.steps.map((s, k) => (
        <div key={k} className="fc-node">
          <span className="fc-name">{s.name}</span>
          {s.step && <span className="fc-step">{s.step}</span>}
        </div>
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
      {slide.concept.callout && (
        <div className="concept-callout">
          <span className="cc-kicker">{slide.concept.callout.kicker}</span>
          <code>{slide.concept.callout.code}</code>
        </div>
      )}
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

<footer className="slide-links">
  <div className="sl-item">
    <span className="sl-kicker">TART map &amp; documentation</span>
    <code>https://tart.elec.ac.nz/</code>
  </div>
  <div className="sl-item">
    <span className="sl-kicker">Stimela recipes &amp; documentation</span>
    <code>git clone https://github.com/gwynbleiddrivia/tart-stimela-run</code>
  </div>
</footer>








						            </div>
						          </section>
						        );
				      })}
		      </main>
		    );
}
