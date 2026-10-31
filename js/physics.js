// physics.js - Spherical Gravity Math, Tangential Movement, and Third-Person Camera Engine
import * as THREE from 'three';

export class SphericalPhysicsEngine {
  constructor() {
    this.playerRadius = 0.85; // Height offset from ground to astronaut pivot
    this.radialVelocity = 0;
    this.isGrounded = true;
    this.isSwimming = false;

    // Third-person camera distance & height
    this.camDistance = 9.5;
    this.camHeight = 3.6;
    this.camPitch = 0.22; // Up/down pitch angle (in radians)

    // Camera forward horizontal tangent vector on planet sphere
    // (Independent of character facing direction, eliminating recursive spinning)
    this.camForward = new THREE.Vector3(0, 0, 1);
    this.characterFacing = new THREE.Vector3(0, 0, 1);

    // Reusable vector scratchpad (zero garbage collection in animation loop)
    this._up = new THREE.Vector3(0, 1, 0);
    this._tangentForward = new THREE.Vector3();
    this._tangentRight = new THREE.Vector3();
    this._moveDir = new THREE.Vector3();
    this._targetCamPos = new THREE.Vector3();
    this._lookTarget = new THREE.Vector3();
    this._matrix = new THREE.Matrix4();
    this._targetQuat = new THREE.Quaternion();
  }

  /**
   * Resets physics state when spawning onto a new planet.
   */
  resetState(spawnPos, planetRadius) {
    this.radialVelocity = 0;
    this.isGrounded = true;
    this.isSwimming = false;
    this.camPitch = 0.22;

    if (spawnPos) {
      this._up.copy(spawnPos).normalize();
      // Initialize tangent vectors at spawn point
      const helper = Math.abs(this._up.y) > 0.9 ? new THREE.Vector3(0, 0, 1) : new THREE.Vector3(0, 1, 0);
      const right = new THREE.Vector3().crossVectors(this._up, helper).normalize();
      this.camForward.crossVectors(right, this._up).normalize();
      this.characterFacing.copy(this.camForward);
    }
  }

  /**
   * Adjusts third-person camera angle from mouse movement.
   * deltaX orbits horizontally around the player on the sphere.
   * deltaY tilts camera pitch up and down.
   */
  applyOrbitDelta(deltaX, deltaY) {
    const sensitivity = 0.0035;

    // Horizontal orbit: rotate camForward around the current spherical normal (up vector)
    if (this._up.lengthSq() > 0.01) {
      this.camForward.applyAxisAngle(this._up, -deltaX * sensitivity);
      // Project strictly onto tangent plane perpendicular to up
      this.camForward.addScaledVector(this._up, -this.camForward.dot(this._up)).normalize();
    }

    // Vertical pitch: clamped so camera cannot flip upside-down
    this.camPitch = Math.max(-0.25, Math.min(0.68, this.camPitch + deltaY * sensitivity));
  }

  /**
   * Zoom camera in and out with mouse wheel.
   */
  applyZoom(deltaY) {
    this.camDistance = Math.max(4.5, Math.min(18.0, this.camDistance + deltaY * 0.008));
  }

