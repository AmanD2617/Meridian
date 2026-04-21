// ============================================================
// Meridian — Shipment Detail Drawer + Execute Reroute Modal
// ============================================================

function MiniMap({ ship, proposedPath, showBoth = true, compact = false }) {
  if (!ship) return null;
  const a = window.cityByCode[ship.from];
  const b = window.cityByCode[ship.to];
  const [x1, y1] = window.project(a.lon, a.lat);
  const [x2, y2] = window.project(b.lon, b.lat);
  // viewBox framing: zoom on the route with padding
  const pad = 80;
  const xMin = Math.min(x1, x2) - pad, xMax = Math.max(x1, x2) + pad;
  const yMin = Math.min(y1, y2) - pad, yMax = Math.max(y1, y2) + pad;
  const vb = `${xMin} ${yMin} ${xMax - xMin} ${yMax - yMin}`;
  return (
    <svg viewBox={vb} preserveAspectRatio="xMidYMid slice">
      {window.continentPaths.map((pts, i) => (
        <polygon key={i} points={pts} fill="var(--bg-3)" stroke="var(--line-2)" strokeWidth="0.3"/>
      ))}
      {/* original route */}
      <path d={ship._path} fill="none" stroke={proposedPath ? "var(--fg-3)" : "var(--accent)"} strokeWidth="1.8"
            strokeDasharray={proposedPath ? "3 4" : undefined} opacity={proposedPath ? 0.55 : 0.9}/>
      {/* proposed */}
      {proposedPath && (
        <path d={proposedPath} fill="none" stroke="var(--violet)" strokeWidth="2.2"
              style={{filter: "drop-shadow(0 0 6px var(--violet))"}}/>
      )}
      {/* endpoints */}
      <g>
        <circle cx={x1} cy={y1} r="3.5" fill="var(--bg-1)" stroke="var(--fg-1)" strokeWidth="1.5"/>
        <circle cx={x2} cy={y2} r="3.5" fill="var(--bg-1)" stroke="var(--fg-1)" strokeWidth="1.5"/>
        <text x={x1 + 6} y={y1 + 3} fontFamily="JetBrains Mono" fontSize="9" fill="var(--fg-0)">{ship.from}</text>
        <text x={x2 + 6} y={y2 + 3} fontFamily="JetBrains Mono" fontSize="9" fill="var(--fg-0)">{ship.to}</text>
      </g>
      {/* current position */}
      {!compact && (
        <g transform={`translate(${ship._pos[0]}, ${ship._pos[1]})`}>
          <circle r="8" fill="var(--accent)" opacity="0.22"/>
          <circle r="3" fill="var(--bg-0)" stroke="var(--accent)" strokeWidth="1.5"/>
        </g>
      )}
    </svg>
  );
}

