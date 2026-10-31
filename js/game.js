// game.js - Master Game Controller, Game States, UI Synchronization, and Lifecycle Management
import * as THREE from 'three';
import { SphericalPhysicsEngine } from './physics.js?v=2.5';
import { PlanetGenerator } from './planetGenerator.js?v=2.5';
import { CharacterModelBuilder } from './characterModels.js?v=2.5';
import { UniverseMap } from './universeMap.js?v=2.5';
import { NasaService, EARTH_DATA, calculateInterstellarDistance } from './nasaService.js?v=2.5';
import { GeminiService } from './geminiService.js?v=2.5';
import { AudioService } from './audioService.js?v=2.5';

export const GAME_STATE = {
  EARTH_TUTORIAL: 'EARTH_TUTORIAL',
  BOARDING_SPACESHIP: 'BOARDING_SPACESHIP',
  LAUNCHING_SPACESHIP: 'LAUNCHING_SPACESHIP',
  UNIVERSE_MAP: 'UNIVERSE_MAP',
  ORBITAL_APPROACH: 'ORBITAL_APPROACH',
  ATMOSPHERIC_ENTRY: 'ATMOSPHERIC_ENTRY',
  SURFACE_EXPLORATION: 'SURFACE_EXPLORATION'
};

export class Game {
  constructor() {
    this.currentState = GAME_STATE.EARTH_TUTORIAL;
    this.prevPlanet = null; // Prior visited planet
    this.currentPlanetData = null; // NASA data of current world
    this.hasHadFirstBriefingOnPlanet = {}; // Track first-time briefings per world
    this.cachedDashboardResult = {}; // Cache planetary comparison dashboards per world

    // Services
    this.nasaService = new NasaService();
    this.geminiService = new GeminiService();
    this.audioService = new AudioService();
    this.physics = new SphericalPhysicsEngine();

    // Input state
    this.input = { x: 0, y: 0, jump: false, interact: false };
    this.keys = {};

    // Three.js Core
    this.clock = new THREE.Clock();
    this.initThree();

    // Scene & Entities
    this.activePlanetGroup = null;
    this.earthGroup = null;
    this.exoplanetGroup = null;
    this.playerAstronaut = null;
    this.descentShip = null;

    // Interactive Proximity
    this.activeInteractable = null;

    // Universe Map
    this.universeMap = new UniverseMap(this.scene, this.camera, this.renderer);

    // Cinematic Timers
    this.cinematicTime = 0;
    this.entryTelemetry = { altitude: 150, speed: 28000, heat: 2200 };

    this.initEventListeners();
    this.initUI();
    this.setupWorld();

    // Start loop
    this.animate = this.animate.bind(this);
    requestAnimationFrame(this.animate);
  }

  initThree() {
    this.container = document.getElementById('canvas-container');
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x060814); // Deep cosmic void

    this.camera = new THREE.PerspectiveCamera(55, window.innerWidth / window.innerHeight, 0.1, 1500);
    this.camera.position.set(0, 30, 45);

    this.renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.15;
    this.container.appendChild(this.renderer.domElement);

    // Warm Sun Directional Light + Soft Ambient / Sky Lights
    this.sunLight = new THREE.DirectionalLight(0xfffaed, 2.2);
    this.sunLight.position.set(60, 80, 50);
    this.sunLight.castShadow = true;
    this.sunLight.shadow.mapSize.width = 2048;
    this.sunLight.shadow.mapSize.height = 2048;
    this.sunLight.shadow.camera.near = 10;
    this.sunLight.shadow.camera.far = 250;
    this.sunLight.shadow.camera.left = -40;
    this.sunLight.shadow.camera.right = 40;
    this.sunLight.shadow.camera.top = 40;
    this.sunLight.shadow.camera.bottom = -40;
    this.sunLight.shadow.bias = -0.0005;
    this.scene.add(this.sunLight);

    this.ambientLight = new THREE.AmbientLight(0xffffff, 1.25);
    this.scene.add(this.ambientLight);

    this.hemiLight = new THREE.HemisphereLight(0xfff8ee, 0x4a5d6e, 0.85);
    this.scene.add(this.hemiLight);

