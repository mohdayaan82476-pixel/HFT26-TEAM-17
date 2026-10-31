// proceduralTextures.js - High-Fidelity Procedural Textures for Eyes on Exoplanets Realistic Rendering
import * as THREE from 'three';

export class ProceduralTextures {
  /**
   * Generates a high-resolution photorealistic Earth map texture.
   */
  static createEarthTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');

    // 1. Ocean Base with deep water & continental shelf gradients
    const oceanGrad = ctx.createLinearGradient(0, 0, 0, 512);
    oceanGrad.addColorStop(0, '#0a2342');
    oceanGrad.addColorStop(0.3, '#0d3b66');
    oceanGrad.addColorStop(0.5, '#124559');
    oceanGrad.addColorStop(0.7, '#0d3b66');
    oceanGrad.addColorStop(1, '#0a2342');
    ctx.fillStyle = oceanGrad;
    ctx.fillRect(0, 0, 1024, 512);

    // 2. Continental Shelf shallow waters
    ctx.fillStyle = 'rgba(72, 202, 228, 0.28)';
    this.drawContinents(ctx, 1024, 512, 12);

    // 3. Continents & Landmasses
    ctx.fillStyle = '#2d6a4f';
    this.drawContinents(ctx, 1024, 512, 0);

    // 4. Arid deserts
    ctx.fillStyle = '#d4a373';
    ctx.beginPath(); ctx.ellipse(540, 240, 95, 38, 0.1, 0, Math.PI * 2); ctx.fill(); // Sahara
    ctx.beginPath(); ctx.ellipse(640, 250, 45, 25, 0.2, 0, Math.PI * 2); ctx.fill(); // Arabia
    ctx.beginPath(); ctx.ellipse(820, 370, 60, 35, 0.0, 0, Math.PI * 2); ctx.fill(); // Australia

    // 5. Mountain chains
    ctx.strokeStyle = '#8d99ae'; ctx.lineWidth = 6;
    ctx.beginPath(); ctx.moveTo(270, 140); ctx.lineTo(260, 240); ctx.stroke(); // Rockies
    ctx.beginPath(); ctx.moveTo(330, 280); ctx.lineTo(340, 440); ctx.stroke(); // Andes
    ctx.beginPath(); ctx.moveTo(680, 210); ctx.lineTo(760, 225); ctx.stroke(); // Himalayas

    // 6. Polar Ice Caps
    const iceGradN = ctx.createLinearGradient(0, 0, 0, 70);
    iceGradN.addColorStop(0, '#ffffff'); iceGradN.addColorStop(0.7, '#e0fbfc'); iceGradN.addColorStop(1, 'rgba(224,251,252,0)');
    ctx.fillStyle = iceGradN; ctx.fillRect(0, 0, 1024, 70);

