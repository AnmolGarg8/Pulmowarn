<p align="center">
  <img src="https://img.shields.io/badge/Three.js-r160-000000?style=for-the-badge&logo=three.js&logoColor=white" />
  <img src="https://img.shields.io/badge/GSAP-3.12-88CE02?style=for-the-badge&logo=greensock&logoColor=white" />
  <img src="https://img.shields.io/badge/Vite-5.x-646CFF?style=for-the-badge&logo=vite&logoColor=white" />
  <img src="https://img.shields.io/badge/Vanilla%20JS-ES2024-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black" />
  <img src="https://img.shields.io/badge/WebGL-GLSL-990000?style=for-the-badge&logo=opengl&logoColor=white" />
</p>

<h1 align="center">
  🫁 PulmoCare — The First Step
</h1>

<p align="center">
  <strong>A cinematic, scroll-driven WebGL narrative</strong> explaining how chronic lung disease deteriorates silently — and how a novel bedside device can catch the earliest warning signs before a medical crisis unfolds.
</p>

<p align="center">
  <a href="#-live-demo">Live Demo</a> •
  <a href="#-the-problem">The Problem</a> •
  <a href="#-technical-architecture">Architecture</a> •
  <a href="#-features">Features</a> •
  <a href="#-getting-started">Getting Started</a> •
  <a href="#-project-structure">Structure</a> •
  <a href="#-author">Author</a>
</p>

---

## 🎯 The Problem

> **300 million people** worldwide live with COPD. Acute exacerbations — sudden, life-threatening episodes of airway obstruction — are the #1 cause of emergency hospitalisation. Yet the earliest sign of deterioration (sputum accumulation) and the most dangerous consequence (CO₂ narcosis) are **completely invisible to every home monitoring device on the market.**

PulmoCare is a concept for the first bedside device that monitors **both the cause and the consequence** — sputum blockage via acoustic sensing and blood CO₂ via transcutaneous measurement — simultaneously, in real time, at home.

This website is the **interactive technical narrative** that explains why it matters.

---

## ✨ Features

### 🎬 Cinematic Scroll Narrative (7 Acts)

| Section | Scroll Range | What Happens |
|---------|-------------|--------------|
| **Hero** | 0 – 130vh | 7,000 particles assemble into anatomically-accurate lung sculpture using SDF geometry. Text fades in. Lung stutters to signal dysfunction. |
| **Pathophysiology** | 130 – 430vh | Procedural bronchial tree renders. Mucus particles accumulate via shader-driven simulation. Real-time CO₂ blood-gas gauge rises to critical. |
| **Monitoring Gap** | 430 – 560vh | Three floating glass cards (custom fragment shaders) compare pulse oximeters, hospital monitors, and sputum tracking — revealing the gap. |
| **Device Reveal** | 560 – 730vh | PulmoCare device spins into view with clearcoat PBR material. 6 annotation callouts track device surface points in real-time. Animated OLED screen cycles through alert states. |
| **Rajan's Story** | 730 – 900vh | Emotional centrepiece. A 3D bedroom scene with a sleeping patient. The device escalates through 6 story beats (2:00 AM → 2:55 AM) as mucus builds, CO₂ rises, and the caregiver is alerted — all before a crisis. |
| **Technical Specs** | 900 – 960vh | Component-level specification grid: MEMS microphone, tcPCO₂ sensor, ARM Cortex-M4, BLE 5.0, OLED display, Li-Po battery. |
| **Closing** | 960 – 1050vh | Full-screen CTA with restored healthy lung particles. |

### 🧠 Technical Highlights

- **Custom GLSL Shaders** — Lung particle assembly, mucus viscosity simulation, glass card materials, and device halo glow are all driven by hand-written vertex and fragment shaders.
- **Dual-Canvas Architecture** — WebGL canvas for 3D rendering + 2D overlay canvas for real-time annotation line drawing with sub-pixel precision.
- **Dynamic Canvas Textures** — The device OLED screen and patient phone notifications are rendered frame-by-frame using the Canvas 2D API and mapped as `CanvasTexture` onto 3D meshes.
- **Procedural Geometry** — Bronchial tree generated algorithmically from branch data. Lung shape defined via signed distance functions (SDFs). Device corners rounded via vertex displacement.
- **Scroll-Synchronised State Machine** — Every 3D object, HTML overlay, light colour, and camera position is driven by GSAP ScrollTrigger with sub-frame interpolation.
- **Post-Processing Pipeline** — UnrealBloomPass with carefully calibrated thresholds (strength: 0.30, threshold: 0.60) to add cinematic glow without over-exposure.

---

