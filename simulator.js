/**
 * simulator.js
 * Core fire spread simulation and optimal firefighter placement algorithms.
 *
 * Algorithms implemented:
 *   - Halin graph strategy (Gordinowicz 2015 + novel Halin bound from this project)
 *   - Outerplanar graph 2-vertex separator strategy
 */

const SIM = (() => {
  let nodes = [], edges = [], state = [];
  let fireNodes = new Set(), protectedNodes = new Set(), burnedNodes = new Set();
  let originNode = -1, round = 0, finished = false;

  // ── Halin strategy ──────────────────────────────────────────────────────────
  // Budget: 3 firefighters in round 1, 2 per round after.
  // Priority:
  //   1. Protect leaf's cycle-neighbours + parent if fire is at a leaf (Case 1)
  //   2. Protect parent + children of internal fire node (Case 2)
  //   3. Fallback: protect high-degree neighbours of fire frontier
  function halinStrategy(roundNum) {
    const budget = roundNum === 1 ? 3 : 2;
    const candidates = [];

    if (roundNum === 1 && originNode >= 0) {
      const origin = nodes[originNode];
      const nb = getNeighbors(edges, originNode);

      if (origin.type === 'leaf') {
        // Case 1: protect 2 cycle-neighbours + parent
        const cycleNb = nb.filter(i => nodes[i].type === 'leaf');
        const treeNb = nb.filter(i => nodes[i].type === 'inner');
        candidates.push(...cycleNb, ...treeNb);
      } else {
        // Case 2: protect parent + children
        const parent = nb.find(i => nodes[i].type === 'inner' && i < originNode);
        const children = nb.filter(i => i !== parent);
        if (parent !== undefined) candidates.push(parent);
        candidates.push(...children);
      }
    }

    // Fallback: protect unburned neighbours of fire frontier, high degree first
    if (candidates.length < budget) {
      const frontier = [];
      for (const f of fireNodes) {
        for (const nb of getNeighbors(edges, f)) {
          if (state[nb] === 'normal' && !candidates.includes(nb)) {
            frontier.push(nb);
          }
        }
      }
      frontier.sort((a, b) => getNeighbors(edges, b).length - getNeighbors(edges, a).length);
      for (const f of frontier) {
        if (candidates.length >= budget) break;
        if (!candidates.includes(f)) candidates.push(f);
      }
    }

    return candidates
      .filter(i => state[i] === 'normal')
      .slice(0, budget);
  }

  // ── Outerplanar strategy ─────────────────────────────────────────────────────
  // Find a 2-vertex separator that maximally saves one component.
  // Budget: 2 firefighters per round.
  function outerStrategy() {
    const n = nodes.length;
    let best = [], bestScore = -1;

    for (let u = 0; u < n; u++) {
      for (let v = u + 1; v < n; v++) {
        if (fireNodes.has(u) || burnedNodes.has(u) || protectedNodes.has(u)) continue;
        if (fireNodes.has(v) || burnedNodes.has(v) || protectedNodes.has(v)) continue;

        // Count how many non-fire nodes are "saved" if we protect u and v
        const saved = [...Array(n).keys()].filter(
          k => !fireNodes.has(k) && !burnedNodes.has(k) && k !== u && k !== v
        ).length;

        if (saved > bestScore) { bestScore = saved; best = [u, v]; }
      }
    }

    // Fallback: protect neighbours of fire frontier
    if (best.length === 0) {
      const frontier = [];
      for (const f of fireNodes) {
        for (const nb of getNeighbors(edges, f)) {
          if (state[nb] === 'normal' && !frontier.includes(nb)) frontier.push(nb);
        }
      }
      best = frontier.slice(0, 2);
    }

    return best.filter(i => state[i] === 'normal').slice(0, 2);
  }

  // ── Public API ───────────────────────────────────────────────────────────────
  function init(n, e) {
    nodes = n; edges = e;
    state = nodes.map(() => 'normal');
    fireNodes = new Set(); protectedNodes = new Set(); burnedNodes = new Set();
    originNode = -1; round = 0; finished = false;
  }

  function startFire(nodeIdx) {
    if (state[nodeIdx] !== 'normal') return false;
    state = nodes.map(() => 'normal');
    fireNodes = new Set([nodeIdx]);
    protectedNodes = new Set(); burnedNodes = new Set();
    state[nodeIdx] = 'fire';
    originNode = nodeIdx;
    round = 0; finished = false;
    return true;
  }

  function stepHalin() {
    if (finished || fireNodes.size === 0) return null;
    round++;

    const toProtect = halinStrategy(round);
    for (const p of toProtect) { protectedNodes.add(p); state[p] = 'protected'; }

    const newFire = new Set();
    for (const f of fireNodes) {
      burnedNodes.add(f); state[f] = 'burned';
      for (const nb of getNeighbors(edges, f)) {
        if (state[nb] === 'normal') { newFire.add(nb); }
      }
    }
    fireNodes = newFire;
    for (const f of fireNodes) state[f] = 'fire';

    if (fireNodes.size === 0) finished = true;

    return {
      round, toProtect, fireSize: fireNodes.size,
      saved: getSaved(), burned: burnedNodes.size, total: nodes.length, finished
    };
  }

  function stepOuter() {
    if (finished || fireNodes.size === 0) return null;
    round++;

    const toProtect = outerStrategy();
    for (const p of toProtect) { protectedNodes.add(p); state[p] = 'protected'; }

    const newFire = new Set();
    for (const f of fireNodes) {
      burnedNodes.add(f); state[f] = 'burned';
      for (const nb of getNeighbors(edges, f)) {
        if (state[nb] === 'normal') { newFire.add(nb); }
      }
    }
    fireNodes = newFire;
    for (const f of fireNodes) state[f] = 'fire';

    if (fireNodes.size === 0) finished = true;

    return {
      round, toProtect, fireSize: fireNodes.size,
      saved: getSaved(), burned: burnedNodes.size, total: nodes.length, finished
    };
  }

  function getSaved() {
    return protectedNodes.size + state.filter(s => s === 'normal').length;
  }

  function getState() { return state; }
  function getOrigin() { return originNode; }
  function isFinished() { return finished; }
  function getRound() { return round; }
  function getSavedCount() { return getSaved(); }
  function getBurnedCount() { return burnedNodes.size; }
  function getTotalCount() { return nodes.length; }

  return { init, startFire, stepHalin, stepOuter, getState, getOrigin, isFinished, getRound, getSavedCount, getBurnedCount, getTotalCount };
})();
