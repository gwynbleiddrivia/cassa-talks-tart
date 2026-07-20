import { useState, useEffect, useRef } from "react";
const N = 36;   // = the number Colab printed
export default function FringeSlider() {
  const [i, setI] = useState(N - 1);
  const [playing, setPlaying] = useState(false);
  const timer = useRef(null);

  useEffect(() => { for (let j = 0; j < N; j++) { const im = new Image(); im.src = `/frames/frames/frame_${String(j).padStart(3,"0")}.png`; } }, []);

  useEffect(() => {
    if (!playing) return;
    timer.current = setInterval(() => {
      setI(prev => { if (prev >= N - 1) { setPlaying(false); return prev; } return prev + 1; });
    }, 300);
    return () => clearInterval(timer.current);
  }, [playing]);

  const play = () => { if (i >= N - 1) setI(0); setPlaying(p => !p); };

  const src = `/frames/frames/frame_${String(i).padStart(3,"0")}.png`;
  const frac = i / (N - 1);
  const story =
    frac < 0.1 ? "One baseline is a single fringe — an endless comb of parallel ridges. No focus yet."
    : frac < 0.3 ? "A few baselines: their crests line up at the centre and add — but a lattice of bright spots (grating lobes) still fills the rest."
    : frac < 0.7 ? "More baselines: the off-centre peaks wash out as the fringes fall out of step and cancel. The central peak sharpens."
    : "All the fringes: away from the centre they cancel, and only the coherent pile-up at the origin survives. That is the sky.";

  return (
    <div style={{ textAlign: "center", width: "100%", maxWidth: 720, margin: "0 auto" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
        <button onClick={play} style={{ width: 40, height: 40, borderRadius: 8, border: "1px solid #ccc", background: "#fff", cursor: "pointer", fontSize: 16 }}>
          {playing ? "❚❚" : "▶"}
        </button>
        <input type="range" min={0} max={N - 1} value={i} onChange={e => setI(+e.target.value)} style={{ flex: 1 }} />
        <span style={{ fontFamily: "monospace", minWidth: 60, textAlign: "right", color: "#444" }}>{i + 1} / {N}</span>
      </div>
      <img src={src} alt="" onError={() => console.log("missing:", src)}
           style={{ maxWidth: "100%", height: "auto", borderRadius: 6 }} />
      <div style={{ fontSize: 14, color: "#555", lineHeight: 1.6, marginTop: 12, padding: "0.75rem 1rem", background: "#f4f4f6", borderRadius: 6, textAlign: "left" }}>
        {story}
      </div>
    </div>
  );
}
