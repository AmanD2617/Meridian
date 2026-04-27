// ============================================================
// Meridian — Global Map Monitoring (Google Maps API)
// v2 — interactive routes, floating card, ripple, polish
// ============================================================

const GMAP_API_KEY = "AIzaSyC-4wDguS9TKxEJcZ1bncrCzCr4_eDIIDg";

// ── Great-circle arc ─────────────────────────────────────────
function gcArc(a, b, steps) {
  steps = steps || 80;
  var toRad = function(d) { return d * Math.PI / 180; };
  var toDeg = function(r) { return r * 180 / Math.PI; };
  var pts = [];
  var lat1 = toRad(a.lat), lng1 = toRad(a.lng);
  var lat2 = toRad(b.lat), lng2 = toRad(b.lng);
  var sinDlat = Math.sin((lat2 - lat1) / 2);
  var sinDlng = Math.sin((lng2 - lng1) / 2);
  var d = 2 * Math.asin(Math.sqrt(
    sinDlat * sinDlat + Math.cos(lat1) * Math.cos(lat2) * sinDlng * sinDlng
  ));
  for (var i = 0; i <= steps; i++) {
    var t = i / steps;
    if (d < 0.0001) { pts.push({ lat: a.lat, lng: a.lng }); continue; }
    var A = Math.sin((1 - t) * d) / Math.sin(d);
    var B = Math.sin(t * d) / Math.sin(d);
    var x = A * Math.cos(lat1) * Math.cos(lng1) + B * Math.cos(lat2) * Math.cos(lng2);
    var y = A * Math.cos(lat1) * Math.sin(lng1) + B * Math.cos(lat2) * Math.sin(lng2);
    var z = A * Math.sin(lat1) + B * Math.sin(lat2);
    pts.push({
      lat: toDeg(Math.atan2(z, Math.sqrt(x * x + y * y))),
      lng: toDeg(Math.atan2(y, x))
    });
  }
  return pts;
}

// ── Route & hazard data ──────────────────────────────────────
var GMAP_ROUTES = [
  { id:"R1", from:{lat:40.71,lng:-74.01}, to:{lat:51.51,lng:-0.13},    label:"New York → London",          ship:"MDR-745",   cargo:"Electronics",  type:"active",   progress:0.52, confidence:92, risk:"MEDIUM" },
  { id:"R2", from:{lat:31.23,lng:121.47}, to:{lat:34.05,lng:-118.24},  label:"Shanghai → Los Angeles",     ship:"MRD-48244", cargo:"Auto Parts",   type:"rerouted", progress:0.38, confidence:76, risk:"HIGH"   },
  { id:"R3", from:{lat:1.35,lng:103.82},  to:{lat:51.92,lng:4.48},     label:"Singapore → Rotterdam",      ship:"MDR-882",   cargo:"Chemicals",    type:"active",   progress:0.71, confidence:88, risk:"LOW"    },
  { id:"R4", from:{lat:25.20,lng:55.27},  to:{lat:19.08,lng:72.88},    label:"Dubai → Mumbai",             ship:"MDR-521",   cargo:"Petroleum",    type:"active",   progress:0.85, confidence:95, risk:"LOW"    },
  { id:"R5", from:{lat:-33.87,lng:151.21},to:{lat:1.35,lng:103.82},    label:"Sydney → Singapore",         ship:"MDR-334",   cargo:"Mining Ore",   type:"delayed",  progress:0.24, confidence:64, risk:"HIGH"   },
];

var GMAP_HAZARDS = [
  { id:"H1", lat:-5,  lng:-30, radius:900000, name:"Tropical Storm 'Epsilon'", risk:"HIGH",   severity:82, impacted:14, status:"Active" },
  { id:"H2", lat:14,  lng:62,  radius:620000, name:"Rough Seas Advisory",      risk:"MEDIUM", severity:55, impacted:6,  status:"Active" },
];

