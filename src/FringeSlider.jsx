import { useState, useEffect } from "react";
const N = 37;   // = the number Colab printed
export default function FringeSlider() {
  const [i, setI] = useState(N - 1);
  useEffect(() => { for (let j = 0; j < N; j++) { const im = new Image(); im.src = `/frames/frames/frame_${String(j).padStart(3,"0")}.png`; } }, []);
  const src = `/frames/frames/frame_${String(i).padStart(3,"0")}.png`;
  return (
    <div style={{ textAlign: "center", width: "100%" }}>
      <img src={src} alt="" onError={() => console.log("missing:", src)}
     style={{ maxWidth: "100%", height: "auto", borderRadius: 6 }} />

      <input type="range" min={0} max={N-1} value={i} onChange={e => setI(+e.target.value)} style={{ width: "85%", marginTop: 12 }} />
      <div style={{ fontFamily: "monospace", color: "#666", marginTop: 6 }}>drag → add baselines one by one</div>
    </div>
  );
}