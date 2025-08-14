// ========== tiny helpers ==========
const $ = s => document.querySelector(s);
const $$ = s => document.querySelectorAll(s);
const wait = ms => new Promise(r => setTimeout(r, ms));

// Show tool grid / open specific tool section
function showGrid() {
  const grid = $('#toolsGrid');
  if (grid) grid.style.display = 'grid';
  $$('.tool-section').forEach(s => s.classList.add('hidden'));
  window.scrollTo({ top: 0, behavior: 'smooth' });
}
function openSection(id) {
  const grid = $('#toolsGrid');
  if (grid) grid.style.display = 'none';
  $$('.tool-section').forEach(s => s.classList.add('hidden'));
  const sec = document.getElementById(id);
  if (sec) sec.classList.remove('hidden');
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ========== grid: restore order + click nav ==========
const grid = $('#toolsGrid');

// Build Reorder / Reset buttons if not present
(function ensureReorderUI(){
  if (!grid) return;
  let actions = document.querySelector('.grid-actions');
  if (!actions) {
    actions = document.createElement('div');
    actions.className = 'grid-actions';
    actions.innerHTML = `
      <button id="reorderToggle" type="button">Reorder</button>
      <button id="resetOrder" type="button">Reset</button>
    `;
    grid.parentNode.insertBefore(actions, grid);
  }
})();

function saveOrder() {
  if (!grid) return;
  const order = [...grid.querySelectorAll('.tool-card')].map(b => b.id);
  localStorage.setItem('toolOrder', JSON.stringify(order));
}
function loadOrder() {
  if (!grid) return;
  const order = JSON.parse(localStorage.getItem('toolOrder') || 'null');
  if (!order) return;
  order.forEach(id => {
    const el = document.getElementById(id);
    if (el) grid.appendChild(el);
  });
}
loadOrder();

// card click -> open section (only when NOT in reorder mode)
grid?.addEventListener('click', e => {
  const btn = e.target.closest('.tool-card');
  if (!btn) return;
  if (grid.classList.contains('reorder')) return; // ignore clicks in reorder mode
  const target = btn.dataset.target;
  if (target) openSection(target);
});

// Bottom nav back to grid
$('#navTools')?.addEventListener('click', showGrid);
$$('.back-btn').forEach(b => b.addEventListener('click', showGrid));


// ========== Drag & Drop (desktop + touch) with Reorder/Reset ==========
const reorderToggle = $('#reorderToggle');
const resetBtn = $('#resetOrder');

// Toggle reorder (iOS "jiggle" style)
reorderToggle?.addEventListener('click', () => {
  grid.classList.toggle('reorder');
  reorderToggle.textContent = grid.classList.contains('reorder') ? 'Done' : 'Reorder';
});

// Reset to original order (clears saved order)
resetBtn?.addEventListener('click', () => {
  localStorage.removeItem('toolOrder');
  location.reload();
});

// Desktop HTML5 drag & drop
let dragged = null;
grid?.addEventListener('dragstart', e => {
  if (!grid.classList.contains('reorder')) { e.preventDefault(); return; }
  const btn = e.target.closest('.tool-card');
  if (!btn) return;
  dragged = btn;
  btn.classList.add('dragging');
  e.dataTransfer.effectAllowed = 'move';
});
grid?.addEventListener('dragend', e => {
  const btn = e.target.closest('.tool-card');
  if (btn) btn.classList.remove('dragging');
  dragged = null;
  saveOrder();
});
grid?.addEventListener('dragover', e => {
  if (!grid.classList.contains('reorder')) return;
  e.preventDefault();
  const after = [...grid.querySelectorAll('.tool-card:not(.dragging)')]
    .reduce((closest, child) => {
      const box = child.getBoundingClientRect();
      const offset = e.clientY - (box.top + box.height / 2);
      if (offset < 0 && offset > closest.offset) return { offset, el: child };
      return closest;
    }, { offset: Number.NEGATIVE_INFINITY, el: null }).el;

  if (dragged) {
    if (after == null) grid.appendChild(dragged);
    else grid.insertBefore(dragged, after);
  }
});

// Mobile touch reorder (iOS/Android)
let touchDragging = null;
function touchClosestCard(x, y) {
  const el = document.elementFromPoint(x, y);
  return el ? el.closest('.tool-card') : null;
}
grid?.addEventListener('touchstart', e => {
  if (!grid.classList.contains('reorder')) return;
  const t = e.target.closest('.tool-card');
  if (!t) return;
  touchDragging = t;
  t.classList.add('dragging');
  e.preventDefault(); // iOS needs this
}, { passive: false });

grid?.addEventListener('touchmove', e => {
  if (!grid.classList.contains('reorder') || !touchDragging) return;
  const touch = e.touches[0];
  const over = touchClosestCard(touch.clientX, touch.clientY);
  if (over && over !== touchDragging) {
    const box = over.getBoundingClientRect();
    const before = (touch.clientY < (box.top + box.height / 2));
    grid.insertBefore(touchDragging, before ? over : over.nextSibling);
  }
  e.preventDefault();
}, { passive: false });

grid?.addEventListener('touchend', () => {
  if (!touchDragging) return;
  touchDragging.classList.remove('dragging');
  touchDragging = null;
  saveOrder();
});


// ========== Compass ==========
const headingDeg = $('#headingDeg');
const headingCard = $('#headingCard');
const dial = $('#compassDial');

function cardinal(d){
  const dirs=["N","NE","E","SE","S","SW","W","NW","N"];
  return dirs[Math.round(((d%360)+360)%360 / 45)];
}
function setHeading(deg){
  if (headingDeg) headingDeg.textContent = `${Math.round(deg)}°`;
  if (headingCard) headingCard.textContent = cardinal(deg);
  if (dial) dial.style.transform = `rotate(${360 - deg}deg)`;
}

function startCompass(){
  const handler = (e)=>{
    let deg = null;
    if (typeof e.webkitCompassHeading === "number") { deg = e.webkitCompassHeading; }
    else if (typeof e.alpha === "number") { deg = 360 - e.alpha; }
    if (deg != null) setHeading((deg + 360) % 360);
  };
  if (typeof DeviceOrientationEvent !== "undefined" &&
      typeof DeviceOrientationEvent.requestPermission === "function") {
    DeviceOrientationEvent.requestPermission()
      .then(state => { if (state === "granted") window.addEventListener("deviceorientation", handler, true); })
      .catch(()=> alert("Compass permission denied. Enable in Settings > Safari > Motion & Orientation."));
  } else if (window.DeviceOrientationEvent) {
    window.addEventListener("deviceorientation", handler, true);
  } else {
    alert("Compass not supported on this device/browser.");
  }
}
$('#enableCompass')?.addEventListener('click', startCompass);


// ========== Converter ==========
const units = {
  length: { base:"m", map:{ m:1, km:1000, mi:1609.344, ft:0.3048, yd:0.9144, cm:0.01, in:0.0254 } },
  weight: { base:"kg", map:{ kg:1, g:0.001, lb:0.45359237, oz:0.028349523125 } },
  volume: { base:"L", map:{ L:1, mL:0.001, gal:3.785411784, "fl oz":0.0295735295625 } },
  speed:  { base:"m/s", map:{ "m/s":1, "km/h":0.2777777778, mph:0.44704 } },
  fuel:   { base:"km/L", map:{ "km/L":1, "L/100km":"inv", "mpg(US)":0.4251437075 } }
};
const convCategory = $('#convCategory');
const fromVal = $('#convFromVal');
const toVal   = $('#convToVal');
const fromUnit= $('#convFromUnit');
const toUnit  = $('#convToUnit');
const convResult = $('#convResult');

$('#convSwap')?.addEventListener('click', ()=>{
  const a = fromUnit.value, b = toUnit.value;
  toUnit.value = a; fromUnit.value = b; computeConv();
});
function fillUnits(){
  if (!convCategory) return;
  const cat = convCategory.value;
  fromUnit.innerHTML = ""; toUnit.innerHTML = "";
  if(cat === "temp"){
    ["°C","°F","K"].forEach(u=>{ fromUnit.add(new Option(u,u)); toUnit.add(new Option(u,u)); });
  } else {
    Object.keys(units[cat].map).forEach(u=>{ fromUnit.add(new Option(u,u)); toUnit.add(new Option(u,u)); });
  }
  fromUnit.selectedIndex = 0; toUnit.selectedIndex = 1;
  computeConv();
}
function convertTemp(v, from, to){
  let c;
  if(from==="°C") c=v;
  if(from==="°F") c=(v-32)*5/9;
  if(from==="K")  c=v-273.15;
  if(to==="°C") return c;
  if(to==="°F") return c*9/5+32;
  if(to==="K")  return c+273.15;
}
function computeConv(){
  const cat = convCategory.value;
  const v = parseFloat(fromVal.value || "0");
  let out = v;

  if(cat === "temp"){
    out = convertTemp(v, fromUnit.value, toUnit.value);
  } else if (cat === "fuel"){
    const f = units.fuel.map;
    const toBase = (val, u)=>{
      if(u==="L/100km") return 100/(val);
      if(u==="mpg(US)") return val * f["mpg(US)"];
      return val;
    };
    const fromBase = (val, u)=>{
      if(u==="L/100km") return 100/(val);
      if(u==="mpg(US)") return val / f["mpg(US)"];
      return val;
    };
    out = fromBase(toBase(v, fromUnit.value), toUnit.value);
  } else {
    const map = units[cat].map;
    const base = (v * map[fromUnit.value]);
    out = base / map[toUnit.value];
  }

  toVal.value = out;
  convResult.textContent = `= ${Number(out).toLocaleString(undefined,{maximumFractionDigits:6})} ${toUnit.value}`;
}
convCategory?.addEventListener('change', fillUnits);
[fromVal, fromUnit, toUnit].forEach(el=> el?.addEventListener('input', computeConv));
if (convCategory) fillUnits();


// ========== Morse ==========
const MORSE = {
  a:"•-", b:"-•••", c:"-•-•", d:"-••", e:"•", f:"••-•", g:"--•", h:"••••", i:"••", j:"•---",
  k:"-•-", l:"•-••", m:"--", n:"-•", o:"---", p:"•--•", q:"--•-", r:"•-•", s:"•••", t:"-",
  u:"••-", v:"•••-", w:"•--", x:"-••-", y:"-•--", z:"--••",
  "1":"•----","2":"••---","3":"•••--","4":"••••-","5":"•••••","6":"-••••","7":"--•••","8":"---••","9":"----•","0":"-----",
  ".":"•-•-•-",
  ",":"--••--",
  "?":"••--••",
  "/":"-••-•",
  "@":"•--•-•",
  "-":"-••••-",
  " ":"/"
};
const REVERSE = Object.fromEntries(Object.entries(MORSE).map(([k,v])=>[v,k]));

const morseText = $('#morseText');
const morseDots = $('#morseDots');
$('#morseEncode')?.addEventListener('click', ()=>{
  const msg = (morseText?.value || "").toLowerCase();
  const out = [...msg].map(ch => MORSE[ch] || "").join(" ");
  if (morseDots) morseDots.value = out.trim();
});
$('#morseDecode')?.addEventListener('click', ()=>{
  const parts = (morseDots?.value || "").trim().split(/\s+/);
  const out = parts.map(p => REVERSE[p] ?? (p==="/" ? " " : "")).join("");
  if (morseText) morseText.value = out;
});

// Audio/screen/vibration playback
let morsePlaying=false, ac=null, osc=null;
const flashEl = (()=>{ const d=document.createElement("div"); d.style.position="fixed"; d.style.inset="0"; d.style.background="#fff"; d.style.opacity="0"; d.style.pointerEvents="none"; d.style.transition="opacity .02s"; document.body.appendChild(d); return d; })();
function beep(on){
  if(!on){ if(osc){ try{osc.stop();}catch{} osc.disconnect(); osc=null; } return; }
  if(!ac) ac = new (window.AudioContext || window.webkitAudioContext)();
  osc = ac.createOscillator(); const g = ac.createGain();
  osc.frequency.value = 700; osc.connect(g); g.connect(ac.destination);
  g.gain.value = 0.15; osc.start();
}
function screenFlash(on){ flashEl.style.opacity = on? "1":"0"; }
function vibe(ms){ if(navigator.vibrate) navigator.vibrate(ms); }
function playMorse(seq, dot){
  morsePlaying = true;
  const useSound = $('#morseSound')?.checked;
  const useScreen = $('#morseScreen')?.checked;
  const useVibe = $('#morseVibe')?.checked;
  (async function run(){
    const letters = seq.split(" ");
    for(let li=0; li<letters.length && morsePlaying; li++){
      const ch = letters[li];
      if(ch==="/"){ if(useSound) beep(false); if(useScreen) screenFlash(false); await wait(7*dot); continue; }
      for(let si=0; si<ch.length && morsePlaying; si++){
        const s = ch[si];
        if(useSound) beep(true);
        if(useScreen) screenFlash(true);
        if(useVibe) vibe(s==="•" ? dot : 3*dot);
        await wait(s==="•" ? dot : 3*dot);
        if(useSound) beep(false);
        if(useScreen) screenFlash(false);
        await wait(dot);
      }
      await wait(2*dot);
    }
    beep(false); screenFlash(false); morsePlaying=false;
  })();
}
function stopMorse(){ morsePlaying=false; beep(false); screenFlash(false); }
$('#morsePlay')?.addEventListener('click', ()=>{
  if(morsePlaying) return;
  const seq = (morseDots?.value || "").trim(); if(!seq) return;
  const dot = parseInt($('#morseSpeed').value || "180", 10);
  playMorse(seq, dot);
});
$('#morseStop')?.addEventListener('click', stopMorse);


// ========== SOS ==========
let sosRunning=false;
$('#sosToggle')?.addEventListener('click', async (e)=>{
  if(sosRunning){ sosRunning=false; e.target.textContent="Start SOS"; beep(false); screenFlash(false); return; }
  sosRunning=true; e.target.textContent="Stop SOS";
  const dot = parseInt($('#sosSpeed').value || "160", 10);
  const useSound = $('#sosSound')?.checked;
  const useScreen = $('#sosScreen')?.checked;
  const useVibe = $('#sosVibe')?.checked;
  const on = async ms => { if(useSound) beep(true); if(useScreen) screenFlash(true); if(useVibe) vibe(ms); await wait(ms); };
  const off = async ms=> { if(useSound) beep(false); if(useScreen) screenFlash(false); await wait(ms); };
  while(sosRunning){
    // S
    await on(dot); await off(dot); await on(dot); await off(dot); await on(dot); await off(3*dot);
    // O
    await on(3*dot); await off(dot); await on(3*dot); await off(dot); await on(3*dot); await off(3*dot);
    // S
    await on(dot); await off(dot); await on(dot); await off(dot); await on(dot); await off(7*dot);
  }
  beep(false); screenFlash(false);
});


// ========== CPR ==========
let cprTimer=null, cprAudio=null, cprRunning=false;
const cprBpm = $('#cprBpm'), cprBpmRead = $('#cprBpmRead');
function cprBeep(){
  const AC = window.AudioContext || window.webkitAudioContext;
  if(!AC) return;
  if(!cprAudio) cprAudio = new AC();
  const o = cprAudio.createOscillator(); const g = cprAudio.createGain();
  o.type="square"; o.frequency.value=800; g.gain.value=0.2; o.connect(g); g.connect(cprAudio.destination);
  o.start(); setTimeout(()=>o.stop(),60);
}
function startCPR(){
  if(cprRunning) return;
  const bpm = parseInt(cprBpm.value || "110", 10);
  const interval = 60000 / bpm;
  cprRunning = true;
  cprBeep();
  cprTimer = setInterval(cprBeep, interval);
}
function stopCPR(){
  cprRunning=false;
  if(cprTimer) clearInterval(cprTimer);
  cprTimer=null;
}
cprBpm?.addEventListener('input', ()=> cprBpmRead && (cprBpmRead.textContent = `${cprBpm.value} BPM`));
$('#cprStart')?.addEventListener('click', startCPR);
$('#cprStop')?.addEventListener('click', stopCPR);


// ========== Sun times (offline NOAA approx) ==========
const d2r = d=> d*Math.PI/180, r2d = r=> r*180/Math.PI;
function sunTimesForDate(lat, lon, dateObj){
  const ms = Date.UTC(dateObj.getUTCFullYear(), dateObj.getUTCMonth(), dateObj.getUTCDate());
  const J2000 = Date.UTC(2000,0,1,12);
  const n = Math.floor((ms - J2000)/86400000);
  const M = d2r((357.5291 + 0.98560028 * n) % 360);
  const C = d2r((1.9148 * Math.sin(M)) + (0.0200 * Math.sin(2*M)) + (0.0003 * Math.sin(3*M)));
  const L = (M + C + d2r(102.9372) + Math.PI) % (2*Math.PI);
  const Jtransit = 2451545 + n + 0.0053*Math.sin(M) - 0.0069*Math.sin(2*L);
  const δ = Math.asin(Math.sin(L) * Math.sin(d2r(23.44)));
  const φ = d2r(lat);
  const cosH = (Math.sin(d2r(-0.83)) - Math.sin(φ)*Math.sin(δ)) / (Math.cos(φ)*Math.cos(δ));
  if (cosH < -1 || cosH > 1) return null;
  const H = Math.acos(cosH);
  const Jrise = Jtransit - r2d(H)/360;
  const Jset  = Jtransit + r2d(H)/360;
  const jdToDate = jd => new Date((jd - 2440587.5) * 86400000);
  return { sunrise: jdToDate(Jrise), sunset: jdToDate(Jset) };
}
function fmtTimeLocal(d){ return d ? d.toLocaleTimeString([], {hour:"2-digit", minute:"2-digit"}) : "--"; }

$('#sunUseGPS')?.addEventListener('click', ()=>{
  if(!navigator.geolocation) return alert("GPS not supported.");
  navigator.geolocation.getCurrentPosition(pos=>{
    $('#sunLat').value = pos.coords.latitude.toFixed(4);
    $('#sunLon').value = pos.coords.longitude.toFixed(4);
  }, ()=> alert("Unable to access GPS."));
});
$('#sunCalc')?.addEventListener('click', ()=>{
  const lat = parseFloat($('#sunLat')?.value || "NaN");
  const lon = parseFloat($('#sunLon')?.value || "NaN");
  const d = $('#sunDate')?.value ? new Date($('#sunDate').value+"T00:00:00") : new Date();
  if (Number.isNaN(lat) || Number.isNaN(lon)) return alert("Enter latitude and longitude.");
  const res = sunTimesForDate(lat, lon, new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate())));
  if(!res){ $('#sunriseOut').textContent="--"; $('#sunsetOut').textContent="--"; $('#sunDurOut').textContent="Polar day/night"; return; }
  $('#sunriseOut').textContent = fmtTimeLocal(res.sunrise);
  $('#sunsetOut').textContent  = fmtTimeLocal(res.sunset);
  const durMs = res.sunset - res.sunrise;
  const hrs = Math.floor(durMs/3600000), mins = Math.round((durMs%3600000)/60000);
  $('#sunDurOut').textContent = `${hrs}h ${mins}m`;
});