var DARK_MAP_STYLE = [
  { elementType:"geometry",                                                             stylers:[{color:"#07101d"}] },
  { elementType:"labels.text.stroke",                                                   stylers:[{color:"#07101d"}] },
  { elementType:"labels.text.fill",                                                     stylers:[{color:"#3d5166"}] },
  { featureType:"administrative.locality",    elementType:"labels.text.fill",           stylers:[{color:"#4a6080"}] },
  { featureType:"poi",                                                                  stylers:[{visibility:"off"}] },
  { featureType:"road",                       elementType:"geometry",                   stylers:[{color:"#14233a"}] },
  { featureType:"road.highway",               elementType:"geometry",                   stylers:[{color:"#1a2e47"}] },
  { featureType:"transit",                    elementType:"geometry",                   stylers:[{color:"#0c1826"}] },
  { featureType:"water",                      elementType:"geometry",                   stylers:[{color:"#030c18"}] },
  { featureType:"water",                      elementType:"labels.text.fill",           stylers:[{color:"#16304d"}] },
  { featureType:"landscape",                  elementType:"geometry",                   stylers:[{color:"#0d1827"}] },
  { featureType:"administrative.country",     elementType:"geometry.stroke",            stylers:[{color:"#162035"},{weight:0.8}] },
  { featureType:"administrative.province",    elementType:"geometry.stroke",            stylers:[{color:"#14213a"},{weight:0.5}] },
];

// ── Helpers ──────────────────────────────────────────────────
function routeBaseColor(r) {
  return r.type === 'rerouted' ? '#f59e0b' : r.type === 'delayed' ? '#f87171' : '#4cd5ff';
}

function dashedIcons(color, opacity, scale) {
  return [{ icon:{ path:'M 0,-1 0,1', strokeOpacity: opacity, strokeColor: color, scale: scale || 3 }, offset:'0', repeat:'14px' }];
}

function riskColor(risk) {
  return risk === 'HIGH' ? 'var(--alert)' : risk === 'MEDIUM' ? 'var(--warn)' : 'var(--ok)';
}

