/**
 * ui.js
 * Canvas rendering, user interaction, and DOM updates.
 */

const COL = {
  normal: '#4A90D9',
  fire: '#E24B4A',
  protected: '#639922',
  burned: '#C8C6BE',
  origin: '#EF9F27',
  edge: '#D3D1C7',
  edgeActive: '#B4B2A9',
  nodeBorder: 'rgba(0,0,0,0.12)',
  text: '#ffffff'
};

const cvs = document.getElementById('cvs');
const ctx = cvs.getContext('2d');
cvs.width = W; cvs.height = H;

let currentNodes = [], currentEdges = [], currentType = 'halin';
let autoTimer = null;

// ── Build graph ───────────────────────────────────────────────────────────────
function buildGraph() {
  const type = document.getElementById('gtype').value;
  const n = parseInt(document.getElementById('nslider').value);
  currentType = type;
  const { nodes, edges } = type === 'halin' ? buildHalin(n) : buildOuter(n);
  currentNodes = nodes;
  currentEdges = edges;
  SIM.init(nodes, edges);
}

function init() {
  stopAuto();
  buildGraph();
  document.getElementById('stepBtn').disabled = true;
  document.getElementById('autoBtn').disabled = true;
  document.getElementById('log').textContent = 'Graph ready. Click any node to start the fire.';
  updateStats(false);
  draw();
}

// ── Draw ──────────────────────────────────────────────────────────────────────
function draw() {
  ctx.clearRect(0, 0, W, H);
  const state = SIM.getState();
  const origin = SIM.getOrigin();

  // Edges
  for (const [a, b] of currentEdges) {
    const na = currentNodes[a], nb = currentNodes[b];
    const aFire = state[a] === 'fire' || state[b] === 'fire';
    ctx.beginPath();
    ctx.moveTo(na.x, na.y);
    ctx.lineTo(nb.x, nb.y);
    ctx.strokeStyle = aFire ? COL.edgeActive : COL.edge;
    ctx.lineWidth = aFire ? 1.5 : 1;
    ctx.stroke();
  }

  // Nodes
  for (let i = 0; i < currentNodes.length; i++) {
    const { x, y } = currentNodes[i];
    const s = state[i];
    const isOrigin = i === origin;
    const r = isOrigin ? 13 : 11;

    // Glow ring for fire nodes
    if (s === 'fire') {
      ctx.beginPath();
      ctx.arc(x, y, r + 4, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(226,75,74,0.18)';
      ctx.fill();
    }

    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fillStyle = s === 'fire' ? COL.fire
      : s === 'protected' ? COL.protected
      : s === 'burned' ? COL.burned
      : isOrigin ? COL.origin
      : COL.normal;
    ctx.fill();

    // Border
    ctx.strokeStyle = COL.nodeBorder;
    ctx.lineWidth = 1;
    ctx.stroke();

    // Node index label
    ctx.fillStyle = COL.text;
    ctx.font = `bold ${currentNodes.length > 16 ? 9 : 10}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(i, x, y);
  }
}

// ── Step ──────────────────────────────────────────────────────────────────────
function step() {
  const result = currentType === 'halin' ? SIM.stepHalin() : SIM.stepOuter();
  if (!result) return;

  const budget = currentType === 'halin' ? (result.round === 1 ? 3 : 2) : 2;
  if (result.finished) {
    setLog(`Fire contained after ${result.round} rounds! ${result.saved} of ${result.total} nodes saved (${((result.saved/result.total)*100).toFixed(1)}%).`);
    document.getElementById('stepBtn').disabled = true;
    document.getElementById('autoBtn').disabled = true;
    stopAuto();
  } else {
    setLog(`Round ${result.round}: placed ${result.toProtect.length}/${budget} firefighters. Fire spreading to ${result.fireSize} node(s).`);
  }

  updateStats(true);
  draw();
}

// ── Auto ──────────────────────────────────────────────────────────────────────
function autoRun() {
  if (autoTimer) { stopAuto(); return; }
  document.getElementById('autoBtn').textContent = 'Pause';
  autoTimer = setInterval(() => {
    if (SIM.isFinished() || document.getElementById('stepBtn').disabled) {
      stopAuto(); return;
    }
    step();
  }, 800);
}

function stopAuto() {
  clearInterval(autoTimer); autoTimer = null;
  document.getElementById('autoBtn').textContent = 'Auto Run';
}

// ── Stats ─────────────────────────────────────────────────────────────────────
function updateStats(started) {
  const total = SIM.getTotalCount();
  const saved = started ? SIM.getSavedCount() : '—';
  const burned = started ? SIM.getBurnedCount() : '—';
  const round = started ? SIM.getRound() : '—';
  const rate = started && total > 0 ? ((SIM.getSavedCount() / total) * 100).toFixed(1) + '%' : '—';

  document.getElementById('sTotal').textContent = total || '—';
  document.getElementById('sSaved').textContent = saved;
  document.getElementById('sBurned').textContent = burned;
  document.getElementById('sRate').textContent = rate;
  document.getElementById('sRound').textContent = round;
}

function setLog(msg) { document.getElementById('log').textContent = msg; }

// ── Canvas click ──────────────────────────────────────────────────────────────
cvs.addEventListener('click', e => {
  const rect = cvs.getBoundingClientRect();
  const scaleX = W / rect.width, scaleY = H / rect.height;
  const mx = (e.clientX - rect.left) * scaleX;
  const my = (e.clientY - rect.top) * scaleY;

  let closest = -1, minD = Infinity;
  for (let i = 0; i < currentNodes.length; i++) {
    const d = Math.hypot(currentNodes[i].x - mx, currentNodes[i].y - my);
    if (d < minD) { minD = d; closest = i; }
  }

  if (closest >= 0 && minD < 24) {
    stopAuto();
    if (SIM.startFire(closest)) {
      document.getElementById('stepBtn').disabled = false;
      document.getElementById('autoBtn').disabled = false;
      document.getElementById('hint').textContent = '';
      setLog(`Fire ignited at node ${closest}. Round 1 ready — click Step or Auto Run.`);
      updateStats(true);
      draw();
    }
  }
});

// ── Controls ──────────────────────────────────────────────────────────────────
document.getElementById('stepBtn').addEventListener('click', step);
document.getElementById('autoBtn').addEventListener('click', autoRun);
document.getElementById('resetBtn').addEventListener('click', init);
document.getElementById('gtype').addEventListener('change', init);
document.getElementById('nslider').addEventListener('input', e => {
  document.getElementById('nval').textContent = e.target.value;
  init();
});

// Populate select
const gtypeEl = document.getElementById('gtype');
[['halin', 'Halin graph'], ['outer', 'Outerplanar graph']].forEach(([v, l]) => {
  const o = document.createElement('option'); o.value = v; o.textContent = l; gtypeEl.appendChild(o);
});

// Tab switching
document.querySelectorAll('.tab').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.tab').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(c => c.classList.add('hidden'));
    btn.classList.add('active');
    document.getElementById('tab-' + btn.dataset.tab).classList.remove('hidden');
  });
});

// Init on load
init();