// ========== Water purification calc ==========
function ft2m(ft){ return ft * 0.3048; }
function gal2L(g){ return g * 3.785411784; }
function ml2L(ml){ return ml / 1000; }
$('#purifyCalc')?.addEventListener('click', ()=>{
  const altV = parseFloat($('#altValue')?.value || "NaN");
  const altU = $('#altUnit')?.value || "ft";
  const volV = parseFloat($('#volValue')?.value || "NaN");
  const volU = $('#volUnit')?.value || "L";
  const out = $('#purifyOut');

  if (Number.isNaN(altV) || Number.isNaN(volV)) { out.textContent = "Enter altitude and volume."; return; }

  const altitude_m = altU === "m" ? altV : ft2m(altV);
  let liters;
  if (volU === "L") liters = volV;
  else if (volU === "mL") liters = ml2L(volV);
  else liters = gal2L(volV);

  const boilMinutes = altitude_m >= 2000 ? 3 : 1;
  const tablets = Math.max(1, Math.ceil(liters));

  out.innerHTML = `
    <div><b>Volume:</b> ${liters.toFixed(2)} L</div>
    <div><b>Boil time:</b> ${boilMinutes} minute(s)</div>
    <div><b>Tablet dose:</b> ${tablets} tablet(s)</div>
  `;
});