// ── Component ────────────────────────────────────────────────
function GlobalMapView(props) {
  var onBack = props.onBack;

  // Refs — map & overlays
  var mapRef          = React.useRef(null);
  var mapInst         = React.useRef(null);
  var overlays        = React.useRef({ lines: [], circles: [], markers: [], intervals: [] });
  var linesByRoute    = React.useRef({});   // { routeId: Polyline }
  var highlightFn     = React.useRef(null); // synchronous map highlight fn

  // State
  var _mapsLoaded = React.useState(function() { return !!(window.google && window.google.maps); });
  var mapsLoaded = _mapsLoaded[0]; var setMapsLoaded = _mapsLoaded[1];

  var _selRoute = React.useState(GMAP_ROUTES[0]);
  var selectedRoute = _selRoute[0]; var setSelectedRoute = _selRoute[1];

  var _selId = React.useState(GMAP_ROUTES[0].id);
  var selectedRouteId = _selId[0]; var setSelectedRouteId = _selId[1];

  var _hazard = React.useState(null);
  var activeHazard = _hazard[0]; var setActiveHazard = _hazard[1];

  var _floatCard = React.useState(null);  // { route, x, y }
  var floatCard = _floatCard[0]; var setFloatCard = _floatCard[1];

  var _layers = React.useState({ hazards:true, traffic:false, weather:true, aiRoutes:true });
  var layers = _layers[0]; var setLayers = _layers[1];

  // ── Load Google Maps API ─────────────────────────────────
  React.useEffect(function() {
    if (window.google && window.google.maps) { setMapsLoaded(true); return; }
    var cbName = '__meridianGmapLoaded';
    window[cbName] = function() { setMapsLoaded(true); };
    var s = document.createElement('script');
    s.src = 'https://maps.googleapis.com/maps/api/js?key=' + GMAP_API_KEY + '&callback=' + cbName;
    s.async = true; s.defer = true;
    document.head.appendChild(s);
  }, []);

  // ── Initialize map ───────────────────────────────────────
  React.useEffect(function() {
    if (!mapsLoaded || !mapRef.current || mapInst.current) return;

    var map = new google.maps.Map(mapRef.current, {
      center: { lat: 20, lng: 10 },
      zoom: 2, minZoom: 2,
      styles: DARK_MAP_STYLE,
      disableDefaultUI: true,
      zoomControl: true,
      zoomControlOptions: { position: google.maps.ControlPosition.RIGHT_CENTER },
      gestureHandling: 'greedy',
      backgroundColor: '#030c18',
    });
    mapInst.current = map;

    // ── Highlight function (synchronous map update) ────────
    highlightFn.current = function(selId) {
      GMAP_ROUTES.forEach(function(r) {
        var line = linesByRoute.current[r.id];
        if (!line) return;
        var col = routeBaseColor(r);
        var isR = r.type === 'rerouted';
        var isSelected = (r.id === selId);
        var isNoneSelected = !selId;

        if (isSelected) {
          line.setOptions({
            strokeOpacity: isR ? 0 : 1.0,
            strokeWeight: 4,
            zIndex: 20,
            icons: isR ? dashedIcons(col, 1, 3.5) : [],
          });
        } else if (isNoneSelected) {
          line.setOptions({
            strokeOpacity: isR ? 0 : 0.82,
            strokeWeight: 2,
            zIndex: 1,
            icons: isR ? dashedIcons(col, 1, 3) : [],
          });
        } else {
          // Dim unselected routes
          line.setOptions({
            strokeOpacity: isR ? 0 : 0.22,
            strokeWeight: 1.5,
            zIndex: 1,
            icons: isR ? dashedIcons(col, 0.22, 2) : [],
          });
        }
      });
    };

    // ── Draw route polylines ───────────────────────────────
    GMAP_ROUTES.forEach(function(r) {
      var pts  = gcArc(r.from, r.to);
      var isR  = r.type === 'rerouted';
      var col  = routeBaseColor(r);

      var line = new google.maps.Polyline({
        path: pts, geodesic: false,
        strokeColor: col,
        strokeOpacity: isR ? 0 : 0.82,
        strokeWeight: 2,
        icons: isR ? dashedIcons(col, 1, 3) : [],
        map: map, clickable: true, zIndex: 1,
      });

      // Hover — subtle brighten
      line.addListener('mouseover', function() {
        var line2 = linesByRoute.current[r.id];
        if (line2) line2.setOptions({ strokeWeight: selectedRouteId === r.id ? 5 : 3, strokeOpacity: isR ? 0 : 0.95 });
      });
      line.addListener('mouseout', function() {
        var line2 = linesByRoute.current[r.id];
        if (!line2) return;
        var isSel = (selectedRouteId === r.id);
        if (isSel) {
          line2.setOptions({ strokeWeight: 4, strokeOpacity: isR ? 0 : 1.0 });
        } else {
          var hasSelection = (selectedRouteId !== null);
          line2.setOptions({ strokeWeight: 2, strokeOpacity: isR ? 0 : (hasSelection ? 0.22 : 0.82) });
        }
      });

      // Click — select + floating card
      line.addListener('click', function(event) {
        // Flash pulse
        line.setOptions({ strokeWeight: 8 });
        setTimeout(function() {
          if (highlightFn.current) highlightFn.current(r.id);
        }, 120);

        setSelectedRouteId(r.id);
        setSelectedRoute(r);
        setActiveHazard(null);

        var rect = mapRef.current.getBoundingClientRect();
        var cx = event.domEvent.clientX - rect.left;
        var cy = event.domEvent.clientY - rect.top;
        // Clamp so card doesn't overflow right/bottom
        var cxClamped = Math.min(Math.max(cx, 120), rect.width - 120);
        var cyClamped = Math.max(cy, 220);
        setFloatCard({ route: r, x: cxClamped, y: cyClamped });
      });

      linesByRoute.current[r.id] = line;
      overlays.current.lines.push(line);

      // Vehicle marker at midpoint
      var midPt = pts[Math.floor(pts.length / 2)];
      var marker = new google.maps.Marker({
        position: midPt, map: map,
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          scale: 6, fillColor: col, fillOpacity: 1,
          strokeColor: 'rgba(255,255,255,0.9)', strokeWeight: 1.5,
        },
        title: r.label, zIndex: 10,
      });
      marker.addListener('click', function(event) {
        if (highlightFn.current) highlightFn.current(r.id);
        setSelectedRouteId(r.id);
        setSelectedRoute(r);
        setActiveHazard(null);
        var rect = mapRef.current.getBoundingClientRect();
        setFloatCard({ route: r,
          x: Math.min(Math.max(event.domEvent.clientX - rect.left, 120), rect.width - 120),
          y: Math.max(event.domEvent.clientY - rect.top, 220),
        });
      });
      overlays.current.markers.push(marker);
    });

    // Initial highlight for default selection
    setTimeout(function() {
      if (highlightFn.current) highlightFn.current(GMAP_ROUTES[0].id);
    }, 100);

    // ── Hazard circles with ripple animation ───────────────
    GMAP_HAZARDS.forEach(function(h) {
      var col = h.risk === 'HIGH' ? '#f87171' : '#fbbf24';

      // Main outer ring
      var outerCircle = new google.maps.Circle({
        strokeColor: col, strokeOpacity: 0.7, strokeWeight: 1.5,
        fillColor: col, fillOpacity: 0.12,
        map: map, center:{ lat:h.lat, lng:h.lng }, radius: h.radius,
        clickable: true, zIndex: 5,
      });
      // Inner fill
      var innerCircle = new google.maps.Circle({
        strokeOpacity: 0, fillColor: col, fillOpacity: 0.20,
        map: map, center:{ lat:h.lat, lng:h.lng }, radius: h.radius * 0.42,
        clickable: true, zIndex: 5,
      });
      // Ripple ring (animated)
      var rippleCircle = new google.maps.Circle({
        strokeColor: col, strokeOpacity: 0, strokeWeight: 2,
        fillOpacity: 0,
        map: map, center:{ lat:h.lat, lng:h.lng }, radius: h.radius,
        clickable: false, zIndex: 4,
      });

      [outerCircle, innerCircle].forEach(function(c) {
        c.addListener('click', function() {
          setActiveHazard(h);
          setFloatCard(null);
        });
      });
      overlays.current.circles.push(outerCircle, innerCircle, rippleCircle);

      // Ripple animation via setInterval
      var tick = 0;
      var id = setInterval(function() {
        tick = (tick + 1) % 80;
        var t = tick / 80;
        var eased = 1 - Math.pow(1 - t, 2); // ease-out
        var newRadius = h.radius * (1 + eased * 0.55);
        var opacity   = (1 - t) * 0.45;
        rippleCircle.setOptions({ radius: newRadius, strokeOpacity: opacity });
      }, 50);
      overlays.current.intervals.push(id);
    });

    // ── Map background click → dismiss float card ──────────
    map.addListener('click', function() {
      setFloatCard(null);
    });

  }, [mapsLoaded]);

  // ── Cleanup on unmount ───────────────────────────────────
  React.useEffect(function() {
    return function() {
      overlays.current.intervals.forEach(function(id) { clearInterval(id); });
      overlays.current.lines.forEach(function(l) { l.setMap(null); });
      overlays.current.circles.forEach(function(c) { c.setMap(null); });
      overlays.current.markers.forEach(function(m) { m.setMap(null); });
      overlays.current = { lines:[], circles:[], markers:[], intervals:[] };
      linesByRoute.current = {};
      mapInst.current = null;
    };
  }, []);

  // ── Layer visibility toggle ──────────────────────────────
  var toggleLayer = React.useCallback(function(key) {
    setLayers(function(prev) {
      var next = Object.assign({}, prev);
      next[key] = !prev[key];
      if (mapInst.current) {
        if (key === 'hazards')  overlays.current.circles.forEach(function(c) { c.setVisible(next.hazards); });
        if (key === 'aiRoutes') {
          overlays.current.lines.forEach(function(l) { l.setVisible(next.aiRoutes); });
          overlays.current.markers.forEach(function(m) { m.setVisible(next.aiRoutes); });
        }
      }
      return next;
    });
  }, []);

  // ── Helpers ──────────────────────────────────────────────
  var typeLabel = function(t) { return t === 'rerouted' ? 'Rerouted' : t === 'delayed' ? 'Delayed' : 'In Transit'; };
  var typeColor = function(t) { return t === 'rerouted' ? 'var(--warn)' : t === 'delayed' ? 'var(--alert)' : 'var(--ok)'; };

  // Layer defs with icons
  var layerDefs = [
    { key:'hazards',  label:'Hazard Zones',    color:'var(--alert)',  icon:'Alert'  },
    { key:'traffic',  label:'Live Traffic',    color:'var(--warn)',   icon:'Layers' },
    { key:'weather',  label:'Weather Overlay', color:'var(--violet)', icon:'Temp'   },
    { key:'aiRoutes', label:'AI Routes',       color:'var(--accent)', icon:'Route'  },
  ];

  var agentSteps = [
    { label:'Risk',         sub:'Threat assessed',   done:true,  active:false },
    { label:'Weather',      sub:'Storm tracked',     done:true,  active:false },
    { label:'Routing',      sub:'Alt routes found',  done:true,  active:false },
    { label:'Orchestrator', sub:'Awaiting approval', done:false, active:true  },
  ];

  return (
    <div className="gmap-view">

      {/* ── Status strip ────────────────────────────────────── */}
      <div className="gmap-status-strip">
        <div className="gss-kpis">
          <div className="gss-kpi">
            <span className="gss-label">ON-TIME</span>
            <span className="gss-val" style={{color:'var(--ok)'}}>96.4%</span>
          </div>
          <div className="gss-kpi">
            <span className="gss-label">AT RISK</span>
            <span className="gss-val" style={{color:'var(--alert)'}}>14 HIGH</span>
          </div>
          <div className="gss-kpi">
            <span className="gss-label">REROUTED</span>
            <span className="gss-val" style={{color:'var(--violet)'}}>210 AI Action</span>
          </div>
          <div className="gss-kpi">
            <span className="gss-label">MONITORING</span>
            <span className="gss-val">2,847 Shipments</span>
          </div>
        </div>
        <div className="gss-divider"/>
        <div className="gss-pills">
          <span className="gss-pill gss-pill-alert">⚠ 2 hazards active</span>
          <span className="gss-pill gss-pill-warn">↺ 3 reroutes in progress</span>
          <span className="gss-pill gss-pill-ai">◈ AI monitoring 2,847 shipments</span>
        </div>
        {onBack && (
          <button className="btn ghost gss-back" onClick={onBack}>
            ← Dashboard
          </button>
        )}
      </div>

      {/* ── Map canvas ───────────────────────────────────────── */}
      <div className="gmap-canvas" ref={mapRef}>
        {!mapsLoaded && (
          <div className="gmap-loading">
            <div className="gmap-spinner"/>
            <span>Initialising Google Maps…</span>
          </div>
        )}
      </div>

      {/* ── Floating route card (appears on route click) ─────── */}
      {floatCard && (
        <div className="gmap-float-card" style={{ left: floatCard.x, top: floatCard.y }}>
          <div className="gfc-header">
            <div className="gfc-id">{floatCard.route.ship}</div>
            <span className="gfc-badge" style={{color: typeColor(floatCard.route.type), borderColor: typeColor(floatCard.route.type)}}>
              {typeLabel(floatCard.route.type)}
            </span>
            <button className="btn ghost" style={{padding:'2px 5px', fontSize:10, marginLeft:'auto'}} onClick={function() { setFloatCard(null); }}>
              <Icons.X size={10}/>
            </button>
          </div>
          <div className="gfc-route">{floatCard.route.label}</div>
          <div className="gfc-grid">
            <div className="gfc-cell">
              <span className="gfc-lbl">ETA</span>
              <span className="gfc-val">APR 19 · 09:44 UTC</span>
            </div>
            <div className="gfc-cell">
              <span className="gfc-lbl">Risk</span>
              <span className="gfc-val" style={{color: riskColor(floatCard.route.risk)}}>{floatCard.route.risk}</span>
            </div>
            <div className="gfc-cell">
              <span className="gfc-lbl">Confidence</span>
              <span className="gfc-val" style={{color:'var(--ok)'}}>{floatCard.route.confidence}%</span>
            </div>
            <div className="gfc-cell">
              <span className="gfc-lbl">Progress</span>
              <span className="gfc-val">{Math.round(floatCard.route.progress * 100)}%</span>
            </div>
          </div>
          <div className="gfc-conf-bar">
            <div className="gfc-conf-fill" style={{width: floatCard.route.confidence + '%'}}/>
          </div>
          <div className="gfc-actions">
            <button className="btn primary"  style={{flex:1, fontSize:10, padding:'5px 4px'}}><Icons.Check size={10}/> Approve</button>
            <button className="btn ghost"    style={{flex:1, fontSize:10, padding:'5px 4px'}}><Icons.Play  size={10}/> Simulate</button>
            <button className="btn ghost"    style={{flex:1, fontSize:10, padding:'5px 4px'}}><Icons.Arrow size={10}/> Details</button>
          </div>
          <div className="gfc-arrow"/>
        </div>
      )}

      {/* ── Left: Layer Controls ─────────────────────────────── */}
      <div className="gmap-layer-panel">
        <div className="glp-title">Layer Controls</div>
        <div className="glp-section-label">Overlays</div>
        {layerDefs.map(function(l) {
          var LayerIcon = Icons[l.icon];
          return (
            <label key={l.key} className={"glp-row" + (layers[l.key] ? " glp-row-active" : "")} onClick={function() { toggleLayer(l.key); }}>
              <div className="glp-icon-wrap" style={{color: layers[l.key] ? l.color : 'var(--fg-3)'}}>
                <LayerIcon size={12}/>
              </div>
              <span className="glp-label" style={{color: layers[l.key] ? 'var(--fg-0)' : 'var(--fg-2)'}}>{l.label}</span>
              <div
                className={"glp-toggle " + (layers[l.key] ? "on" : "off")}
                style={layers[l.key] ? {background: l.color, boxShadow: '0 0 8px ' + l.color} : {}}
              >
                <div className="glp-thumb"/>
              </div>
            </label>
          );
        })}
        <div className="glp-divider"/>
        <div className="glp-section-label">Filter by Status</div>
        {['Active Routes','At Risk','Delayed','Rerouted'].map(function(s) {
          return (
            <label key={s} className="glp-check">
              <input type="checkbox" defaultChecked style={{accentColor:'var(--accent)'}}/>
              <span>{s}</span>
            </label>
          );
        })}
        <div className="glp-divider"/>
        <button className="btn primary" style={{width:'100%', fontSize:11, marginTop:4, gap:5}}>
          <Icons.Play size={11}/> Open Full Simulation
        </button>
      </div>

      {/* ── Right: AI Decision panel ─────────────────────────── */}
      <div className="gmap-ai-panel">
        <div className="gap-header">
          <div className="gap-title">AI Decision</div>
          <span className="gap-badge">Reroute Suggested</span>
        </div>

        <div className="gap-ship-ref">
          <span className="gap-ship-id">{selectedRoute ? selectedRoute.ship : 'MDR-745'}</span>
          <span className="gap-ship-route">{selectedRoute ? selectedRoute.label : 'New York → London'}</span>
          {selectedRoute && (
            <span className="gap-risk-tag" style={{color: riskColor(selectedRoute.risk), borderColor: riskColor(selectedRoute.risk)}}>
              {selectedRoute.risk}
            </span>
          )}
        </div>

        <div className="gap-conf-wrap">
          <div className="gap-conf-header">
            <span className="gap-conf-label">Confidence Score</span>
            <span className="gap-conf-pct">92%</span>
          </div>
          <div className="gap-conf-track">
            <div className="gap-conf-fill" style={{width:'92%'}}/>
          </div>
        </div>

        <div className="gap-divider"/>

        <div className="gap-section-label">Key Reasons</div>
        <ul className="gap-reasons">
          <li>Tropical Storm 'Epsilon' · 82% severity, intercept in 6h</li>
          <li>14 shipments at risk in affected lane corridor</li>
          <li>Northern arc reduces exposure by 67%</li>
          <li>ETA delta +2h 18m vs 94% cargo loss probability</li>
        </ul>

        <div className="gap-divider"/>

        <div className="gap-section-label">Agent Workflow</div>
        <div className="gap-workflow">
          {agentSteps.map(function(a, i) {
            return (
              <React.Fragment key={a.label}>
                <div className={"gap-agent" + (a.done ? " done" : a.active ? " active" : "")}>
                  <div className="gap-agent-dot"/>
                  <div className="gap-agent-info">
                    <div className="gap-agent-name">{a.label}</div>
                    <div className="gap-agent-sub">{a.sub}</div>
                  </div>
                </div>
                {i < agentSteps.length - 1 && <div className="gap-connector"/>}
              </React.Fragment>
            );
          })}
        </div>

        <div className="gap-divider"/>

        <div className="gap-btns">
          <button className="btn primary"  style={{flex:1, fontSize:11, padding:'7px 4px'}}><Icons.Check size={11}/> Approve</button>
          <button className="btn ghost"    style={{flex:1, fontSize:11, padding:'7px 4px'}}><Icons.X    size={11}/> Override</button>
          <button className="btn ghost"    style={{flex:1, fontSize:11, padding:'7px 4px'}}><Icons.Play size={11}/> Simulate</button>
        </div>
      </div>

      {/* ── Bottom: Selected Shipment card ───────────────────── */}
      {selectedRoute && (
        <div className="gmap-ship-card">
          <div className="gsc-left">
            <div className="gsc-id">{selectedRoute.ship}</div>
            <div className="gsc-route">{selectedRoute.label}</div>
          </div>
          <div className="gsc-meta">
            <div className="gsc-item">
              <span className="gsc-lbl">ETA</span>
              <span className="gsc-val">APR 19 · 09:44 UTC</span>
            </div>
            <div className="gsc-item">
              <span className="gsc-lbl">Risk Change</span>
              <span className="gsc-val" style={{color:'var(--ok)'}}>HIGH → MEDIUM</span>
            </div>
            <div className="gsc-item">
              <span className="gsc-lbl">Cargo</span>
              <span className="gsc-val">{selectedRoute.cargo}</span>
            </div>
            <div className="gsc-item">
              <span className="gsc-lbl">Status</span>
              <span className="gsc-val" style={{color: typeColor(selectedRoute.type)}}>{typeLabel(selectedRoute.type)}</span>
            </div>
          </div>
          <div className="gsc-timeline">
            <div className="gsc-tl-label">Route Progress</div>
            <div className="gsc-tl-bar">
              <div className="gsc-tl-fill" style={{width: Math.round(selectedRoute.progress * 100) + '%'}}/>
              <div className="gsc-tl-dot"  style={{left:  Math.round(selectedRoute.progress * 100) + '%'}}/>
            </div>
            <div className="gsc-tl-ends">
              <span>{selectedRoute.label.split(' → ')[0]}</span>
              <span style={{color:'var(--accent)', fontFamily:'var(--font-mono)', fontSize:10}}>{Math.round(selectedRoute.progress * 100)}%</span>
              <span>{selectedRoute.label.split(' → ')[1]}</span>
            </div>
          </div>
          <button className="btn ghost gsc-close" onClick={function() { setSelectedRoute(null); setSelectedRouteId(null); if (highlightFn.current) highlightFn.current(null); }}>
            <Icons.X size={12}/>
          </button>
        </div>
      )}

      {/* ── Hazard tooltip ───────────────────────────────────── */}
      {activeHazard && (
        <div className="gmap-haz-tip">
          <div className="ght-head">
            <span className="ght-icon" style={{color: activeHazard.risk==='HIGH' ? 'var(--alert)' : 'var(--warn)'}}>⚠</span>
            <div className="ght-info">
              <div className="ght-name">{activeHazard.name}</div>
              <div className="ght-status">Active Hazard Zone</div>
            </div>
            <button className="btn ghost" style={{padding:'2px 6px', fontSize:10, marginLeft:'auto'}} onClick={function() { setActiveHazard(null); }}>
              <Icons.X size={11}/>
            </button>
          </div>
          <div className="ght-grid">
            <div className="ght-cell">
              <span className="ght-lbl">Risk</span>
              <span className="ght-val" style={{color: activeHazard.risk==='HIGH' ? 'var(--alert)' : 'var(--warn)'}}>{activeHazard.risk}</span>
            </div>
            <div className="ght-cell">
              <span className="ght-lbl">Severity</span>
              <span className="ght-val">{activeHazard.severity}%</span>
            </div>
            <div className="ght-cell">
              <span className="ght-lbl">Status</span>
              <span className="ght-val" style={{color:'var(--ok)'}}>{activeHazard.status}</span>
            </div>
            <div className="ght-cell">
              <span className="ght-lbl">Impacted</span>
              <span className="ght-val">{activeHazard.impacted} Ships</span>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

window.GlobalMapView = GlobalMapView;