## 🏗 Technical Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Browser Viewport                      │
│                                                         │
│  ┌─────────────────────────────────────────────────┐    │
│  │  WebGL Canvas (Three.js r160)           z:1     │    │
│  │  ├── Scene                                      │    │
│  │  │   ├── Lung Particles (7000 pts, SDF)         │    │
│  │  │   ├── Bronchial Tree (procedural cylinders)  │    │
│  │  │   ├── Mucus System (shader particles)        │    │
│  │  │   ├── Blood Flow (animated spheres)          │    │
│  │  │   ├── CO₂ Gauge (ring + needle)              │    │
│  │  │   ├── Glass Cards (3x shader planes)         │    │
│  │  │   ├── Device Group (PBR + OLED canvas)       │    │
│  │  │   └── Story Environment (bedroom scene)      │    │
│  │  ├── Post-Processing                            │    │
│  │  │   └── UnrealBloomPass (0.30 / 0.50 / 0.60)  │    │
│  │  └── Camera (perspective, mouse-parallax)       │    │
│  └─────────────────────────────────────────────────┘    │
│                                                         │
│  ┌─────────────────────────────────────────────────┐    │
│  │  2D Overlay Canvas                      z:5     │    │
│  │  └── Annotation dashed lines (real-time)        │    │
│  └─────────────────────────────────────────────────┘    │
│                                                         │
│  ┌─────────────────────────────────────────────────┐    │
│  │  HTML Root (fixed overlays)             z:10    │    │
│  │  ├── Section text panels                        │    │
│  │  ├── Glass card content                         │    │
│  │  ├── Story beat cards                           │    │
│  │  ├── CO₂ mini-graph (canvas)                    │    │
│  │  ├── Tech spec grid                             │    │
│  │  └── Closing CTA                                │    │
│  └─────────────────────────────────────────────────┘    │
│                                                         │
│  ┌─────────────────────────────────────────────────┐    │
│  │  Scroll Spacer (1100vh)                 z:0     │    │
│  │  └── GSAP ScrollTrigger bindings                │    │
│  └─────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────┘
```

---

## 🛠 Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Build** | Vite 5.x | HMR dev server, ES module bundling |
| **3D Engine** | Three.js r160 | Scene graph, PBR materials, post-processing |
| **Animation** | GSAP 3.12 + ScrollTrigger | Scroll-synchronised timeline orchestration |
| **Shaders** | Custom GLSL (ES 300) | Particle systems, glass materials, glow effects |
| **Typography** | Google Fonts (Syne 700/800, Inter 400/500) | Premium editorial aesthetic |
| **Rendering** | WebGL 2.0 + Canvas 2D API | Dual-layer rendering pipeline |
| **Language** | Vanilla ES2024 JavaScript | Zero framework overhead |

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** ≥ 18.x
- **npm** ≥ 9.x

### Installation

```bash
# Clone the repository
git clone https://github.com/AnmolGarg8/Pulmocare.git
cd Pulmocare

# Install dependencies
npm install

# Start development server
npm run dev
```

The app will be available at `http://localhost:5173`.

### Production Build

```bash
npm run build
npm run preview
```

---

## 📁 Project Structure

```
Pulmocare/
├── index.html          # Entry point — dual canvas + HTML overlays
├── src/
│   ├── main.js         # Core engine — all 3D systems + ScrollTrigger logic
│   └── style.css       # Global styles, z-index layers, typography
├── vite.config.js      # Vite configuration
├── package.json        # Dependencies and scripts
└── README.md           # You are here
```

### Key Systems in `main.js`

| Function | Lines | Description |
|----------|-------|-------------|
| `buildLungParticles()` | ~200 | SDF-based lung geometry with custom vertex/fragment shaders |
| `buildStarField()` | ~40 | Ambient depth particles |
| `buildBronchialTree()` | ~120 | Procedural airway generation |
| `buildMucusSystem()` | ~80 | Shader-driven viscous particle simulation |
| `buildBloodSystem()` | ~60 | Animated blood cell spheres |
| `buildCO2Gauge()` | ~70 | Real-time ring gauge with needle |
| `buildGlassCards()` | ~100 | Custom glass shader with edge glow |
| `buildDevice()` | ~120 | PBR medical device with rounded corners |
| `buildStoryEnvironment()` | ~80 | 3D bedroom scene for patient narrative |
| `updateOLED()` | ~60 | Frame-by-frame OLED screen rendering |
| `updatePhoneScreen()` | ~50 | Caregiver notification canvas |
| `drawCO2Graph()` | ~40 | Real-time trend line graph |

---

## 🎨 Design Philosophy

This project follows an **Apple-inspired cinematic design language**:

- **Dark canvas** (`#060D1A`) with high-contrast teal (`#00D4AA`) accents
- **Scroll-as-storytelling** — every pixel of scroll reveals a new narrative beat
- **3D objects serve the story** — anatomy is not decorative; it teaches
- **Typography hierarchy** — Syne 800 for impact headlines, Inter 400 for body text
- **Restrained bloom** — post-processing enhances without overwhelming (capped at 0.30 strength)
- **Progressive disclosure** — information reveals only when the user is ready for it

---

## 📊 Performance

- **Target**: 60 FPS on mid-range hardware
- **Pixel ratio**: Capped at `2.0` to prevent GPU overload on Retina displays
- **Particle budget**: 7,000 lung + 2,500 star field + 500 mucus = ~10,000 total
- **Draw calls**: Minimised via instanced geometry and shared materials
- **Texture memory**: Canvas textures (OLED, phone) are 512×256 and 200×350 respectively

---

## 🔮 Roadmap

- [ ] Mobile-responsive layout with touch-based scrolling
- [ ] Preloader with animated PulmoCare logo
- [ ] Sound design — ambient heartbeat, alert tones
- [ ] i18n support (Hindi, Spanish)
- [ ] Deploy to Vercel/Netlify with CI/CD

---

## 📝 License

This project is for **educational and portfolio purposes**. The PulmoCare device concept is part of academic research.

---

## 👨‍💻 Author

**Anmol Garg**  
B.Tech AI & Data Science  
Vivekananda Institute of Professional Studies, New Delhi

<p align="center">
  <a href="https://github.com/AnmolGarg8"><img src="https://img.shields.io/badge/GitHub-AnmolGarg8-181717?style=for-the-badge&logo=github" /></a>
</p>

---

<p align="center">
  <em>"Every deterioration has a first step. PulmoCare is designed to find it."</em>
</p>
