# 🪐 Exoplanet Odyssey: Super Mario Galaxy × No Man's Sky × Animal Crossing

A complete, interactive low-poly 3D web game blending **spherical gravity planet-hopping** (*Super Mario Galaxy*), **exoplanetary scanning & exploration** (*No Man's Sky*), and a **cozy low-poly visual aesthetic** (*Animal Crossing*).

Built with **Three.js**, **NASA Exoplanet Archive TAP API**, and **Google Gemini API** (`gemini-2.5-flash`).

---

## 🎮 Gameplay Highlights & Features

### 1. Earth Onboarding (Tutorial Stage)
- **Spherical Low-Poly Earth**: Continents, oceans, mountain peaks, polar ice caps, cozy low-poly pine & oak trees, boulders, landing pad, and modular deep core drill rig.
- **Two Low-Poly Chibi Astronauts**:
  - **Student Astronaut**: Controlled by player with full walk cycle, jump pose, swim stroke, and idle animations.
  - **Professor Nova (Teacher NPC)**: Standing near the landing site, actively waving and ready for questions.
- **Atmospheric HUD (Left)**: Real-time gauges for $N_2$ (78.08%), $O_2$ (20.95%), $CO_2$ (0.04%), surface pressure (1.013 bar), and temperature.
- **Interactive Stations**:
  - **Plant Scanning ('E')**: Scans trees with audio chime and opens **Farming Stats** (photosynthesis rating, crop growth potential, oxygen output, thermal tolerance).
  - **Mining Drill ('E')**: Activates drill hum and displays **Soil Stratum Cross-Section with Depth** (topsoil, mantle, basaltic bedrock, iron/silicon/rare-metal yield meters).
  - **Spaceship ('E')**: Board the star-cruiser to warp into the Universe Map.

### 2. Universe Overview Map
- **3D Interactive Galaxy Map**: Starry skybox with central host star cluster and exoplanet nodes arranged in golden-angle spiral orbits.
- **Live NASA TAP API Integration**: Fetches real parameters (`pl_name`, `hostname`, `pl_rade`, `pl_bmasse`, `pl_dens`, `pl_eqt`, `pl_insol`, `pl_orbper`).
- **Interactive Controls**:
  - Orbit, pan, and zoom around the 3D galaxy.
  - Real-time search by exoplanet or star name.
  - Filter pills: *All*, *Habitable / Goldilocks*, *Ocean Worlds ($\rho < 2.0$)*, *Super-Earths*, *Gas Giants*.
  - Exoplanet Inspector HUD with habitability evaluation and "Engage Warp" launch trigger.

### 3. Orbital Approach (Goldilocks Check) & Atmospheric Entry
- **Step 3i (Goldilocks Check)**:
  - 3D cinematic view of chosen exoplanet and host star.
  - Evaluates whether planet is in the conservative habitable zone ($0.5 \le S_{eff} \le 1.5$ Earth equivalents).
- **Step 3ii (Atmospheric Entry)**:
  - Cinematic descent sequence with fiery shockwave glow and camera vibration.
  - Descent Telemetry: Altitude (150 km $\rightarrow$ 0 km), Velocity (28,000 km/h $\rightarrow$ Subsonic), Thermal Shield ($2,200^\circ\text{C}$).
  - Dynamically computed atmospheric breakdown ($N_2$, $O_2$, $CO_2$, $H_2O$, radiation deflection).
  - Cockpit Comms Briefing from Professor Nova via Gemini API.

### 4. Surface Landing, Adaptive Worlds & Gemini AI Teacher
- **Adaptive Terrain Engine (Density $\rho$)**:
  - **Solid Ground Worlds ($\rho \ge 2.0\text{ g/cm}^3$)**: Low-poly solid terrain planet reflecting equilibrium temperature (scorched basalt, desert canyon, lush alien bio-world, cryo glacier). Student walks, jumps with planet-specific gravity ($g = M/R^2$), scans alien flora/crystals, inspects core drilling rig.
  - **Liquid Ocean Worlds ($\rho < 2.0\text{ g/cm}^3$)**: Undulating liquid ocean mesh with real-time wave displacement. The spaceship transforms into a motorized hydrofoil boat! Astronaut swims with buoyant floating physics and water splash effects.
- **Google Gemini AI Teacher NPC (`gemini-2.5-flash`)**:
  - Automatic speech dialogue balloon on touchdown.
  - Sends current planet properties, previous planet visited, and Earth baseline.
  - System prompt: *"You are an encouraging, expert space teacher guiding a student astronaut. Compare the CURRENT planet with the PREVIOUS planet visited and Earth. Focus on gravity, habitability, atmosphere, and farming/mining potential in 3 short, cozy sentences."*
  - Typewriter text effect with procedural Animal Crossing style audio chatter.
  - Interactive Q&A: Click suggestion chips or type custom science questions!

---

## 🕹️ Controls

| Key | Action |
|---|---|
| **W, A, S, D** / Arrows | Move across spherical planet surface |
| **Space** | Jump (Solid ground) / Swim stroke (Liquid worlds) |
| **E** | Interact (Scan flora, inspect drill, board ship, talk to Teacher) |
| **Tab** | Toggle Galaxy Map / Return to surface |
| **Mouse Drag** | Smooth 360° Third-Person Orbit Camera |
| **Esc** | Close open modals |

---

## 🚀 Running the Game

Launch using the bundled Python script:
```bash
python serve.py
```
Or double-click `start.bat`.

Open your browser to:
```
http://127.0.0.1:8080/index.html
```