    const iceGradS = ctx.createLinearGradient(0, 440, 0, 512);
    iceGradS.addColorStop(0, 'rgba(224,251,252,0)'); iceGradS.addColorStop(0.3, '#e0fbfc'); iceGradS.addColorStop(1, '#ffffff');
    ctx.fillStyle = iceGradS; ctx.fillRect(0, 440, 1024, 72);

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.ClampToEdgeWrapping;
    return texture;
  }

  static drawContinents(ctx, w, h, expand = 0) {
    const poly = (coords) => {
      ctx.beginPath();
      coords.forEach(([x, y], idx) => {
        const px = (x / 100) * w;
        const py = (y / 100) * h;
        if (idx === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      });
      ctx.closePath();
      if (expand > 0) { ctx.lineWidth = expand; ctx.lineJoin = 'round'; ctx.stroke(); }
      ctx.fill();
    };
    poly([[14, 15], [32, 14], [38, 28], [30, 48], [24, 46], [18, 38], [12, 28]]); // N. America
    poly([[28, 50], [38, 54], [40, 68], [34, 86], [28, 88], [26, 68]]); // S. America
    poly([[46, 16], [78, 14], [92, 22], [88, 44], [74, 42], [62, 36], [48, 38], [42, 26]]); // Eurasia
    poly([[46, 40], [60, 42], [64, 56], [54, 78], [46, 74], [42, 54]]); // Africa
    poly([[76, 66], [88, 64], [89, 78], [78, 80], [74, 72]]); // Australia
    poly([[38, 8], [46, 10], [42, 18], [36, 16]]); // Greenland
  }

  static createEarthCloudsTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 1024; canvas.height = 512;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, 1024, 512);

    ctx.fillStyle = 'rgba(255, 255, 255, 0.75)';
    for (let x = 0; x < 1024; x += 18) {
      const y = 250 + Math.sin(x * 0.02) * 16 + Math.cos(x * 0.05) * 10;
      const r = 16 + Math.sin(x * 0.03) * 10;
      ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
    }

    const cyclones = [{ x: 260, y: 170, r: 48 }, { x: 740, y: 160, r: 56 }, { x: 380, y: 380, r: 52 }, { x: 820, y: 390, r: 44 }];
    cyclones.forEach(c => {
      for (let a = 0; a < Math.PI * 4; a += 0.35) {
        const dist = (a / (Math.PI * 4)) * c.r;
        const px = c.x + Math.cos(a) * dist;
        const py = c.y + Math.sin(a) * dist * 0.6;
        ctx.beginPath(); ctx.arc(px, py, 6 + (dist / c.r) * 12, 0, Math.PI * 2); ctx.fill();
      }
    });

    ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
    for (let i = 0; i < 90; i++) {
      const px = (i * 12.3) % 1024;
      const py = 90 + ((i * 37.1) % 330);
      ctx.beginPath(); ctx.ellipse(px, py, 28, 8, Math.sin(i) * 0.5, 0, Math.PI * 2); ctx.fill();
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    return texture;
  }

  /**
   * Generates custom high-poly procedural textures based on NASA Exoplanet physical parameters.
   * SAFE: All property accesses are guarded with fallbacks.
   */
  static createExoplanetTexture(planetData) {
    const canvas = document.createElement('canvas');
    canvas.width = 1024; canvas.height = 512;
    const ctx = canvas.getContext('2d');

    // Safe fallback extraction
    const density = (planetData && planetData.pl_dens) ? Number(planetData.pl_dens) : 5.0;
    const eqt = (planetData && planetData.pl_eqt) ? Number(planetData.pl_eqt) : 288;
    const radius = (planetData && planetData.pl_rade) ? Number(planetData.pl_rade) : 1.0;
    const isLiquid = !!(planetData && (planetData.isLiquidWorld || density < 2.0));
    // SAFE hostname check — never call .includes on undefined
    const hostname = (planetData && typeof planetData.hostname === 'string') ? planetData.hostname : '';

    // CASE 1: Molten Lava World
    if (eqt > 900) {
      ctx.fillStyle = '#141419';
      ctx.fillRect(0, 0, 1024, 512);
      for (let i = 0; i < 35; i++) {
        const startX = (i * 31.7) % 1024;
        const startY = 60 + ((i * 43.1) % 390);
        ctx.strokeStyle = '#ff3c00'; ctx.lineWidth = 5;
        ctx.beginPath(); ctx.moveTo(startX, startY);
        let cx = startX, cy = startY;
        for (let s = 0; s < 6; s++) { cx += Math.sin(s + i) * 35; cy += Math.cos(s * 2 + i) * 25; ctx.lineTo(cx, cy); }
        ctx.stroke();
        ctx.strokeStyle = '#ffb703'; ctx.lineWidth = 2; ctx.stroke();
      }
      for (let j = 0; j < 18; j++) {
        const mx = (j * 59.3) % 1024, my = 100 + ((j * 31.7) % 312);
        const grad = ctx.createRadialGradient(mx, my, 4, mx, my, 28);
        grad.addColorStop(0, '#ffeeaa'); grad.addColorStop(0.4, '#ff7700'); grad.addColorStop(0.8, '#aa1100'); grad.addColorStop(1, 'transparent');
        ctx.fillStyle = grad; ctx.beginPath(); ctx.arc(mx, my, 28, 0, Math.PI * 2); ctx.fill();
      }
    }
    // CASE 2: Gas Giant
    else if (radius >= 4.0 || (density < 1.2 && radius > 2.5)) {
      const isCobalt = hostname.includes('189733');
      const bands = isCobalt
        ? ['#03045e', '#0077b6', '#00b4d8', '#023e8a', '#0096c7', '#03045e']
        : ['#dda15e', '#bc6c25', '#fefae0', '#e76f51', '#f4a261', '#264653', '#e9c46a'];
      for (let y = 0; y < 512; y++) {
        ctx.fillStyle = bands[Math.floor((y / 512) * bands.length) % bands.length];
        ctx.fillRect(0, y, 1024, 1);
      }
      for (let b = 0; b < bands.length; b++) {
        const by = (b / bands.length) * 512;
        ctx.fillStyle = 'rgba(255,255,255,0.18)';
        for (let x = 0; x < 1024; x += 4) {
          const waveY = by + Math.sin(x * 0.04 + b) * 12 + Math.cos(x * 0.015) * 8;
          ctx.fillRect(x, waveY, 4, 3);
        }
      }
      const spotX = 620, spotY = 320;
      const stormGrad = ctx.createRadialGradient(spotX, spotY, 6, spotX, spotY, 54);
      stormGrad.addColorStop(0, isCobalt ? '#caf0f8' : '#e63946');
      stormGrad.addColorStop(0.6, isCobalt ? '#0077b6' : '#d62828');
      stormGrad.addColorStop(1, 'transparent');
      ctx.fillStyle = stormGrad; ctx.beginPath(); ctx.ellipse(spotX, spotY, 64, 34, 0.1, 0, Math.PI * 2); ctx.fill();
    }
    // CASE 3: Ocean / Hycean World
    else if (isLiquid) {
      const oceanGrad = ctx.createLinearGradient(0, 0, 0, 512);
      oceanGrad.addColorStop(0, '#001219'); oceanGrad.addColorStop(0.3, '#005f73');
      oceanGrad.addColorStop(0.5, '#0a9396'); oceanGrad.addColorStop(0.7, '#005f73'); oceanGrad.addColorStop(1, '#001219');
      ctx.fillStyle = oceanGrad; ctx.fillRect(0, 0, 1024, 512);
      ctx.fillStyle = 'rgba(148,210,189,0.28)';
      for (let s = 0; s < 40; s++) {
        const sx = (s * 27.3) % 1024, sy = 80 + ((s * 39.1) % 350);
        ctx.beginPath(); ctx.ellipse(sx, sy, 55, 14, Math.sin(s) * 0.4, 0, Math.PI * 2); ctx.fill();
      }
      ctx.fillStyle = 'rgba(255,255,255,0.35)';
      for (let c = 0; c < 24; c++) {
        const cx = (c * 43.7) % 1024, cy = 60 + ((c * 47.9) % 390);
        ctx.beginPath(); ctx.arc(cx, cy, 26, 0, Math.PI * 2); ctx.fill();
      }
    }
    // CASE 4: Habitable / Terrestrial
    else {
      const isRedDwarf = hostname.includes('TRAPPIST') || hostname.includes('Proxima');
      ctx.fillStyle = isRedDwarf ? '#1a2238' : '#1d3557';
      ctx.fillRect(0, 0, 1024, 512);
      ctx.fillStyle = isRedDwarf ? '#8b263e' : '#4f772d';
      for (let c = 0; c < 14; c++) {
        const cx = (c * 79.1) % 1024, cy = 100 + ((c * 67.3) % 312);
        ctx.beginPath(); ctx.ellipse(cx, cy, 75 + Math.sin(c) * 20, 48 + Math.cos(c) * 15, c * 0.3, 0, Math.PI * 2); ctx.fill();
      }
      ctx.fillStyle = isRedDwarf ? '#b56576' : '#90a955';
      for (let m = 0; m < 12; m++) {
        const mx = (m * 91.3) % 1024, my = 120 + ((m * 73.1) % 270);
        ctx.beginPath(); ctx.arc(mx, my, 32, 0, Math.PI * 2); ctx.fill();
      }
      ctx.fillStyle = 'rgba(240,248,255,0.85)';
      ctx.fillRect(0, 0, 1024, 52);
      ctx.fillRect(0, 460, 1024, 52);
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.ClampToEdgeWrapping;
    return texture;
  }

  static createRingsTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 512; canvas.height = 1;
    const ctx = canvas.getContext('2d');
    for (let x = 0; x < 512; x++) {
      const u = x / 512;
      if (u > 0.65 && u < 0.72) {
        ctx.fillStyle = 'rgba(0,0,0,0)';
      } else {
        const alpha = Math.sin(u * Math.PI) * (0.35 + Math.sin(u * 80) * 0.25);
        ctx.fillStyle = `rgba(220,200,180,${Math.max(0, Math.min(0.9, alpha))})`;
      }
      ctx.fillRect(x, 0, 1, 1);
    }
    return new THREE.CanvasTexture(canvas);
  }

  static createAtmosphericGlow(radius, colorHex = 0x48cae4, opacity = 0.45) {
    const glowGeo = new THREE.SphereGeometry(radius * 1.055, 48, 36);
    const glowMat = new THREE.MeshBasicMaterial({
      color: colorHex,
      side: THREE.BackSide,
      transparent: true,
      opacity: opacity,
      blending: THREE.AdditiveBlending
    });
    return new THREE.Mesh(glowGeo, glowMat);
  }
}
