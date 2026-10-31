// planetGenerator.js - Procedural Low-Poly Spherical Planet Generator with Dynamic Atmosphere
import * as THREE from 'three';
import { CharacterModelBuilder } from './characterModels.js?v=2.5';
import { ProceduralTextures } from './proceduralTextures.js?v=2.5';

export class PlanetGenerator {
  /**
   * Builds the Earth Onboarding Tutorial Planet (Radius: 26 units).
   */
  static buildEarthPlanet() {
    const radius = 26;
    const group = new THREE.Group();
    group.name = 'EarthPlanet';

    // 1. Low-poly Earth sphere with displaced continent vertices
    const sphereGeo = new THREE.IcosahedronGeometry(radius, 4); // Low-poly faceted look
    const pos = sphereGeo.attributes.position;
    const colors = [];

    const deepOcean = new THREE.Color(0x1d3557);
    const shallowWater = new THREE.Color(0x457b9d);
    const lushGrass = new THREE.Color(0x2a9d8f);
    const forestGreen = new THREE.Color(0x264653);
    const mountainPeak = new THREE.Color(0xe9c46a);
    const snowCap = new THREE.Color(0xf1faee);

    const vertex = new THREE.Vector3();
    for (let i = 0; i < pos.count; i++) {
      vertex.fromBufferAttribute(pos, i);
      const normal = vertex.clone().normalize();

      // Procedural pseudo-continents using spherical harmonics
      const n1 = Math.sin(normal.x * 3.5) * Math.cos(normal.y * 3.2) * Math.sin(normal.z * 3.5);
      const n2 = Math.cos(normal.x * 6.0) * Math.sin(normal.z * 6.0) * 0.4;
      const elevation = n1 + n2;

      let col;
      if (Math.abs(normal.y) > 0.82) {
        // Polar ice caps
        col = snowCap;
        vertex.addScaledVector(normal, 0.4);
      } else if (elevation < -0.05) {
        // Deep oceans
        col = deepOcean;
        vertex.addScaledVector(normal, -0.2);
      } else if (elevation < 0.1) {
        // Shallow waters / coastlines
        col = shallowWater;
        vertex.addScaledVector(normal, -0.05);
      } else if (elevation < 0.35) {
        // Lowland plains / grass
        col = lushGrass;
        vertex.addScaledVector(normal, 0.5);
      } else if (elevation < 0.6) {
        // Forest highlands
        col = forestGreen;
        vertex.addScaledVector(normal, 0.9);
      } else {
        // Mountain peaks
        col = mountainPeak;
        vertex.addScaledVector(normal, 1.4);
      }

      pos.setXYZ(i, vertex.x, vertex.y, vertex.z);
      colors.push(col.r, col.g, col.b);
    }

    sphereGeo.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    sphereGeo.computeVertexNormals();

    const planetMat = new THREE.MeshStandardMaterial({
      vertexColors: true,
      roughness: 0.8,
      metalness: 0.1,
      flatShading: true
    });

    const planetMesh = new THREE.Mesh(sphereGeo, planetMat);
    planetMesh.receiveShadow = true;
    planetMesh.castShadow = true;
    group.add(planetMesh);

    // 2. Atmosphere Glow Halo
    const atmosphere = this.createAtmosphereHalo(radius + 1.8, 0x48cae4, 0.28);
    group.add(atmosphere);

    // 3. Clouds layer
    const cloudsGeo = new THREE.IcosahedronGeometry(radius + 1.2, 3);
    const cloudsMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.28,
      roughness: 0.9,
      flatShading: true
    });
    const clouds = new THREE.Mesh(cloudsGeo, cloudsMat);
    group.add(clouds);
    group.userData.clouds = clouds;

    // Track interactive props & physical solid colliders on Earth
    const interactables = [];
    const floraList = [];
    const colliders = [];

    // Helper to position object onto sphere normal & register physical collider
    const placeOnSurface = (obj, latDeg, lonDeg, heightOffset = 0, colliderRadius = 0) => {
      const lat = (latDeg * Math.PI) / 180;
      const lon = (lonDeg * Math.PI) / 180;
      const dir = new THREE.Vector3(
        Math.cos(lat) * Math.sin(lon),
        Math.sin(lat),
        Math.cos(lat) * Math.cos(lon)
      ).normalize();

      const surfacePos = dir.clone().multiplyScalar(radius + heightOffset);
      obj.position.copy(surfacePos);
      obj.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir);
      group.add(obj);

      if (colliderRadius > 0) {
        colliders.push({
          position: surfacePos.clone(),
          radius: colliderRadius,
          name: obj.name || 'Obstacle'
        });
      }

      return { pos: surfacePos, dir };
    };

    // 4. Place Landing Pad & Exploration Spaceship (Northwest Quadrant of Base Camp)
    const landingPad = this.createLandingPad();
    const padLoc = placeOnSurface(landingPad, 28, -32, 0.1);

    const spaceship = CharacterModelBuilder.createSpaceship();
    spaceship.name = 'ExplorationSpaceship';
    const shipLoc = placeOnSurface(spaceship, 28, -32, 0.25, 3.2); // Solid collider: 3.2m hull, resting on landing pad
    spaceship.userData.isSpaceship = true;

    // Mission Flag standing proudly on path entrance to landing pad (clean non-overlapping clearance)
    const missionFlag = this.createMissionFlag();
    missionFlag.name = 'MissionFlag';
    placeOnSurface(missionFlag, 22, -26, 0.1, 0.4);

    // Central courtyard focal direction for camp structures
    const campCenterDir = new THREE.Vector3(
      Math.cos(15 * Math.PI / 180) * Math.sin(-20 * Math.PI / 180),
      Math.sin(15 * Math.PI / 180),
      Math.cos(15 * Math.PI / 180) * Math.cos(-20 * Math.PI / 180)
    ).normalize();

    // Cadet Tom starting position on initial load / reload:
    // Placed far away on an elevated green meadow vista (lat: -12, lon: 25),
    // >20m-29m away from camp so that Professor Spike and the spaceship are completely out of frame.
    const startSpawnDir = new THREE.Vector3(
      Math.cos(-12 * Math.PI / 180) * Math.sin(25 * Math.PI / 180),
      Math.sin(-12 * Math.PI / 180),
      Math.cos(-12 * Math.PI / 180) * Math.cos(25 * Math.PI / 180)
    ).normalize();
    const spawnPosition = startSpawnDir.clone().multiplyScalar(radius + 0.1);

    // Orient spaceship forward towards the central camp courtyard
    const shipUp = shipLoc.dir.clone();
    const shipForward = campCenterDir.clone().sub(shipUp.clone().multiplyScalar(campCenterDir.dot(shipUp))).normalize();
    const shipRight = new THREE.Vector3().crossVectors(shipUp, shipForward).normalize();
    const shipMat = new THREE.Matrix4().makeBasis(shipRight, shipUp, shipForward);
    spaceship.quaternion.setFromRotationMatrix(shipMat);
    spaceship.userData.initialPosition = spaceship.position.clone();
    spaceship.userData.initialQuaternion = spaceship.quaternion.clone();
    group.userData.spaceshipMesh = spaceship;

    interactables.push({
      type: 'SPACESHIP',
      name: 'Exploration Star-Cruiser',
      prompt: '[E] Board Ship & Launch into Space',
      mesh: spaceship,
      position: spaceship.position,
      interactionRadius: 5.8
    });

    // 5. Place Teacher Astronaut NPC & Research Table (Northeast Quadrant: Astrobiology Camp)
    const teacher = CharacterModelBuilder.createAstronaut(true);
    teacher.name = 'ProfessorSpike';
    const teacherLoc = placeOnSurface(teacher, 26, -6, 0.1, 1.2); // Solid collider: 1.2m
    interactables.push({
      type: 'TEACHER',
      name: 'Professor Spike (Astrobiologist)',
      prompt: '[E] Speak with Professor Spike',
      mesh: teacher,
      position: teacher.position,
      interactionRadius: 4.8
    });

    // Rotate Professor Spike and his research table to face the central courtyard directly!
    const teacherUp = teacherLoc.dir.clone();
    const toSpawn = campCenterDir.clone().sub(teacherUp.clone().multiplyScalar(campCenterDir.dot(teacherUp))).normalize();
    const teacherRight = new THREE.Vector3().crossVectors(teacherUp, toSpawn).normalize();
    const teacherMat = new THREE.Matrix4().makeBasis(teacherRight, teacherUp, toSpawn);
    teacher.quaternion.setFromRotationMatrix(teacherMat);
    group.userData.teacherMesh = teacher;

    // 6. Place Mining Core Drill Rig (Southwest Quadrant: Mineral Bedrock Outcrop)
    const drill = CharacterModelBuilder.createMiningDrill();
    drill.name = 'DeepCoreMiningDrill';
    const drillLoc = placeOnSurface(drill, 3, -32, 0.2, 2.0); // Solid collider: 2.0m rig
    drill.userData.isDrill = true;

    // Orient drill forward toward camp courtyard
    const drillUp = drillLoc.dir.clone();
    const drillForward = campCenterDir.clone().sub(drillUp.clone().multiplyScalar(campCenterDir.dot(drillUp))).normalize();
    const drillRight = new THREE.Vector3().crossVectors(drillUp, drillForward).normalize();
    const drillMat = new THREE.Matrix4().makeBasis(drillRight, drillUp, drillForward);
    drill.quaternion.setFromRotationMatrix(drillMat);

    interactables.push({
      type: 'DRILL',
      name: 'Automated Deep Core Rig',
      prompt: '[E] Inspect Core Soil Cross-Section',
      mesh: drill,
      position: drill.position,
      interactionRadius: 4.8
    });

    // 7. Place Lush Trees & Ancient Flora (Southeast Quadrant Specimen + distant continents)
    const treeCoords = [
      { lat: 4, lon: -6, pine: false }, // Research specimen Southeast of Astrobiology Camp
      { lat: 42, lon: 18, pine: true },
      { lat: 38, lon: -55, pine: false },
      { lat: 8, lon: 85, pine: true },
      { lat: -22, lon: 20, pine: false },
      { lat: 18, lon: 110, pine: true },
      { lat: -12, lon: -55, pine: true },
      { lat: 48, lon: 65, pine: false },
      { lat: -28, lon: 72, pine: true },
      { lat: -35, lon: -15, pine: false }
    ];

    treeCoords.forEach((c, idx) => {
      const tree = CharacterModelBuilder.createTree(c.pine);
      tree.name = `Tree_${idx + 1}`;
      const loc = placeOnSurface(tree, c.lat, c.lon, 0.1, 1.35); // Solid trunk collider: 1.35m
      floraList.push(tree);
      interactables.push({
        type: 'PLANT',
        name: c.pine ? `Boreal Pinus Sylvestris #${idx + 1}` : `Quercus Terra (Ancient Oak) #${idx + 1}`,
        prompt: '[E] Scan Biosphere Specimen',
        mesh: tree,
        position: loc.pos,
        interactionRadius: 4.0,
        stats: {
          species: c.pine ? 'Pinus Sylvestris (Earth Pine)' : 'Quercus Terra (Earth Oak)',
          photosynthesisRating: c.pine ? '88% (Coniferous resilience)' : '96% (High efficiency C3)',
          cropGrowthPotential: 'Optimal in nitrogen-rich topsoil',
          oxygenGeneration: '+3.2 kg O2 / month',
          idealTemp: '-15°C to +35°C'
        }
      });
    });

    // 8. Place Low-poly rocks & boulders along mountain trails (spaced far from camp interactables)
    const rockCoords = [
      { lat: 38, lon: -15 }, // Northern mountain ridge
      { lat: -15, lon: -40 }, // Southern mineral ridge
      { lat: 15, lon: 68 },  // Distant continent
      { lat: -6, lon: 35 },   // Distant continent
      { lat: 35, lon: 82 },   // Distant continent
      { lat: -20, lon: 0 }    // Far south
    ];
    rockCoords.forEach((c, idx) => {
      const rock = CharacterModelBuilder.createRock(0x6c757d);
      rock.name = `Rock_${idx + 1}`;
      placeOnSurface(rock, c.lat, c.lon, 0.1, 1.1); // Solid rock collider: 1.1m
    });

    group.userData = {
      radius,
      planetType: 'Earth',
      isLiquidWorld: false,
      interactables,
      colliders,
      spaceshipMesh: spaceship,
      teacherMesh: teacher,
      spawnPosition,
      gravity: 1.0,
      atmosphereDetails: PlanetGenerator.computeAtmosphereDetails({ isEarth: true })
    };

    return group;
  }

  /**
   * Procedurally generates a destination exoplanet using live/fallback NASA TAP parameters.
   * Tailors terrain, colors, and liquid status according to density and equilibrium temperature.
   */
  static buildExoplanet(planetData) {
    if (planetData && (planetData.isEarth || planetData.pl_name === 'Earth')) {
      return PlanetGenerator.buildEarthPlanet();
    }
    const radius = 26; // Standard gameplay sphere radius
    const group = new THREE.Group();
    group.name = `Exoplanet_${planetData.pl_name}`;

    const isLiquid = planetData.isLiquidWorld || (planetData.pl_dens < 2.0);
    const eqt = planetData.pl_eqt || 288;
    const density = planetData.pl_dens || 5.5;

    // Palette selection based on planetary temperature & density
    let terrainBaseCol, terrainHighCol, terrainAccentCol, atmoColor;
    let worldSubtype = 'Temperate Terrestrial';

    if (isLiquid) {
      if (eqt > 450) {
        // Supercritical steam ocean
        worldSubtype = 'Superheated Steam World';
        terrainBaseCol = new THREE.Color(0x023e8a);
        terrainHighCol = new THREE.Color(0x0077b6);
        terrainAccentCol = new THREE.Color(0x90e0ef);
        atmoColor = 0x00b4d8;
      } else {
        // Deep Hycean Ocean
        worldSubtype = 'Hycean Blue Ocean';
        terrainBaseCol = new THREE.Color(0x03045e);
        terrainHighCol = new THREE.Color(0x0096c7);
        terrainAccentCol = new THREE.Color(0x48cae4);
        atmoColor = 0xade8f4;
      }
    } else if (eqt > 700) {
      // Scorched Lava / Basalt world (e.g. 55 Cancri e)
      worldSubtype = 'Scorched Molten World';
      terrainBaseCol = new THREE.Color(0x1a0f0f); // Dark basalt
      terrainHighCol = new THREE.Color(0xd00000); // Glowing magma
      terrainAccentCol = new THREE.Color(0xffba08); // Molten gold
      atmoColor = 0xff4800;
    } else if (eqt > 380) {
      // Scorched Desert / Red canyon world
      worldSubtype = 'Arid Desert Super-Earth';
      terrainBaseCol = new THREE.Color(0x9c6644);
      terrainHighCol = new THREE.Color(0xddb892);
      terrainAccentCol = new THREE.Color(0xb08968);
      atmoColor = 0xf4a261;
    } else if (eqt < 220) {
      // Frozen Cryo World (e.g. TRAPPIST-1 f)
      worldSubtype = 'Cryo Glaciated World';
      terrainBaseCol = new THREE.Color(0x64dfdf);
      terrainHighCol = new THREE.Color(0x72efdd);
      terrainAccentCol = new THREE.Color(0xffffff);
      atmoColor = 0x80ffdb;
    } else {
      // Temperate Habitable World (e.g. TRAPPIST-1 e, Kepler-452 b)
      worldSubtype = 'Lush Alien Bio-World';
      terrainBaseCol = new THREE.Color(0x38b000);
      terrainHighCol = new THREE.Color(0x70e000);
      terrainAccentCol = new THREE.Color(0x9d4edd); // Alien purple flora
      atmoColor = 0x48cae4;
    }

    // 1. Terrain Mesh
    const sphereGeo = new THREE.IcosahedronGeometry(radius, 4);
    const pos = sphereGeo.attributes.position;
    const colors = [];
    const vertex = new THREE.Vector3();
    const originalPositions = [];

    for (let i = 0; i < pos.count; i++) {
      vertex.fromBufferAttribute(pos, i);
      const normal = vertex.clone().normalize();
      originalPositions.push(vertex.clone());

      let col;
      if (isLiquid) {
        // Water planet with calm undulating surface
        col = Math.random() > 0.5 ? terrainBaseCol : terrainHighCol;
      } else {
        // Solid planet with jagged low-poly ridges and craters
        const bump = Math.sin(normal.x * 5.0) * Math.cos(normal.y * 4.5) * Math.sin(normal.z * 5.0);
        const crater = Math.cos(normal.x * 10.0 + normal.z * 10.0) * 0.3;
        const elev = (bump + crater) * 1.5;

        vertex.addScaledVector(normal, elev);
        pos.setXYZ(i, vertex.x, vertex.y, vertex.z);

        if (elev > 0.8) col = terrainAccentCol;
        else if (elev > 0.2) col = terrainHighCol;
        else col = terrainBaseCol;
      }

      colors.push(col.r, col.g, col.b);
    }

    sphereGeo.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    sphereGeo.computeVertexNormals();

    const planetMat = new THREE.MeshStandardMaterial({
      vertexColors: true,
      roughness: isLiquid ? 0.2 : 0.85,
      metalness: isLiquid ? 0.3 : 0.15,
      flatShading: true,
      transparent: isLiquid,
      opacity: isLiquid ? 0.92 : 1.0
    });

    const planetMesh = new THREE.Mesh(sphereGeo, planetMat);
    planetMesh.receiveShadow = true;
    planetMesh.castShadow = true;
    group.add(planetMesh);

    // Save for animated waves if liquid world
    group.userData.planetMesh = planetMesh;
    group.userData.originalPositions = originalPositions;
    group.userData.isLiquidWorld = isLiquid;

    // 2. Atmosphere Glow Halo
    const atmosphere = this.createAtmosphereHalo(radius + 2.0, atmoColor, 0.32);
    group.add(atmosphere);

    // 3. Dynamic Interactive Props & Physical Solid Colliders
    const interactables = [];
    const colliders = [];

    const placeOnSurface = (obj, latDeg, lonDeg, heightOffset = 0, colliderRadius = 0) => {
      const lat = (latDeg * Math.PI) / 180;
      const lon = (lonDeg * Math.PI) / 180;
      const dir = new THREE.Vector3(
        Math.cos(lat) * Math.sin(lon),
        Math.sin(lat),
        Math.cos(lat) * Math.cos(lon)
      ).normalize();

      const surfacePos = dir.clone().multiplyScalar(radius + heightOffset);
      obj.position.copy(surfacePos);
      obj.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir);
      group.add(obj);

      if (colliderRadius > 0) {
        colliders.push({
          position: surfacePos.clone(),
          radius: colliderRadius,
          name: obj.name || 'ExoObstacle'
        });
      }

      return { pos: surfacePos, dir };
    };

    // Central courtyard spawn position on exoplanet (open landing plaza between quadrants)
    const startSpawnDir = new THREE.Vector3(
      Math.cos(20 * Math.PI / 180) * Math.sin(40 * Math.PI / 180),
      Math.sin(20 * Math.PI / 180),
      Math.cos(20 * Math.PI / 180) * Math.cos(40 * Math.PI / 180)
    ).normalize();
    const spawnPosition = startSpawnDir.clone().multiplyScalar(radius + 0.1);

    if (isLiquid) {
      // LIQUID OCEAN WORLD:
      // Spaceship transforms into exploration hydrofoil boat (Northwest Quadrant)
      const boat = CharacterModelBuilder.createExplorationBoat();
      boat.name = 'HydrofoilBoat';
      const boatLoc = placeOnSurface(boat, 32, 26, 0.1, 2.8);

      // Orient boat toward central landing plaza
      const bUp = boatLoc.dir.clone();
      const bForward = startSpawnDir.clone().sub(bUp.clone().multiplyScalar(startSpawnDir.dot(bUp))).normalize();
      const bRight = new THREE.Vector3().crossVectors(bUp, bForward).normalize();
      const bMat = new THREE.Matrix4().makeBasis(bRight, bUp, bForward);
      boat.quaternion.setFromRotationMatrix(bMat);
      boat.userData.initialPosition = boat.position.clone();
      boat.userData.initialQuaternion = boat.quaternion.clone();
      boat.visible = false; // Hidden during atmospheric entry until touchdown!
      group.userData.boatMesh = boat;
      group.userData.spaceshipMesh = boat;
      interactables.push({
        type: 'BOAT',
        name: 'Hydrofoil Research Skiff',
        prompt: '[E] Board Skiff & Launch to Orbit',
        mesh: boat,
        position: boat.position,
        interactionRadius: 5.8
      });

      // Floating scientific buoys spread in distinct quadrants across ocean
      const buoyCoords = [
        { lat: 8, lon: 26 },   // Southwest Marine Lab Buoy
        { lat: 8, lon: 54 },   // Southeast Bioluminescent Kelp Buoy
        { lat: 45, lon: 15 },  // Distant ocean
        { lat: 20, lon: 88 },  // Distant ocean
        { lat: -25, lon: -30 },// Distant ocean
        { lat: 30, lon: -55 }  // Distant ocean
      ];
      buoyCoords.forEach((c, idx) => {
        const buoy = this.createScienceBuoy();
        buoy.name = `ScienceBuoy_${idx + 1}`;
        const loc = placeOnSurface(buoy, c.lat, c.lon, 0.2, 1.4);
        interactables.push({
          type: 'PLANT',
          name: idx === 0 ? 'Marine Lab Buoy #1' : `Floating Ocean Bio-Pod #${idx + 1}`,
          prompt: '[E] Scan Marine Biosphere',
          mesh: buoy,
          position: loc.pos,
          interactionRadius: 4.0,
          stats: {
            species: 'Hydro-Bioluminescent Algae Colony',
            photosynthesisRating: '92% (Aquatic light absorption)',
            cropGrowthPotential: 'Ideal for floating kelp hydroponics',
            salinityConductivity: `${(density * 12).toFixed(1)} mS/cm`,
            deepSeaDepth: 'Estimated 140 km global ocean mantle'
          }
        });
      });
    } else {
      // SOLID GROUND PLANET:
      // Exploration Spaceship landed (Northwest Quadrant of Landing Camp)
      const spaceship = CharacterModelBuilder.createSpaceship();
      spaceship.name = 'ExoSpaceship';
      const shipLoc = placeOnSurface(spaceship, 32, 26, 0.05, 3.2); // Solid collider: 3.2m, resting on surface terrain
      spaceship.userData.isSpaceship = true;

      // Orient spaceship forward toward central camp plaza
      const shipUp = shipLoc.dir.clone();
      const shipForward = startSpawnDir.clone().sub(shipUp.clone().multiplyScalar(startSpawnDir.dot(shipUp))).normalize();
      const shipRight = new THREE.Vector3().crossVectors(shipUp, shipForward).normalize();
      const shipMat = new THREE.Matrix4().makeBasis(shipRight, shipUp, shipForward);
      spaceship.quaternion.setFromRotationMatrix(shipMat);

      spaceship.userData.initialPosition = spaceship.position.clone();
      spaceship.userData.initialQuaternion = spaceship.quaternion.clone();
      spaceship.visible = false; // Hidden during atmospheric entry until touchdown!
      group.userData.spaceshipMesh = spaceship;
      interactables.push({
        type: 'SPACESHIP',
        name: 'Exploration Star-Cruiser',
        prompt: '[E] Board Ship & Launch into Orbit',
        mesh: spaceship,
        position: spaceship.position,
        interactionRadius: 5.8
      });

      // Place Mining Drill at Southwest Quadrant (Mineral Bedrock Ridge)
      const drill = CharacterModelBuilder.createMiningDrill();
      drill.name = 'ExoMiningDrill';
      const drillLoc = placeOnSurface(drill, 8, 26, 0.2, 2.0); // Solid collider: 2.0m, accessible on mineral ridge

      // Orient drill forward toward central camp plaza
      const drillUp = drillLoc.dir.clone();
      const drillForward = startSpawnDir.clone().sub(drillUp.clone().multiplyScalar(startSpawnDir.dot(drillUp))).normalize();
      const drillRight = new THREE.Vector3().crossVectors(drillUp, drillForward).normalize();
      const drillMat = new THREE.Matrix4().makeBasis(drillRight, drillUp, drillForward);
      drill.quaternion.setFromRotationMatrix(drillMat);

      interactables.push({
        type: 'DRILL',
        name: 'Planetary Core Drill',
        prompt: '[E] Inspect Exoplanet Soil Stratum',
        mesh: drill,
        position: drill.position,
        interactionRadius: 4.8
      });

      // Place alien flora / crystals (Southeast Quadrant Specimen + distant terrain)
      const alienCoords = [
        { lat: 8, lon: 54, isCrystal: density > 4.5 }, // Southeast Camp Specimen #1
        { lat: 46, lon: 15, isCrystal: density > 4.5 },
        { lat: 20, lon: 88, isCrystal: eqt > 500 },
        { lat: -25, lon: -30, isCrystal: false },
        { lat: 30, lon: -55, isCrystal: density > 5.0 },
        { lat: -15, lon: 20, isCrystal: false },
        { lat: 50, lon: 75, isCrystal: true }
      ];

      alienCoords.forEach((c, idx) => {
        const item = c.isCrystal
          ? CharacterModelBuilder.createMineralCrystal(0x00f5d4)
          : CharacterModelBuilder.createAlienFlora(eqt > 500 ? 0xff0054 : 0x9d4edd);

        item.name = `AlienFlora_${idx + 1}`;
        const loc = placeOnSurface(item, c.lat, c.lon, 0.1, 1.25); // Solid flora collider: 1.25m
        interactables.push({
          type: 'PLANT',
          name: c.isCrystal ? `Resonant Xenolith Crystal #${idx + 1}` : `Exo-Flora Specimen #${idx + 1}`,
          prompt: '[E] Scan Surface Specimen',
          mesh: item,
          position: loc.pos,
          interactionRadius: 4.0,
          stats: {
            species: c.isCrystal ? 'Piezoelectric Silicate Crystal' : 'Silicon-Based Bioluminescent Fern',
            photosynthesisRating: c.isCrystal ? 'N/A (Crystalline matrix)' : `${Math.min(99, Math.round(eqt * 0.15))}%`,
            cropGrowthPotential: c.isCrystal ? 'Rich in heavy transition elements' : 'Requires greenhouse dome',
            radiationResistance: 'High (Heavy metal crust absorption)',
            mineralLattice: `Density: ${density} g/cm³`
          }
        });
      });
    }

    // Teacher NPC & Research Table (Northeast Quadrant of Landing Camp)
    const teacher = CharacterModelBuilder.createAstronaut(true);
    teacher.name = 'ExoProfessorSpike';
    const teacherLoc = placeOnSurface(teacher, 32, 54, 0.1, 1.2); // Solid collider: 1.2m, beside landing camp

    // Rotate Professor Spike and his research table to face the central camp courtyard directly!
    const teacherUp = teacherLoc.dir.clone();
    const toSpawn = startSpawnDir.clone().sub(teacherUp.clone().multiplyScalar(startSpawnDir.dot(teacherUp))).normalize();
    const teacherRight = new THREE.Vector3().crossVectors(teacherUp, toSpawn).normalize();
    const teacherMat = new THREE.Matrix4().makeBasis(teacherRight, teacherUp, toSpawn);
    teacher.quaternion.setFromRotationMatrix(teacherMat);

    interactables.push({
      type: 'TEACHER',
      name: 'Professor Spike',
      prompt: '[E] Ask Professor Spike about this world',
      mesh: teacher,
      position: teacher.position,
      interactionRadius: 4.8
    });
    group.userData.teacherMesh = teacher;

    const atmosphereDetails = PlanetGenerator.computeAtmosphereDetails(planetData);

    Object.assign(group.userData, {
      radius,
      planetData,
      isLiquidWorld: isLiquid,
      interactables,
      colliders,
      spawnPosition,
      worldSubtype,
      gravity: planetData.surfaceGravity || 1.0,
      atmosphereDetails
    });

    return group;
  }

  /**
   * Computes scientifically grounded atmospheric composition breakdown for HUD and telemetry.
   */
  static computeAtmosphereDetails(planetData) {
    if (!planetData || planetData.isEarth || planetData.pl_name === 'Earth') {
      return {
        n2: '78.08%',
        o2: '20.95%',
        co2: '0.04%',
        h2o: '0.40%',
        pressure: '1.013 bar',
        temperature: '288 K (15.0°C)',
        radiation: '0.27 mSv/yr (Safe Magnetosphere)',
        breathability: '🫁 Breathable (Safe)',
        breathabilityClass: 'breathable'
      };
    }

    const isLiquid = Boolean(planetData.isLiquidWorld || (planetData.pl_dens < 2.0));
    const density = planetData.pl_dens || 5.51;
    const eqt = planetData.pl_eqt || 288;
    const grav = planetData.surfaceGravity || 1.0;

    let n2 = '0.0%', o2 = '0.0%', co2 = '0.0%', h2o = '0.0%', h2 = '0.0%';
    let pressureEst = '1.0 bar';
    let breathability = '🦺 Toxic / Requires EVA Suit';
    let breathabilityClass = 'warning';

    if (isLiquid) {
      h2o = '68.5%';
      h2 = '22.0%';
      co2 = '8.0%';
      n2 = '1.2%';
      o2 = '0.3%';
      pressureEst = `${(density * 4.2).toFixed(1)} bar (Dense steam envelope)`;
      breathability = '🌊 Superheated Steam / High Pressure';
      breathabilityClass = 'warning';
    } else if (eqt > 700) {
      co2 = '94.2%';
      n2 = '4.5%';
      o2 = '0.1%';
      pressureEst = `${(density * 18.0).toFixed(0)} bar (Crushing furnace)`;
      breathability = '🔥 Scorching Furnace (Extreme Hazard)';
      breathabilityClass = 'danger';
    } else if (planetData.isGoldilocks) {
      n2 = '72.4%';
      o2 = '18.6%';
      co2 = '1.8%';
      pressureEst = `${(grav * 1.05).toFixed(2)} bar (Earth-like)`;
      breathability = '🦺 Low O₂ / EVA Gear Advised';
      breathabilityClass = 'warning';
    } else if (eqt < 220) {
      n2 = '62.0%';
      co2 = '34.5%';
      o2 = '0.2%';
      pressureEst = `${(grav * 0.45).toFixed(2)} bar (Thin cryo-envelope)`;
      breathability = '❄️ Sub-Freezing Cryo (EVA Suit Required)';
      breathabilityClass = 'warning';
    } else {
      co2 = '88.0%';
      n2 = '10.2%';
      o2 = '0.1%';
      pressureEst = `${(grav * 0.85).toFixed(2)} bar`;
      breathability = '🦺 Toxic CO₂ (EVA Suit Required)';
      breathabilityClass = 'warning';
    }

    return {
      n2,
      o2,
      co2,
      h2o,
      h2,
      pressure: pressureEst,
      temperature: `${eqt} K (${(eqt - 273.15).toFixed(1)}°C)`,
      radiation: (planetData.pl_insol || 1.0) > 2.0 ? 'High Cosmic Flux' : 'Moderate / Shielded',
      breathability,
      breathabilityClass
    };
  }

  /**
   * Updates liquid ocean wave animation for liquid worlds.
   */
  static updateLiquidWaves(planetGroup, time) {
    if (!planetGroup || !planetGroup.userData.isLiquidWorld) return;
    const mesh = planetGroup.userData.planetMesh;
    const original = planetGroup.userData.originalPositions;
    if (!mesh || !original) return;

    const pos = mesh.geometry.attributes.position;
    const vertex = new THREE.Vector3();

    for (let i = 0; i < pos.count; i++) {
      const orig = original[i];
      const normal = orig.clone().normalize();
      const wave = Math.sin(orig.x * 0.4 + time * 2.2) *
                   Math.cos(orig.z * 0.4 + time * 1.8) * 0.35 +
                   Math.sin(orig.y * 0.6 + time * 3.0) * 0.15;

      vertex.copy(orig).addScaledVector(normal, wave);
      pos.setXYZ(i, vertex.x, vertex.y, vertex.z);
    }
    pos.needsUpdate = true;
    mesh.geometry.computeVertexNormals();
  }

  /**
   * Creates an atmospheric glow shell using backface additive blending.
   */
  static createAtmosphereHalo(radius, colorHex, opacity = 0.3) {
    const geo = new THREE.IcosahedronGeometry(radius, 3);
    const mat = new THREE.MeshBasicMaterial({
      color: colorHex,
      side: THREE.BackSide,
      transparent: true,
      opacity: opacity,
      blending: THREE.AdditiveBlending
    });
    const halo = new THREE.Mesh(geo, mat);
    halo.name = 'AtmosphereHalo';
    return halo;
  }

  /**
   * Creates a landing pad structure on planet surfaces.
   */
  static createLandingPad() {
    const pad = new THREE.Group();
    const concreteMat = new THREE.MeshStandardMaterial({
      color: 0x3d405b,
      roughness: 0.9,
      flatShading: true
    });
    const yellowMat = new THREE.MeshStandardMaterial({
      color: 0xf4a261,
      roughness: 0.5,
      flatShading: true
    });

    const baseGeo = new THREE.CylinderGeometry(3.4, 3.8, 0.3, 8);
    const base = new THREE.Mesh(baseGeo, concreteMat);
    pad.add(base);

    // Chevron cross markings
    const cross1 = new THREE.Mesh(new THREE.BoxGeometry(4.2, 0.35, 0.6), yellowMat);
    const cross2 = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.35, 4.2), yellowMat);
    pad.add(cross1);
    pad.add(cross2);

    return pad;
  }

  /**
   * Creates a mission outpost flag with the planetary ring logo (matching reference artwork).
   */
  static createMissionFlag() {
    const group = new THREE.Group();
    group.name = 'MissionFlag';

    // Metal pole
    const poleMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.3, metalness: 0.8 });
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.05, 2.6, 8), poleMat);
    pole.position.y = 1.3;
    pole.castShadow = true;
    group.add(pole);

    // Gold finial sphere on top
    const goldMat = new THREE.MeshStandardMaterial({ color: 0xf59e0b, roughness: 0.2, metalness: 0.9 });
    const finial = new THREE.Mesh(new THREE.SphereGeometry(0.09, 12, 8), goldMat);
    finial.position.y = 2.65;
    group.add(finial);

    // Flag fabric (Deep navy space flag banner)
    const flagMat = new THREE.MeshStandardMaterial({ color: 0x1d4ed8, roughness: 0.6, side: THREE.DoubleSide });
    const flagGeo = new THREE.PlaneGeometry(1.1, 0.68, 6, 2);
    const pos = flagGeo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      pos.setZ(i, Math.sin(x * 4) * 0.05);
    }
    flagGeo.computeVertexNormals();
    const flag = new THREE.Mesh(flagGeo, flagMat);
    flag.position.set(0.55, 2.2, 0);
    flag.castShadow = true;
    group.add(flag);

    // Golden planetary ring emblem
    const emblemMat = new THREE.MeshBasicMaterial({ color: 0xfbbf24, side: THREE.DoubleSide });
    const planetDisc = new THREE.Mesh(new THREE.CircleGeometry(0.12, 16), emblemMat);
    planetDisc.position.set(0.55, 2.2, 0.02);
    group.add(planetDisc);

    const ringTorus = new THREE.Mesh(new THREE.TorusGeometry(0.2, 0.02, 4, 16), emblemMat);
    ringTorus.rotation.x = 0.45;
    ringTorus.position.set(0.55, 2.2, 0.025);
    group.add(ringTorus);

    // Base mounting pedestal
    const baseMat = new THREE.MeshStandardMaterial({ color: 0x475569, roughness: 0.8 });
    const base = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.4, 0.15, 8), baseMat);
    base.position.y = 0.075;
    group.add(base);

    return group;
  }

  /**
   * Creates a floating scientific buoy for liquid worlds.
   */
  static createScienceBuoy() {
    const buoy = new THREE.Group();
    const floatMat = new THREE.MeshStandardMaterial({
      color: 0xffb703,
      roughness: 0.4,
      metalness: 0.2,
      flatShading: true
    });
    const mastMat = new THREE.MeshStandardMaterial({
      color: 0x023047,
      roughness: 0.7,
      flatShading: true
    });
    const beaconMat = new THREE.MeshBasicMaterial({ color: 0x00f5d4 });

    const floatMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.8, 0.5, 0.6, 6), floatMat);
    buoy.add(floatMesh);

    const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 1.8, 5), mastMat);
    mast.position.y = 0.9;
    buoy.add(mast);

    const beacon = new THREE.Mesh(new THREE.SphereGeometry(0.2, 6, 6), beaconMat);
    beacon.position.y = 1.8;
    buoy.add(beacon);

    return buoy;
  }

  /**
   * Builds an authentic NASA "Eyes on Exoplanets" style High-Poly Planetary System.
   * Features high-poly smooth sphere geometry, procedural photorealistic surface maps,
   * rotating translucent clouds, Rayleigh atmospheric rim scattering, and host star lighting.
   */
  static buildEyesOnExoplanetSystem(planetData, radius = 22) {
    const group = new THREE.Group();
    group.name = `EyesOnSystem_${planetData.pl_name}`;

    const isLiquid = planetData.isLiquidWorld || (planetData.pl_dens < 2.0);
    const radiusScale = planetData.pl_rade || 1.0;
    const eqt = planetData.pl_eqt || 288;
    const hostname = planetData.hostname || 'Host Star';

    // 1. High-Poly Smooth Planet Sphere (64x48 segments, smooth normals)
    const planetGeo = new THREE.SphereGeometry(radius, 64, 48);
    const isEarth = Boolean(planetData.isEarth || planetData.pl_name === 'Earth');
    const planetTex = isEarth ? ProceduralTextures.createEarthTexture() : ProceduralTextures.createExoplanetTexture(planetData);

    const planetMat = new THREE.MeshStandardMaterial({
      map: planetTex,
      roughness: isLiquid ? 0.22 : 0.62,
      metalness: isLiquid ? 0.35 : 0.08,
      flatShading: false
    });

    const planetMesh = new THREE.Mesh(planetGeo, planetMat);
    planetMesh.name = 'HighPolyPlanet';
    planetMesh.castShadow = true;
    planetMesh.receiveShadow = true;
    group.add(planetMesh);

    // 2. Translucent Swirling Cloud Sphere (for temperate, terrestrial, and ocean worlds)
    let cloudsMesh = null;
    if (eqt < 450) {
      const cloudsGeo = new THREE.SphereGeometry(radius * 1.018, 64, 48);
      const cloudsTex = ProceduralTextures.createEarthCloudsTexture();
      const cloudsMat = new THREE.MeshStandardMaterial({
        map: cloudsTex,
        transparent: true,
        opacity: 0.65,
        blending: THREE.NormalBlending,
        roughness: 0.9,
        flatShading: false
      });
      cloudsMesh = new THREE.Mesh(cloudsGeo, cloudsMat);
      cloudsMesh.name = 'AtmosphericClouds';
      group.add(cloudsMesh);
    }

    // 3. Atmospheric Rim Glow (Rayleigh scattering)
    let atmoColor = 0x48cae4;
    if (eqt > 800) atmoColor = 0xff5400; // Scorched amber
    else if (isLiquid) atmoColor = 0x00f5d4; // Cyan
    else if (planetData.isGoldilocks) atmoColor = 0x70e000; // Life-supporting green
    else if (eqt < 220) atmoColor = 0xa0c4ff; // Icy violet

    const halo = ProceduralTextures.createAtmosphericGlow(radius, atmoColor, 0.45);
    group.add(halo);

    // 4. Gas Giant Rings (if gas giant or super-Neptune)
    let ringsMesh = null;
    if (radiusScale >= 3.5 || planetData.pl_name.includes('189733') || planetData.pl_name.includes('WASP')) {
      const ringGeo = new THREE.RingGeometry(radius * 1.45, radius * 2.35, 64);
      const ringTex = ProceduralTextures.createRingsTexture();
      const ringMat = new THREE.MeshStandardMaterial({
        map: ringTex,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.85,
        roughness: 0.5
      });
      ringsMesh = new THREE.Mesh(ringGeo, ringMat);
      ringsMesh.rotation.x = Math.PI * 0.42;
      ringsMesh.rotation.y = 0.2;
      group.add(ringsMesh);
    }

    // 5. Host Star (Eyes on Exoplanets system lighting)
    const starDist = 180;
    const isRedDwarf = hostname.includes('TRAPPIST') || hostname.includes('Proxima');
    const isHotStar = eqt > 1200;
    let starColor = 0xfff3b0; // Default warm yellow
    let starSize = 18;

    if (isRedDwarf) {
      starColor = 0xff4800; // Deep orange-red
      starSize = 13;
    } else if (isHotStar) {
      starColor = 0xd7e3fc; // Brilliant blue-white
      starSize = 24;
    }

    const starGroup = new THREE.Group();
    starGroup.position.set(-starDist, 35, -45);

    const starGeo = new THREE.SphereGeometry(starSize, 32, 32);
    const starMat = new THREE.MeshBasicMaterial({ color: starColor });
    const starMesh = new THREE.Mesh(starGeo, starMat);
    starGroup.add(starMesh);

    // Corona flare
    const coronaGeo = new THREE.SphereGeometry(starSize * 1.6, 24, 24);
    const coronaMat = new THREE.MeshBasicMaterial({
      color: starColor,
      side: THREE.BackSide,
      transparent: true,
      opacity: 0.35,
      blending: THREE.AdditiveBlending
    });
    starGroup.add(new THREE.Mesh(coronaGeo, coronaMat));

    // Directional Sun Light illuminating the planet's day/night terminator!
    const sunLight = new THREE.DirectionalLight(starColor, 2.8);
    sunLight.position.copy(starGroup.position);
    sunLight.target = planetMesh;
    sunLight.castShadow = false; // No shadow map needed in orbital view
    group.add(sunLight);

    // Soft fill light so the dark side isn't completely black (like NASA renders)
    const fillLight = new THREE.AmbientLight(0x2a2a4a, 0.55);
    group.add(fillLight);

    // Gentle rim back-light from opposite the star
    const rimLight = new THREE.DirectionalLight(0x103060, 0.6);
    rimLight.position.set(-starGroup.position.x * 0.5, -10, starGroup.position.z * 0.5);
    group.add(rimLight);

    group.add(starGroup);

    // 6. Orbital path ring
    const orbitRingGeo = new THREE.RingGeometry(starDist - 0.5, starDist + 0.5, 96);
    const orbitRingMat = new THREE.MeshBasicMaterial({
      color: 0x48cae4,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.15
    });
    const orbitRing = new THREE.Mesh(orbitRingGeo, orbitRingMat);
    orbitRing.rotation.x = Math.PI * 0.5;
    orbitRing.position.copy(starGroup.position);
    group.add(orbitRing);

    group.userData = {
      planetMesh,
      cloudsMesh,
      ringsMesh,
      starGroup,
      sunLight,
      fillLight
    };

    return group;
  }

  /**
   * Builds an authentic High-Poly 3D Earth model for the starting base and orbital view.
   */
  static buildHighPolyEarth(radius = 22) {
    const group = new THREE.Group();
    group.name = 'HighPolyEarth';

    const earthGeo = new THREE.SphereGeometry(radius, 64, 48);
    const earthTex = ProceduralTextures.createEarthTexture();
    const earthMat = new THREE.MeshStandardMaterial({
      map: earthTex,
      roughness: 0.45,
      metalness: 0.1,
      flatShading: false
    });
    const earthMesh = new THREE.Mesh(earthGeo, earthMat);
    earthMesh.name = 'EarthPlanetMesh';
    group.add(earthMesh);

    // Swirling Clouds Sphere
    const cloudsGeo = new THREE.SphereGeometry(radius * 1.018, 64, 48);
    const cloudsTex = ProceduralTextures.createEarthCloudsTexture();
    const cloudsMat = new THREE.MeshStandardMaterial({
      map: cloudsTex,
      transparent: true,
      opacity: 0.65,
      blending: THREE.NormalBlending,
      roughness: 0.9,
      flatShading: false
    });
    const cloudsMesh = new THREE.Mesh(cloudsGeo, cloudsMat);
    cloudsMesh.name = 'EarthCloudsMesh';
    group.add(cloudsMesh);

    // Cyan/blue Rayleigh atmospheric rim glow
    const halo = ProceduralTextures.createAtmosphericGlow(radius, 0x48cae4, 0.45);
    group.add(halo);

    group.userData = {
      planetMesh: earthMesh,
      cloudsMesh
    };

    return group;
  }
}
