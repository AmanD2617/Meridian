// ============================================================
// Meridian — Overview Dashboard (REDESIGNED)
//   Mounted by app.jsx when view === "overview".
//   Sections: KPI strip → Predictive Alert + Global Route Monitor
//             → LIVE AI DECISIONS (hero) → Active Shipments table.
// ============================================================

// ---- Tiny helpers ----------------------------------------------------
const cls = (...xs) => xs.filter(Boolean).join(" ");

// Static decision data for the hero card. Takes precedence over live
// entries so the visual hierarchy is preserved even when the API is
// quiet. Live entries (when present) are appended below.
const HERO_DECISIONS = [
  {
    id:           "OPT-MS39004",
    shipmentId:   "MS-39004",
    contextLabel: "Delayed · Ocean",
    vehicle:      "Ship",
    signal:       "Globe",
    signalLabel:  "Satellite Data",
    resolution:   "Reroute proposal · Port → Air",
    status:       "PENDING",
    confidence:   0.98,
    savings:      "Estimated saving: $12,500",
    analysis:     "Port strike in Dubai identified. Reroute via Emirates SkyCargo proposed.",
  },
  {
    id:           "OPT-MS39002",
    shipmentId:   "MS-39002",
    contextLabel: "On Track · Road",
    vehicle:      "Truck",
    signal:       "Pulse",
    signalLabel:  "Traffic Data",
    resolution:   "Route optimised · +14% speed",
    status:       "EXECUTED",
    confidence:   0.94,
    analysis:     "Corridor traffic agent found a faster alternate — fuel efficiency maintained.",
  },
  {
    id:           "OPT-MS39006",
    shipmentId:   "MS-39006",
    contextLabel: "Weather Risk · Ocean",
    vehicle:      "Ship",
    signal:       "Temp",
    signalLabel:  "Meteo Data",
    resolution:   "Assessing detour",
    status:       "ASSESSING",
    confidence:   0.78,
    analysis:     "Monitoring shipment MS-39006. Analysing potential hurricane impact. Delay ~48h likely.",
  },
];

// Converts a live adapted shipment → table row shape
function shipmentToRow(s) {
  const STATUS = {
    transit:   { label: "In Transit",  tone: "ok"     },
    risk:      { label: "At Risk",     tone: "alert"  },
    delayed:   { label: "Delayed",     tone: "warn"   },
    rerouted:  { label: "Rerouted",    tone: "violet" },
    delivered: { label: "Delivered",   tone: "ok"     },
  };
  const TRANSPORT = { air: "Air", ocean: "Ocean", road: "Road", rail: "Rail" };
  const st = STATUS[s.status] ?? { label: s.status, tone: "ok" };
  return {
    id:           `#${s.id}`,
    dest:         `${s.from} → ${s.to}`,
    statusLabel:  `${st.label} · ${TRANSPORT[s.transportType] ?? "Freight"}`,
    statusTone:   st.tone,
    eta:          s.etaIso ?? "—",
    risk:         s.status === "risk" ? "High Risk" : s.status === "delayed" ? "Low Risk" : s.status === "rerouted" ? "Safe" : "On Track",
    decision:     s.status === "risk" ? "Proposed reroute" : s.status === "rerouted" ? "Reroute applied" : "Confirmed",
    decisionTone: s.status === "risk" ? "alert" : s.status === "rerouted" ? "violet" : "ok",
    progress:     s.progress ?? 0,
    progressTone: s.status === "risk" ? "alert" : s.status === "delayed" ? "warn" : "ok",
    action:       s.status === "risk" ? "approve" : "view",
  };
}