// ========== Knot guide ==========
const KNOTS = {
  bowline: [
    "Make a small loop near the end (the rabbit hole).",
    "Pass the working end up through the loop.",
    "Wrap it around the standing part.",
    "Pass back down the loop and tighten."
  ],
  clove: [
    "Wrap the rope around the post once.",
    "Cross over the standing part and wrap again.",
    "Tuck the working end under the last wrap and snug."
  ],
  square: [
    "Left over right and under (first overhand).",
    "Right over left and under (second overhand).",
    "Tighten; ends exit the same side."
  ]
};
function renderKnot(id){
  const steps = KNOTS[id] || [];
  const ul = $('#knotSteps');
  if (ul) ul.innerHTML = steps.map(s=>`<li>${s}</li>`).join("");
}
$('#knotSelect')?.addEventListener('change', ()=> renderKnot($('#knotSelect').value));
renderKnot('bowline');


// ========== Map (Leaflet) ==========
let map = null, userMarker=null;
function ensureMap(){
  if (map || !$('#mapContainer') || typeof L === 'undefined') return;
  map = L.map('mapContainer').setView([20,0], 2);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19, attribution: '&copy; OpenStreetMap'
  }).addTo(map);
}
$('#mapLocate')?.addEventListener('click', ()=>{
  ensureMap();
  if(!navigator.geolocation) return alert("GPS not supported.");
  navigator.geolocation.getCurrentPosition(pos=>{
    const {latitude, longitude} = pos.coords;
    map.setView([latitude, longitude], 14);
    if(userMarker) userMarker.remove();
    userMarker = L.marker([latitude, longitude]).addTo(map).bindPopup("You are here");
  }, ()=> alert("Unable to access GPS."));
});
// init map when map section becomes visible
const mapObs = new MutationObserver(()=> {
  if (!$('#sec-map')) return;
  if (!$('#sec-map').classList.contains('hidden')) ensureMap();
});
if ($('#sec-map')) mapObs.observe($('#sec-map'), {attributes:true, attributeFilter:['class']});


