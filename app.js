// ===== View Switching =====
document.querySelectorAll('.tool-card, .bottom-nav a').forEach(link => {
  link.addEventListener('click', e => {
    e.preventDefault();
    const target = link.getAttribute('href').replace('#', '');
    document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
    const targetView = document.querySelector(`[data-view="${target}"]`);
    if (targetView) targetView.classList.add('active');
  });
});

// ===== Compass =====
const enableCompassBtn = document.getElementById('enableCompass');
if (enableCompassBtn) {
  enableCompassBtn.addEventListener('click', () => {
    if (typeof DeviceOrientationEvent.requestPermission === 'function') {
      DeviceOrientationEvent.requestPermission().then(permissionState => {
        if (permissionState === 'granted') startCompass();
      }).catch(console.error);
    } else {
      startCompass();
    }
  });
}
function startCompass() {
  window.addEventListener('deviceorientation', e => {
    const heading = e.alpha;
    document.getElementById('compassDial').style.transform = `rotate(${heading}deg)`;
    document.getElementById('compassHeading').textContent = `${Math.round(heading)}°`;
  });
}

// ===== Unit Converter =====
document.getElementById('convertBtn').addEventListener('click', () => {
  const type = document.getElementById('convertType').value;
  const value = parseFloat(document.getElementById('convertInput').value);
  let result = '';
  if (isNaN(value)) {
    result = 'Enter a number';
  } else {
    if (type === 'length') result = `${value} m = ${(value * 3.28084).toFixed(2)} ft`;
    if (type === 'weight') result = `${value} kg = ${(value * 2.20462).toFixed(2)} lbs`;
    if (type === 'temp') result = `${value}°C = ${(value * 9/5 + 32).toFixed(1)}°F`;
  }
  document.getElementById('convertResult').textContent = result;
});

// ===== Morse Code =====
const morseMap = { 'A':'.-', 'B':'-...', 'C':'-.-.', 'D':'-..', 'E':'.', 'F':'..-.',
  'G':'--.', 'H':'....', 'I':'..', 'J':'.---', 'K':'-.-', 'L':'.-..',
  'M':'--', 'N':'-.', 'O':'---', 'P':'.--.', 'Q':'--.-', 'R':'.-.',
  'S':'...', 'T':'-', 'U':'..-', 'V':'...-', 'W':'.--', 'X':'-..-',
  'Y':'-.--', 'Z':'--..', '1':'.----', '2':'..---', '3':'...--', '4':'....-',
  '5':'.....', '6':'-....', '7':'--...', '8':'---..', '9':'----.', '0':'-----',
  ' ':'/' };
const inverseMorse = Object.fromEntries(Object.entries(morseMap).map(([k,v]) => [v,k]));

document.getElementById('morseEncode').onclick = () => {
  const text = document.getElementById('morseInput').value.toUpperCase();
  document.getElementById('morseOutput').textContent = text.split('').map(ch => morseMap[ch] || '').join(' ');
};
document.getElementById('morseDecode').onclick = () => {
  const code = document.getElementById('morseInput').value.trim();
  document.getElementById('morseOutput').textContent = code.split(' ').map(c => inverseMorse[c] || '').join('');
};
document.getElementById('morsePlay').onclick = () => {
  const ctx = new AudioContext();
  const unit = 0.1;
  const morse = document.getElementById('morseOutput').textContent;
  let t = ctx.currentTime;
  morse.split('').forEach(symbol => {
    if (symbol === '.') beep(ctx, t, unit);
    if (symbol === '-') beep(ctx, t, unit*3);
    t += unit*2;
  });
};
function beep(ctx, start, dur) {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.type = 'sine';
  osc.frequency.value = 600;
  osc.start(start);
  osc.stop(start + dur);
}