    // Distant cosmic background stars
    this.buildCosmicSkybox();
  }

  buildCosmicSkybox() {
    const starCount = 2400;
    const geo = new THREE.BufferGeometry();
    const pos = new Float32Array(starCount * 3);
    const col = new Float32Array(starCount * 3);

    for (let i = 0; i < starCount; i++) {
      const r = 400 + Math.random() * 400;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(Math.random() * 2 - 1);

      pos[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      pos[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      pos[i * 3 + 2] = r * Math.cos(phi);

      const c = Math.random() > 0.3 ? new THREE.Color(0xffffff) : new THREE.Color(0xa2d2ff);
      col[i * 3] = c.r;
      col[i * 3 + 1] = c.g;
      col[i * 3 + 2] = c.b;
    }
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(col, 3));

    const mat = new THREE.PointsMaterial({
      size: 1.6,
      vertexColors: true,
      transparent: true,
      opacity: 0.9
    });
    this.skyboxPoints = new THREE.Points(geo, mat);
    this.scene.add(this.skyboxPoints);
  }

  setupWorld() {
    // 1. Build Earth Tutorial Stage
    this.earthGroup = PlanetGenerator.buildEarthPlanet();
    this.scene.add(this.earthGroup);
    this.activePlanetGroup = this.earthGroup;

    // 2. Spawn Student Astronaut Player (Cadet Tom)
    this.playerAstronaut = CharacterModelBuilder.createAstronaut(false);
    this.playerAstronaut.name = 'Tom';
    this.playerAstronaut.position.copy(this.earthGroup.userData.spawnPosition);
    this.scene.add(this.playerAstronaut);
    this.isPlayerWaving = true;

    // Initial orientation: Tom spawns far away from Professor Spike & spaceship, facing camera & waving
    const up = this.playerAstronaut.position.clone().normalize();
    this.physics.resetState(this.playerAstronaut.position, this.earthGroup.userData.radius);
    this.physics.camDistance = 5.2;
    this.physics.camHeight = 1.6;
    this.physics.camPitch = 0.12;

    // Vector towards distant base camp
    const campDir = new THREE.Vector3(
      Math.cos(27 * Math.PI / 180) * Math.sin(-20 * Math.PI / 180),
      Math.sin(27 * Math.PI / 180),
      Math.cos(27 * Math.PI / 180) * Math.cos(-20 * Math.PI / 180)
    ).normalize();
    const toCamp = campDir.clone().sub(up.clone().multiplyScalar(campDir.dot(up))).normalize();
    const awayFromCamp = toCamp.clone().negate().normalize();

    // Camera looks along awayFromCamp (looking at Tom and out towards open horizon)
    this.physics.camForward.copy(awayFromCamp);

    // Tom looks directly towards the camera (which is -camForward)
    const toCamera = this.physics.camForward.clone().negate().normalize();
    this.physics.characterFacing.copy(toCamera);
    const facingRight = new THREE.Vector3().crossVectors(up, toCamera).normalize();
    const pMat = new THREE.Matrix4().makeBasis(facingRight, up, toCamera);
    this.playerAstronaut.quaternion.setFromRotationMatrix(pMat);

    // Position camera immediately facing Tom
    this.physics.updateCamera(this.camera, this.playerAstronaut, up, 1.0);

    // 3. Build Re-Entry Descent Spaceship for cinematic sequence
    this.descentShip = CharacterModelBuilder.createSpaceship();
    this.descentShip.visible = false;
    this.scene.add(this.descentShip);

    // 3b. Build Boarding Tractor Beam Visual Effect
    const beamGeo = new THREE.CylinderGeometry(0.7, 1.5, 5.0, 16, 1, true);
    const beamMat = new THREE.MeshBasicMaterial({
      color: 0x00f5d4,
      transparent: true,
      opacity: 0,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending
    });
    this.boardingBeam = new THREE.Mesh(beamGeo, beamMat);
    this.boardingBeam.visible = false;
    this.scene.add(this.boardingBeam);

    // 4. Load Exoplanets for Map
    this.loadExoplanetData();

    // 5. Update HUD for Earth Onboarding
    this.updateAtmosphereHUD(this.earthGroup.userData.atmosphereDetails, 'Earth (Home Base)');
    this.showProximityPrompt('Welcome Cadet Tom! Explore Earth, scan wild trees, or head toward base camp to meet Professor Spike.');
  }

  async loadExoplanetData() {
    const result = await this.nasaService.fetchExoplanets(60);
    this.universeMap.populateNodes(result.planets, planet => {
      if (this.currentState === GAME_STATE.UNIVERSE_MAP) {
        this.displayPlanetInspector(planet);
      }
    });
    document.getElementById('planet-inspector-modal')?.classList.add('hidden');

    // Populate search / roster pills in UI
    this.populatePlanetRoster(result.planets, result.isLive);
  }

  initEventListeners() {
    window.addEventListener('resize', () => {
      this.camera.aspect = window.innerWidth / window.innerHeight;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(window.innerWidth, window.innerHeight);
    });

    window.addEventListener('keydown', e => {
      this.audioService.ensureContext();

      // Guard: do not trigger hotkeys if user is actively typing in an input or textarea
      if (e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA')) {
        if (e.code === 'Escape') {
          e.target.blur();
        }
        return;
      }

      this.keys[e.code] = true;

      if (e.code === 'KeyE') {
        this.triggerInteraction();
      }
      if (e.code === 'KeyT') {
        this.toggleVehicleTransformation();
      }
      if (e.code === 'Tab') {
        e.preventDefault();
        this.toggleGalaxyMap();
      }
      if (this.currentState === GAME_STATE.UNIVERSE_MAP) {
        if (e.code === 'BracketLeft') {
          e.preventDefault();
          this.toggleLeftMenuCollapse();
        } else if (e.code === 'BracketRight') {
          e.preventDefault();
          this.toggleRightMenuCollapse();
        }
      }
      if (e.code === 'Escape') {
        // Hierarchical escape closing: inspect modal -> sub-modals -> galaxy map
        if (!document.getElementById('planet-inspector-modal')?.classList.contains('hidden')) {
          document.getElementById('planet-inspector-modal')?.classList.add('hidden');
        } else if (!document.getElementById('api-key-modal')?.classList.contains('hidden')) {
          document.getElementById('api-key-modal')?.classList.add('hidden');
        } else if (!document.getElementById('teacher-dialogue-modal')?.classList.contains('hidden')) {
          document.getElementById('teacher-dialogue-modal')?.classList.add('hidden');
        } else if (!document.getElementById('farming-stats-modal')?.classList.contains('hidden')) {
          document.getElementById('farming-stats-modal')?.classList.add('hidden');
        } else if (!document.getElementById('soil-cross-section-modal')?.classList.contains('hidden')) {
          document.getElementById('soil-cross-section-modal')?.classList.add('hidden');
        } else if (this.currentState === GAME_STATE.UNIVERSE_MAP) {
          this.closeGalaxyMap();
        } else if (this.currentState === GAME_STATE.ORBITAL_APPROACH) {
          this.openGalaxyMap();
        }
      }
    });

    window.addEventListener('keyup', e => {
      this.keys[e.code] = false;
    });

    // Mouse drag for camera orbit & Map interaction
    let isMouseDown = false;
    let lastX = 0, lastY = 0;

    window.addEventListener('mousedown', e => {
      // Guard all interactive UI panels from stealing camera orbit controls
      if (e.target.closest('button, input, #planet-roster-list, .modal-card, #teacher-dialogue-modal, #api-key-modal, #atmospheric-entry-hud, #orbital-goldilocks-hud, #planet-inspector-modal, #galaxy-map-overlay, #distance-caliper-banner, .modal-close-btn')) return;
      isMouseDown = true;
      lastX = e.clientX;
      lastY = e.clientY;

      if (this.currentState === GAME_STATE.UNIVERSE_MAP) {
        this.universeMap.onMouseDown(e);
      }
    });

    window.addEventListener('mousemove', e => {
      if (!isMouseDown) return;
      const dx = e.clientX - lastX;
      const dy = e.clientY - lastY;
      lastX = e.clientX;
      lastY = e.clientY;

      if (this.currentState === GAME_STATE.UNIVERSE_MAP) {
        this.universeMap.onMouseMove(e);
      } else if (this.currentState === GAME_STATE.ORBITAL_APPROACH) {
        this.orbitalYaw = (this.orbitalYaw || 0) - dx * 0.0035;
        this.orbitalPitch = Math.max(-0.4, Math.min(0.8, (this.orbitalPitch !== undefined ? this.orbitalPitch : 0.22) + dy * 0.0035));
      } else {
        this.physics.applyOrbitDelta(dx, dy);
      }
    });

    window.addEventListener('mouseup', e => {
      isMouseDown = false;
      if (this.currentState === GAME_STATE.UNIVERSE_MAP) {
        this.universeMap.onMouseUp();
        // Also check click selection if tiny movement
        this.universeMap.handleClick(e.clientX, e.clientY);
      }
    });

    // Prevent context menu on right click so right-drag camera control is seamless
    window.addEventListener('contextmenu', e => {
      if (!e.target.closest('input, textarea')) e.preventDefault();
    });

    window.addEventListener('wheel', e => {
      if (this.currentState === GAME_STATE.UNIVERSE_MAP) {
        this.universeMap.onWheel(e);
      } else if (this.currentState === GAME_STATE.EARTH_TUTORIAL || this.currentState === GAME_STATE.SURFACE_EXPLORATION) {
        this.physics.applyZoom(e.deltaY);
      }
    }, { passive: false });
  }

  initUI() {
    // API Key setting button & modal
    const apiKeyBtn = document.getElementById('api-key-toggle-btn');
    const apiKeyModal = document.getElementById('api-key-modal');
    const saveKeyBtn = document.getElementById('save-api-key-btn');
    const apiKeyInput = document.getElementById('gemini-api-key-input');
    const apiStatusBadge = document.getElementById('gemini-status-badge');

    if (this.geminiService.hasApiKey()) {
      apiKeyInput.value = this.geminiService.apiKey;
      apiStatusBadge.textContent = 'Featherless Active';
      apiStatusBadge.classList.add('active');
    }

    apiKeyBtn?.addEventListener('click', () => {
      this.audioService.playUIChime(true);
      apiKeyModal.classList.toggle('hidden');
    });

    saveKeyBtn?.addEventListener('click', () => {
      const val = apiKeyInput.value.trim();
      this.geminiService.setApiKey(val);
      if (val) {
        apiStatusBadge.textContent = 'Featherless Active';
        apiStatusBadge.classList.add('active');
      } else {
        apiStatusBadge.textContent = 'Teacher (Offline)';
        apiStatusBadge.classList.remove('active');
      }
      apiKeyModal.classList.add('hidden');
      this.audioService.playUIChime(true);
    });

    // Audio mute button
    const audioToggleBtn = document.getElementById('audio-toggle-btn');
    audioToggleBtn?.addEventListener('click', () => {
      this.audioService.ensureContext();
      const isMuted = this.audioService.toggleMute();
      audioToggleBtn.textContent = isMuted ? '🔇 Audio Muted' : '🔊 Sound FX';
      audioToggleBtn.classList.toggle('muted', isMuted);
    });

    // Close buttons on all modals & floating panels (precision targeted)
    document.querySelectorAll('.modal-close-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.audioService.playUIChime(false);

        // Target the specific enclosing container
        const modal = btn.closest('.modal-overlay, #planet-inspector-modal, #galaxy-map-overlay, #orbital-goldilocks-hud, #teacher-dialogue-modal, #api-key-modal');
        if (modal) {
          if (modal.id === 'galaxy-map-overlay') {
            this.closeGalaxyMap();
          } else if (modal.id === 'orbital-goldilocks-hud') {
            modal.classList.add('hidden');
            this.openGalaxyMap();
          } else {
            modal.classList.add('hidden');
          }
        } else {
          this.closeAllModals();
        }
      });
    });

    // Collapsible Planet Map Left & Right Menus (Header buttons & Dock tabs)
    const inspectorCollapseHandler = (e) => {
      e.preventDefault();
      e.stopPropagation();
      this.toggleLeftMenuCollapse();
    };
    document.getElementById('collapse-inspector-btn')?.addEventListener('click', inspectorCollapseHandler);
    document.getElementById('dock-tab-inspector')?.addEventListener('click', inspectorCollapseHandler);

    const galaxyMapCollapseHandler = (e) => {
      e.preventDefault();
      e.stopPropagation();
      this.toggleRightMenuCollapse();
    };
    document.getElementById('collapse-galaxy-map-btn')?.addEventListener('click', galaxyMapCollapseHandler);
    document.getElementById('dock-tab-galaxy-map')?.addEventListener('click', galaxyMapCollapseHandler);

    // Backdrop click for full-screen modal overlays (e.g. plant scan, soil cross-section)
    document.querySelectorAll('.modal-overlay').forEach(overlay => {
      overlay.addEventListener('click', (e) => {
        if (e.target === overlay) {
          e.stopPropagation();
          overlay.classList.add('hidden');
          this.audioService.playUIChime(false);
        }
      });
    });

    // Universe Map Launch button
    const warpBtn = document.getElementById('engage-warp-btn');
    warpBtn?.addEventListener('click', () => {
      if (this.universeMap.selectedPlanet) {
        this.audioService.playUIChime(true);
        this.initiateOrbitalApproach(this.universeMap.selectedPlanet);
      }
    });

    // Descent start button from Goldilocks check
    const startDescentBtn = document.getElementById('start-descent-btn');
    startDescentBtn?.addEventListener('click', () => {
      this.audioService.playUIChime(true);
      this.initiateAtmosphericEntry();
    });

    // Proximity Prompt Click Handler (Supports mouse click on [E] or [T] pill)
    const interactionPrompt = document.getElementById('interaction-prompt');
    interactionPrompt?.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      const transformBtn = e.target.closest('#prompt-transform-btn');
      if (transformBtn) {
        this.toggleVehicleTransformation();
      } else {
        this.triggerInteraction();
      }
    });

    // Teacher dialogue quick questions & dashboard reopen
    document.querySelectorAll('.teacher-quick-ask').forEach(btn => {
      btn.addEventListener('click', e => {
        e.preventDefault();
        e.stopPropagation();
        if (btn.id === 'show-comparison-dashboard-btn') {
          this.displayComparisonDashboard();
          return;
        }
        const question = btn.getAttribute('data-question') || btn.textContent.trim();
        this.handleTeacherQuestion(question);
      });
    });

    const askInput = document.getElementById('teacher-custom-question');
    const sendAskBtn = document.getElementById('send-teacher-question');
    sendAskBtn?.addEventListener('click', () => {
      const q = askInput.value.trim();
      if (q) {
        this.handleTeacherQuestion(q);
        askInput.value = '';
      }
    });

    askInput?.addEventListener('keydown', e => {
      if (e.key === 'Enter') {
        const q = askInput.value.trim();
        if (q) {
          this.handleTeacherQuestion(q);
          askInput.value = '';
        }
      }
    });

    // Map Search & Filter Event Handlers
    this.activeRosterFilter = 'all';
    this.activeSearchQuery = '';

    const searchInput = document.getElementById('map-search-input');
    searchInput?.addEventListener('input', e => {
      this.activeSearchQuery = e.target.value.toLowerCase().trim();
      this.applyRosterFilter();
    });

    document.querySelectorAll('.filter-pill').forEach(pill => {
      pill.addEventListener('click', e => {
        document.querySelectorAll('.filter-pill').forEach(p => p.classList.remove('active'));
        pill.classList.add('active');
        this.activeRosterFilter = pill.getAttribute('data-filter') || 'all';
        this.applyRosterFilter();
      });
    });
  }

  applyRosterFilter() {
    const filter = this.activeRosterFilter || 'all';
    const query = this.activeSearchQuery || '';
    const cards = document.querySelectorAll('.roster-card');
    let visibleCount = 0;
    const totalCount = cards.length;

    cards.forEach(card => {
      const name = (card.getAttribute('data-name') || '').toLowerCase();
      const host = (card.getAttribute('data-host') || '').toLowerCase();
      const type = card.getAttribute('data-type') || '';
      const isGoldilocks = card.getAttribute('data-goldilocks') === 'true';
      const isLiquid = card.getAttribute('data-liquid') === 'true';
      const isLava = card.getAttribute('data-lava') === 'true';
      const isNearby = card.getAttribute('data-nearby') === 'true';
      const isEarth = card.getAttribute('data-name') === 'Earth';

      // Category filter check
      let matchesCategory = true;
      if (filter === 'goldilocks') {
        matchesCategory = isGoldilocks;
      } else if (filter === 'super-earth') {
        matchesCategory = type === 'Super-Earth';
      } else if (filter === 'liquid') {
        matchesCategory = isLiquid;
      } else if (filter === 'lava') {
        matchesCategory = isLava;
      } else if (filter === 'gas-giant') {
        matchesCategory = type === 'Gas Giant';
      } else if (filter === 'nearby') {
        matchesCategory = isNearby || isEarth;
      }

      // Search query check
      let matchesSearch = true;
      if (query) {
        matchesSearch = name.includes(query) || host.includes(query) || type.toLowerCase().includes(query);
      }

      const isVisible = matchesCategory && matchesSearch;
      card.style.display = isVisible ? 'flex' : 'none';
      if (isVisible) visibleCount++;
    });

    // Update roster counter readout
    const counterEl = document.getElementById('roster-counter');
    if (counterEl) {
      counterEl.textContent = `Showing ${visibleCount} of ${totalCount} worlds`;
    }

    // Handle empty state
    const list = document.getElementById('planet-roster-list');
    let emptyEl = document.getElementById('roster-empty-state');
    if (visibleCount === 0) {
      if (!emptyEl && list) {
        emptyEl = document.createElement('div');
        emptyEl.id = 'roster-empty-state';
        emptyEl.className = 'roster-empty-state';
        emptyEl.innerHTML = `
          <span>No matching exoplanets found for your search.</span>
          <button class="roster-reset-btn" id="roster-reset-btn">Reset Filters</button>
        `;
        list.appendChild(emptyEl);
        document.getElementById('roster-reset-btn')?.addEventListener('click', () => {
          this.activeRosterFilter = 'all';
          this.activeSearchQuery = '';
          const input = document.getElementById('map-search-input');
          if (input) input.value = '';
          document.querySelectorAll('.filter-pill').forEach(p => {
            p.classList.toggle('active', p.getAttribute('data-filter') === 'all');
          });
          this.applyRosterFilter();
        });
      }
    } else if (emptyEl) {
      emptyEl.remove();
    }

    // Synchronize 3D starfield map visibility so scene is clean and focused
    if (this.universeMap && typeof this.universeMap.filterNodes === 'function') {
      this.universeMap.filterNodes(filter, query);
    }
  }

  filterRoster(filter) {
    this.activeRosterFilter = filter;
    this.applyRosterFilter();
  }

  populatePlanetRoster(planets, isLive) {
    const list = document.getElementById('planet-roster-list');
    if (!list) return;
    list.innerHTML = '';

    const sourceBadge = document.getElementById('nasa-source-badge');
    if (sourceBadge) {
      sourceBadge.textContent = isLive ? 'NASA TAP Live Sync' : 'NASA Archive (Cached)';
      sourceBadge.classList.toggle('live', isLive);
    }

    const countBadge = document.getElementById('map-worlds-count');
    if (countBadge) {
      countBadge.textContent = `${planets.length + 1} Verified Worlds (NASA Archive)`;
    }

    // Always include Earth at the top of the roster as a selectable destination
    const earthCard = document.createElement('div');
    earthCard.className = 'roster-card goldilocks earth-card';
    earthCard.setAttribute('data-name', 'Earth');
    earthCard.setAttribute('data-host', 'Sun (Sol)');
    earthCard.setAttribute('data-goldilocks', 'true');
    earthCard.setAttribute('data-liquid', 'false');
    earthCard.setAttribute('data-lava', 'false');
    earthCard.setAttribute('data-nearby', 'true');
    earthCard.setAttribute('data-type', 'Terrestrial');
    earthCard.innerHTML = `
      <div class="roster-card-header">
        <span class="roster-name">🌍 Earth (Starting Base / Homeworld)</span>
        <div class="roster-badges-wrap">
          <span class="goldilocks-badge">Homeworld</span>
          <span class="nearby-badge">Origin</span>
        </div>
      </div>
      <div class="roster-meta">
        <span>Host: Sun (Sol)</span> •
        <span>1.00 R⊕</span> •
        <span>1.00g</span> •
        <span>288 K</span> •
        <span>0.0 LY</span>
      </div>
    `;
    earthCard.addEventListener('click', () => {
      this.audioService.playUIChime(true);
      if (this.universeMap.earthNode) {
        this.universeMap.selectPlanet(this.universeMap.earthNode);
      }
      document.querySelectorAll('.roster-card').forEach(c => c.classList.remove('selected'));
      earthCard.classList.add('selected');
    });
    list.appendChild(earthCard);

    planets.forEach(p => {
      const card = document.createElement('div');
      card.className = `roster-card ${p.isGoldilocks ? 'goldilocks' : ''}`;
      card.setAttribute('data-name', p.pl_name);
      card.setAttribute('data-host', p.hostname || '');
      card.setAttribute('data-goldilocks', p.isGoldilocks ? 'true' : 'false');
      card.setAttribute('data-liquid', p.isLiquidWorld ? 'true' : 'false');
      card.setAttribute('data-lava', p.isLavaWorld ? 'true' : 'false');
      card.setAttribute('data-nearby', p.isNearby ? 'true' : 'false');
      card.setAttribute('data-type', p.planetType);

      // Build badges
      let badgesHtml = '';
      if (p.isGoldilocks) {
        badgesHtml += '<span class="goldilocks-badge">Habitable</span>';
      }
      if (p.planetType === 'Super-Earth') {
        badgesHtml += '<span class="super-earth-badge">Super-Earth</span>';
      }
      if (p.isLiquidWorld) {
        badgesHtml += '<span class="liquid-badge">Ocean World</span>';
      }
      if (p.isLavaWorld) {
        badgesHtml += '<span class="lava-badge">Lava World</span>';
      }
      if (p.planetType === 'Gas Giant') {
        badgesHtml += '<span class="gas-badge">Gas Giant</span>';
      }
      if (p.isNearby) {
        badgesHtml += '<span class="nearby-badge">&lt;50 LY</span>';
      }

      card.innerHTML = `
        <div class="roster-card-header">
          <span class="roster-name">${p.pl_name}</span>
          <div class="roster-badges-wrap">${badgesHtml}</div>
        </div>
        <div class="roster-meta">
          <span>Host: ${p.hostname}</span> •
          <span>${p.pl_rade} R⊕</span> •
          <span>${p.surfaceGravity}g</span> •
          <span>${p.pl_eqt} K</span> •
          <span>${p.dist_ly} LY</span>
        </div>
      `;

      card.addEventListener('click', () => {
        this.audioService.playUIChime(true);
        this.universeMap.selectPlanetByName(p.pl_name);
        document.querySelectorAll('.roster-card').forEach(c => c.classList.remove('selected'));
        card.classList.add('selected');
      });

      list.appendChild(card);
    });

    this.applyRosterFilter();
  }

  displayPlanetInspector(planet) {
    const modal = document.getElementById('planet-inspector-modal');
    if (!planet || !modal) return;
    modal.classList.remove('hidden');
    modal.classList.remove('collapsed');
    this.updateCollapseUI();

    const departure = this.currentPlanetData || EARTH_DATA;
    const isFromEarth = departure.pl_name === 'Earth' || departure.isEarth;
    const isTargetEarth = planet.pl_name === 'Earth' || planet.isEarth;
    const dist = calculateInterstellarDistance(departure, planet);

    document.getElementById('inspect-pl-name').textContent = planet.pl_name;
    document.getElementById('inspect-host-star').textContent = planet.hostname;
    
    const distElem = document.getElementById('inspect-distance');
    if (distElem) {
      if (isFromEarth && !isTargetEarth) {
        distElem.textContent = `${planet.dist_ly || 40.0} Light-Years from Earth (${planet.dist_pc || 12.3} pc)`;
      } else if (!isFromEarth && isTargetEarth) {
        distElem.textContent = `${departure.dist_ly || 40.0} Light-Years (Homeworld Return)`;
      } else if (!isFromEarth && !isTargetEarth) {
        distElem.textContent = `${dist} Light-Years from ${departure.pl_name} (${planet.dist_ly} LY from Earth)`;
      } else {
        distElem.textContent = '0.0 Light-Years (Current Location)';
      }
    }

    const warpBtn = document.getElementById('engage-warp-btn');
    if (warpBtn) {
      if (isTargetEarth) {
        warpBtn.textContent = '🌍 ENGAGE WARP & RETURN TO EARTH';
      } else {
        warpBtn.textContent = `🚀 ENGAGE WARP & ENTER ORBIT (${planet.pl_name})`;
      }
    }

    document.getElementById('inspect-radius').textContent = `${planet.pl_rade} R⊕`;
    document.getElementById('inspect-mass').textContent = `${planet.pl_bmasse} M⊕`;
    document.getElementById('inspect-density').textContent = `${planet.pl_dens} g/cm³`;
    document.getElementById('inspect-gravity').textContent = `${planet.surfaceGravity}g`;
    document.getElementById('inspect-temperature').textContent = `${planet.pl_eqt} K (${(planet.pl_eqt - 273.15).toFixed(0)}°C)`;
    document.getElementById('inspect-insolation').textContent = `${planet.pl_insol} S⊕`;
    document.getElementById('inspect-period').textContent = `${planet.pl_orbper} Earth days`;
    document.getElementById('inspect-type-desc').textContent = planet.description;

    const goldBadge = document.getElementById('inspect-goldilocks-status');
    if (planet.isGoldilocks) {
      goldBadge.textContent = '🌟 Within Habitable Goldilocks Zone';
      goldBadge.className = 'inspect-badge goldilocks';
    } else if (planet.pl_eqt > 380) {
      goldBadge.textContent = '🔥 Hot Zone (Above Boiling Point)';
      goldBadge.className = 'inspect-badge hot';
    } else {
      goldBadge.textContent = '❄️ Frigid Cryo Zone (Below Freezing)';
      goldBadge.className = 'inspect-badge cold';
    }
  }

  toggleLeftMenuCollapse(forceState = null) {
    const modal = document.getElementById('planet-inspector-modal');
    if (!modal) return;
    const isCollapsed = forceState !== null ? forceState : !modal.classList.contains('collapsed');
    if (isCollapsed) {
      modal.classList.add('collapsed');
    } else {
      modal.classList.remove('collapsed');
      modal.classList.remove('hidden');
    }
    this.updateCollapseUI();
    this.audioService.playUIChime(true);
  }

  toggleRightMenuCollapse(forceState = null) {
    const overlay = document.getElementById('galaxy-map-overlay');
    if (!overlay) return;
    const isCollapsed = forceState !== null ? forceState : !overlay.classList.contains('collapsed');
    if (isCollapsed) {
      overlay.classList.add('collapsed');
    } else {
      overlay.classList.remove('collapsed');
      overlay.classList.remove('hidden');
    }
    this.updateCollapseUI();
    this.audioService.playUIChime(true);
  }

  updateCollapseUI() {
    const inspector = document.getElementById('planet-inspector-modal');
    const roster = document.getElementById('galaxy-map-overlay');

    if (inspector) {
      const isCollapsed = inspector.classList.contains('collapsed');
      const btn = document.getElementById('collapse-inspector-btn');
      const dockTab = document.getElementById('dock-tab-inspector');
      const arrow = dockTab?.querySelector('.tab-arrow');

      if (btn) {
        btn.textContent = isCollapsed ? '▶' : '◀';
        btn.title = isCollapsed ? 'Expand Inspector ( [ )' : 'Collapse Inspector ( [ )';
      }
      if (dockTab) {
        dockTab.title = isCollapsed ? 'Expand Planet Inspector ( [ )' : 'Collapse Planet Inspector ( [ )';
      }
      if (arrow) {
        arrow.textContent = isCollapsed ? '▶' : '◀';
      }
    }

    if (roster) {
      const isCollapsed = roster.classList.contains('collapsed');
      const btn = document.getElementById('collapse-galaxy-map-btn');
      const dockTab = document.getElementById('dock-tab-galaxy-map');
      const arrow = dockTab?.querySelector('.tab-arrow');

      if (btn) {
        btn.textContent = isCollapsed ? '◀' : '▶';
        btn.title = isCollapsed ? 'Expand Roster ( ] )' : 'Collapse Roster ( ] )';
      }
      if (dockTab) {
        dockTab.title = isCollapsed ? 'Expand Galaxy Roster ( ] )' : 'Collapse Galaxy Roster ( ] )';
      }
      if (arrow) {
        arrow.textContent = isCollapsed ? '◀' : '▶';
      }
    }
  }

  toggleGalaxyMap() {
    this.audioService.playUIChime(true);
    if (this.currentState === GAME_STATE.UNIVERSE_MAP) {
      // Return to prior exploration state
      this.closeGalaxyMap();
    } else {
      this.openGalaxyMap();
    }
  }

  openGalaxyMap() {
    this.currentState = GAME_STATE.UNIVERSE_MAP;
    this.closeAllModals();

    const departure = this.currentPlanetData || EARTH_DATA;
    this.universeMap.setDeparturePlanet(departure);

    if (this.activePlanetGroup) this.activePlanetGroup.visible = false;
    if (this.playerAstronaut) this.playerAstronaut.visible = false;
    if (this.descentShip) this.descentShip.visible = false;

    this.universeMap.show();
    this.applyRosterFilter();
    document.getElementById('galaxy-map-overlay')?.classList.remove('hidden');
    document.getElementById('hud-atmosphere')?.classList.add('hidden');
    document.getElementById('controls-pill')?.classList.add('hidden');
    this.hideProximityPrompt();
    this.updateCollapseUI();
  }

  closeGalaxyMap() {
    this.universeMap.hide();
    document.getElementById('galaxy-map-overlay')?.classList.add('hidden');
    document.getElementById('planet-inspector-modal')?.classList.add('hidden');
    document.getElementById('hud-atmosphere')?.classList.remove('hidden');
    document.getElementById('controls-pill')?.classList.remove('hidden');

    if (this.activePlanetGroup) this.activePlanetGroup.visible = true;
    if (this.playerAstronaut) this.playerAstronaut.visible = true;

    if (this.currentPlanetData) {
      this.currentState = GAME_STATE.SURFACE_EXPLORATION;
    } else {
      this.currentState = GAME_STATE.EARTH_TUTORIAL;
    }
  }

  /**
   * STEP 3i: Orbital Approach & Goldilocks Habitable Zone Evaluation
   */
  initiateOrbitalApproach(planet) {
    const targetPlanet = planet || this.universeMap?.selectedPlanet || this.nasaService?.cachedPlanets?.[0] || EARTH_DATA;
    this.prevPlanet = this.currentPlanetData || EARTH_DATA;
    this.currentPlanetData = targetPlanet;
    planet = targetPlanet;
    this.currentState = GAME_STATE.ORBITAL_APPROACH;
    this.cinematicTime = 0;

    this.universeMap.hide();
    document.getElementById('galaxy-map-overlay')?.classList.add('hidden');
    document.getElementById('planet-inspector-modal')?.classList.add('hidden');

    // Build authentic Eyes on Exoplanets high-poly system view in space
    if (this.exoplanetGroup) {
      this.scene.remove(this.exoplanetGroup);
    }
    this.exoplanetGroup = PlanetGenerator.buildEyesOnExoplanetSystem(planet);
    this.scene.add(this.exoplanetGroup);
    this.activePlanetGroup = this.exoplanetGroup;
    this.orbitalYaw = 0;
    this.orbitalPitch = 0.22;
    if (this.earthGroup) this.earthGroup.visible = false;
    if (this.playerAstronaut) this.playerAstronaut.visible = false;

    // Display Step 3i Goldilocks HUD
    const hud = document.getElementById('orbital-goldilocks-hud');
    hud?.classList.remove('hidden');

    const isEarth = planet.pl_name === 'Earth' || planet.isEarth;
    document.getElementById('gold-pl-name').textContent = planet.pl_name;
    document.getElementById('gold-stellar-flux').textContent = `${planet.pl_insol} S⊕ (Earth = 1.0)`;
    document.getElementById('gold-equilibrium-temp').textContent = `${planet.pl_eqt} K (${(planet.pl_eqt - 273.15).toFixed(1)}°C)`;
    document.getElementById('gold-density-calc').textContent = `${planet.pl_dens} g/cm³ (${planet.isLiquidWorld ? 'Liquid Ocean/Fluid World' : (isEarth ? 'Terrestrial Homeworld' : 'Solid Lithosphere')})`;

    const verdictElem = document.getElementById('goldilocks-verdict-banner');
    const descentBtn = document.getElementById('start-descent-btn');
    if (isEarth) {
      verdictElem.textContent = '🌍 HOMEWORLD TELEMETRY: 100% Human Compatibility. Ready for return descent.';
      verdictElem.className = 'goldilocks-banner habitable';
      if (descentBtn) descentBtn.textContent = '⬇️ INITIATE ATMOSPHERIC DESCENT TO EARTH';
    } else if (planet.isGoldilocks) {
      verdictElem.textContent = '✅ GOLDILOCKS ZONE VERIFIED: Candidate for liquid surface water & hospitable biosphere!';
      verdictElem.className = 'goldilocks-banner habitable';
      if (descentBtn) descentBtn.textContent = '⬇️ INITIATE ATMOSPHERIC DESCENT';
    } else if (planet.pl_eqt > 380) {
      verdictElem.textContent = '⚠️ EXTREME THERMAL FLUX: Above boiling point. Heavy atmospheric greenhouse or scorched lithosphere.';
      verdictElem.className = 'goldilocks-banner extreme-hot';
      if (descentBtn) descentBtn.textContent = '⬇️ INITIATE ATMOSPHERIC DESCENT';
    } else {
      verdictElem.textContent = '❄️ CRYO ZONE: Sub-freezing equilibrium temperature. Global glacial crust expected.';
      verdictElem.className = 'goldilocks-banner extreme-cold';
      if (descentBtn) descentBtn.textContent = '⬇️ INITIATE ATMOSPHERIC DESCENT';
    }
  }

  /**
   * STEP 3ii: Atmospheric Entry Descent Sequence
   */
  async initiateAtmosphericEntry() {
    if (!this.currentPlanetData) {
      this.currentPlanetData = this.universeMap?.selectedPlanet || EARTH_DATA;
    }
    this.currentState = GAME_STATE.ATMOSPHERIC_ENTRY;
    this.cinematicTime = 0;
    this.entryTelemetry = { altitude: 150, speed: 28000, heat: 2200 };

    document.getElementById('orbital-goldilocks-hud')?.classList.add('hidden');
    const entryHUD = document.getElementById('atmospheric-entry-hud');
    entryHUD?.classList.remove('hidden');

    this.audioService.playAtmosphericRoar(4.5);

    const isEarth = this.currentPlanetData.pl_name === 'Earth' || this.currentPlanetData.isEarth;

    if (isEarth) {
      if (this.exoplanetGroup) {
        this.scene.remove(this.exoplanetGroup);
      }
      this.earthGroup.visible = true;
      this.activePlanetGroup = this.earthGroup;
    } else {
      // Swap high-poly system view for interactive surface terrain planet
      if (this.exoplanetGroup) {
        this.scene.remove(this.exoplanetGroup);
      }
      this.exoplanetGroup = PlanetGenerator.buildExoplanet(this.currentPlanetData);
      this.scene.add(this.exoplanetGroup);
      this.activePlanetGroup = this.exoplanetGroup;
    }

    // Ensure the surface spaceship is completely hidden during atmospheric entry so descentShip is the ONLY ship!
    const surfaceShip = this.activePlanetGroup.userData.spaceshipMesh;
    if (surfaceShip) {
      surfaceShip.visible = false;
    }
    if (this.activePlanetGroup.userData.boatMesh) {
      this.activePlanetGroup.userData.boatMesh.visible = false;
    }
    this.playerAstronaut.visible = false;
    this.hideProximityPrompt();

    // Determine target landing position from surface ship location
    if (surfaceShip) {
      this.descentTargetPos = surfaceShip.position.clone();
      this.descentLandingUp = this.descentTargetPos.clone().normalize();
      this.descentStartPos = this.descentLandingUp.clone().multiplyScalar(75).add(new THREE.Vector3(0, 15, 20));
    } else {
      this.descentLandingUp = new THREE.Vector3(0, 1, 0.35).normalize();
      this.descentTargetPos = this.descentLandingUp.clone().multiplyScalar(28.0);
      this.descentStartPos = this.descentLandingUp.clone().multiplyScalar(75).add(new THREE.Vector3(0, 15, 20));
    }

    // Show descent ship in high orbit flying toward planet (standing vertically, retro-burn landing orientation)
    this.descentShip.visible = true;
    this.descentShip.position.copy(this.descentStartPos);
    const initUp = this.descentShip.position.clone().normalize();
    this.descentShip.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), initUp);
    if (this.descentShip.userData.flame) {
      this.descentShip.userData.flame.visible = true;
    }

    // Dynamic atmospheric computation display
    const atmo = this.activePlanetGroup.userData.atmosphereDetails;
    document.getElementById('entry-atmo-n2').textContent = atmo.n2 || '12%';
    document.getElementById('entry-atmo-o2').textContent = atmo.o2 || '0.5%';
    document.getElementById('entry-atmo-co2').textContent = atmo.co2 || '65%';
    document.getElementById('entry-radiation-shield').textContent = isEarth
      ? '100% (Earth Magnetosphere)'
      : (this.currentPlanetData.pl_insol > 2.0 ? '64% (Heavy Cosmic Shielding)' : '98% (Safe Deflection)');

    // Teacher cockpit comms
    const commsElem = document.getElementById('entry-teacher-comms-text');
    if (commsElem) {
      if (isEarth) {
        commsElem.textContent = 'Hold onto your seat, Cadet Tom! 🌍 We are zooming through Earth\'s pretty blue sky straight toward home. Get ready for warm milk and chocolate cookies! 🍪';
      } else {
        const warningResult = await this.geminiService.generateEntryWarning(this.currentPlanetData);
        commsElem.textContent = warningResult.text;
      }
    }
  }

  /**
   * STEP 3iii & 3iii B: Surface Landing, Adaptive World & Gemini AI Teacher
   */
  async completeLanding() {
    if (!this.currentPlanetData) {
      this.currentPlanetData = this.universeMap?.selectedPlanet || EARTH_DATA;
    }
    const isEarth = this.currentPlanetData.pl_name === 'Earth' || this.currentPlanetData.isEarth;
    this.currentState = isEarth ? GAME_STATE.EARTH_TUTORIAL : GAME_STATE.SURFACE_EXPLORATION;

    // Hide cinematic descent ship
    this.descentShip.visible = false;
    if (this.descentShip && this.descentShip.userData.flame) {
      this.descentShip.userData.flame.visible = false;
    }

    // Now make the landed surface spaceship present and visible!
    const surfaceShip = this.activePlanetGroup.userData.spaceshipMesh;
    if (surfaceShip) {
      surfaceShip.visible = true;
    }
    if (this.activePlanetGroup.userData.boatMesh) {
      this.activePlanetGroup.userData.boatMesh.visible = true;
    }

    document.getElementById('atmospheric-entry-hud')?.classList.add('hidden');
    document.getElementById('hud-atmosphere')?.classList.remove('hidden');
    document.getElementById('controls-pill')?.classList.remove('hidden');

    // Spawn player astronaut onto planet in TPS view standing in front of the landed ship
    if (surfaceShip) {
      const shipPos = surfaceShip.position;
      const shipUp = shipPos.clone().normalize();
      const shipForward = new THREE.Vector3(0, 0, 1).applyQuaternion(surfaceShip.quaternion);
      const shipRight = new THREE.Vector3(1, 0, 0).applyQuaternion(surfaceShip.quaternion);

      // Spawn astronaut 4.5m in front of the landed ship, facing forward into the new world
      const spawnPos = shipPos.clone().addScaledVector(shipForward, 4.5);
      spawnPos.normalize().multiplyScalar(this.activePlanetGroup.userData.radius + 0.1);

      this.playerAstronaut.position.copy(spawnPos);
      this.playerAstronaut.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), shipUp);
      this.playerAstronaut.visible = true;

      // Initialize TPS camera and physics: camera positioned to frame both the player and their landed vertical ship
      this.physics.resetState(this.playerAstronaut.position, this.activePlanetGroup.userData.radius);
      const viewDir = shipForward.clone().addScaledVector(shipRight, 0.35).normalize();
      this.physics.camForward.copy(viewDir);
      this.physics.characterFacing.copy(viewDir);
      this.physics.camDistance = 8.8;
      this.physics.camHeight = 3.4;
      this.physics.camPitch = 0.20;
    } else {
      this.playerAstronaut.visible = true;
      this.playerAstronaut.position.copy(this.activePlanetGroup.userData.spawnPosition);
      const up = this.playerAstronaut.position.clone().normalize();
      this.playerAstronaut.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), up);
      this.physics.resetState(this.playerAstronaut.position, this.activePlanetGroup.userData.radius);
    }

    // Update left HUD with this planet's atmospheric properties
    const atmo = this.activePlanetGroup.userData.atmosphereDetails;
    const plName = isEarth ? 'Earth' : this.currentPlanetData.pl_name;
    const subtype = isEarth ? 'Terrestrial Home Base' : (this.activePlanetGroup.userData.worldSubtype || 'Terrestrial');
    this.updateAtmosphereHUD(atmo, plName, subtype);

    // If liquid world, notice spaceship transformed into watership mode
    if (!isEarth && this.currentPlanetData.isLiquidWorld) {
      this.showProximityPrompt('🌊 Ocean World: Spaceship in Watership Mode! Head over to Professor Spike [E] for your mission debriefing.');
    } else {
      this.showProximityPrompt(`Touchdown on ${plName} confirmed! Head over to Professor Spike [E] for your mission debriefing.`);
    }

    // If returned to Earth, reset currentPlanetData to null
    if (isEarth) {
      this.currentPlanetData = null;
    }
  }

  async handleTeacherQuestion(question) {
    const teacherTextElem = document.getElementById('teacher-dialogue-text');
    const teacherSourceBadge = document.getElementById('teacher-source-indicator');
    teacherTextElem.textContent = 'Consulting astrobiology database...';

    const planet = this.currentPlanetData || {
      pl_name: "Earth",
      pl_dens: 5.51,
      pl_eqt: 288,
      surfaceGravity: 1.0,
      pl_insol: 1.0,
      isLiquidWorld: false
    };

    const result = await this.geminiService.askTeacherQuestion(question, planet);
    if (teacherSourceBadge) {
      teacherSourceBadge.textContent = (result.source === 'featherless' || result.source === 'gemini') ? 'Featherless Live AI' : 'Teacher (Astro-Sim)';
      teacherSourceBadge.className = `teacher-source ${result.source}`;
    }
    this.typewriterText(teacherTextElem, result.text);
  }

  typewriterText(element, text, isTeacher = true) {
    if (this.typewriterInterval) {
      clearInterval(this.typewriterInterval);
      this.typewriterInterval = null;
    }
    element.dataset.fullText = text;
    element.textContent = '';
    let i = 0;
    const speed = 14; // ms per character

    this.typewriterInterval = setInterval(() => {
      if (i < text.length) {
        element.textContent += text.charAt(i);
        // Play speech blip periodically for Animal Crossing voice effect
        if (i % 2 === 0 && text.charAt(i) !== ' ') {
          this.audioService.playSpeechBlip(text.charAt(i), isTeacher);
        }
        i++;
      } else {
        clearInterval(this.typewriterInterval);
        this.typewriterInterval = null;
      }
    }, speed);
  }

  updateAtmosphereHUD(atmo, planetName, subtype = 'Terrestrial') {
    if (!atmo) return;
    document.getElementById('hud-planet-name').textContent = planetName;
    document.getElementById('hud-planet-type').textContent = subtype;
    document.getElementById('hud-n2-val').textContent = atmo.n2 || '78.08%';
    document.getElementById('hud-o2-val').textContent = atmo.o2 || '20.95%';
    document.getElementById('hud-co2-val').textContent = atmo.co2 || '0.04%';
    document.getElementById('hud-pressure-val').textContent = atmo.pressure || '1.013 bar';
    document.getElementById('hud-temp-val').textContent = atmo.temperature || '288 K';

    // Update dynamic progress bar fill widths
    const fillN2 = document.querySelector('.fill-n2');
    const fillO2 = document.querySelector('.fill-o2');
    const fillCo2 = document.querySelector('.fill-co2');
    if (fillN2) fillN2.style.width = atmo.n2 || '78%';
    if (fillO2) fillO2.style.width = atmo.o2 || '21%';
    if (fillCo2) fillCo2.style.width = atmo.co2 || '0.04%';

    // Update breathability badge
    const breathBadge = document.getElementById('hud-breathability');
    if (breathBadge) {
      breathBadge.textContent = atmo.breathability || '🫁 Breathable (Safe)';
      breathBadge.className = `hud-breath-badge ${atmo.breathabilityClass || 'breathable'}`;
    }
  }

  async triggerInteraction() {
    // If an inspection modal or teacher dialogue is already open, do not trigger under it
    if (this.isModalOpen()) return;

    if (!this.activeInteractable) return;
    this.audioService.playUIChime(true);
    const item = this.activeInteractable;

    if (item.type === 'SPACESHIP' || item.type === 'BOAT') {
      // Board ship with cinematic tractor beam animation & launch off planet
      this.initiateBoardingSequence(item.mesh);
    } else if (item.type === 'PLANT') {
      // Scan plant and show Farming Stats
      this.hideProximityPrompt();
      this.audioService.playScanSound();
      this.displayFarmingStats(item);
    } else if (item.type === 'DRILL') {
      // Mining drill soil cross-section
      this.hideProximityPrompt();
      this.audioService.playDrillHum();
      this.displayDrillModal();
    } else if (item.type === 'TEACHER') {
      // Open teacher dialog with personalized debriefing or Q&A
      const dialogBox = document.getElementById('teacher-dialogue-modal');
      dialogBox?.classList.remove('hidden');
      this.hideProximityPrompt();
      const teacherTextElem = document.getElementById('teacher-dialogue-text');
      const teacherSourceBadge = document.getElementById('teacher-source-indicator');
      if (!teacherTextElem) return;

      const currentPl = this.currentPlanetData || EARTH_DATA;
      const planetKey = currentPl.pl_name;
      const isFirstVisit = !this.hasHadFirstBriefingOnPlanet[planetKey];

      if (isFirstVisit) {
        this.hasHadFirstBriefingOnPlanet[planetKey] = true;
        delete teacherTextElem.dataset.fullText;
        teacherTextElem.textContent = 'Professor Spike is preparing the Planetary Compatibility Dashboard...';
        try {
          const result = await this.geminiService.generateHumanCompatibilityComparison(
            currentPl,
            this.prevPlanet || EARTH_DATA
          );
          this.cachedDashboardResult[planetKey] = result;
          if (teacherSourceBadge) {
            teacherSourceBadge.textContent = (result.source === 'featherless' || result.source === 'gemini')
              ? 'Featherless Live AI'
              : 'Teacher (Astro-Sim)';
            teacherSourceBadge.className = `teacher-source ${result.source}`;
          }
          if (this.typewriterInterval) {
            clearInterval(this.typewriterInterval);
            this.typewriterInterval = null;
          }
          teacherTextElem.dataset.fullText = result.text;
          teacherTextElem.innerHTML = result.dashboardHtml || `<div class="speech-balloon">${result.text}</div>`;
          this.audioService.playUIChime(true);
        } catch (err) {
          console.warn('Teacher briefing error:', err);
        }
      } else {
        if (teacherSourceBadge) {
          teacherSourceBadge.textContent = 'Teacher (Astro-Sim)';
          teacherSourceBadge.className = 'teacher-source offline';
        }
        this.typewriterText(
          teacherTextElem,
          `Welcome back, little cadet! 🐶✨ Telemetry for ${currentPl.pl_name} is in my notebook! Want to know if we can grow space berries, dig for shiny crystals, or bounce like a kangaroo? Ask me below!`,
          true
        );
      }
    }
  }

  async displayComparisonDashboard() {
    const teacherTextElem = document.getElementById('teacher-dialogue-text');
    const teacherSourceBadge = document.getElementById('teacher-source-indicator');
    if (!teacherTextElem) return;

    if (this.typewriterInterval) {
      clearInterval(this.typewriterInterval);
      this.typewriterInterval = null;
    }

    const currentPl = this.currentPlanetData || EARTH_DATA;
    const planetKey = currentPl.pl_name;
    const cached = this.cachedDashboardResult && this.cachedDashboardResult[planetKey];

    if (cached) {
      if (teacherSourceBadge) {
        teacherSourceBadge.textContent = 'Dashboard (Astro-Sim)';
        teacherSourceBadge.className = 'teacher-source offline';
      }
      teacherTextElem.dataset.fullText = cached.text;
      teacherTextElem.innerHTML = cached.dashboardHtml;
      this.audioService.playUIChime(true);
      return;
    }

    const result = await this.geminiService.generateHumanCompatibilityComparison(
      currentPl,
      this.prevPlanet || EARTH_DATA
    );
    this.cachedDashboardResult[planetKey] = result;
    if (teacherSourceBadge) {
      teacherSourceBadge.textContent = 'Dashboard (Astro-Sim)';
      teacherSourceBadge.className = 'teacher-source offline';
    }
    teacherTextElem.dataset.fullText = result.text;
    teacherTextElem.innerHTML = result.dashboardHtml || `<div class="speech-balloon">${result.text}</div>`;
    this.audioService.playUIChime(true);
  }

  initiateBoardingSequence(shipMesh) {
    this.currentState = GAME_STATE.BOARDING_SPACESHIP;
    this.cinematicTime = 0;
    this.activeShip = shipMesh;
    this.hideProximityPrompt();
    document.getElementById('controls-pill')?.classList.add('hidden');
    document.getElementById('hud-atmosphere')?.classList.add('hidden');
    this.closeAllModals();

    this.audioService.playBoardingChime();

    const shipUp = shipMesh.position.clone().normalize();
    const shipForward = new THREE.Vector3(0, 0, 1).applyQuaternion(shipMesh.quaternion);

    // Position glowing tractor beam from ground to ship hatch
    this.boardingBeam.position.copy(shipMesh.position).addScaledVector(shipUp, 1.8);
    this.boardingBeam.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), shipUp);
    this.boardingBeam.visible = true;

    this.boardingStartPos = this.playerAstronaut.position.clone();
    this.boardingTargetPos = shipMesh.position.clone().addScaledVector(shipUp, 3.8).addScaledVector(shipForward, 0.4);
  }

  initiateLaunchSequence(shipMesh) {
    this.currentState = GAME_STATE.LAUNCHING_SPACESHIP;
    this.cinematicTime = 0;
    this.activeShip = shipMesh;
    this.launchStartPos = shipMesh.position.clone();
    this.launchUp = shipMesh.position.clone().normalize();
    const shipRight = new THREE.Vector3(1, 0, 0).applyQuaternion(shipMesh.quaternion);
    this.launchCamPos = this.launchStartPos.clone().addScaledVector(this.launchUp, 4.0).addScaledVector(shipRight, 9.0);

    this.audioService.playRocketLaunchSound(3.8);
  }

  displayFarmingStats(plantItem) {
    const modal = document.getElementById('farming-stats-modal');
    if (!modal) return;
    modal.classList.remove('hidden');

    const stats = plantItem.stats || {
      species: 'Exo-Flora Biospecimen',
      photosynthesisRating: '91%',
      cropGrowthPotential: 'High in greenhouse',
      oxygenGeneration: '+1.8 kg O2 / month',
      idealTemp: '10°C to 35°C'
    };

    document.getElementById('farm-species-name').textContent = plantItem.name;
    document.getElementById('farm-photosynthesis-rate').textContent = stats.photosynthesisRating || '91%';
    document.getElementById('farm-growth-potential').textContent = stats.cropGrowthPotential || 'Experimental';
    document.getElementById('farm-oxygen-output').textContent = stats.oxygenGeneration || stats.salinityConductivity || stats.radiationResistance || 'N/A';
    document.getElementById('farm-temp-tolerance').textContent = stats.idealTemp || stats.deepSeaDepth || stats.mineralLattice || 'N/A';
  }

  displayDrillModal() {
    const modal = document.getElementById('soil-cross-section-modal');
    if (!modal) return;
    modal.classList.remove('hidden');

    const density = this.currentPlanetData ? this.currentPlanetData.pl_dens : 5.51;
    const isWater = this.currentPlanetData ? this.currentPlanetData.isLiquidWorld : false;
    const plName = this.currentPlanetData ? this.currentPlanetData.pl_name : 'Earth';

    const titleElem = modal.querySelector('.modal-title');
    if (titleElem) {
      titleElem.textContent = `⛏️ Deep Core Soil Stratum — ${plName}`;
    }

    if (isWater) {
      document.getElementById('drill-strata-1').textContent = 'Depth 0 - 20 km: Superheated High-Pressure Hydrosphere (H2O, CH4)';
      document.getElementById('drill-strata-2').textContent = 'Depth 20 - 90 km: High-Pressure Ice VII & Heavy Deuterium Slurry';
      document.getElementById('drill-strata-3').textContent = 'Depth 90 - 400 km: Compressed Silicate-Iron Core Mantle';
      document.getElementById('drill-yield-iron').style.width = '25%';
      document.getElementById('drill-yield-silicon').style.width = '35%';
      document.getElementById('drill-yield-rare').style.width = '65%';
    } else if (density > 5.5) {
      document.getElementById('drill-strata-1').textContent = 'Depth 0 - 5 m: Dense Basaltic Regolith (High Magnetite Concentration)';
      document.getElementById('drill-strata-2').textContent = 'Depth 5 - 120 m: Solid Nickel-Iron Ore Veins & Metallic Silicates';
      document.getElementById('drill-strata-3').textContent = 'Depth 120 - 800 m: Hyper-Dense Crystallized Carbon & Heavy Transition Metals';
      document.getElementById('drill-yield-iron').style.width = '90%';
      document.getElementById('drill-yield-silicon').style.width = '50%';
      document.getElementById('drill-yield-rare').style.width = '85%';
    } else {
      document.getElementById('drill-strata-1').textContent = 'Depth 0 - 2 m: Organic Topsoil & Humus (Rich in Phosphates & Nitrogen)';
      document.getElementById('drill-strata-2').textContent = 'Depth 2 - 50 m: Clay, Silicates & Hydrated Oxides';
      document.getElementById('drill-strata-3').textContent = 'Depth 50 - 500 m: Basaltic Bedrock (Iron, Titanium, Trace Minerals)';
      document.getElementById('drill-yield-iron').style.width = '65%';
      document.getElementById('drill-yield-silicon').style.width = '80%';
      document.getElementById('drill-yield-rare').style.width = '30%';
    }
  }

  isModalOpen() {
    const modalIds = [
      'farming-stats-modal',
      'soil-cross-section-modal',
      'teacher-dialogue-modal',
      'planet-inspector-modal',
      'api-key-modal'
    ];
    return modalIds.some(id => {
      const el = document.getElementById(id);
      return Boolean(el && !el.classList.contains('hidden'));
    });
  }

  closeAllModals() {
    document.getElementById('farming-stats-modal')?.classList.add('hidden');
    document.getElementById('soil-cross-section-modal')?.classList.add('hidden');
    document.getElementById('teacher-dialogue-modal')?.classList.add('hidden');
    document.getElementById('api-key-modal')?.classList.add('hidden');
    document.getElementById('planet-inspector-modal')?.classList.add('hidden');
  }

  showProximityPrompt(content, isHTML = false) {
    const prompt = document.getElementById('interaction-prompt');
    if (prompt) {
      if (isHTML) {
        prompt.innerHTML = content;
      } else {
        prompt.textContent = content;
      }
      prompt.classList.remove('hidden');
    }
  }

  hideProximityPrompt() {
    const prompt = document.getElementById('interaction-prompt');
    if (prompt) prompt.classList.add('hidden');
  }

  checkProximityInteractables() {
    // Both Earth Tutorial and Exoplanet Surface Exploration support interactions!
    if (this.currentState !== GAME_STATE.SURFACE_EXPLORATION && this.currentState !== GAME_STATE.EARTH_TUTORIAL) {
      this.hideProximityPrompt();
      return;
    }

    // Do not overlap prompt over active modal dialogues
    if (this.isModalOpen()) {
      this.hideProximityPrompt();
      return;
    }

    if (!this.activePlanetGroup || !this.playerAstronaut) return;
    const interactables = this.activePlanetGroup.userData.interactables || [];
    const playerPos = this.playerAstronaut.position;

    let nearest = null;
    let nearestDist = Infinity;

    for (const item of interactables) {
      // Dynamic physical threshold tuned to prop size and generous spacing
      const threshold = item.interactionRadius || (
        (item.type === 'SPACESHIP' || item.type === 'BOAT') ? 5.8 :
        item.type === 'DRILL' ? 4.8 :
        item.type === 'TEACHER' ? 4.8 :
        4.0
      );
      const dist = playerPos.distanceTo(item.position);
      if (dist < threshold && dist < nearestDist) {
        nearestDist = dist;
        nearest = item;
      }
    }

    if (nearest) {
      this.activeInteractable = nearest;
      const isShip = (nearest.type === 'SPACESHIP' || nearest.type === 'BOAT');
      const actionText = nearest.prompt.replace(/^\[E\]\s*/, '');
      const html = `
        <div class="prompt-action primary-action">
          <span class="prompt-key">E</span>
          <span class="prompt-label">${actionText}</span>
        </div>
        ${isShip ? `
          <div class="prompt-divider">•</div>
          <div class="prompt-transform-btn" id="prompt-transform-btn" title="Transform Vehicle Mode (T)">
            <span class="prompt-key">T</span>
            <span class="prompt-label">Transform Mode</span>
          </div>
        ` : ''}
      `;
      this.showProximityPrompt(html, true);
    } else {
      this.activeInteractable = null;
      this.hideProximityPrompt();
    }
  }

  toggleVehicleTransformation() {
    if (!this.activePlanetGroup) return;
    const interactables = this.activePlanetGroup.userData.interactables || [];
    const shipInteractable = interactables.find(item => item.type === 'SPACESHIP' || item.type === 'BOAT');
    if (!shipInteractable || !shipInteractable.mesh) return;

    // Only allow transformation if player is near the vehicle
    const playerDist = this.playerAstronaut ? this.playerAstronaut.position.distanceTo(shipInteractable.position) : Infinity;
    if (playerDist > 10.0 && this.currentState !== GAME_STATE.SURFACE_EXPLORATION && this.currentState !== GAME_STATE.EARTH_TUTORIAL) {
      return;
    }

    const oldMesh = shipInteractable.mesh;
    const parent = oldMesh.parent || this.activePlanetGroup;
    const isCurrentlyBoat = shipInteractable.type === 'BOAT';
    const targetType = isCurrentlyBoat ? 'SPACESHIP' : 'BOAT';

    // Create the transformed model matching user reference artwork
    const newMesh = isCurrentlyBoat
      ? CharacterModelBuilder.createSpaceship()
      : CharacterModelBuilder.createExplorationBoat();

    newMesh.name = isCurrentlyBoat ? 'ExplorationSpaceship' : 'ExplorationBoat';
    newMesh.position.copy(oldMesh.position);
    newMesh.quaternion.copy(oldMesh.quaternion);
    newMesh.userData.isSpaceship = !isCurrentlyBoat;
    newMesh.userData.initialPosition = newMesh.position.clone();
    newMesh.userData.initialQuaternion = newMesh.quaternion.clone();

    // Replace old mesh with new mesh in 3D scene
    parent.remove(oldMesh);
    parent.add(newMesh);

    // Update interactable state & prompt
    shipInteractable.type = targetType;
    shipInteractable.mesh = newMesh;
    shipInteractable.name = isCurrentlyBoat ? 'Exploration Star-Cruiser (Spaceship Mode)' : 'Hydrofoil Skiff (Watership Mode)';
    shipInteractable.prompt = isCurrentlyBoat ? '[E] Board Ship & Launch into Space' : '[E] Board Skiff & Launch to Orbit';

    if (this.activePlanetGroup.userData.spaceshipMesh) {
      this.activePlanetGroup.userData.spaceshipMesh = newMesh;
    }
    if (this.activePlanetGroup.userData.boatMesh) {
      this.activePlanetGroup.userData.boatMesh = newMesh;
    }

    // Sound effect & prompt confirmation
    this.audioService.playUIChime(true);

    // Refresh proximity prompt immediately
    this.checkProximityInteractables();
  }

  updateInput() {
    this.input.x = 0;
    this.input.y = 0;

    // W: Forward into camera view (+Y)
    // S: Backward toward camera (-Y)
    if (this.keys['KeyW'] || this.keys['ArrowUp']) this.input.y += 1;
    if (this.keys['KeyS'] || this.keys['ArrowDown']) this.input.y -= 1;

    // INVERTED Left / Right movement controls:
    // D: Moves Left (-X)
    // A: Moves Right (+X)
    if (this.keys['KeyD'] || this.keys['ArrowRight']) this.input.x -= 1;
    if (this.keys['KeyA'] || this.keys['ArrowLeft']) this.input.x += 1;

    this.input.jump = Boolean(this.keys['Space']);
  }

  animate() {
    requestAnimationFrame(this.animate);
    const delta = this.clock.getDelta();
    const elapsedTime = this.clock.getElapsedTime();

    this.updateInput();

    // 1. STATE: EARTH_TUTORIAL or SURFACE_EXPLORATION
    if (this.currentState === GAME_STATE.EARTH_TUTORIAL || this.currentState === GAME_STATE.SURFACE_EXPLORATION) {
      const radius = this.activePlanetGroup.userData.radius || 26;
      const gravity = this.activePlanetGroup.userData.gravity || 1.0;
      const isLiquid = this.activePlanetGroup.userData.isLiquidWorld || false;

      // Spherical physics movement, collision resolution & smooth camera
      const colliders = (this.activePlanetGroup && this.activePlanetGroup.userData) ? (this.activePlanetGroup.userData.colliders || []) : [];
      const moveState = this.physics.update(
        this.playerAstronaut,
        this.camera,
        this.input,
        radius,
        gravity,
        isLiquid,
        delta,
        colliders
      );

      // Play jump / splash sounds on actions
      if (this.input.jump && moveState.isGrounded) {
        this.audioService.playJumpSound();
      } else if (moveState.isSwimming && moveState.isMoving && Math.random() < 0.05) {
        this.audioService.playSplashSound();
      }

      // If player moves or jumps, disengage waving greeting and switch to active traversal
      if (moveState.isMoving || moveState.isJumping || moveState.isSwimming || Math.abs(this.input.x) > 0.01 || Math.abs(this.input.y) > 0.01) {
        this.isPlayerWaving = false;
      }

      // Update student astronaut walk/swim/jump limb animations (or waving greeting on load)
      CharacterModelBuilder.updateAnimation(
        this.playerAstronaut,
        delta,
        moveState.isMoving,
        moveState.isJumping,
        moveState.isSwimming,
        this.isPlayerWaving
      );

      // Update teacher waving animation if present
      if (this.activePlanetGroup.userData.teacherMesh) {
        CharacterModelBuilder.updateAnimation(
          this.activePlanetGroup.userData.teacherMesh,
          delta,
          false,
          false,
          false,
          true // isWaving
        );
      }

      // Update clouds / liquid ocean waves
      if (this.activePlanetGroup.userData.clouds) {
        this.activePlanetGroup.userData.clouds.rotation.y += delta * 0.02;
      }
      if (isLiquid) {
        PlanetGenerator.updateLiquidWaves(this.activePlanetGroup, elapsedTime);
      }

      // Check distance to interactive stations & flora
      this.checkProximityInteractables();
    }

    // 2. STATE: BOARDING_SPACESHIP
    else if (this.currentState === GAME_STATE.BOARDING_SPACESHIP) {
      this.cinematicTime += delta;
      const duration = 1.5;
      const progress = Math.min(1.0, this.cinematicTime / duration);
      const ease = progress * progress * (3 - 2 * progress); // Smoothstep curve

      // Tractor beam glow pulsation
      if (this.boardingBeam) {
        this.boardingBeam.material.opacity = Math.sin(progress * Math.PI) * 0.75;
      }

      // Smoothly float astronaut up into ship cockpit
      this.playerAstronaut.position.lerpVectors(this.boardingStartPos, this.boardingTargetPos, ease);
      this.playerAstronaut.scale.setScalar(0.85 * (1.0 - progress * 0.5));
      CharacterModelBuilder.updateAnimation(this.playerAstronaut, delta, false, true, false);

      // Cinematic camera framing the boarding sequence
      if (this.activeShip) {
        const shipUp = this.activeShip.position.clone().normalize();
        const shipRight = new THREE.Vector3(1, 0, 0).applyQuaternion(this.activeShip.quaternion);
        const targetCam = this.activeShip.position.clone()
          .addScaledVector(shipUp, 4.2)
          .addScaledVector(shipRight, 6.5)
          .add(new THREE.Vector3(0, 0, 4.5));

        this.camera.position.lerp(targetCam, Math.min(1.0, 5.0 * delta));
        this.camera.lookAt(this.activeShip.position.clone().addScaledVector(shipUp, 2.0));
      }

      if (progress >= 1.0) {
        this.playerAstronaut.visible = false;
        this.playerAstronaut.scale.set(0.85, 0.85, 0.85);
        if (this.boardingBeam) this.boardingBeam.visible = false;
        this.audioService.playHatchSeal();
        this.initiateLaunchSequence(this.activeShip);
      }
    }

    // 3. STATE: LAUNCHING_SPACESHIP (Ascending from planet into space)
    else if (this.currentState === GAME_STATE.LAUNCHING_SPACESHIP) {
      this.cinematicTime += delta;
      const duration = 3.6;
      const progress = Math.min(1.0, this.cinematicTime / duration);

      // Expand rocket thruster exhaust flame
      if (this.activeShip && this.activeShip.userData.flame) {
        this.activeShip.userData.flame.visible = true;
        const flameScale = 1.0 + Math.min(4.0, progress * 4.5);
        this.activeShip.userData.flame.scale.set(flameScale, flameScale * 1.6, flameScale);
      }

      // Planetary liftoff acceleration: brief rumble on pad, then vertical ascent
      let altitude = 0;
      if (this.cinematicTime > 0.4) {
        const tAscent = this.cinematicTime - 0.4;
        altitude = 20.0 * Math.pow(tAscent, 2.2);
        this.activeShip.position.copy(this.launchStartPos).addScaledVector(this.launchUp, altitude);
      }

      // Camera stays grounded looking up at the rocket shooting into space
      const shake = (Math.random() - 0.5) * (0.35 * (1.0 - progress * 0.7));
      const camTarget = this.launchCamPos.clone().addScaledVector(this.launchUp, Math.min(28.0, altitude * 0.16));
      camTarget.x += shake;
      camTarget.z += shake;
      this.camera.position.lerp(camTarget, Math.min(1.0, 6.0 * delta));
      this.camera.lookAt(this.activeShip.position);

      if (progress >= 1.0) {
        // Reset ship back to surface for future landings
        this.activeShip.position.copy(this.activeShip.userData.initialPosition || this.launchStartPos);
        if (this.activeShip.userData.flame) this.activeShip.userData.flame.scale.set(1, 1, 1);
        this.openGalaxyMap();
      }
    }

    // 4. STATE: UNIVERSE_MAP
    else if (this.currentState === GAME_STATE.UNIVERSE_MAP) {
      this.universeMap.update(delta, elapsedTime);
    }

    // 5. STATE: ORBITAL_APPROACH (Eyes on Exoplanets System View)
    else if (this.currentState === GAME_STATE.ORBITAL_APPROACH) {
      this.cinematicTime += delta;
      const r = 55;
      // Gentle auto-rotation drift plus interactive mouse orbit
      this.orbitalYaw = (this.orbitalYaw || 0) + delta * 0.04;
      const pitch = this.orbitalPitch !== undefined ? this.orbitalPitch : 0.22;
      const yaw = this.orbitalYaw;

      const cx = Math.sin(yaw) * Math.cos(pitch) * r;
      const cy = Math.sin(pitch) * r;
      const cz = Math.cos(yaw) * Math.cos(pitch) * r;

      this.camera.position.set(cx, cy, cz);
      this.camera.up.set(0, 1, 0);
      this.camera.lookAt(0, 0, 0);

      // Rotate high-poly planet & translucent cloud sphere on their axes
      if (this.activePlanetGroup && this.activePlanetGroup.userData) {
        const u = this.activePlanetGroup.userData;
        if (u.planetMesh) u.planetMesh.rotation.y += delta * 0.06;
        if (u.cloudsMesh) u.cloudsMesh.rotation.y += delta * 0.10;
        if (u.starGroup) u.starGroup.rotation.y += delta * 0.05;
      }
    }

    // 6. STATE: ATMOSPHERIC_ENTRY (Cinematic descent with sidebar HUD)
    else if (this.currentState === GAME_STATE.ATMOSPHERIC_ENTRY) {
      this.cinematicTime += delta;
      const totalDescentTime = 4.5;
      const progress = Math.min(1.0, this.cinematicTime / totalDescentTime);

      // Descent altitude telemetry simulation
      this.entryTelemetry.altitude = Math.max(0, Math.round((1.0 - progress) * 150));
      this.entryTelemetry.speed = Math.max(800, Math.round((1.0 - progress * 0.8) * 28000));
      this.entryTelemetry.heat = Math.max(350, Math.round(Math.sin(progress * Math.PI) * 2400));

      document.getElementById('entry-telemetry-alt').textContent = `${this.entryTelemetry.altitude} km`;
      document.getElementById('entry-telemetry-speed').textContent = `${this.entryTelemetry.speed} km/h`;
      document.getElementById('entry-telemetry-heat').textContent = `${this.entryTelemetry.heat}°C`;

      // Smooth deceleration curve towards touchdown
      const easeProgress = Math.sin((progress * Math.PI) * 0.5);
      const shipPos = (this.descentStartPos && this.descentTargetPos)
        ? this.descentStartPos.clone().lerp(this.descentTargetPos, easeProgress)
        : new THREE.Vector3(0, THREE.MathUtils.lerp(75, 28, progress), THREE.MathUtils.lerp(75, 28, progress) * 0.35);

      this.descentShip.position.copy(shipPos);

      // Planet normal vector pointing straight up into space
      const upDir = shipPos.clone().normalize();

      // Rocket lands and stands vertically: local +Y aligned with surface normal
      const verticalQuat = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), upDir);

      // Dynamic descent flare: slight aerodynamic entry pitch that transitions smoothly to 100% vertical on touchdown
      const flarePitch = (1.0 - progress) * 0.32;
      const flareQuat = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), flarePitch);
      this.descentShip.quaternion.copy(verticalQuat).multiply(flareQuat);

      // Dynamic retro-thruster brake plumes
      if (this.descentShip.userData.flame) {
        this.descentShip.userData.flame.visible = true;
        const flamePulse = 0.85 + Math.sin(this.cinematicTime * 24) * 0.22;
        const retroPower = 1.0 + (1.0 - progress) * 0.75;
        this.descentShip.userData.flame.scale.set(flamePulse, flamePulse * retroPower, flamePulse);
      }

      // Cinematic camera offset: Positioned slightly to the left, tracking descent ship
      const shake = (Math.random() - 0.5) * (1.0 - progress) * 0.7;
      const camOffset = upDir.clone().multiplyScalar(9.0 + (1.0 - progress) * 12.0)
        .add(new THREE.Vector3(-10 + shake, 6 + shake, 18 + shake));
      this.camera.position.copy(shipPos).add(camOffset);
      this.camera.lookAt(shipPos.clone().addScaledVector(upDir, 2.5));

      if (progress >= 1.0) {
        this.completeLanding();
      }
    }

    this.renderer.render(this.scene, this.camera);
  }
}
