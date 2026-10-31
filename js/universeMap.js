// universeMap.js - "Eyes on Exoplanets" Style Galaxy Map
//   • Earth on far left with real-scale distance corridor to exoplanets
//   • High-poly photorealistic procedural planet spheres per classification
//   • Distance milestone arcs + animated warp-line from Earth to target
//   • Mouse drag: slow, precise, zero spin-runaway
import * as THREE from 'three';
import { ProceduralTextures } from './proceduralTextures.js?v=2.5';
import { CharacterModelBuilder } from './characterModels.js?v=2.5';
import { EARTH_DATA, calculateInterstellarDistance } from './nasaService.js?v=2.5';

export class UniverseMap {
  constructor(scene, camera, renderer) {
    this.scene = scene;
    this.camera = camera;
    this.renderer = renderer;

    this.group = new THREE.Group();
    this.group.name = 'UniverseMapGroup';
    this.scene.add(this.group);
    this.group.visible = false;

    this.planetNodes = [];
    this.selectedPlanet = null;
    this.departurePlanet = EARTH_DATA;
    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();

    // ── Mouse Drag State ──────────────────────────────────────────────────
    this.isDragging = false;
    this.prevMouseX = 0;
    this.prevMouseY = 0;
    this.dragStartX = 0;
    this.dragStartY = 0;
    this.hasDragged = false;

    // ── Camera Orbit State ────────────────────────────────────────────────
    // Yaw: horizontal rotation.  Pitch: vertical angle (clamped).
    this.mapDistance = 140;
    this.mapYaw   = 0.30;
    this.mapPitch = 0.32;
    // World-space look-at point — centre of Earth-to-exoplanet corridor
    this.targetCenter = new THREE.Vector3(-10, 0, 0);

    // ── Trajectory photon pulse ───────────────────────────────────────────
    this.pulseTime = 0;
    this.selectedTargetPos = null;

    // Earth anchor position in map space
    this.earthOrigin = new THREE.Vector3(-65, 0, 0);

    // Build the scene parts
    this._buildGalaxyBackdrop();
    this._buildEarthBase();
    this._buildDistanceCorridor();
    this._buildTrajectoryLine();
  }

  // ════════════════════════════════════════════════════════════════════════
  //  SCENE CONSTRUCTION
  // ════════════════════════════════════════════════════════════════════════

  _buildGalaxyBackdrop() {
    // Dense starfield
    const starCount = 3500;
    const starGeo  = new THREE.BufferGeometry();
    const positions = new Float32Array(starCount * 3);
    const colors    = new Float32Array(starCount * 3);

    for (let i = 0; i < starCount; i++) {
      const r     = 180 + Math.random() * 400;
      const theta = Math.random() * Math.PI * 2;
      const phi   = Math.acos(Math.random() * 2 - 1);
      positions[i*3]   = r * Math.sin(phi) * Math.cos(theta);
      positions[i*3+1] = r * Math.sin(phi) * Math.sin(theta) * 0.4; // flatten disc
      positions[i*3+2] = r * Math.cos(phi);

      // Warm/cool star colour variety
      const t = Math.random();
      let col;
      if (t < 0.25)      col = new THREE.Color(0xfff9c4); // yellow dwarf
      else if (t < 0.50) col = new THREE.Color(0xaad4f5); // blue-white
      else if (t < 0.75) col = new THREE.Color(0xffd6a5); // orange giant
      else               col = new THREE.Color(0xff8fa3); // red dwarf
      colors[i*3] = col.r; colors[i*3+1] = col.g; colors[i*3+2] = col.b;
    }
    starGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    starGeo.setAttribute('color',    new THREE.BufferAttribute(colors, 3));

    this.starfield = new THREE.Points(starGeo, new THREE.PointsMaterial({
      size: 1.8, vertexColors: true, transparent: true, opacity: 0.9,
      sizeAttenuation: true
    }));
    this.group.add(this.starfield);

    // Milky Way dust band — thin horizontal haze
    const dustGeo = new THREE.BufferGeometry();
    const dustPos = new Float32Array(1200 * 3);
    for (let i = 0; i < 1200; i++) {
      const a = Math.random() * Math.PI * 2;
      const r = 100 + Math.random() * 300;
      dustPos[i*3]   = Math.cos(a) * r;
      dustPos[i*3+1] = (Math.random() - 0.5) * 18;
      dustPos[i*3+2] = Math.sin(a) * r;
    }
    dustGeo.setAttribute('position', new THREE.BufferAttribute(dustPos, 3));
    this.group.add(new THREE.Points(dustGeo, new THREE.PointsMaterial({
      color: 0xffecd2, size: 3.5, transparent: true, opacity: 0.08,
      blending: THREE.AdditiveBlending
    })));

    // Subtle galactic grid plane
    const grid = new THREE.GridHelper(280, 28, 0x48cae4, 0x1a2a44);
    grid.position.y = -14;
    grid.material.transparent = true;
    grid.material.opacity = 0.18;
    this.group.add(grid);
  }