  /**
   * Main physics step for spherical planet movement.
   *
   * @param {THREE.Object3D} player - Student astronaut mesh/group
   * @param {THREE.Camera} camera - Three.js camera
   * @param {Object} input - { x: -1..1, y: -1..1, jump: boolean }
   * @param {number} planetRadius - Base sphere radius (e.g. 26)
   * @param {number} gravityMultiplier - Surface gravity in g (e.g. 1.0)
   * @param {boolean} isLiquidWorld - Whether world is fluid ocean
   * @param {number} delta - Frame delta time in seconds
   * @param {Array} colliders - Obstacle positions and radii on planet surface
   * @returns {Object} movement state { isMoving, isJumping, isSwimming }
   */
  update(player, camera, input, planetRadius, gravityMultiplier = 1.0, isLiquidWorld = false, delta = 0.016, colliders = []) {
    const dt = Math.min(delta, 0.05); // Cap spike delta on tab switch
    const planetCenter = new THREE.Vector3(0, 0, 0);

    // 1. Calculate spherical gravity normal vector (Up points from planet center through player)
    this._up.copy(player.position).sub(planetCenter).normalize();
    const upVector = this._up;

    // 2. Project camForward onto tangent plane perpendicular to upVector
    this.camForward.addScaledVector(upVector, -this.camForward.dot(upVector));
    if (this.camForward.lengthSq() < 0.001) {
      const helper = Math.abs(upVector.y) > 0.9 ? new THREE.Vector3(0, 0, 1) : new THREE.Vector3(0, 1, 0);
      const right = new THREE.Vector3().crossVectors(upVector, helper).normalize();
      this.camForward.crossVectors(right, upVector).normalize();
    } else {
      this.camForward.normalize();
    }

    // 3. Tangent basis for WASD movement relative to camera view
    // tangentForward points in direction camera is facing along the sphere surface
    this._tangentForward.copy(this.camForward);
    // tangentRight is 90 degrees to the right of camera view
    this._tangentRight.crossVectors(upVector, this._tangentForward).normalize();

    // 4. Movement Direction from WASD Inputs
    // W (input.y > 0): moves forward (into screen)
    // S (input.y < 0): moves backward (toward camera)
    // D (input.x > 0): moves right (relative to camera view)
    // A (input.x < 0): moves left (relative to camera view)
    this._moveDir.set(0, 0, 0);
    const hasMoveInput = Math.abs(input.x) > 0.05 || Math.abs(input.y) > 0.05;

    if (hasMoveInput) {
      this._moveDir.addScaledVector(this._tangentForward, input.y);
      this._moveDir.addScaledVector(this._tangentRight, input.x);
      this._moveDir.normalize();
      this.characterFacing.copy(this._moveDir);
    }

    // 5. Movement Speed & Swimming Dynamics
    const baseSpeed = isLiquidWorld ? 6.8 : 9.0;
    const moveSpeed = hasMoveInput ? baseSpeed : 0;
    const currentRadius = player.position.length();

    if (hasMoveInput) {
      // True spherical movement: rotate player position around sphere center
      // Angular step dTheta = distance / currentRadius
      const distance = moveSpeed * dt;
      const dTheta = distance / currentRadius;

      // Rotation axis on sphere: Axis = Up x MoveDir
      const moveAxis = new THREE.Vector3().crossVectors(upVector, this._moveDir).normalize();
      player.position.applyAxisAngle(moveAxis, dTheta);

      // Parallel-transport both camForward and characterFacing along sphere curve
      this.camForward.applyAxisAngle(moveAxis, dTheta);
      this.characterFacing.applyAxisAngle(moveAxis, dTheta);

      // Re-calculate updated up vector after movement step
      this._up.copy(player.position).normalize();
      this.camForward.addScaledVector(this._up, -this.camForward.dot(this._up)).normalize();
      this.characterFacing.addScaledVector(this._up, -this.characterFacing.dot(this._up)).normalize();

      // Smoothly rotate character to face movement direction in tangent frame
      const facingForward = this.characterFacing.clone();
      const facingRight = new THREE.Vector3().crossVectors(this._up, facingForward).normalize();
      const actualForward = new THREE.Vector3().crossVectors(facingRight, this._up).normalize();

      this._matrix.makeBasis(facingRight, this._up, actualForward);
      this._targetQuat.setFromRotationMatrix(this._matrix);
      player.quaternion.slerp(this._targetQuat, Math.min(1.0, 14.0 * dt));
    } else {
      // Idle: Keep character upright on sphere while facing last direction
      this.characterFacing.addScaledVector(this._up, -this.characterFacing.dot(this._up)).normalize();
      if (this.characterFacing.lengthSq() > 0.01) {
        const right = new THREE.Vector3().crossVectors(this._up, this.characterFacing).normalize();
        const actualForward = new THREE.Vector3().crossVectors(right, this._up).normalize();
        this._matrix.makeBasis(right, this._up, actualForward);
        this._targetQuat.setFromRotationMatrix(this._matrix);
        player.quaternion.slerp(this._targetQuat, Math.min(1.0, 8.0 * dt));
      } else {
        this._targetQuat.setFromUnitVectors(new THREE.Vector3(0, 1, 0), this._up);
        player.quaternion.slerp(this._targetQuat, Math.min(1.0, 8.0 * dt));
      }
    }

    // 6. Obstacle Collision Resolution (Prevent model from phasing through props)
    if (colliders && colliders.length > 0) {
      const pRad = this.playerRadius || 0.85;
      for (let i = 0; i < colliders.length; i++) {
        const col = colliders[i];
        if (!col || !col.position) continue;

        // Euclidean distance check
        const distSq = player.position.distanceToSquared(col.position);
        const minDist = col.radius + pRad;

        if (distSq < minDist * minDist) {
          const dist = Math.sqrt(distSq);
          // Vector from obstacle to player on the sphere surface
          const pushDir = new THREE.Vector3().subVectors(player.position, col.position);
          // Remove radial normal component so push is purely along the ground tangent
          pushDir.addScaledVector(this._up, -pushDir.dot(this._up));

          if (pushDir.lengthSq() < 0.0001) {
            pushDir.copy(this._tangentRight);
          } else {
            pushDir.normalize();
          }

          // Push player out to collider boundary
          const overlap = minDist - dist;
          player.position.addScaledVector(pushDir, overlap);

          // Maintain proper spherical radius
          player.position.normalize().multiplyScalar(currentRadius);
        }
      }
    }

    // 6. Radial Gravity, Jumping, and Liquid Buoyancy
    const groundHeight = planetRadius + this.playerRadius;
    const g = 18.0 * Math.max(0.3, gravityMultiplier);

    if (isLiquidWorld) {
      // LIQUID OCEAN WORLD PHYSICS
      const oceanSurface = planetRadius + 0.35;
      this.isSwimming = true;

      // Buoyant water resistance & equilibrium float
      const submergedDepth = oceanSurface - player.position.length();
      if (submergedDepth > 0) {
        const buoyancy = 24.0 * submergedDepth;
        this.radialVelocity += buoyancy * dt;
        this.radialVelocity *= Math.pow(0.85, dt * 60); // Water drag
      } else {
        this.radialVelocity -= g * 0.7 * dt;
      }

      // Swim stroke propulsion on Space
      if (input.jump) {
        this.radialVelocity = 5.0;
      }

      // Clamp max depth
      const minOceanFloor = planetRadius - 1.5;
      if (player.position.length() + this.radialVelocity * dt < minOceanFloor) {
        this.radialVelocity = 0;
        player.position.setLength(minOceanFloor);
      }

      this.isGrounded = false;
    } else {
      // SOLID PLANET GRAVITY
      this.isSwimming = false;

      // Pull toward planet center
      this.radialVelocity -= g * dt;

      // Jump input if on ground
      if (input.jump && this.isGrounded) {
        const jumpImpulse = 9.5 / Math.sqrt(Math.max(0.4, gravityMultiplier));
        this.radialVelocity = jumpImpulse;
        this.isGrounded = false;
      }

      // Check ground collision with sphere
      const newRadius = player.position.length() + this.radialVelocity * dt;
      if (newRadius <= groundHeight) {
        this.radialVelocity = 0;
        this.isGrounded = true;
        player.position.setLength(groundHeight);
      } else {
        this.isGrounded = false;
      }
    }

    // Apply radial velocity displacement
    if (this.radialVelocity !== 0) {
      player.position.addScaledVector(this._up, this.radialVelocity * dt);
    }

    // 7. Smooth Third-Person Follow Camera
    this.updateCamera(camera, player, this._up, dt);

    return {
      isMoving: hasMoveInput,
      isJumping: !this.isGrounded && !this.isSwimming,
      isSwimming: this.isSwimming,
      radialVelocity: this.radialVelocity
    };
  }

  /**
   * Smoothly positions third-person camera behind player along the horizontal view axis.
   * Completely decoupled from character turning to eliminate any camera spinning.
   */
  updateCamera(camera, player, upVector, dt) {
    const forward = this.camForward.clone().normalize();
    const right = new THREE.Vector3().crossVectors(upVector, forward).normalize();

    // Base backward direction (directly behind where camera looks)
    const backVector = forward.clone().negate();

    // Tilt backVector upwards with camPitch around right axis
    backVector.applyAxisAngle(right, -this.camPitch);

    // Target camera position: behind and above player on sphere
    this._targetCamPos.copy(player.position)
      .addScaledVector(upVector, this.camHeight)
      .addScaledVector(backVector, this.camDistance);

    // Smooth lerp camera position
    camera.position.lerp(this._targetCamPos, Math.min(1.0, 10.0 * dt));

    // Align camera's UP vector with planet's spherical UP
    camera.up.lerp(upVector, Math.min(1.0, 10.0 * dt)).normalize();

    // Look at player chest
    this._lookTarget.copy(player.position).addScaledVector(upVector, 1.4);
    camera.lookAt(this._lookTarget);
  }
}