function ShipDrawer({ shipmentId, onClose, onExecute }) {
  const ship = window.SHIPMENTS.find(s => s.id === shipmentId);
  if (!ship) return null;
  const a = window.cityByCode[ship.from], b = window.cityByCode[ship.to];
  const optLog = window.REASONING.find(r => r.shipmentId === ship.id);
  const proposedPath = ship.status === "rerouted"
    ? window.arcPath(a, b, ship.bulge * 0.4)
    : (optLog ? window.arcPath(a, b, -0.32) : null);

  // Fake timeline events for this shipment
  const timeline = [
    { t: "08:14 UTC", agent: true, title: "Shipment created", sub: `Cargo manifested · ${ship.cargo} · ${ship.weight}` },
    { t: "09:02 UTC", agent: false, title: `Departed ${a.name} (${ship.from})`, sub: "Origin handoff complete · Carrier: Maersk MAEU" },
    { t: "11:47 UTC", agent: true, title: "Risk agent flagged hazard proximity", sub: "Cyclone Arwen trajectory intersects corridor", opt: optLog?.id },
    { t: "12:03 UTC", agent: true, title: "Weather agent confirmed forecast", sub: "92% confidence · clearance +14h" },
    { t: "14:32 UTC", active: true, agent: true, title: "Orchestrator proposed reroute", sub: "Routing agent evaluated 4 alternates", opt: optLog?.id },
    { t: "—",         agent: false, title: `Scheduled arrival ${b.name} (${ship.to})`, sub: `ETA ${ship.etaIso}` },
  ];

  return (
    <aside className="ship-drawer" data-screen-label="02 Shipment Detail">
      <div className="sd-head">
        <div>
          <div className="sd-id">{ship.id}</div>
          <div className="sd-cargo">{ship.cargo} · {ship.weight}</div>
        </div>
        <span className={"status-dot " + ship.status} style={{marginLeft: 12}}>
          {ship.status === "risk" ? "At Risk" : ship.status === "rerouted" ? "Rerouted" : ship.status === "delayed" ? "Delayed" : "In Transit"}
        </span>
        <button className="btn ghost sd-head-close" onClick={onClose} style={{padding:"4px 8px"}}><Icons.X size={14}/></button>
      </div>

      <div className="sd-body">
        {/* mini map */}
        <div>
          <div className="sd-section-title">Route</div>
          <div className="sd-minimap">
            <MiniMap ship={ship} proposedPath={proposedPath}/>
          </div>

          <div className="sd-route-compare" style={{marginTop: 12}}>
            <div className="sd-route-card original">
              <div className="rc-label"><span className="dot"/>Original</div>
              <div className="rc-eta">{ship.etaOriginal}</div>
              <div className="rc-sub">{a.name} → {b.name}</div>
            </div>
            <div className={"sd-route-card " + (proposedPath ? "proposed" : "original")}>
              <div className="rc-label"><span className="dot"/>{proposedPath ? "AI Proposed" : "Current"}</div>
              <div className="rc-eta">{ship.etaIso}</div>
              <div className="rc-sub">
                {ship.delayMin === 0 ? "On schedule" :
                 ship.delayMin > 0 ? `+${Math.floor(ship.delayMin/60)}h ${ship.delayMin%60}m late` :
                                     `${Math.floor(ship.delayMin/60)}h ${Math.abs(ship.delayMin%60)}m saved`}
              </div>
            </div>
          </div>
        </div>

        {/* shipment details */}
        <div>
          <div className="sd-section-title">Details</div>
          <div className="sd-kv">
            <div className="k">Origin</div>
            <div className="v mono">{a.lat.toFixed(2)}°N, {a.lon.toFixed(2)}°{a.lon < 0 ? "W" : "E"} · {ship.from}</div>
            <div className="k">Destination</div>
            <div className="v mono">{b.lat.toFixed(2)}°{b.lat < 0 ? "S" : "N"}, {Math.abs(b.lon).toFixed(2)}°{b.lon < 0 ? "W" : "E"} · {ship.to}</div>
            <div className="k">Current pos</div>
            <div className="v mono">{ship._pos[0].toFixed(1)}, {ship._pos[1].toFixed(1)} · 2dsphere indexed</div>
            <div className="k">Progress</div>
            <div className="v">{Math.round(ship.progress*100)}% of route complete</div>
            <div className="k">Carrier</div>
            <div className="v">Maersk Line · vessel MAEU-2887</div>
            <div className="k">Customs</div>
            <div className="v">Pre-cleared · HS code 3004.90</div>
          </div>
        </div>

        {/* timeline */}
        <div>
          <div className="sd-section-title">Timeline</div>
          <div className="sd-timeline">
            {timeline.map((t, i) => (
              <div key={i} className="sd-tl-entry" data-active={!!t.active} data-agent={t.agent}>
                <div className="sd-tl-dot"/>
                <div className="sd-tl-time">{t.t}</div>
                <div className="sd-tl-body">
                  <div className="title">{t.title}</div>
                  <div className="sub">{t.sub}</div>
                  {t.opt && <span className="opt-ref">↗ {t.opt}</span>}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {proposedPath && (
        <div className="sd-foot">
          <button className="btn ghost" onClick={onClose} style={{flex: 0}}>Close</button>
          <button className="btn">Override</button>
          <button className="btn primary" onClick={() => onExecute(ship, optLog)}>
            <Icons.Check size={13}/> Execute reroute
          </button>
        </div>
      )}
    </aside>
  );
}

function ExecuteRerouteModal({ ship, optLog, onCancel, onConfirm }) {
  const [phase, setPhase] = React.useState("confirm"); // confirm → executing → success
  const [countdown, setCountdown] = React.useState(null);

  if (!ship) return null;
  const a = window.cityByCode[ship.from], b = window.cityByCode[ship.to];
  const proposedPath = window.arcPath(a, b, -0.32);

  const doExecute = () => {
    setPhase("executing");
    setTimeout(() => setPhase("success"), 1300);
  };

  return (
    <div className="modal-scrim" onClick={e => { if (e.target === e.currentTarget && phase !== "executing") onCancel(); }}>
      <div className="modal" role="dialog" aria-modal="true">
        {phase === "success" ? (
          <div className="exec-success">
            <div className="check-ring"><Icons.Check size={28} sw={2}/></div>
            <h3>Reroute executed</h3>
            <p>Shipment <span style={{fontFamily:"var(--font-mono)", color:"var(--fg-0)"}}>{ship.id}</span> has been updated with the AI's proposed route.<br/>Carrier and customer have been notified.</p>
            <div className="log-ref">{optLog?.id || "OPT-4921"} · status: EXECUTED</div>
            <div style={{display:"flex", gap: 10, marginTop: 8}}>
              <button className="btn" onClick={onCancel}>Close</button>
              <button className="btn primary" onClick={() => onConfirm(ship.id, optLog?.id)}>View on map</button>
            </div>
          </div>
        ) : (
          <>
            <div className="modal-head">
              <div className="modal-eyebrow">Human-in-the-loop · Execute Reroute</div>
              <h2 className="modal-title">Apply AI-proposed route to shipment?</h2>
              <div className="modal-sub">
                This will replace <span className="mono">{ship.id}</span>'s active <span className="mono">routeLineString</span> with the Orchestrator agent's proposed alternative and mark <span className="mono">{optLog?.id || "OPT-4921"}</span> as <span className="mono">EXECUTED</span>.
              </div>
            </div>

            <div className="modal-body">
              <div className="modal-minimap">
                <MiniMap ship={ship} proposedPath={proposedPath} compact={true}/>
              </div>

              <div className="modal-compare">
                <div className="cmp-card original">
                  <div className="cmp-label">Original ETA</div>
                  <div className="cmp-eta">{ship.etaOriginal}</div>
                  <div className="cmp-dist">Direct · 6,487 nm</div>
                </div>
                <div className="cmp-arrow"><Icons.Arrow size={20} sw={2}/></div>
                <div className="cmp-card proposed">
                  <div className="cmp-label">Proposed ETA</div>
                  <div className="cmp-eta">{ship.etaIso}</div>
                  <div className="cmp-dist">Via DXB bridge · 6,842 nm</div>
                </div>
              </div>

              <div className="modal-savings">
                <div className="save-cell">
                  <div className="s-label">Time impact</div>
                  <div className={"s-val " + (ship.delayMin > 0 ? "bad" : "good")}>
                    {ship.delayMin > 0 ? `+${Math.floor(ship.delayMin/60)}h ${ship.delayMin%60}m` : `-${Math.floor(Math.abs(ship.delayMin)/60)}h ${Math.abs(ship.delayMin)%60}m`}
                  </div>
                </div>
                <div className="save-cell">
                  <div className="s-label">Spoilage avoided</div>
                  <div className="s-val good">$42.8k</div>
                </div>
                <div className="save-cell">
                  <div className="s-label">Fuel delta</div>
                  <div className="s-val">+4.2%</div>
                </div>
              </div>

              <div className="modal-reasoning">
                <div className="mr-title">Orchestrator reasoning</div>
                <div className="mr-body">
                  Cyclone Arwen intersects the planned corridor with <span className="mono">92%</span> confidence. Routing agent evaluated 4 alternates; the DXB bridge adds <span className="mono">3h 32m</span> but avoids a <span className="mono">$42.8k</span> expected spoilage loss and keeps refrigerated pharma within <span className="mono">2–8°C</span> spec for the full voyage.
                </div>
              </div>

              <div className="modal-api">
                <span className="comment">// backend call on confirm</span><br/>
                <span className="method">PUT</span> <span className="path">/api/optimization/{optLog?.id || "OPT-4921"}/execute</span><br/>
                <span className="comment">// updates Shipment.routeLineString + OptimizationLog.status = "EXECUTED"</span>
              </div>
            </div>

            <div className="modal-foot">
              <div className="tooltip-chip"><Icons.Clock size={11}/> Decision window closes in 4:12</div>
              <div className="spacer"/>
              <button className="btn" onClick={onCancel} disabled={phase === "executing"}>Cancel</button>
              <button className="btn primary" onClick={doExecute} disabled={phase === "executing"}>
                {phase === "executing"
                  ? <>Executing…</>
                  : <><Icons.Check size={13}/> Confirm &amp; execute</>}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

Object.assign(window, { ShipDrawer, ExecuteRerouteModal, MiniMap });
