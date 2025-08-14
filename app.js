// ===== TOOL NAVIGATION =====
document.querySelectorAll('.tool-card').forEach(card => {
  card.addEventListener('click', () => {
    const toolId = card.dataset.tool;
    document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
    document.getElementById(`tool-${toolId}`).classList.add('active');
  });
});

document.querySelectorAll('.back-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
    document.getElementById('toolsView').classList.add('active');
  });
});

// ===== COMPASS =====
let compassActive = false;
document.getElementById('enableCompass').addEventListener('click', () => {
  if (window.DeviceOrientationEvent && typeof DeviceOrientationEvent.requestPermission === 'function') {
    DeviceOrientationEvent.requestPermission().then(response => {
      if (response === 'granted') startCompass();
    }).catch(console.error);
  } else {
    startCompass();
  }
});

function startCompass() {
  if (compassActive) return;
  window.addEventListener('deviceorientationabsolute', handleOrientation);
  window.addEventListener('deviceorientation', handleOrientation);
  compassActive = true;
}

function handleOrientation(e) {
  const heading = e.alpha ? 360 - e.alpha : 0;
  document.getElementById('compassDial').style.transform = `rotate(${heading}deg)`;
  document.getElementById('compassHeading').textContent = `${Math.round(heading)}°`;
}

// ===== UNIT CONVERTER =====
document.getElementById('convertBtn').addEventListener('click', () => {
  const type = document.getElementById('convertType').value;
  const input = parseFloat(document.getElementById('convertInput').value);
  let result = '';

  if (isNaN(input)) {
    result = 'Please enter a number.';
  } else {
    switch (type) {
      case 'length':
        result = `${input} meters = ${(input * 3.28084).toFixed(2)} feet`;
        break;
      case 'weight':
        result = `${input} kg = ${(input * 2.20462).toFixed(2)} lbs`;
        break;
      case 'temp':
        result = `${input}°C = ${((input * 9/5) + 32).toFixed(2)}°F`;
        break;
    }
  }
  document.getElementById('convertResult').textContent = result;
});

// ===== MORSE CODE =====
const morseCodeMap = {
  'A': '.-', 'B': '-...', 'C': '-.-.', 'D': '-..',
  'E': '.', 'F': '..-.', 'G': '--.', 'H': '....',
  'I': '..', 'J': '.---', 'K': '-.-', 'L': '.-..',
  'M': '--', 'N': '-.', 'O': '---', 'P': '.--.',
  'Q': '--.-', 'R': '.-.', 'S': '...', 'T': '-',
  'U': '..-', 'V': '...-', 'W': '.--', 'X': '-..-',
  'Y': '-.--', 'Z': '--..', '1': '.----', '2': '..---',
  '3': '...--', '4': '....-', '5': '.....', '6': '-....',
  '7': '--...', '8': '---..', '9': '----.', '0': '-----',
  ' ': '/'
};
const reverseMorse = Object.fromEntries(Object.entries(morseCodeMap).map(([k,v]) => [v,k]));

document.getElementById('morseEncode').addEventListener('click', () => {
  const text = document.getElementById('morseInput').value.toUpperCase();
  document.getElementById('morseOutput').textContent =
    text.split('').map(ch => morseCodeMap[ch] || '').join(' ');
});

document.getElementById('morseDecode').addEventListener('click', () => {
  const code = document.getElementById('morseInput').value.trim();
  document.getElementById('morseOutput').textContent =
    code.split(' ').map(m => reverseMorse[m] || '').join('');
});

document.getElementById('morsePlay').addEventListener('click', () => {
  const code = document.getElementById('morseOutput').textContent;
  let i = 0;
  const beep = new AudioContext();
  function playTone(len) {
    const osc = beep.createOscillator();
    osc.frequency.value = 600;
    osc.connect(beep.destination);
    osc.start();
    osc.stop(beep.currentTime + len);
  }
  function next() {
    if (i >= code.length) return;
    const c = code[i++];
    if (c === '.') { playTone(0.1); setTimeout(next, 200); }
    else if (c === '-') { playTone(0.3); setTimeout(next, 400); }
    else setTimeout(next, 200);
  }
  next();
});

// ===== SOS TOOL =====
let sosInterval;
document.getElementById('sosStart').addEventListener('click', () => {
  const status = document.getElementById('sosStatus');
  let on = false;
  sosInterval = setInterval(() => {
    on = !on;
    document.body.style.background = on ? 'red' : '';
    status.textContent = on ? 'SOS ACTIVE' : '';
  }, 500);
});
document.getElementById('sosStop').addEventListener('click', () => {
  clearInterval(sosInterval);
  document.body.style.background = '';
  document.getElementById('sosStatus').textContent = '';
});

// ===== CPR TIMER =====
let cprTimer;
document.getElementById('cprStart').addEventListener('click', () => {
  let count = 30;
  const display = document.getElementById('cprCountdown');
  clearInterval(cprTimer);
  display.textContent = count;
  cprTimer = setInterval(() => {
    count--;
    display.textContent = count;
    if (count <= 0) {
      clearInterval(cprTimer);
      display.textContent = 'Give breaths!';
    }
  }, 1000);
});