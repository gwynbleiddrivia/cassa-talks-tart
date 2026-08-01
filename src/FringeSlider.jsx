import { useState, useEffect } from "react";
const N = 34;   // = the number Colab printed
// `frame` freezes the slider on one frame and hides the control — used by the
// print-only slides, so the PDF can show the progression the live slider shows.
export default function FringeSlider({ frame = null }) {
  const [i, setI] = useState(N - 1);
  useEffect(() => { for (let j = 0; j < N; j++) { const im = new Image(); im.src = `/frames/frame_${String(j).padStart(3,"0")}.png`; } }, []);
  const frozen = frame !== null;
  const idx = frozen ? Math.max(0, Math.min(N - 1, frame)) : i;
  const src = `/frames/frame_${String(idx).padStart(3,"0")}.png`;
  return (
    <div style={{ textAlign: "center", width: "100%" }}>
      <img src={src} alt="" onError={() => console.log("missing:", src)}
     style={{ maxWidth: "100%", height: "auto", borderRadius: 6 }} />

      {!frozen && (
        <input type="range" min={0} max={N-1} value={i} onChange={e => setI(+e.target.value)} style={{ width: "85%", marginTop: 12 }} />
      )}
      <div style={{ fontFamily: "monospace", color: "#666", marginTop: 6 }}>
        {frozen ? `${idx + 1} of ${N} baselines added` : "drag → add baselines one by one"}
      </div>
    </div>
  );
}