  _buildEarthBase() {
    this.earthGroup = new THREE.Group();
    this.earthGroup.position.copy(this.earthOrigin);

    const R = 5.8; // Earth visual radius

    // High-poly Earth with procedural texture
    const earthTex = ProceduralTextures.createEarthTexture();
    const earthMesh = new THREE.Mesh(
      new THREE.SphereGeometry(R, 64, 48),
      new THREE.MeshStandardMaterial({ map: earthTex, roughness: 0.42, metalness: 0.08 })
    );
    this.mapEarthMesh = earthMesh;
    this.earthGroup.add(earthMesh);

    // Cloud layer
    const cloudTex = ProceduralTextures.createEarthCloudsTexture();
    this.mapEarthClouds = new THREE.Mesh(
      new THREE.SphereGeometry(R * 1.018, 48, 36),
      new THREE.MeshStandardMaterial({ map: cloudTex, transparent: true, opacity: 0.72, roughness: 0.9 })
    );
    this.earthGroup.add(this.mapEarthClouds);

    // Atmospheric glow
    this.earthGroup.add(ProceduralTextures.createAtmosphericGlow(R, 0x48cae4, 0.5));

    // Docked spaceship
    try {
      const ship = CharacterModelBuilder.createSpaceship();
      ship.scale.setScalar(0.42);
      ship.position.set(0, R + 0.05, 0);
      ship.rotation.z = -0.15;
      this.earthGroup.add(ship);
      this.mapShip = ship;
    } catch (e) { /* spaceship optional */ }

    // Beacon nav light
    this.mapNavLight = new THREE.PointLight(0x00f5d4, 2.2, 20);
    this.mapNavLight.position.set(0, R + 2.5, 0);
    this.earthGroup.add(this.mapNavLight);

    // Anchor ring
    const anchorRing = new THREE.Mesh(
      new THREE.RingGeometry(R * 1.35, R * 1.6, 40),
      new THREE.MeshBasicMaterial({ color: 0x00f5d4, side: THREE.DoubleSide, transparent: true, opacity: 0.7 })
    );
    anchorRing.rotation.x = Math.PI * 0.5;
    this.earthGroup.add(anchorRing);

    // "EARTH — HOME BASE" label sprite
    this.earthGroup.add(this._makeTextSprite('🌍 EARTH  HOME BASE', R + 3.6, 0xffffff));

    // Register Earth as an interactive world node for return-to-Earth navigation
    this.earthNode = {
      data: EARTH_DATA,
      nodeGroup: this.earthGroup,
      planetMesh: earthMesh,
      beacon: anchorRing,
      targetPos: this.earthOrigin.clone()
    };

    this.group.add(this.earthGroup);
  }

  setDeparturePlanet(planet) {
    this.departurePlanet = planet || EARTH_DATA;
  }