// ===== SOS =====
let sosInterval;
document.getElementById('sosStart').onclick = () => {
  const body = document.body;
  sosInterval = setInterval(() => {
    body.style.background = body.style.background === 'white' ? 'black' : 'white';
  }, 300);
};
document.getElementById('sosStop').onclick = () => {
  clearInterval(sosInterval);
  document.body.style.background = '';
};

// ===== CPR Timer =====
let cprTimer;
document.getElementById('cprStart').onclick = () => {
  let count = 30;
  document.getElementById('cprCountdown').textContent = count;
  clearInterval(cprTimer);
  cprTimer = setInterval(() => {
    count--;
    document.getElementById('cprCountdown').textContent = count;
    if (count <= 0) {
      clearInterval(cprTimer);
      alert('Give 2 breaths!');
    }
  }, 1000);
};

// ===== Sun Times =====
document.getElementById('sunGet').onclick = () => {
  navigator.geolocation.getCurrentPosition(pos => {
    const times = SunCalc.getTimes(new Date(), pos.coords.latitude, pos.coords.longitude);
    document.getElementById('sunTimes').textContent =
      `Sunrise: ${times.sunrise.toLocaleTimeString()}, Sunset: ${times.sunset.toLocaleTimeString()}`;
  });
};

// ===== Water Calculator =====
document.getElementById('purifyCalc').onclick = () => {
  const liters = parseFloat(document.getElementById('waterLiters').value);
  if (!liters) return;
  document.getElementById('purifyResult').textContent = `${liters} liters: boil 1 min (3 min above 2000m) or use ${(liters*2).toFixed(0)} drops bleach`;
};

// ===== Knots =====
document.getElementById('knotGallery').innerHTML = `
  <p>Square Knot</p>
  <p>Bowline</p>
  <p>Clove Hitch</p>
`;

// ===== Offline Map =====
if (document.getElementById('mapContainer')) {
  const map = L.map('mapContainer').setView([0,0], 2);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19
  }).addTo(map);
  navigator.geolocation.getCurrentPosition(pos => {
    map.setView([pos.coords.latitude, pos.coords.longitude], 13);
  });
}

// ===== Whistle =====
let whistleOsc;
document.getElementById('whistleStart').onclick = () => {
  const ctx = new AudioContext();
  whistleOsc = ctx.createOscillator();
  whistleOsc.type = 'square';
  whistleOsc.frequency.value = 3000;
  whistleOsc.connect(ctx.destination);
  whistleOsc.start();
};
document.getElementById('whistleStop').onclick = () => {
  if (whistleOsc) whistleOsc.stop();
};

// ===== Flashlight =====
document.getElementById('flashOn').onclick = () => {
  document.body.style.background = 'white';
};
document.getElementById('flashOff').onclick = () => {
  document.body.style.background = '';
};

// ===== Weather =====
document.getElementById('weatherGet').onclick = () => {
  navigator.geolocation.getCurrentPosition(pos => {
    const apiKey = 'YOUR_OPENWEATHERMAP_API_KEY';
    fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${pos.coords.latitude}&lon=${pos.coords.longitude}&units=metric&appid=${apiKey}`)
      .then(res => res.json())
      .then(data => {
        document.getElementById('weatherResult').textContent =
          `${data.weather[0].description}, ${data.main.temp}°C`;
      });
  });
};

// ===== Static Guides =====
document.getElementById('firstAidContent').innerHTML = `<ul><li>Check scene safety</li><li>Call for help</li><li>Give CPR if no pulse</li></ul>`;
document.getElementById('fireContent').innerHTML = `<ul><li>Use dry tinder</li><li>Build teepee structure</li><li>Shield from wind</li></ul>`;
document.getElementById('shelterContent').innerHTML = `<ul><li>Pick dry ground</li><li>Use natural windbreak</li><li>Insulate from ground</li></ul>`;
document.getElementById('plantsContent').innerHTML = `<ul><li>Dandelion - edible leaves</li><li>Cattail - edible roots</li></ul>`;