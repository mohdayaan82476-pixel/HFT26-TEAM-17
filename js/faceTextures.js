// faceTextures.js - Procedural Kawaii Face Texture Generator for Cat & Dog Astronauts
// Generates high-quality canvas-based face textures matching the cute reference artwork
import * as THREE from 'three';

export class FaceTextureGenerator {

  /**
   * Creates a kawaii cat face texture (canvas-drawn)
   * Grey/white fur, big sparkly black eyes, pink triangle nose,
   * smiling mouth, rosy cheeks, whisker dots
   */
  static createCatFaceTexture(size = 512) {
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    const cx = size / 2;
    const cy = size / 2;

    // --- Background: Face fur base (warm white) ---
    ctx.fillStyle = '#f8f4f0';
    ctx.beginPath();
    ctx.arc(cx, cy, size * 0.48, 0, Math.PI * 2);
    ctx.fill();

    // --- Grey fur patch on top of head ---
    ctx.fillStyle = '#8d99ae';
    ctx.beginPath();
    ctx.ellipse(cx, cy * 0.55, size * 0.4, size * 0.28, 0, Math.PI, 0);
    ctx.fill();

    // Grey fur patch center dip (like the reference - V-shape between eyes)
    ctx.fillStyle = '#8d99ae';
    ctx.beginPath();
    ctx.moveTo(cx - size * 0.18, cy * 0.45);
    ctx.quadraticCurveTo(cx, cy * 0.85, cx + size * 0.18, cy * 0.45);
    ctx.quadraticCurveTo(cx, cy * 0.55, cx - size * 0.18, cy * 0.45);
    ctx.fill();

    // --- White muzzle area ---
    ctx.fillStyle = '#fefcfa';
    ctx.beginPath();
    ctx.ellipse(cx, cy + size * 0.08, size * 0.28, size * 0.22, 0, 0, Math.PI * 2);
    ctx.fill();

    // --- BIG expressive eyes ---
    const eyeY = cy - size * 0.02;
    const eyeSpacing = size * 0.135;
    const eyeW = size * 0.115;
    const eyeH = size * 0.14;

    // Eye whites (slight off-white)
    [cx - eyeSpacing, cx + eyeSpacing].forEach(ex => {
      ctx.fillStyle = '#fefefe';
      ctx.beginPath();
      ctx.ellipse(ex, eyeY, eyeW + 2, eyeH + 2, 0, 0, Math.PI * 2);
      ctx.fill();
    });

    // Main black iris
    [cx - eyeSpacing, cx + eyeSpacing].forEach(ex => {
      ctx.fillStyle = '#1a1a24';
      ctx.beginPath();
      ctx.ellipse(ex, eyeY, eyeW, eyeH, 0, 0, Math.PI * 2);
      ctx.fill();
    });

    // Large white highlight sparkle (top-right of each eye)
    [cx - eyeSpacing, cx + eyeSpacing].forEach(ex => {
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(ex + eyeW * 0.3, eyeY - eyeH * 0.3, size * 0.035, 0, Math.PI * 2);
      ctx.fill();
      // Small secondary sparkle
      ctx.beginPath();
      ctx.arc(ex - eyeW * 0.2, eyeY + eyeH * 0.15, size * 0.015, 0, Math.PI * 2);
      ctx.fill();
    });

    // --- Cute pink triangle nose ---
    const noseY = cy + size * 0.08;
    ctx.fillStyle = '#ff758f';
    ctx.beginPath();
    ctx.moveTo(cx, noseY + size * 0.025);
    ctx.lineTo(cx - size * 0.035, noseY - size * 0.02);
    ctx.lineTo(cx + size * 0.035, noseY - size * 0.02);
    ctx.closePath();
    ctx.fill();

    // --- Smiling mouth (W-shape like a cat) ---
    ctx.strokeStyle = '#2b2d42';
    ctx.lineWidth = size * 0.01;
    ctx.lineCap = 'round';

    // Left curve of mouth
    ctx.beginPath();
    ctx.moveTo(cx, noseY + size * 0.035);
    ctx.quadraticCurveTo(cx - size * 0.07, noseY + size * 0.1, cx - size * 0.12, noseY + size * 0.06);
    ctx.stroke();

    // Right curve of mouth
    ctx.beginPath();
    ctx.moveTo(cx, noseY + size * 0.035);
    ctx.quadraticCurveTo(cx + size * 0.07, noseY + size * 0.1, cx + size * 0.12, noseY + size * 0.06);
    ctx.stroke();

    // --- Rosy pink cheek blush circles ---
    const blushY = cy + size * 0.08;
    const blushX = size * 0.2;
    ctx.fillStyle = 'rgba(255, 181, 167, 0.55)';
    ctx.beginPath();
    ctx.ellipse(cx - blushX, blushY, size * 0.06, size * 0.04, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(cx + blushX, blushY, size * 0.06, size * 0.04, 0, 0, Math.PI * 2);
    ctx.fill();

    // --- Whisker dots (3 dots on each side of nose) ---
    ctx.fillStyle = '#8d99ae';
    const dotSize = size * 0.008;
    [-1, 1].forEach(side => {
      for (let i = 0; i < 3; i++) {
        const dx = side * (size * 0.08 + i * size * 0.025);
        const dy = noseY + size * 0.01 + (i === 1 ? -size * 0.015 : i === 2 ? size * 0.015 : 0);
        ctx.beginPath();
        ctx.arc(cx + dx, dy, dotSize, 0, Math.PI * 2);
        ctx.fill();
      }
    });

    const texture = new THREE.CanvasTexture(canvas);
    texture.needsUpdate = true;
    return texture;
  }

  /**
   * Creates a kawaii dog face texture (canvas-drawn)
   * Tan/brown fur, brown eye-patch, big sparkly eyes,
   * dark round nose, happy open mouth, rosy cheeks
   */
  static createDogFaceTexture(size = 512) {
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    const cx = size / 2;
    const cy = size / 2;

    // --- Background: Face fur base (warm tan) ---
    ctx.fillStyle = '#e8cdb5';
    ctx.beginPath();
    ctx.arc(cx, cy, size * 0.48, 0, Math.PI * 2);
    ctx.fill();

    // --- Brown fur patches (top of head and around left eye area) ---
    ctx.fillStyle = '#b07d62';
    ctx.beginPath();
    ctx.ellipse(cx, cy * 0.5, size * 0.42, size * 0.3, 0, Math.PI, 0);
    ctx.fill();

    // Brown patch over left eye area (like the reference puppy)
    ctx.fillStyle = '#b07d62';
    ctx.beginPath();
    ctx.ellipse(cx - size * 0.1, cy - size * 0.05, size * 0.16, size * 0.18, -0.2, 0, Math.PI * 2);
    ctx.fill();

    // Brown patch over right side of face
    ctx.fillStyle = '#c49a7c';
    ctx.beginPath();
    ctx.ellipse(cx + size * 0.14, cy - size * 0.06, size * 0.13, size * 0.15, 0.15, 0, Math.PI * 2);
    ctx.fill();

    // --- Cream/white muzzle area ---
    ctx.fillStyle = '#fefae0';
    ctx.beginPath();
    ctx.ellipse(cx, cy + size * 0.1, size * 0.26, size * 0.2, 0, 0, Math.PI * 2);
    ctx.fill();

    // --- BIG expressive puppy eyes ---
    const eyeY = cy - size * 0.03;
    const eyeSpacing = size * 0.135;
    const eyeW = size * 0.11;
    const eyeH = size * 0.135;

    // Eye whites
    [cx - eyeSpacing, cx + eyeSpacing].forEach(ex => {
      ctx.fillStyle = '#fefefe';
      ctx.beginPath();
      ctx.ellipse(ex, eyeY, eyeW + 2, eyeH + 2, 0, 0, Math.PI * 2);
      ctx.fill();
    });

    // Main black iris
    [cx - eyeSpacing, cx + eyeSpacing].forEach(ex => {
      ctx.fillStyle = '#1a1a24';
      ctx.beginPath();
      ctx.ellipse(ex, eyeY, eyeW, eyeH, 0, 0, Math.PI * 2);
      ctx.fill();
    });

    // Sparkle highlights
    [cx - eyeSpacing, cx + eyeSpacing].forEach(ex => {
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(ex + eyeW * 0.28, eyeY - eyeH * 0.28, size * 0.035, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(ex - eyeW * 0.22, eyeY + eyeH * 0.18, size * 0.014, 0, Math.PI * 2);
      ctx.fill();
    });

    // --- Cute round dark puppy nose ---
    const noseY = cy + size * 0.06;
    ctx.fillStyle = '#3d2b1f';
    ctx.beginPath();
    ctx.ellipse(cx, noseY, size * 0.055, size * 0.04, 0, 0, Math.PI * 2);
    ctx.fill();
    // Nose highlight
    ctx.fillStyle = 'rgba(255,255,255,0.25)';
    ctx.beginPath();
    ctx.ellipse(cx - size * 0.015, noseY - size * 0.015, size * 0.02, size * 0.012, -0.3, 0, Math.PI * 2);
    ctx.fill();

    // --- Happy open smiling mouth ---
    ctx.strokeStyle = '#2b2d42';
    ctx.lineWidth = size * 0.01;
    ctx.lineCap = 'round';

    // Open mouth curve
    ctx.beginPath();
    ctx.moveTo(cx - size * 0.1, noseY + size * 0.04);
    ctx.quadraticCurveTo(cx, noseY + size * 0.12, cx + size * 0.1, noseY + size * 0.04);
    ctx.stroke();

    // Mouth interior (dark open mouth)
    ctx.fillStyle = '#4a1a2e';
    ctx.beginPath();
    ctx.moveTo(cx - size * 0.08, noseY + size * 0.045);
    ctx.quadraticCurveTo(cx, noseY + size * 0.1, cx + size * 0.08, noseY + size * 0.045);
    ctx.closePath();
    ctx.fill();

    // Little pink tongue peeking out
    ctx.fillStyle = '#ff85a1';
    ctx.beginPath();
    ctx.ellipse(cx, noseY + size * 0.09, size * 0.04, size * 0.025, 0, 0, Math.PI);
    ctx.fill();

    // --- Rosy cheek blush ---
    const blushY = cy + size * 0.07;
    const blushX = size * 0.2;
    ctx.fillStyle = 'rgba(255, 160, 140, 0.5)';
    ctx.beginPath();
    ctx.ellipse(cx - blushX, blushY, size * 0.055, size * 0.038, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(cx + blushX, blushY, size * 0.055, size * 0.038, 0, 0, Math.PI * 2);
    ctx.fill();

    const texture = new THREE.CanvasTexture(canvas);
    texture.needsUpdate = true;
    return texture;
  }

  /**
   * Loads and extracts the exact face crop from the uploaded reference artwork!
   * isDog = false -> Student Cat face (Cadet Tom)
   * isDog = true  -> Teacher Dog face (Professor Spike)
   */
  static createExactImageFaceTexture(isDog = false, size = 512) {
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');

    // First draw procedural kawaii backup so canvas is never empty while loading
    if (isDog) {
      const backupTex = this.createDogFaceTexture(size);
      ctx.drawImage(backupTex.image, 0, 0);
    } else {
      const backupTex = this.createCatFaceTexture(size);
      ctx.drawImage(backupTex.image, 0, 0);
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.needsUpdate = true;

    // Load pre-extracted high-res transparent face PNG
    const pngPath = isDog ? 'assets/dog_face.png' : 'assets/cat_face.png';
    const img = new Image();
    img.src = pngPath;
    img.onload = () => {
      ctx.clearRect(0, 0, size, size);
      ctx.drawImage(img, 0, 0, size, size);
      texture.needsUpdate = true;
    };
    img.onerror = () => {
      // Fallback: extract directly from characters.jpg
      const fallbackImg = new Image();
      fallbackImg.src = 'assets/characters.jpg';
      fallbackImg.onload = () => {
        const iw = fallbackImg.naturalWidth || fallbackImg.width;
        const ih = fallbackImg.naturalHeight || fallbackImg.height;
        let sx, sy, sw, sh;
        if (!isDog) {
          sw = iw * 0.235;
          sh = ih * 0.35;
          sx = iw * 0.225;
          sy = ih * 0.245;
        } else {
          sw = iw * 0.235;
          sh = ih * 0.35;
          sx = iw * 0.555;
          sy = ih * 0.255;
        }
        ctx.clearRect(0, 0, size, size);
        ctx.save();
        ctx.beginPath();
        ctx.arc(size / 2, size / 2, size * 0.48, 0, Math.PI * 2);
        ctx.closePath();
        ctx.clip();
        ctx.drawImage(fallbackImg, sx, sy, sw, sh, 0, 0, size, size);
        ctx.restore();
        texture.needsUpdate = true;
      };
    };

    return texture;
  }

  /**
   * Creates a face disc mesh with the given texture, positioned inside the visor.
   * Returns a THREE.Mesh of a slightly curved circular disc that cleanly fits inside the visor bezel.
   */
  static createFacePlane(texture, radius = 0.38) {
    const geo = new THREE.CircleGeometry(radius, 32);

    // Slightly curve the circular disc outward for natural facial depth
    const pos = geo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const y = pos.getY(i);
      const r = Math.sqrt(x * x + y * y) / radius;
      const z = Math.max(0, 1 - r * r) * 0.04;
      pos.setZ(i, z);
    }
    geo.computeVertexNormals();

    const mat = new THREE.MeshBasicMaterial({
      map: texture,
      transparent: true,
      side: THREE.FrontSide,
      depthTest: true,
      depthWrite: false, // Prevents transparent depth occlusion
      polygonOffset: true,
      polygonOffsetFactor: -1,
      polygonOffsetUnits: -1
    });

    const mesh = new THREE.Mesh(geo, mat);
    mesh.renderOrder = 10;
    return mesh;
  }
}
