# Firefighter Problem Simulator

An interactive browser-based simulator for the **Firefighter Problem** on Halin and Outerplanar graphs, with automated optimal containment strategies.

Built as part of the CS Mini Project at **IIT Jammu** (Group 14, 2025).

## Live Demo

Open `index.html` directly in any browser — no server or dependencies needed.

## What is the Firefighter Problem?

A fire breaks out at a vertex of a graph. Each round:
1. Firefighters permanently protect *k* unburned vertices
2. Fire spreads to all unprotected neighbours of burning vertices

The goal is to maximize the fraction of vertices saved (*surviving rate*).

## Proven Results (this project)

| Graph class | Worst-case bound | Asymptotic (n→∞) | Budget |
|---|---|---|---|
| General planar | ρ ≥ 2/21 ≈ 0.095 | — | 3+2/round |
| **Halin graphs** *(novel)* | **ρ ≥ 1/6 ≈ 0.167** | **ρ ≥ 2/3 ≈ 0.667** | 3+2/round |
| Outerplanar graphs | ρ ≥ 1/3 ≈ 0.333 | — | 1+1/round |

The **Halin graph bound is an original contribution** of this project, improving upon the general planar bound of 2/21 from Gordinowicz (2015).

## Algorithm Strategies

### Halin Graphs
- **Fire at leaf node**: Protect 2 cycle-neighbours + tree parent → confines fire to 1 node, saves n−1
- **Fire at internal node**: Protect parent + 2 children → splits graph into subtrees of size ≤ 2n/3

### Outerplanar Graphs
- Uses a 2-vertex separator {u, v} to disconnect the graph into components
- Protecting the separator guarantees at least 1/3 of vertices are saved

## How to Use

1. Clone or download this repository
2. Open `index.html` in a browser
3. Select graph type (Halin / Outerplanar) and adjust node count
4. Click any node to start the fire
5. Use **Step** to advance one round at a time, or **Auto Run** for animation

## File Structure

```
firefighter-simulator/
├── index.html      # Main page and layout
├── style.css       # Styling
├── graph.js        # Graph construction (Halin, Outerplanar)
├── simulator.js    # Core simulation and algorithm logic
└── ui.js           # Canvas rendering and user interaction
```

## Reference

Gordinowicz, P. (2015). *Planar graph is on fire.* Theoretical Computer Science, 593, 160–164.

## Team

Group 14 — Mathematics and Computing, IIT Jammu
- Jay Mangal Pandey (2023UMA0216)
- Sachin Kumar Sah (2023UMA0234)
- Nishchay Chaudhary (2023UMA0226)
- Prince Gupta (2023UMA0229)

Supervisor: Prof. Suman Banerjee
