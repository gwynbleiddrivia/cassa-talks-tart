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