// ========== Whistle ==========
let whistleAC=null, whistleOsc=null;
function whistleStart(){
  const AC = window.AudioContext || window.webkitAudioContext;
  if(!AC) return alert("Audio not supported.");
  if(!whistleAC) whistleAC = new AC();
  whistleOsc = whistleAC.createOscillator();
  const g = whistleAC.createGain();
  whistleOsc.type='sine'; whistleOsc.frequency.value=4000; g.gain.value=0.15;
  whistleOsc.connect(g); g.connect(whistleAC.destination);
  whistleOsc.start();
}
function whistleStop(){ try{ whistleOsc?.stop(); }catch{} whistleOsc=null; }
$('#whistleStart')?.addEventListener('click', whistleStart);
$('#whistleStop')?.addEventListener('click', whistleStop);


// ========== Flashlight (torch + screen) ==========
let camStream=null; let torchTrack=null;
const screenOverlay = (()=>{ const d=document.createElement('div'); d.style.position='fixed'; d.style.inset='0'; d.style.background='#fff'; d.style.opacity='0'; d.style.pointerEvents='none'; d.style.transition='opacity .05s'; document.body.appendChild(d); return d; })();
async function torchOn(){
  screenOverlay.style.opacity='1';
  try{
    camStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
    const track = camStream.getVideoTracks()[0];
    const caps = track.getCapabilities?.();
    if (caps && 'torch' in caps) {
      await track.applyConstraints({ advanced: [{ torch: true }] });
      torchTrack = track;
    }
  }catch(e){ /* screen overlay still provides light */ }
}
function torchOff(){
  screenOverlay.style.opacity='0';
  if(torchTrack){ torchTrack.applyConstraints({ advanced: [{ torch: false }] }); torchTrack=null; }
  if(camStream){ camStream.getTracks().forEach(t=>t.stop()); camStream=null; }
}
$('#flashOn')?.addEventListener('click', torchOn);
$('#flashOff')?.addEventListener('click', torchOff);


// ========== Weather (Open-Meteo; caches last) ==========
async function getWeather(){
  const out = $('#weatherResult');
  if(!out) return;
  if(!navigator.geolocation){ out.textContent='GPS not supported.'; return; }
  out.textContent = 'Locating…';
  navigator.geolocation.getCurrentPosition(async pos=>{
    const {latitude, longitude} = pos.coords;
    out.textContent = 'Fetching…';
    try{
      const url = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,wind_speed_10m`;
      const r = await fetch(url, { cache: 'no-store' });
      const j = await r.json();
      const c = j.current;
      const txt = `Temp: ${c.temperature_2m}°C • Humidity: ${c.relative_humidity_2m}% • Wind: ${c.wind_speed_10m} m/s`;
      out.textContent = txt;
      localStorage.setItem('weather_last', JSON.stringify({ t:Date.now(), txt }));
    }catch(e){
      const last = JSON.parse(localStorage.getItem('weather_last')||'null');
      out.textContent = last ? `(offline) ${last.txt}` : 'Offline and no cached weather.';
    }
  }, ()=> out.textContent='GPS denied.');
}
$('#weatherGet')?.addEventListener('click', getWeather);


// ========== start on grid ==========
showGrid();