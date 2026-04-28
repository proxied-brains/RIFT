// ── Panic key (Escape x2 or configurable) ───────────────────────
const PANIC_KEY = localStorage.getItem('void_panic_key') || 'Escape';
let panicCount = 0;
let panicTimer = null;

document.addEventListener('keydown', (e) => {
  if (e.key === PANIC_KEY) {
    panicCount++;
    clearTimeout(panicTimer);
    panicTimer = setTimeout(() => panicCount = 0, 600);
    if (panicCount >= 2) {
      panicAction();
    }
  }
});

function panicAction() {
  const target = localStorage.getItem('void_panic_target') || 'https://classroom.google.com';
  window.location.replace(target);
}

document.addEventListener('DOMContentLoaded', () => {
  const pb = document.getElementById('panic-btn');
  if (pb) pb.addEventListener('click', panicAction);
});

// ── History flood ────────────────────────────────────────────────
const EDU_SITES = [
  'https://classroom.google.com',
  'https://www.ixl.com',
  'https://www.iready.com',
  'https://khanacademy.org',
  'https://quizlet.com',
  'https://www.duolingo.com',
  'https://www.brainpop.com',
  'https://www.scholastic.com',
  'https://pbs.org/kids',
  'https://www.abcya.com',
];

function floodHistory(count = 30) {
  let i = 0;
  const interval = setInterval(() => {
    if (i >= count) { clearInterval(interval); return; }
    const site = EDU_SITES[i % EDU_SITES.length];
    history.pushState({}, '', '#edu-' + i);
    i++;
  }, 30);
}

// ── Disguise modes ───────────────────────────────────────────────
const DISGUISES = {
  none: { title: 'Void', favicon: '' },
  google_classroom: {
    title: 'Google Classroom',
    favicon: 'https://www.google.com/favicon.ico',
    url: 'https://classroom.google.com',
  },
  ixl: {
    title: 'IXL Learning',
    favicon: 'https://www.ixl.com/favicon.ico',
    url: 'https://www.ixl.com',
  },
  iready: {
    title: 'i-Ready',
    favicon: 'https://i-ready.com/favicon.ico',
    url: 'https://i-ready.com',
  },
  khanacademy: {
    title: 'Khan Academy',
    favicon: 'https://www.khanacademy.org/favicon.ico',
    url: 'https://www.khanacademy.org',
  },
  quizlet: {
    title: 'Quizlet',
    favicon: 'https://quizlet.com/favicon.ico',
    url: 'https://quizlet.com',
  },
};

function applyDisguise(mode) {
  const d = DISGUISES[mode] || DISGUISES.none;
  document.title = d.title;
  let link = document.querySelector("link[rel~='icon']");
  if (!link) { link = document.createElement('link'); link.rel = 'icon'; document.head.appendChild(link); }
  if (d.favicon) link.href = d.favicon;
  localStorage.setItem('void_disguise', mode);
}

function loadDisguise() {
  const saved = localStorage.getItem('void_disguise') || 'none';
  applyDisguise(saved);
}

// ── About:blank cloak ────────────────────────────────────────────
function openCloaked(url) {
  const win = window.open('about:blank', '_blank');
  if (!win) { alert('Allow popups for this site to use cloaking'); return; }
  const html = `<!DOCTYPE html>
<html>
<head>
  <title>${document.title}</title>
  <style>body,html{margin:0;padding:0;height:100%;overflow:hidden}iframe{width:100%;height:100%;border:none}</style>
</head>
<body>
  <iframe src="${url}"></iframe>
</body>
</html>`;
  win.document.write(html);
  win.document.close();
}

// ── Stealth level ────────────────────────────────────────────────
function getStealthLevel() {
  let level = 0;
  if (localStorage.getItem('void_disguise') !== 'none') level += 40;
  if (localStorage.getItem('void_panic_key')) level += 20;
  if (localStorage.getItem('void_cloak') === '1') level += 20;
  if (localStorage.getItem('void_flood') === '1') level += 20;
  return Math.min(level, 100);
}

function updateStealthMeter() {
  const fill = document.getElementById('stealth-fill');
  const label = document.getElementById('stealth-label');
  if (!fill) return;
  const level = getStealthLevel();
  fill.style.width = level + '%';
  if (label) label.textContent = level + '%';
}

// ── Nav active state ─────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  loadDisguise();
  const path = window.location.pathname;
  document.querySelectorAll('.nav-link').forEach(link => {
    if (link.getAttribute('href') === path ||
        (path === '/' && link.getAttribute('href') === '/index.html')) {
      link.classList.add('active');
    }
  });
});

// ── Export for pages ─────────────────────────────────────────────
window.VoidUtils = { panicAction, floodHistory, openCloaked, applyDisguise, DISGUISES, updateStealthMeter };
