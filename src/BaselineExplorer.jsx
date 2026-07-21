import { useRef, useEffect, useState } from "react";

const LAMBDA = 0.1903;
const BLUE = "#1f6feb";
const MAX_SEP = 1.5;   // metres — matches the slider max

export default function BaselineExplorer({ sep: sep0 = 0.6, ang: ang0 = 30, size = 240 }) {
  const [sep, setSep] = useState(sep0);
  const [ang, setAng] = useState(ang0);
  const canvasRef = useRef(null);

  const S = size, C = S / 2;
  const GROUND_SCALE = (2 * (C - 16)) / MAX_SEP;        // baseline spans the whole panel

  const UV_SCALE = (C - 16) / (MAX_SEP / LAMBDA);        // longest baseline fits

  const th = (ang * Math.PI) / 180;
  const lenWl = sep / LAMBDA;                 // baseline length in wavelengths
  const u = lenWl * Math.cos(th);
  const v = lenWl * Math.sin(th);

  // ground panel: antenna A at centre, B offset by the separation
  const dx = sep * GROUND_SCALE * Math.cos(th);
  const dy = sep * GROUND_SCALE * Math.sin(th);
  const ax = C - dx / 2, ay = C + dy / 2;   // antenna A
  const bx = C + dx / 2, by = C - dy / 2;   // antenna B

  // uv panel: the single dot
  const ux = C + u * UV_SCALE;
  const uy = C - v * UV_SCALE;

  // fringe panel: cos(2*pi*(u*l + v*m)) over the sky disk
  useEffect(() => {
    const cv = canvasRef.current; if (!cv) return;
    const ctx = cv.getContext("2d");
    const img = ctx.createImageData(S, S);
    for (let j = 0; j < S; j++) {
      const m = 1 - (2 * j) / (S - 1);
      for (let i = 0; i < S; i++) {
        const l = (2 * i) / (S - 1) - 1;
        const k = 4 * (j * S + i);
        if (l * l + m * m <= 1) {
          const val = Math.cos(2 * Math.PI * (u * l + v * m)); // -1..1
          const g = Math.round((val + 1) * 127.5);
          img.data[k] = g; img.data[k + 1] = g; img.data[k + 2] = g; img.data[k + 3] = 255;
        } else { img.data[k + 3] = 0; }
      }
    }
    ctx.clearRect(0, 0, S, S);
    ctx.putImageData(img, 0, 0);
    ctx.beginPath(); ctx.arc(C, C, C - 1, 0, 2 * Math.PI);
    ctx.strokeStyle = "#999"; ctx.stroke();
  }, [u, v]);

  const label = { fontWeight: 600, fontSize: 14, marginBottom: 6, textAlign: "center" };
  const panel = { display: "flex", flexDirection: "column", alignItems: "center" };

  return (
        <div style={{ fontFamily: "system-ui, sans-serif" }}>

      <div style={{ display: "flex", gap: 24, flexWrap: "wrap", justifyContent: "center" }}>

        {/* ① ground */}
        <div style={panel}>
          <div style={label}>① the two antennas</div>
          <svg width={S} height={S} style={{ background: "#fafafa", borderRadius: 8 }}>
            <line x1={ax} y1={ay} x2={bx} y2={by} stroke="#333" strokeWidth="3" />
            <circle cx={ax} cy={ay} r="7" fill={BLUE} />
            <circle cx={bx} cy={by} r="7" fill={BLUE} />

          </svg>
          <div style={{ fontSize: 13, color: "#555", marginTop: 4 }}>
            {sep.toFixed(2)} m apart
          </div>
        </div>

        {/* ② uv-map */}
        <div style={panel}>
          <div style={label}>② one dot in the uv-map</div>
          <svg width={S} height={S} style={{ background: "#fafafa", borderRadius: 8 }}>
            <defs>
              <marker id="ah" markerWidth="8" markerHeight="8" refX="6" refY="3"
                      orient="auto"><path d="M0,0 L6,3 L0,6 Z" fill={BLUE} /></marker>
            </defs>
            <line x1="0" y1={C} x2={S} y2={C} stroke="#e0e0e0" />
            <line x1={C} y1="0" x2={C} y2={S} stroke="#e0e0e0" />
            <line x1={C} y1={C} x2={ux} y2={uy} stroke={BLUE} strokeWidth="2"
                  markerEnd="url(#ah)" />
            <circle cx={ux} cy={uy} r="6" fill={BLUE} />
          </svg>
          <div style={{ fontSize: 13, color: "#555", marginTop: 4 }}>
            {lenWl.toFixed(1)} wavelengths from centre
          </div>
        </div>

        {/* ③ sky fringe */}
        <div style={panel}>
          <div style={label}>③ one fringe on the sky</div>
          <canvas ref={canvasRef} width={S} height={S}
                  style={{ background: "#fafafa", borderRadius: 8 }} />
          <div style={{ fontSize: 13, color: "#555", marginTop: 4 }}>
            stripe spacing ≈ {(1 / lenWl).toFixed(2)} (finer as the dot moves out)
          </div>
        </div>
      </div>

      {/* controls */}
      <div style={{ maxWidth: 460, margin: "22px auto 0" }}>
        <label style={{ display: "block", fontSize: 14, marginBottom: 10 }}>
          Separation: <b>{sep.toFixed(2)} m</b>
          <input type="range" min="0.1" max="1.5" step="0.01" value={sep}
                 onChange={(e) => setSep(+e.target.value)} style={{ width: "100%" }} />
        </label>
        <label style={{ display: "block", fontSize: 14 }}>
          Orientation: <b>{ang}°</b>
          <input type="range" min="0" max="180" step="1" value={ang}
                 onChange={(e) => setAng(+e.target.value)} style={{ width: "100%" }} />
        </label>
        <p style={{ fontSize: 13, color: "#666", marginTop: 14, lineHeight: 1.5 }}>
          Slide <b>Separation</b> → the dot moves out and the stripes get finer.
          Slide <b>Orientation</b> → the dot circles the centre and the stripes turn with it,
          always at a right angle to the antenna pair.
        </p>
      </div>
    </div>
  );
}