// ---- 1. KPI STRIP ----------------------------------------------------
function DashKpiStrip({ kpis }) {
  const onTime   = kpis ? `${kpis.onTime}%`        : "96.4%";
  const atRisk   = kpis ? `${kpis.atRisk}`          : "14";
  const rerouted = kpis ? `${kpis.reroutedToday}`   : "210";
  const items = [
    { label: "On-Time %",  value: onTime,   delta: "+1.2%", deltaTone: "ok",     iconKey: "Check", spark: [92,93,93,94,94,95,95,96,96,97,96,96],            color: "var(--ok)"     },
    { label: "At Risk",    value: atRisk,   delta: "+3",    deltaTone: "alert",  iconKey: "Alert", spark: [4,5,5,7,8,9,11,10,12,13,14,14],                   color: "var(--alert)", badge: "HIGH",     badgeTone: "alert"  },
    { label: "Rerouted",   value: rerouted, delta: "+18",   deltaTone: "violet", iconKey: "Route", spark: [120,140,150,160,170,180,185,190,195,200,205,210], color: "var(--violet)", badge: "AI Action", badgeTone: "violet" },
  ];
  return (
    <section className="dash-kpis">
      {items.map((k, i) => {
        const Icon = window.Icons[k.iconKey];
        return (
          <div key={i} className="dash-kpi">
            <div className="dash-kpi-icon"><Icon size={18}/></div>
            <div className="dash-kpi-body">
              <div className="dash-kpi-head">
                <span className="dash-kpi-label">{k.label}</span>
                {k.badge && <span className={cls("dash-pill", `tone-${k.badgeTone}`)}>{k.badge}</span>}
              </div>
              <div className="dash-kpi-value-row">
                <span className="dash-kpi-value">{k.value}</span>
                <span className={cls("dash-kpi-delta", `tone-${k.deltaTone}`)}>▲ {k.delta}</span>
              </div>
            </div>
            <div className="dash-kpi-spark">
              <Spark values={k.spark} color={k.color} w={92} h={32}/>
            </div>
          </div>
        );
      })}
    </section>
  );
}

// ---- 2. PREDICTIVE ALERT CARD ---------------------------------------
function PredictiveAlertCard({ onViewImpact, onSimulate }) {
  return (
    <div className="predict-alert">
      <div className="card-head">
        <div className="card-eyebrow"><span className="dash-pill tone-violet">PREDICTIVE</span> Alert</div>
        <div className="card-title">High-risk prediction</div>
        <div className="card-sub">3 shipments enter hazard zones in next 48h.</div>
      </div>

      <div className="predict-alert-row tone-alert">
        <div className="predict-row-head">
          <span className="mono strong">#MS-39004</span>
          <span className="dash-pill tone-alert">IMMINENT</span>
        </div>
        <div className="predict-row-body">
          Shipment <strong>MS-39004</strong> entering hazard zone in <strong className="text-alert">2h</strong> — storm Eloise (Cat 3).
        </div>
      </div>

      <div className="predict-alert-row tone-warn">
        <div className="predict-row-head">
          <span className="mono strong">#MS-39007</span>
          <span className="dash-pill tone-warn">HURRICANE</span>
        </div>
        <div className="predict-row-body">Pacific corridor — landfall in 9h.</div>
      </div>

      <div className="predict-alert-row tone-warn">
        <div className="predict-row-head">
          <span className="mono strong">#MS-39008</span>
          <span className="dash-pill tone-warn">PORT STRIKE</span>
        </div>
        <div className="predict-row-body">Singapore terminal · 36h closure expected.</div>
      </div>

      <div className="predict-alert-actions">
        <button className="btn primary" onClick={onViewImpact}>View Impact</button>
        <button className="btn"         onClick={onSimulate}>Simulate</button>
      </div>
    </div>
  );
}

// ---- 4. GLOBAL ROUTE MONITOR ----------------------------------------
function GlobalRouteMonitor({ shipments, selectedId, onSelect, onExpand }) {
  return (
    <div className="route-monitor">
      <div className="card-head row">
        <div>
          <div className="card-eyebrow">LIVE MAP · NETWORK</div>
          <div className="card-title">Global Route Monitor</div>
          <div className="card-sub">2 hazards detected · 3 reroutes in progress</div>
        </div>
        <div className="route-monitor-actions">
          <span className="dash-pill tone-warn">2 hazards</span>
          <span className="dash-pill tone-violet">3 reroutes</span>
          <button className="btn" onClick={onExpand}>
            <Icons.Zoom size={13}/> Expand to Map
          </button>
        </div>
      </div>
      <div className="route-monitor-map">
        <WorldMap
          shipments={shipments.slice(0, 24)}
          selectedId={selectedId}
          onSelect={onSelect}
          simulatedReroute={null}
          refreshKey={0}
          compact
        />
      </div>
    </div>
  );
}