  _buildDistanceCorridor() {
    this.corridorGroup = new THREE.Group();

    // Light-Year milestone arcs radiating from Earth position
    const milestones = [
      { ly: 10,   label: '10 LY',   color: 0x48cae4 },
      { ly: 50,   label: '50 LY',   color: 0x90e0ef },
      { ly: 100,  label: '100 LY',  color: 0x0096c7 },
      { ly: 500,  label: '500 LY',  color: 0x0077b6 },
      { ly: 1000, label: '1,000 LY',color: 0x03045e }
    ];

    milestones.forEach((m, idx) => {
      // Radius of the arc = x-offset of that distance from Earth
      const arcRadius = this._distanceToX(m.ly) - this.earthOrigin.x;
      if (arcRadius <= 0) return;

      // Semi-circle arc on the xz-plane, opening rightward
      const arcGeo = new THREE.BufferGeometry();
      const pts = [];
      for (let a = -Math.PI * 0.55; a <= Math.PI * 0.55; a += 0.06) {
        pts.push(new THREE.Vector3(
          this.earthOrigin.x + Math.cos(a) * arcRadius,
          -14,
          Math.sin(a) * arcRadius * 0.8
        ));
      }
      arcGeo.setFromPoints(pts);
      this.corridorGroup.add(new THREE.Line(arcGeo, new THREE.LineBasicMaterial({
        color: m.color, transparent: true, opacity: Math.max(0.06, 0.22 - idx * 0.04)
      })));

      // Small tick mark at the top of the arc
      const topX = this.earthOrigin.x + arcRadius;
      const tickGeo = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(topX, -14, 0),
        new THREE.Vector3(topX, -8, 0)
      ]);
      this.corridorGroup.add(new THREE.Line(tickGeo, new THREE.LineBasicMaterial({
        color: m.color, transparent: true, opacity: 0.55
      })));
    });

    // Solid guide rail from Earth along X axis
    const railGeo = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(this.earthOrigin.x, -14, 0),
      new THREE.Vector3(130, -14, 0)
    ]);
    this.corridorGroup.add(new THREE.Line(railGeo, new THREE.LineBasicMaterial({
      color: 0x48cae4, transparent: true, opacity: 0.35
    })));

    this.group.add(this.corridorGroup);
  }

  _buildTrajectoryLine() {
    // Animated laser trajectory from Earth to selected planet
    const linePositions = new Float32Array(6);
    this.trajectoryGeo = new THREE.BufferGeometry();
    this.trajectoryGeo.setAttribute('position', new THREE.BufferAttribute(linePositions, 3));
    this.trajectoryLine = new THREE.Line(this.trajectoryGeo, new THREE.LineBasicMaterial({
      color: 0x00f5d4, transparent: true, opacity: 0.80
    }));
    this.group.add(this.trajectoryLine);

    // Warp photon pulses
    const pulseCount = 8;
    this.pulsePositions = new Float32Array(pulseCount * 3);
    const pulseGeo = new THREE.BufferGeometry();
    pulseGeo.setAttribute('position', new THREE.BufferAttribute(this.pulsePositions, 3));
    this.pulsePoints = new THREE.Points(pulseGeo, new THREE.PointsMaterial({
      color: 0xffffff, size: 5.0, transparent: true, opacity: 0.9,
      blending: THREE.AdditiveBlending, sizeAttenuation: true
    }));
    this.group.add(this.pulsePoints);
  }

  // ════════════════════════════════════════════════════════════════════════
  //  PLANET NODE POPULATION
  // ════════════════════════════════════════════════════════════════════════

  populateNodes(planets, onPlanetSelected) {
    this.onPlanetSelected = onPlanetSelected;

    // Remove old nodes
    this.planetNodes.forEach(n => this.group.remove(n.nodeGroup));
    this.planetNodes = [];

    planets.forEach((p, idx) => {
      const nodeGroup = new THREE.Group();

      // Layout: X = logarithmic light-year distance corridor from Earth
      // For multi-planet systems sharing near-identical distances, apply subtle longitudinal staggering
      const basePosX = this._distanceToX(p.dist_ly || 40.0);
      const xStagger = ((idx % 7) - 3) * 0.9;
      const posX = basePosX + xStagger;

      // Elegant cylindrical phyllotaxis / golden-angle spiral around central sector corridor
      const goldenAngle = idx * 2.399963;
      const radius = 10.0 + (idx % 4) * 4.5;
      const posY = Math.sin(goldenAngle) * (radius * 0.62);
      const posZ = Math.cos(goldenAngle) * radius;
      nodeGroup.position.set(posX, posY, posZ);

      // ── Planet type colours ────────────────────────────────────────
      let colorHex = 0x3a86ff; // default blue
      if (!p || p.isLiquidWorld)           colorHex = 0x00b4d8; // ocean cyan
      else if ((p.pl_eqt || 0) > 900)      colorHex = 0xff4800; // lava orange
      else if ((p.pl_eqt || 0) > 700)      colorHex = 0xfb5607; // hot amber
      else if (p.isGoldilocks)             colorHex = 0x38b000; // habitable green
      else if ((p.pl_eqt || 300) < 220)    colorHex = 0xa0c4ff; // icy pale blue
      else if ((p.pl_rade || 1) >= 4.0)    colorHex = 0xf4a261; // gas giant tan

      const planetRadius = Math.max(1.0, Math.min(3.2, Math.sqrt(p.pl_rade || 1.0) * 1.1));

      // ── High-poly sphere with procedural texture ───────────────────
      const planetTex = ProceduralTextures.createExoplanetTexture(p);
      const planetMesh = new THREE.Mesh(
        new THREE.SphereGeometry(planetRadius, 48, 36),
        new THREE.MeshStandardMaterial({
          map: planetTex,
          roughness: (p.isLiquidWorld) ? 0.18 : 0.55,
          metalness: (p.isLiquidWorld) ? 0.3  : 0.06,
          flatShading: false
        })
      );
      nodeGroup.add(planetMesh);

      // Atmospheric glow halo (BackSide sphere — cheap but effective)
      nodeGroup.add(new THREE.Mesh(
        new THREE.SphereGeometry(planetRadius * 1.28, 24, 18),
        new THREE.MeshBasicMaterial({
          color: colorHex, side: THREE.BackSide,
          transparent: true, opacity: 0.30,
          blending: THREE.AdditiveBlending
        })
      ));

      // Selection / orbiting beacon ring
      const beaconMesh = new THREE.Mesh(
        new THREE.RingGeometry(planetRadius * 1.5, planetRadius * 1.85, 32),
        new THREE.MeshBasicMaterial({
          color: colorHex, side: THREE.DoubleSide,
          transparent: true, opacity: p.isGoldilocks ? 0.80 : 0.35
        })
      );
      beaconMesh.rotation.x = Math.PI * 0.5;
      nodeGroup.add(beaconMesh);

      // Gas-giant rings (for large planets)
      if ((p.pl_rade || 1) >= 4.0) {
        const ringMesh = new THREE.Mesh(
          new THREE.RingGeometry(planetRadius * 1.5, planetRadius * 2.4, 48),
          new THREE.MeshBasicMaterial({
            color: 0xdda15e, side: THREE.DoubleSide,
            transparent: true, opacity: 0.55
          })
        );
        ringMesh.rotation.x = Math.PI * 0.48;
        nodeGroup.add(ringMesh);
      }

      // Vertical guide stem to grid plane
      const stemH = posY + 14;
      if (Math.abs(stemH) > 0.5) {
        const stem = new THREE.Mesh(
          new THREE.CylinderGeometry(0.045, 0.045, Math.abs(stemH), 4),
          new THREE.MeshBasicMaterial({ color: 0x48cae4, transparent: true, opacity: 0.22 })
        );
        stem.position.y = -stemH * 0.5;
        nodeGroup.add(stem);
      }

      // Planet name label sprite
      nodeGroup.add(this._makeTextSprite(p.pl_name, planetRadius + 2.2, 0xe0fbfc));

      this.group.add(nodeGroup);

      this.planetNodes.push({
        data: p,
        nodeGroup,
        planetMesh,
        beacon: beaconMesh,
        originalColor: colorHex,
        targetPos: new THREE.Vector3(posX, posY, posZ)
      });
    });

    // Select TRAPPIST-1 e by default, or first in list
    const def = this.planetNodes.find(n => n.data.pl_name && n.data.pl_name.includes('TRAPPIST-1 e'))
              || this.planetNodes[0];
    if (def) this.selectPlanet(def);
  }

  /**
   * Filters 3D planet nodes in space so only matching categories or search queries remain prominent,
   * avoiding visual overload.
   */
  filterNodes(filterType = 'all', searchQuery = '') {
    const q = (searchQuery || '').trim().toLowerCase();

    this.planetNodes.forEach(node => {
      const p = node.data;
      let matchesFilter = true;
      if (filterType === 'goldilocks') matchesFilter = Boolean(p.isGoldilocks);
      else if (filterType === 'super-earth') matchesFilter = p.planetType === 'Super-Earth';
      else if (filterType === 'liquid') matchesFilter = Boolean(p.isLiquidWorld);
      else if (filterType === 'lava') matchesFilter = Boolean(p.isLavaWorld) || (p.pl_eqt || 0) > 900;
      else if (filterType === 'gas-giant') matchesFilter = p.planetType === 'Gas Giant' || (p.pl_rade || 1) >= 4.0;
      else if (filterType === 'nearby') matchesFilter = Boolean(p.isNearby) || (p.dist_ly || 999) < 50.0;

      let matchesSearch = true;
      if (q) {
        const name = (p.pl_name || '').toLowerCase();
        const host = (p.hostname || '').toLowerCase();
        const method = (p.discoverymethod || '').toLowerCase();
        const type = (p.planetType || '').toLowerCase();
        matchesSearch = name.includes(q) || host.includes(q) || method.includes(q) || type.includes(q);
      }

      const isVisible = matchesFilter && matchesSearch;
      node.nodeGroup.visible = isVisible;
    });
  }

  // ════════════════════════════════════════════════════════════════════════
  //  SHOW / HIDE / UPDATE
  // ════════════════════════════════════════════════════════════════════════

  show() {
    this.group.visible = true;
    this.mapDistance = 140;
    this.mapYaw   = 0.30;
    this.mapPitch = 0.32;
    this._applyCamera();
    document.getElementById('distance-caliper-banner')?.classList.remove('hidden');
  }

  hide() {
    this.group.visible = false;
    document.getElementById('distance-caliper-banner')?.classList.add('hidden');
  }

  update(delta, time) {
    if (!this.group.visible) return;

    // Earth slow rotation
    if (this.mapEarthMesh)   this.mapEarthMesh.rotation.y   += delta * 0.12;
    if (this.mapEarthClouds) this.mapEarthClouds.rotation.y += delta * 0.19;

    // Ship hover
    if (this.mapShip) this.mapShip.position.y = 5.8 + 1.8 + Math.sin(time * 2.2) * 0.22;

    // Nav light blink
    if (this.mapNavLight) this.mapNavLight.intensity = 1.5 + Math.sin(time * 4.5) * 0.8;

    // Starfield drift
    if (this.starfield) this.starfield.rotation.y += delta * 0.006;

    // Planet node rotation + beacon pulse
    this.planetNodes.forEach(node => {
      node.planetMesh.rotation.y += delta * 0.45;
      const s = 1.0 + Math.sin(time * 2.8 + node.nodeGroup.position.x * 0.1) * 0.09;
      node.beacon.scale.set(s, s, s);
    });

    // Warp trajectory line + photon pulse animation
    if (this.selectedTargetPos) {
      const departure = this.departurePlanet || EARTH_DATA;
      const isFromEarth = departure.pl_name === 'Earth' || departure.isEarth;
      let startPos = this.earthOrigin;
      if (!isFromEarth) {
        const depNode = this.planetNodes.find(n => n.data.pl_name === departure.pl_name);
        if (depNode) startPos = depNode.targetPos;
      }

      const arr = this.trajectoryGeo.attributes.position.array;
      arr[0] = startPos.x; arr[1] = startPos.y; arr[2] = startPos.z;
      arr[3] = this.selectedTargetPos.x; arr[4] = this.selectedTargetPos.y; arr[5] = this.selectedTargetPos.z;
      this.trajectoryGeo.attributes.position.needsUpdate = true;

      this.pulseTime += delta * 0.65;
      const pulseCount = 8;
      for (let i = 0; i < pulseCount; i++) {
        const frac = ((this.pulseTime + i / pulseCount) % 1.0);
        const eased = frac < 0.5 ? 2 * frac * frac : 1 - Math.pow(-2 * frac + 2, 2) * 0.5;
        this.pulsePositions[i*3]   = startPos.x + (this.selectedTargetPos.x - startPos.x) * eased;
        this.pulsePositions[i*3+1] = startPos.y + (this.selectedTargetPos.y - startPos.y) * eased;
        this.pulsePositions[i*3+2] = startPos.z + (this.selectedTargetPos.z - startPos.z) * eased;
      }
      this.pulsePoints.geometry.attributes.position.needsUpdate = true;
    }

    this._applyCamera();
  }

  // ════════════════════════════════════════════════════════════════════════
  //  CAMERA
  // ════════════════════════════════════════════════════════════════════════

  _applyCamera() {
    const cx = this.targetCenter.x + this.mapDistance * Math.cos(this.mapPitch) * Math.sin(this.mapYaw);
    const cy = this.targetCenter.y + this.mapDistance * Math.sin(this.mapPitch);
    const cz = this.targetCenter.z + this.mapDistance * Math.cos(this.mapPitch) * Math.cos(this.mapYaw);
    this.camera.position.set(cx, cy, cz);
    this.camera.up.set(0, 1, 0);
    this.camera.lookAt(this.targetCenter);
  }

  updateCamera() { this._applyCamera(); }

  // ════════════════════════════════════════════════════════════════════════
  //  MOUSE EVENTS — Slow, precise, zero spin
  // ════════════════════════════════════════════════════════════════════════

  onMouseDown(e) {
    this.isDragging = true;
    this.prevMouseX  = e.clientX;
    this.prevMouseY  = e.clientY;
    this.dragStartX  = e.clientX;
    this.dragStartY  = e.clientY;
    this.hasDragged  = false;
  }

  onMouseMove(e) {
    if (!this.isDragging) return;

    const dx = e.clientX - this.prevMouseX;
    const dy = e.clientY - this.prevMouseY;
    this.prevMouseX = e.clientX;
    this.prevMouseY = e.clientY;

    if (Math.hypot(e.clientX - this.dragStartX, e.clientY - this.dragStartY) > 6) {
      this.hasDragged = true;
    }

    // Sensitivity: 0.0028 rad/px  — feels natural, cannot run away
    this.mapYaw   -= dx * 0.0028;
    this.mapPitch  = Math.max(-0.18, Math.min(1.15, this.mapPitch + dy * 0.0028));
  }

  onMouseUp() { this.isDragging = false; }

  onWheel(e) {
    if (!this.group.visible) return;
    this.mapDistance = Math.max(50, Math.min(260, this.mapDistance + e.deltaY * 0.08));
  }

  // ════════════════════════════════════════════════════════════════════════
  //  CLICK / SELECTION
  // ════════════════════════════════════════════════════════════════════════

  handleClick(clientX, clientY) {
    if (!this.group.visible || this.hasDragged) return;

    this.mouse.x = (clientX / window.innerWidth)  *  2 - 1;
    this.mouse.y = -(clientY / window.innerHeight) *  2 + 1;

    this.raycaster.setFromCamera(this.mouse, this.camera);
    const visibleNodes = this.planetNodes.filter(n => n.nodeGroup.visible);
    const meshes = visibleNodes.map(n => n.planetMesh);
    if (this.mapEarthMesh) meshes.push(this.mapEarthMesh);
    const hits   = this.raycaster.intersectObjects(meshes, true);

    if (hits.length > 0) {
      if (hits[0].object === this.mapEarthMesh && this.earthNode) {
        this.selectPlanet(this.earthNode);
      } else {
        const found = visibleNodes.find(n => n.planetMesh === hits[0].object);
        if (found) this.selectPlanet(found);
      }
    }
  }

  selectPlanet(nodeObj) {
    this.selectedPlanet    = nodeObj.data;
    this.selectedTargetPos = nodeObj.targetPos.clone();

    // Highlight selection
    this.planetNodes.forEach(n => {
      n.beacon.material.opacity = (n === nodeObj) ? 0.95 : (n.data.isGoldilocks ? 0.55 : 0.22);
    });

    const departure = this.departurePlanet || EARTH_DATA;
    const isFromEarth = departure.pl_name === 'Earth' || departure.isEarth;
    const isToEarth = nodeObj.data.pl_name === 'Earth' || nodeObj.data.isEarth;

    // Calculate relative distance between departure world and selected world
    const dLy = isFromEarth && isToEarth ? 0.0 : calculateInterstellarDistance(departure, nodeObj.data);
    const dKm = (dLy * 9.461e12).toExponential(2);
    const dPc = (dLy / 3.26156).toFixed(1);
    const warpDays = (dLy * 0.49).toFixed(1);

    // Update Distance Caliper HUD origin and target dynamically
    const originEl = document.getElementById('caliper-origin');
    if (originEl) {
      if (isFromEarth) {
        originEl.textContent = '🌍 Earth (Starting Base • 0 LY)';
      } else {
        originEl.textContent = `🪐 ${departure.pl_name} (Departure World • ${departure.dist_ly || 0} LY from Earth)`;
      }
    }

    const targetEl = document.getElementById('caliper-target-name');
    if (targetEl) {
      if (isToEarth) {
        targetEl.textContent = '🌍 Earth (Home World)';
      } else {
        targetEl.textContent = `🪐 ${nodeObj.data.pl_name}`;
      }
    }

    this._setEl('caliper-dist-value',  `${dLy} Light-Years  (${dKm} km)`);
    this._setEl('caliper-starlight',   `${dLy} Years ago`);
    this._setEl('caliper-warp',        `${warpDays} Warp Days`);
    this._setEl('caliper-parsec',      `${dPc} pc`);

    if (this.onPlanetSelected) this.onPlanetSelected(this.selectedPlanet, dLy, departure);
  }

  selectPlanetByName(name) {
    if (!name) return;
    if (name.toLowerCase() === 'earth') {
      if (this.earthNode) this.selectPlanet(this.earthNode);
      return;
    }
    const found = this.planetNodes.find(n => n.data.pl_name && n.data.pl_name.toLowerCase() === name.toLowerCase());
    if (found) this.selectPlanet(found);
  }

  // ════════════════════════════════════════════════════════════════════════
  //  HELPERS
  // ════════════════════════════════════════════════════════════════════════

  /**
   * Maps a real light-year distance to an X coordinate in the map.
   * Earth = -65, logarithmic scale toward +120.
   */
  _distanceToX(dist_ly) {
    const d = Math.max(0.5, dist_ly || 40.0);
    return this.earthOrigin.x + 14 + Math.log(1 + d) * 16.0;
  }

  // Equivalent public name so game.js can call it
  calculateDistanceCoord(dist_ly) { return this._distanceToX(dist_ly); }

  _setEl(id, text) {
    const el = document.getElementById(id);
    if (el) el.textContent = text;
  }

  /**
   * Creates a canvas-based text sprite label floating above a planet node.
   */
  _makeTextSprite(text, yOffset, colorHex = 0xffffff) {
    const canvas = document.createElement('canvas');
    canvas.width = 512; canvas.height = 80;
    const ctx = canvas.getContext('2d');

    ctx.clearRect(0, 0, 512, 80);
    ctx.fillStyle = `rgba(0,0,0,0.48)`;
    ctx.beginPath();
    ctx.moveTo(16, 4); ctx.lineTo(496, 4);
    ctx.arcTo(508, 4, 508, 16, 12);
    ctx.lineTo(508, 64); ctx.arcTo(508, 76, 496, 76, 12);
    ctx.lineTo(16, 76); ctx.arcTo(4, 76, 4, 64, 12);
    ctx.lineTo(4, 16); ctx.arcTo(4, 4, 16, 4, 12);
    ctx.closePath();
    ctx.fill();

    const col = new THREE.Color(colorHex);
    ctx.fillStyle = `rgb(${Math.round(col.r*255)},${Math.round(col.g*255)},${Math.round(col.b*255)})`;
    ctx.font = 'bold 26px Outfit, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, 256, 42);

    const tex = new THREE.CanvasTexture(canvas);
    const mat = new THREE.SpriteMaterial({ map: tex, transparent: true, opacity: 0.9 });
    const sprite = new THREE.Sprite(mat);
    sprite.position.y = yOffset;
    sprite.scale.set(8, 1.3, 1);
    return sprite;
  }
}
