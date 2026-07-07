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
		    }
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

						              <div className="slide-content">
						                <p className="stage-label">{slide.stage}</p>
						                <h1>{slide.title}</h1>
						                <p className="description">{slide.content}</p>
						                <div className="math-box">
						                  <code>{slide.formula}</code>
						                </div>
						                <p className="ref-text">Stimela Step: {slide.notebookRef}</p>
						              </div>

						            </div>
						          </section>
						        );
				      })}
		      </main>
		    );
}