// ---- 3. LIVE AI DECISIONS — HERO ------------------------------------
function LiveAiDecisions({ decisions, onApprove, onReject }) {
  return (
    <section className="live-ai-hero-wrap">
      <div className="live-ai-hero-aura" aria-hidden="true"/>
      <div className="live-ai-hero">
        <div className="live-ai-bar"/>
        <div className="card-head row">
          <div>
            <div className="card-eyebrow"><Icons.Brain size={12}/> LIVE AI DECISIONS</div>
            <div className="card-title">Agent swarm is reasoning</div>
            <div className="card-sub">Weather · Risk · Route · Orchestrator agents — streaming live</div>
          </div>
          <div className="live-ai-head-actions">
            <span className="streaming-pill">
              <span className="streaming-dot"/>
              Streaming
            </span>
            <button className="btn primary">Open AI Control →</button>
          </div>
        </div>

        <div className="live-ai-rows">
          {decisions.map(d => (
            <DecisionRow key={d.id} d={d} onApprove={onApprove} onReject={onReject}/>
          ))}
        </div>
      </div>
    </section>
  );
}

function DecisionRow({ d, onApprove, onReject }) {
  const VehicleIcon = window.Icons[d.vehicle] ?? window.Icons.Ship;
  const SignalIcon  = window.Icons[d.signal]  ?? window.Icons.Globe;
  const status = {
    PENDING:   { label: "Decision Pending",     tone: "warn"   },
    EXECUTED:  { label: "Optimised & Executed", tone: "ok"     },
    ASSESSING: { label: "AI Assessing",         tone: "violet" },
  }[d.status];

  return (
    <div className={cls("live-ai-row", `state-${d.status.toLowerCase()}`)}>
      {d.status === "PENDING" && <span className="live-ai-shimmer" aria-hidden="true"/>}

      <div className="live-ai-row-grid">
        <div className="live-ai-row-main">
          <div className="live-ai-row-meta">
            <span className="mono strong">Decision · <span className="text-violet">{d.shipmentId}</span></span>
            <span className="dash-pill tone-mute">{d.contextLabel}</span>
          </div>

          {/* Flow chips */}
          <div className="flow-chips">
            <span className="flow-chip">
              <VehicleIcon size={12}/>{vehicleLabel(d.vehicle)}
            </span>
            <span className="flow-arrow">→</span>
            <span className="flow-chip tone-warn">
              <SignalIcon size={12}/>{d.signalLabel}
            </span>
            <span className="flow-arrow">→</span>
            <span className="flow-chip tone-violet flow-chip-ai">
              <Icons.Brain size={12}/>Meridian AI
            </span>
            <span className="flow-arrow">→</span>
            <span className="flow-chip tone-ok">
              <Icons.Route size={12}/>{d.resolution}
            </span>
          </div>

          <p className="live-ai-analysis">
            <span className="strong">Analysis:</span> {d.analysis}{" "}
            {d.savings && <span className="text-ok strong">{d.savings}</span>}
          </p>
        </div>

        <div className="live-ai-row-side">
          <span className={cls("dash-pill", `tone-${status.tone}`, "with-dot")}>
            <span className="dot"/> {status.label}
          </span>

          <div className="confidence">
            <div className="confidence-row">
              <span className="confidence-label">CONFIDENCE</span>
              <span className={cls("confidence-pct",
                d.confidence >= 0.9 ? "tone-ok" : d.confidence >= 0.8 ? "tone-violet" : "tone-warn")}>
                {Math.round(d.confidence*100)}%
              </span>
            </div>
            <div className={cls("confidence-bar",
              d.confidence >= 0.9 ? "tone-ok" : d.confidence >= 0.8 ? "tone-violet" : "tone-warn")}>
              <span style={{width: `${d.confidence*100}%`}}/>
            </div>
          </div>

          <div className="live-ai-actions">
            {d.status === "PENDING" && (
              <>
                <button className="btn primary" onClick={() => onApprove?.(d)}>Approve AI Action</button>
                <button className="btn"          onClick={() => onReject?.(d)}>Reject</button>
              </>
            )}
            {d.status === "EXECUTED" && (
              <button className="btn">View Details</button>
            )}
            {d.status === "ASSESSING" && (
              <>
                <span className="typing-dots">
                  <i style={{animationDelay: "0ms"}}/>
                  <i style={{animationDelay: "160ms"}}/>
                  <i style={{animationDelay: "320ms"}}/>
                  reasoning
                </span>
                <button className="btn">View Options</button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function vehicleLabel(key) {
  return { Ship: "Ocean Vessel", Truck: "Truck", Pulse: "Air Freight" }[key] ?? "Vehicle";
}

// ---- 5. ACTIVE SHIPMENTS TABLE --------------------------------------
function ActiveShipmentsTable({ rows }) {
  return (
    <section className="dash-table-card">
      <div className="card-head row">
        <div>
          <div className="card-eyebrow">FLEET · LIVE</div>
          <div className="card-title">Active Shipments</div>
          <div className="card-sub">Hover a row to surface actions. AI decisions stay in-line.</div>
        </div>
        <div className="dash-table-head-actions">
          <span className="dash-pill tone-violet">{rows.length} live</span>
          <button className="btn">Open Shipments →</button>
        </div>
      </div>

      <div className="dash-table-wrap">
        <table className="dash-table">
          <thead>
            <tr>
              <th>Shipment ID</th>
              <th>Destination</th>
              <th>Status</th>
              <th>ETA</th>
              <th>Risk Level</th>
              <th>AI Decision Flow</th>
              <th>Progress</th>
              <th style={{textAlign: "right"}}>Action</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={i} className="dash-row">
                <td><span className="mono strong">{r.id}</span></td>
                <td><span className="dest">{r.dest}</span></td>
                <td>
                  <span className={cls("dash-pill", "with-dot", `tone-${r.statusTone}`)}>
                    <span className="dot"/>{r.statusLabel}
                  </span>
                </td>
                <td><span className="mono">{r.eta}</span></td>
                <td><RiskChip risk={r.risk}/></td>
                <td>
                  <span className="decision-cell">
                    <span className={cls("decision-dot", `tone-${r.decisionTone}`)}/>
                    <Icons.Brain size={12}/>
                    <span className="flow-arrow">→</span>
                    <span className={cls("decision-label", `tone-${r.decisionTone}`)}>{r.decision}</span>
                  </span>
                </td>
                <td>
                  <div className="dash-progress-cell">
                    <div className={cls("dash-progress", `tone-${r.progressTone}`)}>
                      <span style={{width: `${r.progress*100}%`}}/>
                    </div>
                    <span className="mono pct">{Math.round(r.progress*100)}%</span>
                  </div>
                </td>
                <td style={{textAlign: "right"}}>
                  {r.action === "approve" ? (
                    <span className="row-actions">
                      <button className="btn primary sm">Approve</button>
                      <button className="btn sm">Reject</button>
                    </span>
                  ) : (
                    <button className="btn sm">View Details</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function RiskChip({ risk }) {
  const tone = risk === "On Track" || risk === "Safe" ? "ok"
             : risk === "Low Risk" ? "warn"
             : "alert";
  const Icon = tone === "alert" ? Icons.Alert : Icons.Check;
  return (
    <span className={cls("risk-chip", `tone-${tone}`)}>
      <Icon size={12}/>{risk}
    </span>
  );
}

// ---- DASHBOARD (top-level mounted by app.jsx) -----------------------
function Dashboard({ shipments, selectedId, onSelectShipment, onExpandMap, onSimulate, onViewImpact, entries, kpis }) {
  // Combine static hero decisions with the latest live entry (if any).
  const liveOne = (entries ?? []).find(e => e.status === "active");
  const decisions = liveOne
    ? [
        {
          id:           liveOne.id,
          shipmentId:   liveOne.shipmentId ?? "MRD-LIVE",
          contextLabel: "Live · Orchestrator",
          vehicle:      "Ship",
          signal:       "Pulse",
          signalLabel:  "Live signal",
          resolution:   liveOne.title?.slice(0, 36) ?? "Reroute proposal",
          status:       "PENDING",
          confidence:   0.92,
          analysis:     liveOne.body ?? "Live agent reasoning streaming.",
        },
        ...HERO_DECISIONS,
      ].slice(0, 3)
    : HERO_DECISIONS;

  return (
    <div className="dash">
      <DashKpiStrip kpis={kpis}/>

      <div className="dash-mid">
        <PredictiveAlertCard
          onViewImpact={onViewImpact}
          onSimulate={onSimulate}
        />
        <GlobalRouteMonitor
          shipments={shipments}
          selectedId={selectedId}
          onSelect={onSelectShipment}
          onExpand={onExpandMap}
        />
      </div>

      <LiveAiDecisions
        decisions={decisions}
        onApprove={d => onSelectShipment?.(d.shipmentId)}
        onReject={() => {}}
      />

      <ActiveShipmentsTable rows={(shipments ?? []).map(shipmentToRow)}/>
    </div>
  );
}

// Expose globally for app.jsx (no module system in Babel-CDN setup)
Object.assign(window, {
  Dashboard,
  DashKpiStrip,
  PredictiveAlertCard,
  GlobalRouteMonitor,
  LiveAiDecisions,
  ActiveShipmentsTable,
});
