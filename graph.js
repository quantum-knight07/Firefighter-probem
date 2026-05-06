/**
 * graph.js
 * Graph construction for Halin and Outerplanar graphs.
 * Each node: { x, y, type }
 * Each edge: [i, j]
 */

const W = 680, H = 360;

function buildHalin(n) {
  const nodes = [], edges = [];
  const cx = W / 2, cy = H / 2;
  const innerCount = Math.max(3, Math.floor(n * 0.4));
  const leafCount = Math.max(n - innerCount, innerCount);
  const innerR = 75, outerR = 148;

  // Inner tree nodes (ring)
  for (let i = 0; i < innerCount; i++) {
    const a = (i / innerCount) * Math.PI * 2 - Math.PI / 2;
    nodes.push({ x: cx + Math.cos(a) * innerR, y: cy + Math.sin(a) * innerR, type: 'inner' });
  }

  // Tree edges among inner nodes (star from root 0)
  for (let i = 1; i < innerCount; i++) edges.push([0, i]);
  for (let i = 1; i < innerCount - 1; i++) edges.push([i, i + 1]);

  // Leaf nodes + tree edges + outer cycle
  for (let i = 0; i < leafCount; i++) {
    const a = (i / leafCount) * Math.PI * 2 - Math.PI / 2;
    const parentIdx = i % innerCount;
    nodes.push({ x: cx + Math.cos(a) * outerR, y: cy + Math.sin(a) * outerR, type: 'leaf' });
    const li = innerCount + i;
    edges.push([parentIdx, li]);
  }
  for (let i = 0; i < leafCount; i++) {
    const li = innerCount + i;
    const lj = innerCount + (i + 1) % leafCount;
    edges.push([li, lj]);
  }

  return { nodes, edges };
}

function buildOuter(n) {
  const nodes = [], edges = [];
  const cx = W / 2, cy = H / 2;
  const r = 148;
  const count = Math.max(5, n);

  for (let i = 0; i < count; i++) {
    const a = (i / count) * Math.PI * 2 - Math.PI / 2;
    nodes.push({ x: cx + Math.cos(a) * r, y: cy + Math.sin(a) * r, type: 'outer' });
  }

  // Outer cycle
  for (let i = 0; i < count; i++) edges.push([i, (i + 1) % count]);

  // Internal chords (to make it a non-trivial outerplanar graph)
  const diags = Math.floor(count * 0.45);
  for (let i = 0; i < diags; i++) {
    const a = i;
    const b = (i + Math.floor(count / 3)) % count;
    const exists = edges.some(e => (e[0] === a && e[1] === b) || (e[0] === b && e[1] === a));
    if (!exists && a !== b) edges.push([a, b]);
  }

  return { nodes, edges };
}

function getNeighbors(edges, i) {
  const nb = [];
  for (const [a, b] of edges) {
    if (a === i) nb.push(b);
    if (b === i) nb.push(a);
  }
  return nb;
}
