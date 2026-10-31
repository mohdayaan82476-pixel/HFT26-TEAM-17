// characterModels.js - Adorable Animal Crossing Low-Poly 3D Astronauts (Tom & Professor Spike), Rocket, Boat & Rig
import * as THREE from 'three';
import { FaceTextureGenerator } from './faceTextures.js?v=2.5';

export class CharacterModelBuilder {
  /**
   * Creates the adorable Cat Astronaut (Student - Cadet Tom)
   * Inspired by the reference artwork: Pointy cat ears through helmet, cute cat face,
   * red stripes, blue square & red circle buttons, pink paw pads, and fluffy curved cat tail.
   */
  static createCatAstronaut() {
    const group = new THREE.Group();
    group.name = 'StudentCatAstronaut';

    // Materials
    const suitWhite = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.55,
      metalness: 0.1,
      flatShading: true
    });

    const stripeRed = new THREE.MeshStandardMaterial({
      color: 0xef233c,
      roughness: 0.45,
      metalness: 0.15,
      flatShading: true
    });

    const furGrey = new THREE.MeshStandardMaterial({
      color: 0x8d99ae,
      roughness: 0.7,
      flatShading: true
    });

    const furWhite = new THREE.MeshStandardMaterial({
      color: 0xf8f9fa,
      roughness: 0.7,
      flatShading: true
    });

    const earPink = new THREE.MeshStandardMaterial({
      color: 0xffb5a7,
      roughness: 0.6,
      flatShading: true
    });

    const nosePink = new THREE.MeshStandardMaterial({
      color: 0xff758f,
      roughness: 0.4,
      flatShading: true
    });

    const eyeBlack = new THREE.MeshBasicMaterial({ color: 0x1a1a24 });
    const eyeHighlight = new THREE.MeshBasicMaterial({ color: 0xffffff });

    const btnBlue = new THREE.MeshStandardMaterial({
      color: 0x3a86ff,
      roughness: 0.4,
      metalness: 0.2,
      flatShading: true
    });

    const darkMat = new THREE.MeshStandardMaterial({
      color: 0x2b2d42,
      roughness: 0.8,
      flatShading: true
    });

    const visorGlass = new THREE.MeshStandardMaterial({
      color: 0x3a86ff,
      roughness: 0.1,
      metalness: 0.85,
      transparent: true,
      opacity: 0.35,
      flatShading: true
    });

    // 1. Torso
    const torsoGeo = new THREE.CylinderGeometry(0.36, 0.42, 0.72, 8);
    const torso = new THREE.Mesh(torsoGeo, suitWhite);
    torso.position.y = 0.85;
    torso.castShadow = true;
    torso.receiveShadow = true;
    group.add(torso);

    // Collar Red Stripe
    const collarGeo = new THREE.TorusGeometry(0.38, 0.04, 6, 12);
    const collar = new THREE.Mesh(collarGeo, stripeRed);
    collar.rotation.x = Math.PI * 0.5;
    collar.position.y = 1.2;
    group.add(collar);

    // Chest Control Console (Blue Square on left, Red Circle on right)
    const btnSquareGeo = new THREE.BoxGeometry(0.12, 0.12, 0.06);
    const btnSquare = new THREE.Mesh(btnSquareGeo, btnBlue);
    btnSquare.position.set(-0.11, 0.95, 0.38);
    group.add(btnSquare);

    const btnCircleGeo = new THREE.CylinderGeometry(0.06, 0.06, 0.06, 8);
    btnCircleGeo.rotateX(Math.PI * 0.5);
    const btnCircle = new THREE.Mesh(btnCircleGeo, stripeRed);
    btnCircle.position.set(0.11, 0.95, 0.38);
    group.add(btnCircle);

    // Utility Belt with silver buckle
    const beltGeo = new THREE.CylinderGeometry(0.43, 0.43, 0.1, 8);
    const belt = new THREE.Mesh(beltGeo, darkMat);
    belt.position.y = 0.58;
    group.add(belt);

    const buckleGeo = new THREE.BoxGeometry(0.14, 0.12, 0.06);
    const buckle = new THREE.Mesh(buckleGeo, suitWhite);
    buckle.position.set(0, 0.58, 0.42);
    group.add(buckle);

    // 2. Head & Helmet (High-Fidelity Match with Reference Artwork)
    const headGroup = new THREE.Group();
    headGroup.position.y = 1.5;

    // A. Character Head Sphere (Warm White Fur)
    // Placed at z = -0.06 with radius 0.42 so its front surface stops at z = +0.36
    const headGeo = new THREE.SphereGeometry(0.42, 24, 20);
    const headMesh = new THREE.Mesh(headGeo, furWhite);
    headMesh.position.set(0, 0, -0.06);
    headMesh.castShadow = true;
    headGroup.add(headMesh);

    // B. Helmet Cowl Shell - Covers the back, top, bottom, and sides
    // -Math.PI * 0.5 rotates the cowl to cover the BACK of the head, leaving the FRONT wide open!
    const cowlGeo = new THREE.SphereGeometry(0.53, 24, 18, 0, Math.PI * 2, 0, Math.PI * 0.58);
    cowlGeo.rotateX(-Math.PI * 0.5);
    const cowl = new THREE.Mesh(cowlGeo, suitWhite);
    cowl.position.set(0, 0, -0.04);
    cowl.castShadow = true;
    headGroup.add(cowl);

    // C. White Visor Frame / Bezel Ring (Framing the face opening)
    const rimGeo = new THREE.TorusGeometry(0.41, 0.055, 16, 32);
    rimGeo.scale(1.0, 1.12, 1.0);
    const rim = new THREE.Mesh(rimGeo, suitWhite);
    rim.position.set(0, 0.01, 0.35);
    headGroup.add(rim);

    // D. Red Racing Stripe along Helmet Crown
    const stripeGeo = new THREE.BoxGeometry(0.16, 0.045, 0.44);
    const helmetStripe = new THREE.Mesh(stripeGeo, stripeRed);
    helmetStripe.position.set(0, 0.52, -0.08);
    headGroup.add(helmetStripe);

    // E. Red Ear Communicator Cups with White Center Caps
    const discGeo = new THREE.CylinderGeometry(0.15, 0.15, 0.08, 16);
    discGeo.rotateZ(Math.PI * 0.5);
    const discL = new THREE.Mesh(discGeo, stripeRed);
    discL.position.set(-0.52, 0, 0);
    const capL = new THREE.Mesh(new THREE.SphereGeometry(0.11, 12, 8), suitWhite);
    capL.position.set(-0.55, 0, 0);
    headGroup.add(discL);
    headGroup.add(capL);

    const discR = new THREE.Mesh(discGeo, stripeRed);
    discR.position.set(0.52, 0, 0);
    const capR = new THREE.Mesh(new THREE.SphereGeometry(0.11, 12, 8), suitWhite);
    capR.position.set(0.55, 0, 0);
    headGroup.add(discR);
    headGroup.add(capR);

    // F. Cute Pointy Cat Ears (Grey outer, pink inner) poking out through helmet slots
    const createCatEar = (isLeft) => {
      const earGroup = new THREE.Group();
      const earOuterGeo = new THREE.ConeGeometry(0.18, 0.38, 4);
      earOuterGeo.rotateY(Math.PI * 0.25);
      const earOuter = new THREE.Mesh(earOuterGeo, furGrey);
      earGroup.add(earOuter);

      const earInnerGeo = new THREE.ConeGeometry(0.13, 0.30, 4);
      earInnerGeo.rotateY(Math.PI * 0.25);
      const earInner = new THREE.Mesh(earInnerGeo, earPink);
      earInner.position.set(0, -0.02, 0.04);
      earGroup.add(earInner);

      earGroup.position.set(isLeft ? -0.30 : 0.30, 0.50, 0.02);
      earGroup.rotation.z = isLeft ? 0.22 : -0.22;
      earGroup.rotation.x = -0.12;
      return earGroup;
    };
    headGroup.add(createCatEar(true));
    headGroup.add(createCatEar(false));

    // G. HIGH-FIDELITY FACE MESH (From User Reference Artwork)
    // Curved circular disc positioned neatly inside the white helmet visor ring (z = 0.35)
    const catFaceTex = FaceTextureGenerator.createExactImageFaceTexture(false);
    const faceMesh = FaceTextureGenerator.createFacePlane(catFaceTex, 0.38);
    faceMesh.position.set(0, 0.0, 0.35);
    headGroup.add(faceMesh);

    group.add(headGroup);

    // 3. Life-Support Backpack
    const packGeo = new THREE.BoxGeometry(0.48, 0.55, 0.28);
    const pack = new THREE.Mesh(packGeo, suitWhite);
    pack.position.set(0, 0.9, -0.4);
    pack.castShadow = true;
    group.add(pack);

    // Backpack red trim stripes
    const packStripeGeo = new THREE.BoxGeometry(0.5, 0.1, 0.3);
    const packStripe = new THREE.Mesh(packStripeGeo, stripeRed);
    packStripe.position.set(0, 0.98, -0.4);
    group.add(packStripe);

    // 4. Fluffy Curved Cat Tail (grey with white tip) poking through tail grommet
    const tailGroup = new THREE.Group();
    tailGroup.position.set(0, 0.6, -0.42);

    const tailPart1 = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.09, 0.35, 6), furGrey);
    tailPart1.position.set(0, 0.12, -0.15);
    tailPart1.rotation.x = -0.7;
    tailGroup.add(tailPart1);

    const tailPart2 = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.35, 6), furGrey);
    tailPart2.position.set(0, 0.34, -0.28);
    tailPart2.rotation.x = -0.2;
    tailGroup.add(tailPart2);

    const tailTip = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.24, 6), furWhite);
    tailTip.position.set(0, 0.52, -0.26);
    tailTip.rotation.x = 0.5;
    tailGroup.add(tailTip);

    group.add(tailGroup);
    group.userData.tailGroup = tailGroup;

    // 5. Arms (Articulated with red bands & pink paw pads)
    const armGeo = new THREE.CylinderGeometry(0.12, 0.14, 0.45, 6);
    armGeo.translate(0, -0.22, 0);

    // Red arm band
    const armBandGeo = new THREE.CylinderGeometry(0.14, 0.14, 0.09, 6);
    armBandGeo.translate(0, -0.18, 0);

    const leftArmGroup = new THREE.Group();
    leftArmGroup.position.set(-0.54, 1.1, 0);
    const leftArm = new THREE.Mesh(armGeo, suitWhite);
    leftArm.castShadow = true;
    leftArmGroup.add(leftArm);
    leftArmGroup.add(new THREE.Mesh(armBandGeo, stripeRed));

    const leftGlove = new THREE.Mesh(new THREE.SphereGeometry(0.14, 6, 6), suitWhite);
    leftGlove.position.y = -0.45;
    leftArmGroup.add(leftGlove);
    // Pink paw pad on palm
    const padL = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.02, 6), earPink);
    padL.rotation.x = Math.PI * 0.5;
    padL.position.set(0, -0.45, 0.12);
    leftArmGroup.add(padL);
    group.add(leftArmGroup);

    const rightArmGroup = new THREE.Group();
    rightArmGroup.position.set(0.54, 1.1, 0);
    const rightArm = new THREE.Mesh(armGeo, suitWhite);
    rightArm.castShadow = true;
    rightArmGroup.add(rightArm);
    rightArmGroup.add(new THREE.Mesh(armBandGeo, stripeRed));

    const rightGlove = new THREE.Mesh(new THREE.SphereGeometry(0.14, 6, 6), suitWhite);
    rightGlove.position.y = -0.45;
    rightArmGroup.add(rightGlove);
    // Pink paw pad on palm
    const padR = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.02, 6), earPink);
    padR.rotation.x = Math.PI * 0.5;
    padR.position.set(0, -0.45, 0.12);
    rightArmGroup.add(padR);
    group.add(rightArmGroup);

    // 6. Legs (Articulated with red knee bands & white boots)
    const legGeo = new THREE.CylinderGeometry(0.14, 0.16, 0.5, 6);
    legGeo.translate(0, -0.25, 0);

    const legBandGeo = new THREE.CylinderGeometry(0.16, 0.16, 0.08, 6);
    legBandGeo.translate(0, -0.28, 0);

    const leftLegGroup = new THREE.Group();
    leftLegGroup.position.set(-0.22, 0.52, 0);
    const leftLeg = new THREE.Mesh(legGeo, suitWhite);
    leftLeg.castShadow = true;
    leftLegGroup.add(leftLeg);
    leftLegGroup.add(new THREE.Mesh(legBandGeo, stripeRed));

    const leftBoot = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.18, 0.36), suitWhite);
    leftBoot.position.set(0, -0.5, 0.08);
    leftLegGroup.add(leftBoot);
    const leftSole = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.05, 0.38), darkMat);
    leftSole.position.set(0, -0.59, 0.08);
    leftLegGroup.add(leftSole);
    group.add(leftLegGroup);

    const rightLegGroup = new THREE.Group();
    rightLegGroup.position.set(0.22, 0.52, 0);
    const rightLeg = new THREE.Mesh(legGeo, suitWhite);
    rightLeg.castShadow = true;
    rightLegGroup.add(rightLeg);
    rightLegGroup.add(new THREE.Mesh(legBandGeo, stripeRed));

    const rightBoot = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.18, 0.36), suitWhite);
    rightBoot.position.set(0, -0.5, 0.08);
    rightLegGroup.add(rightBoot);
    const rightSole = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.05, 0.38), darkMat);
    rightSole.position.set(0, -0.59, 0.08);
    rightLegGroup.add(rightSole);
    group.add(rightLegGroup);

    // Metadata for physics & animation
    group.userData = {
      leftArmGroup,
      rightArmGroup,
      leftLegGroup,
      rightLegGroup,
      tailGroup,
      headGroup,
      torso,
      animTime: 0,
      isMoving: false,
      isSwimming: false,
      isJumping: false,
      isTeacher: false,
      characterType: 'cat'
    };

    group.scale.set(0.85, 0.85, 0.85);
    return group;
  }

  /**
   * Creates the adorable Dog Astronaut (Teacher - Professor Spike)
   * Inspired by the reference artwork: Floppy brown puppy ears outside the helmet,
   * sweet golden-tan puppy face, holding the science datapad with ringed planet logo!
   */
  static createDogAstronaut() {
    const group = new THREE.Group();
    group.name = 'TeacherDogAstronaut';

    // Materials
    const suitWhite = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.55,
      metalness: 0.1,
      flatShading: true
    });

    const stripeRed = new THREE.MeshStandardMaterial({
      color: 0xef233c,
      roughness: 0.45,
      metalness: 0.15,
      flatShading: true
    });

    const furBrown = new THREE.MeshStandardMaterial({
      color: 0xb07d62,
      roughness: 0.75,
      flatShading: true
    });

    const furTan = new THREE.MeshStandardMaterial({
      color: 0xddb892,
      roughness: 0.7,
      flatShading: true
    });

    const furCream = new THREE.MeshStandardMaterial({
      color: 0xfefae0,
      roughness: 0.7,
      flatShading: true
    });

    const noseDark = new THREE.MeshStandardMaterial({
      color: 0x3d2b1f,
      roughness: 0.4,
      flatShading: true
    });

    const tonguePink = new THREE.MeshStandardMaterial({
      color: 0xff85a1,
      roughness: 0.5,
      flatShading: true
    });

    const eyeBlack = new THREE.MeshBasicMaterial({ color: 0x1a1a24 });
    const eyeHighlight = new THREE.MeshBasicMaterial({ color: 0xffffff });

    const btnBlue = new THREE.MeshStandardMaterial({
      color: 0x3a86ff,
      roughness: 0.4,
      metalness: 0.2,
      flatShading: true
    });

    const darkMat = new THREE.MeshStandardMaterial({
      color: 0x2b2d42,
      roughness: 0.8,
      flatShading: true
    });

    const visorGlass = new THREE.MeshStandardMaterial({
      color: 0x48cae4,
      roughness: 0.1,
      metalness: 0.85,
      transparent: true,
      opacity: 0.35,
      flatShading: true
    });

    // 1. Torso
    const torsoGeo = new THREE.CylinderGeometry(0.36, 0.42, 0.72, 8);
    const torso = new THREE.Mesh(torsoGeo, suitWhite);
    torso.position.y = 0.85;
    torso.castShadow = true;
    torso.receiveShadow = true;
    group.add(torso);

    // Collar Red Stripe
    const collarGeo = new THREE.TorusGeometry(0.38, 0.04, 6, 12);
    const collar = new THREE.Mesh(collarGeo, stripeRed);
    collar.rotation.x = Math.PI * 0.5;
    collar.position.y = 1.2;
    group.add(collar);

    // Chest Buttons (Blue Square on left, Red Circle on right)
    const btnSquare = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.12, 0.06), btnBlue);
    btnSquare.position.set(-0.11, 0.95, 0.38);
    group.add(btnSquare);

    const btnCircle = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.06, 8), stripeRed);
    btnCircle.rotation.x = Math.PI * 0.5;
    btnCircle.position.set(0.11, 0.95, 0.38);
    group.add(btnCircle);

    // Belt & Buckle
    const belt = new THREE.Mesh(new THREE.CylinderGeometry(0.43, 0.43, 0.1, 8), darkMat);
    belt.position.y = 0.58;
    group.add(belt);

    const buckle = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.12, 0.06), suitWhite);
    buckle.position.set(0, 0.58, 0.42);
    group.add(buckle);

    // 2. Head & Helmet (Dog Teacher - Professor Spike, High-Fidelity Match with Reference)
    const headGroup = new THREE.Group();
    headGroup.position.y = 1.5;

    // A. Character Head Sphere (Warm Cream Fur)
    // Placed at z = -0.06 with radius 0.42 so its front surface stops at z = +0.36
    const headGeo = new THREE.SphereGeometry(0.42, 24, 20);
    const headMesh = new THREE.Mesh(headGeo, furCream);
    headMesh.position.set(0, 0, -0.06);
    headMesh.castShadow = true;
    headGroup.add(headMesh);

    // B. Helmet Cowl Shell - Covers the back, top, bottom, and sides
    // -Math.PI * 0.5 rotates the cowl to cover the BACK of the head, leaving the FRONT wide open!
    const cowlGeo = new THREE.SphereGeometry(0.53, 24, 18, 0, Math.PI * 2, 0, Math.PI * 0.58);
    cowlGeo.rotateX(-Math.PI * 0.5);
    const cowl = new THREE.Mesh(cowlGeo, suitWhite);
    cowl.position.set(0, 0, -0.04);
    cowl.castShadow = true;
    headGroup.add(cowl);

    // C. White Visor Frame / Bezel Ring (Framing the face opening)
    const rimGeo = new THREE.TorusGeometry(0.41, 0.055, 16, 32);
    rimGeo.scale(1.0, 1.12, 1.0);
    const rim = new THREE.Mesh(rimGeo, suitWhite);
    rim.position.set(0, 0.01, 0.35);
    headGroup.add(rim);

    // D. Red Racing Stripe along Helmet Crown
    const stripeGeo = new THREE.BoxGeometry(0.16, 0.045, 0.44);
    const helmetStripe = new THREE.Mesh(stripeGeo, stripeRed);
    helmetStripe.position.set(0, 0.52, -0.08);
    headGroup.add(helmetStripe);

    // E. Red Ear Communicator Cups with White Center Caps
    const discGeo = new THREE.CylinderGeometry(0.15, 0.15, 0.08, 16);
    discGeo.rotateZ(Math.PI * 0.5);
    const discL = new THREE.Mesh(discGeo, stripeRed);
    discL.position.set(-0.52, 0, 0);
    const capL = new THREE.Mesh(new THREE.SphereGeometry(0.11, 12, 8), suitWhite);
    capL.position.set(-0.55, 0, 0);
    headGroup.add(discL);
    headGroup.add(capL);

    const discR = new THREE.Mesh(discGeo, stripeRed);
    discR.position.set(0.52, 0, 0);
    const capR = new THREE.Mesh(new THREE.SphereGeometry(0.11, 12, 8), suitWhite);
    capR.position.set(0.55, 0, 0);
    headGroup.add(discR);
    headGroup.add(capR);

    // F. Floppy Brown Puppy Ears drooping naturally down the sides outside the helmet!
    const createPuppyEar = (isLeft) => {
      const earGroup = new THREE.Group();
      const earGeo = new THREE.BoxGeometry(0.18, 0.55, 0.28);
      earGeo.translate(0, -0.22, 0);
      const ear = new THREE.Mesh(earGeo, furBrown);
      ear.castShadow = true;
      earGroup.add(ear);

      earGroup.position.set(isLeft ? -0.55 : 0.55, 0.22, -0.05);
      earGroup.rotation.z = isLeft ? 0.35 : -0.35;
      earGroup.rotation.x = 0.2;
      return earGroup;
    };
    headGroup.add(createPuppyEar(true));
    headGroup.add(createPuppyEar(false));

    // G. HIGH-FIDELITY FACE MESH (From User Reference Artwork)
    // Curved circular disc positioned neatly inside the white helmet visor ring (z = 0.35)
    const dogFaceTex = FaceTextureGenerator.createExactImageFaceTexture(true);
    const faceMesh = FaceTextureGenerator.createFacePlane(dogFaceTex, 0.38);
    faceMesh.position.set(0, 0.0, 0.35);
    headGroup.add(faceMesh);

    group.add(headGroup);

    // 3. Life-Support Backpack
    const pack = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.55, 0.28), suitWhite);
    pack.position.set(0, 0.9, -0.4);
    pack.castShadow = true;
    group.add(pack);

    const packStripe = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.1, 0.3), stripeRed);
    packStripe.position.set(0, 0.98, -0.4);
    group.add(packStripe);

    // 4. Wagging Golden-Tan Puppy Tail
    const tailGroup = new THREE.Group();
    tailGroup.position.set(0, 0.62, -0.42);

    const tailPart = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.09, 0.38, 6), furTan);
    tailPart.position.set(0, 0.14, -0.18);
    tailPart.rotation.x = -0.7;
    tailGroup.add(tailPart);

    const tailTip = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.2, 6), furCream);
    tailTip.position.set(0, 0.32, -0.28);
    tailTip.rotation.x = -0.3;
    tailGroup.add(tailTip);

    group.add(tailGroup);
    group.userData.tailGroup = tailGroup;

    // 5. Left Arm (Holding the Science Tablet / Datapad with Ringed Planet Logo!)
    const armGeo = new THREE.CylinderGeometry(0.12, 0.14, 0.45, 6);
    armGeo.translate(0, -0.22, 0);
    const armBandGeo = new THREE.CylinderGeometry(0.14, 0.14, 0.09, 6);
    armBandGeo.translate(0, -0.18, 0);

    const leftArmGroup = new THREE.Group();
    leftArmGroup.position.set(-0.54, 1.1, 0);
    const leftArm = new THREE.Mesh(armGeo, suitWhite);
    leftArm.castShadow = true;
    leftArmGroup.add(leftArm);
    leftArmGroup.add(new THREE.Mesh(armBandGeo, stripeRed));

    const leftGlove = new THREE.Mesh(new THREE.SphereGeometry(0.14, 6, 6), suitWhite);
    leftGlove.position.y = -0.45;
    leftArmGroup.add(leftGlove);

    // Science Tablet / Datapad Model
    const tabletGroup = new THREE.Group();
    tabletGroup.position.set(0.15, -0.42, 0.28);
    tabletGroup.rotation.set(-0.6, 0.3, -0.2);

    // Tablet body (dark slate)
    const tabBody = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.55, 0.04), darkMat);
    tabletGroup.add(tabBody);

    // Glowing screen with ringed planet logo
    const screenMat = new THREE.MeshBasicMaterial({ color: 0x48cae4 });
    const screen = new THREE.Mesh(new THREE.PlaneGeometry(0.36, 0.48), screenMat);
    screen.position.z = 0.022;
    tabletGroup.add(screen);

    // Ringed planet insignia on tablet screen
    const planetDot = new THREE.Mesh(new THREE.SphereGeometry(0.08, 8, 8), new THREE.MeshBasicMaterial({ color: 0xffffff }));
    planetDot.position.z = 0.03;
    tabletGroup.add(planetDot);
    const ringGeo = new THREE.RingGeometry(0.1, 0.14, 16);
    const planetRing = new THREE.Mesh(ringGeo, new THREE.MeshBasicMaterial({ color: 0xffffff, side: THREE.DoubleSide }));
    planetRing.position.z = 0.032;
    planetRing.rotation.x = 0.6;
    tabletGroup.add(planetRing);

    leftArmGroup.add(tabletGroup);
    group.add(leftArmGroup);

    // 6. Right Arm (Free to wave / gesture)
    const rightArmGroup = new THREE.Group();
    rightArmGroup.position.set(0.54, 1.1, 0);
    const rightArm = new THREE.Mesh(armGeo, suitWhite);
    rightArm.castShadow = true;
    rightArmGroup.add(rightArm);
    rightArmGroup.add(new THREE.Mesh(armBandGeo, stripeRed));

    const rightGlove = new THREE.Mesh(new THREE.SphereGeometry(0.14, 6, 6), suitWhite);
    rightGlove.position.y = -0.45;
    rightArmGroup.add(rightGlove);
    group.add(rightArmGroup);

    // 7. Legs
    const legGeo = new THREE.CylinderGeometry(0.14, 0.16, 0.5, 6);
    legGeo.translate(0, -0.25, 0);
    const legBandGeo = new THREE.CylinderGeometry(0.16, 0.16, 0.08, 6);
    legBandGeo.translate(0, -0.28, 0);

    const leftLegGroup = new THREE.Group();
    leftLegGroup.position.set(-0.22, 0.52, 0);
    leftLegGroup.add(new THREE.Mesh(legGeo, suitWhite));
    leftLegGroup.add(new THREE.Mesh(legBandGeo, stripeRed));
    const leftBoot = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.18, 0.36), suitWhite);
    leftBoot.position.set(0, -0.5, 0.08);
    leftLegGroup.add(leftBoot);
    const leftSole = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.05, 0.38), darkMat);
    leftSole.position.set(0, -0.59, 0.08);
    leftLegGroup.add(leftSole);
    group.add(leftLegGroup);

    const rightLegGroup = new THREE.Group();
    rightLegGroup.position.set(0.22, 0.52, 0);
    rightLegGroup.add(new THREE.Mesh(legGeo, suitWhite));
    rightLegGroup.add(new THREE.Mesh(legBandGeo, stripeRed));
    const rightBoot = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.18, 0.36), suitWhite);
    rightBoot.position.set(0, -0.5, 0.08);
    rightLegGroup.add(rightBoot);
    const rightSole = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.05, 0.38), darkMat);
    rightSole.position.set(0, -0.59, 0.08);
    rightLegGroup.add(rightSole);
    group.add(rightLegGroup);

    // 8. Field Astrobiology Research Desk (Stands neatly in front of Professor Spike)
    const tableGroup = new THREE.Group();
    tableGroup.position.set(0, 0, 0.72);

    const tableMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      roughness: 0.6,
      metalness: 0.4,
      flatShading: true
    });
    const glowCyanMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });
    const deskTopMat = new THREE.MeshStandardMaterial({
      color: 0x0f172a,
      roughness: 0.4,
      metalness: 0.2,
      flatShading: true
    });

    // Tabletop
    const deskTop = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.08, 0.52), deskTopMat);
    deskTop.position.y = 0.56;
    deskTop.castShadow = true;
    deskTop.receiveShadow = true;
    tableGroup.add(deskTop);

    // Glowing cyan accent border along the front edge of the desk
    const deskGlowTrim = new THREE.Mesh(new THREE.BoxGeometry(1.22, 0.03, 0.04), glowCyanMat);
    deskGlowTrim.position.set(0, 0.56, 0.26);
    tableGroup.add(deskGlowTrim);

    // Left and right support legs
    const legL = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.08, 0.54, 6), tableMat);
    legL.position.set(-0.48, 0.27, 0);
    legL.castShadow = true;
    tableGroup.add(legL);

    const legR = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.08, 0.54, 6), tableMat);
    legR.position.set(0.48, 0.27, 0);
    legR.castShadow = true;
    tableGroup.add(legR);

    // Base feet
    const footL = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.06, 0.44), tableMat);
    footL.position.set(-0.48, 0.03, 0);
    tableGroup.add(footL);

    const footR = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.06, 0.44), tableMat);
    footR.position.set(0.48, 0.03, 0);
    tableGroup.add(footR);

    // Holographic Planet Projector on the desk
    const projectorBase = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.14, 0.05, 8), tableMat);
    projectorBase.position.set(-0.32, 0.62, 0.04);
    tableGroup.add(projectorBase);

    // Wireframe glowing holographic planet hovering above projector
    const holoPlanet = new THREE.Mesh(
      new THREE.SphereGeometry(0.09, 8, 8),
      new THREE.MeshBasicMaterial({ color: 0x48cae4, wireframe: true })
    );
    holoPlanet.position.set(-0.32, 0.78, 0.04);
    tableGroup.add(holoPlanet);

    // Astrobiology Specimen Flask with glowing fluid
    const flaskGeo = new THREE.CylinderGeometry(0.05, 0.07, 0.16, 8);
    const flaskMat = new THREE.MeshStandardMaterial({
      color: 0x52b788,
      roughness: 0.2,
      metalness: 0.1,
      transparent: true,
      opacity: 0.85
    });
    const flask = new THREE.Mesh(flaskGeo, flaskMat);
    flask.position.set(0.32, 0.68, 0.06);
    tableGroup.add(flask);

    // Compact analysis keyboard / control pad
    const keypad = new THREE.Mesh(
      new THREE.BoxGeometry(0.3, 0.03, 0.2),
      new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.7 })
    );
    keypad.position.set(0.02, 0.61, 0.08);
    tableGroup.add(keypad);

    group.add(tableGroup);

    group.userData = {
      leftArmGroup,
      rightArmGroup,
      leftLegGroup,
      rightLegGroup,
      tailGroup,
      headGroup,
      torso,
      animTime: 0,
      isMoving: false,
      isSwimming: false,
      isJumping: false,
      isTeacher: true,
      characterType: 'dog'
    };

    group.scale.set(0.85, 0.85, 0.85);
    return group;
  }

  /**
   * Universal astronaut creator mapping:
   * isTeacher = true -> createDogAstronaut (Professor Spike)
   * isTeacher = false -> createCatAstronaut (Student Cadet Tom)
   */
  static createAstronaut(isTeacher = false) {
    return isTeacher ? this.createDogAstronaut() : this.createCatAstronaut();
  }

  /**
   * Updates character limb rotations, poses, and lively tail wagging!
   */
  static updateAnimation(character, delta, isMoving, isJumping, isSwimming, isWaving = false) {
    if (!character || !character.userData) return;
    const u = character.userData;
    u.animTime += delta * 8;
    const t = u.animTime;

    // Tail wagging animation
    if (u.tailGroup) {
      if (u.characterType === 'dog') {
        // Happy puppy tail wagging!
        u.tailGroup.rotation.y = Math.sin(t * 3.8) * 0.42;
        u.tailGroup.rotation.z = Math.cos(t * 1.9) * 0.15;
      } else {
        // Cat tail gentle S-curve swish
        u.tailGroup.rotation.y = Math.sin(t * 1.4) * 0.35;
        u.tailGroup.rotation.z = Math.cos(t * 1.4) * 0.18;
      }
    }

    if (isWaving) {
      if (u.isTeacher) {
        // Professor Spike (dog mentor) friendly waving while holding datapad
        u.rightArmGroup.rotation.x = Math.sin(t * 1.5) * 0.3 - 2.2;
        u.rightArmGroup.rotation.z = Math.cos(t * 2.5) * 0.4 + 0.4;
        u.leftLegGroup.rotation.x = 0;
        u.rightLegGroup.rotation.x = 0;
        u.torso.position.y = 0.85 + Math.sin(t * 0.8) * 0.02;
      } else {
        // Tom (cat cadet) pointing directly towards the camera and waving his hand warmly!
        // Natural waving speed (~1.7 Hz, relaxed, friendly and smooth)
        const waveSpeed = 1.35;
        const waveAngle = Math.sin(t * waveSpeed);

        // Right arm raised high, waving in a smooth organic arc with wrist follow-through
        // 1. Z-axis: primary side-to-side waving swing
        u.rightArmGroup.rotation.z = 0.45 + waveAngle * 0.35;
        // 2. X-axis: arm stays raised high while tracing a subtle convex arc at each turnaround
        u.rightArmGroup.rotation.x = -2.32 + Math.cos(t * waveSpeed * 2.0) * 0.05 + Math.sin(t * 0.5) * 0.02;
        // 3. Y-axis: natural wrist & forearm roll with phase lag (overlapping action)
        u.rightArmGroup.rotation.y = -0.20 + Math.sin(t * waveSpeed + 0.4) * 0.12;

        // Left arm outstretched pointing directly forward at the camera with gentle breathing
        u.leftArmGroup.rotation.x = -1.50 + Math.sin(t * 0.5) * 0.015;
        u.leftArmGroup.rotation.z = -0.18;
        u.leftArmGroup.rotation.y = 0.22;

        // Subtle expressive secondary motions: head tilt & body weight shift
        if (u.headGroup) {
          u.headGroup.rotation.z = Math.sin(t * waveSpeed) * 0.06; // gentle curious head tilt
          u.headGroup.rotation.x = Math.sin(t * 0.5) * 0.03 - 0.02; // soft nod toward camera
        }
        if (u.torso) {
          u.torso.rotation.z = -Math.sin(t * waveSpeed) * 0.025; // organic counter-balance sway
          u.torso.rotation.x = 0;
          u.torso.position.y = 0.85 + Math.sin(t * 0.8) * 0.02; // smooth breathing bounce
        }

        u.leftLegGroup.rotation.x = 0;
        u.rightLegGroup.rotation.x = 0;
      }
      return;
    }

    // Reset waving-specific head or torso tilt when moving, jumping, swimming, or idling
    if (u.headGroup) {
      u.headGroup.rotation.z = 0;
      u.headGroup.rotation.x = 0;
    }
    if (u.torso) {
      u.torso.rotation.z = 0;
    }

    if (isSwimming) {
      // Fluid swimming stroke
      u.leftArmGroup.rotation.x = Math.sin(t * 0.8) * 0.9 - 1.2;
      u.rightArmGroup.rotation.x = Math.sin(t * 0.8 + Math.PI) * 0.9 - 1.2;
      u.leftLegGroup.rotation.x = Math.sin(t * 1.2) * 0.4 + 0.2;
      u.rightLegGroup.rotation.x = Math.sin(t * 1.2 + Math.PI) * 0.4 + 0.2;
      u.torso.rotation.x = 0.5;
      u.torso.position.y = 0.65 + Math.sin(t * 0.8) * 0.06;
    } else if (isJumping) {
      // Jump pose
      u.leftArmGroup.rotation.x = -2.2;
      u.rightArmGroup.rotation.x = -2.2;
      u.leftLegGroup.rotation.x = 0.6;
      u.rightLegGroup.rotation.x = 0.4;
      u.torso.rotation.x = 0;
      u.torso.position.y = 0.9;
    } else if (isMoving) {
      // Walk cycle
      const walkFreq = 1.3;
      u.leftArmGroup.rotation.x = Math.sin(t * walkFreq) * 0.7;
      u.rightArmGroup.rotation.x = -Math.sin(t * walkFreq) * 0.7;
      u.leftLegGroup.rotation.x = -Math.sin(t * walkFreq) * 0.7;
      u.rightLegGroup.rotation.x = Math.sin(t * walkFreq) * 0.7;
      u.leftArmGroup.rotation.z = -0.15;
      u.rightArmGroup.rotation.z = 0.15;
      u.torso.rotation.x = 0.12;
      u.torso.position.y = 0.85 + Math.abs(Math.sin(t * walkFreq * 2)) * 0.05;
    } else {
      // Idle breathing
      const idleFreq = 0.35;
      u.leftArmGroup.rotation.x = Math.sin(t * idleFreq) * 0.05;
      u.rightArmGroup.rotation.x = -Math.sin(t * idleFreq) * 0.05;
      u.leftArmGroup.rotation.z = -0.12;
      u.rightArmGroup.rotation.z = 0.12;
      u.leftLegGroup.rotation.x = 0;
      u.rightLegGroup.rotation.x = 0;
      u.torso.rotation.x = 0;
      u.torso.position.y = 0.85 + Math.sin(t * idleFreq * 2) * 0.02;
    }
  }

  /**
   * Creates the exploration Spaceship (Vertical Rocket Lander Mode)
   * matching the user's reference artwork:
   * Features:
   * - Standing vertically upright on two articulated mechanical landing gear legs with red footpad shoes
   * - Tall aerodynamic faceted white shuttle/rocket fuselage
   * - Needle-sharp conical nosecone with red tip and downward-curved red chevron collar
   * - Panoramic faceted cobalt-blue crystalline cockpit canopy with dark frame
   * - Angled red shoulder/flank armor patches flanking cockpit
   * - Dark slate side sensor intake ports
   * - Planetary orbital ring emblem on the front chest hull
   * - Vertical red console panel on lower fuselage with twin stacked glowing cyan indicator lights
   * - Dark slate ventral keel/chin block between thruster pods
   * - Twin heavy cylindrical side thruster pods with dark slate casing, white collar rings, and glowing cyan vertical energy bars
   * - Ringed engine nozzles at base with glowing cyan plasma emitters
   * - Downward swept delta wings with bold angled red wingtips and red forward stripes
   * - Auxiliary upper canard stabilizer fins above thruster pods with red caps
   * - Dual vertical downward-pointing high-energy plasma rocket flames (ship.userData.flame)
   */
  static createSpaceship() {
    const ship = new THREE.Group();
    ship.name = 'Spaceship';

    // Materials matching reference artwork
    const hullWhite = new THREE.MeshStandardMaterial({
      color: 0xf6f9fc,
      roughness: 0.28,
      metalness: 0.10,
      flatShading: true
    });

    const accentRed = new THREE.MeshStandardMaterial({
      color: 0xee382b,
      roughness: 0.32,
      metalness: 0.15,
      flatShading: true
    });

    const darkTrim = new THREE.MeshStandardMaterial({
      color: 0x222a36,
      roughness: 0.50,
      metalness: 0.50,
      flatShading: true
    });

    const cockpitGlass = new THREE.MeshStandardMaterial({
      color: 0x0062d2, // Vibrant royal cobalt blue
      roughness: 0.06,
      metalness: 0.85,
      transparent: true,
      opacity: 0.94,
      flatShading: true
    });

    const cyanGlow = new THREE.MeshBasicMaterial({
      color: 0x00f5d4
    });

    const logoNavy = new THREE.MeshBasicMaterial({
      color: 0x1e293b
    });

    const legMetal = new THREE.MeshStandardMaterial({
      color: 0x475569,
      roughness: 0.42,
      metalness: 0.70,
      flatShading: true
    });

    // 1. Central Aerodynamic Fuselage (Vertical Stack)
    // 1a. Lower fuselage body (between thrusters)
    const lowerBodyGeo = new THREE.CylinderGeometry(0.72, 0.68, 1.2, 8);
    const lowerBody = new THREE.Mesh(lowerBodyGeo, hullWhite);
    lowerBody.position.set(0, 1.8, 0);
    lowerBody.castShadow = true;
    lowerBody.receiveShadow = true;
    ship.add(lowerBody);

    // 1b. Mid fuselage body (chest / lower cockpit level)
    const midBodyGeo = new THREE.CylinderGeometry(0.78, 0.72, 1.2, 8);
    const midBody = new THREE.Mesh(midBodyGeo, hullWhite);
    midBody.position.set(0, 3.0, 0);
    midBody.castShadow = true;
    midBody.receiveShadow = true;
    ship.add(midBody);

    // 1c. Upper tapered fuselage section (transitioning into nosecone)
    const upperBodyGeo = new THREE.CylinderGeometry(0.52, 0.78, 1.2, 8);
    const upperBody = new THREE.Mesh(upperBodyGeo, hullWhite);
    upperBody.position.set(0, 4.2, 0);
    upperBody.castShadow = true;
    ship.add(upperBody);

    // 1d. Tall conical nosecone section
    const coneLowerGeo = new THREE.CylinderGeometry(0.36, 0.52, 0.8, 8);
    const coneLower = new THREE.Mesh(coneLowerGeo, hullWhite);
    coneLower.position.set(0, 5.0, 0);
    coneLower.castShadow = true;
    ship.add(coneLower);

    // 1e. Curved red chevron collar band around upper cone
    const chevronGeo = new THREE.CylinderGeometry(0.34, 0.42, 0.35, 8);
    const chevronMesh = new THREE.Mesh(chevronGeo, accentRed);
    chevronMesh.position.set(0, 5.18, 0);
    ship.add(chevronMesh);

    // 1f. White band below tip
    const whiteBandGeo = new THREE.CylinderGeometry(0.18, 0.32, 0.4, 8);
    const whiteBand = new THREE.Mesh(whiteBandGeo, hullWhite);
    whiteBand.position.set(0, 5.55, 0);
    ship.add(whiteBand);

    // 1g. Sharp needle red nosecone tip
    const tipGeo = new THREE.ConeGeometry(0.18, 0.75, 8);
    const tipMesh = new THREE.Mesh(tipGeo, accentRed);
    tipMesh.position.set(0, 6.08, 0);
    tipMesh.castShadow = true;
    ship.add(tipMesh);

    // 2. Large Faceted Cobalt-Blue Panoramic Cockpit Canopy
    // Using faceted dodecahedron geometry scaled into a sleek vertical teardrop
    const canopyGeo = new THREE.DodecahedronGeometry(0.62, 1);
    canopyGeo.scale(0.85, 1.65, 0.65);
    const canopy = new THREE.Mesh(canopyGeo, cockpitGlass);
    canopy.position.set(0, 3.95, 0.50);
    canopy.rotation.x = -0.10;
    canopy.castShadow = true;
    ship.add(canopy);

    // Dark trim frame surround for canopy
    const canopyTrimGeo = new THREE.BoxGeometry(1.0, 1.95, 0.28);
    const canopyTrim = new THREE.Mesh(canopyTrimGeo, darkTrim);
    canopyTrim.position.set(0, 3.95, 0.40);
    canopyTrim.rotation.x = -0.10;
    ship.add(canopyTrim);

    // Interior cockpit pilot dashboard glow
    const dashGlow = new THREE.Mesh(new THREE.BoxGeometry(0.44, 0.08, 0.22), cyanGlow);
    dashGlow.position.set(0, 3.70, 0.50);
    ship.add(dashGlow);

    // 3. Flank Markings, Side Sensor Intakes & Insignia
    // Symmetrical red shoulder / flank armor patches
    const shoulderL = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.78, 0.44), accentRed);
    shoulderL.position.set(-0.74, 3.32, 0.22);
    shoulderL.rotation.z = -0.20;
    shoulderL.rotation.y = 0.25;
    ship.add(shoulderL);

    const shoulderR = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.78, 0.44), accentRed);
    shoulderR.position.set(0.74, 3.32, 0.22);
    shoulderR.rotation.z = 0.20;
    shoulderR.rotation.y = -0.25;
    ship.add(shoulderR);

    // Side dark sensor intake ports
    const intakeL = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.38, 0.26), darkTrim);
    intakeL.position.set(-0.84, 3.75, 0.12);
    ship.add(intakeL);

    const intakeR = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.38, 0.26), darkTrim);
    intakeR.position.set(0.84, 3.75, 0.12);
    ship.add(intakeR);

    // Planetary orbital ring insignia on front chest hull
    const planetDisc = new THREE.Mesh(new THREE.CircleGeometry(0.15, 16), logoNavy);
    planetDisc.position.set(0, 2.85, 0.74);
    ship.add(planetDisc);

    const planetRing = new THREE.Mesh(new THREE.TorusGeometry(0.25, 0.024, 4, 20), logoNavy);
    planetRing.position.set(0, 2.85, 0.75);
    planetRing.rotation.x = 0.45;
    planetRing.rotation.z = -0.22;
    ship.add(planetRing);

    // Vertical red console panel on lower fuselage with twin glowing cyan lights
    const redConsole = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.80, 0.10), accentRed);
    redConsole.position.set(0, 1.95, 0.72);
    ship.add(redConsole);

    const statusLight1 = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.14, 0.04), cyanGlow);
    statusLight1.position.set(0, 2.18, 0.78);
    ship.add(statusLight1);

    const statusLight2 = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.14, 0.04), cyanGlow);
    statusLight2.position.set(0, 1.82, 0.78);
    ship.add(statusLight2);

    // Dark slate ventral keel / chin plate between thrusters
    const chinPlate = new THREE.Mesh(new THREE.BoxGeometry(0.44, 0.50, 0.40), darkTrim);
    chinPlate.position.set(0, 1.25, 0.42);
    ship.add(chinPlate);

    // 4. Twin Heavy Side Thruster Pods / Nacelles
    const createThrusterPod = (isLeft) => {
      const podGroup = new THREE.Group();
      const posX = isLeft ? -1.18 : 1.18;
      podGroup.position.set(posX, 1.85, 0);

      // Dark slate main pod cylinder body
      const podBody = new THREE.Mesh(new THREE.CylinderGeometry(0.40, 0.40, 1.6, 10), darkTrim);
      podBody.castShadow = true;
      podGroup.add(podBody);

      // White aerodynamic upper sleeve fairing
      const upperFairing = new THREE.Mesh(new THREE.CylinderGeometry(0.43, 0.43, 0.65, 10), hullWhite);
      upperFairing.position.y = 0.52;
      upperFairing.castShadow = true;
      podGroup.add(upperFairing);

      // White lower band collar
      const lowerBand = new THREE.Mesh(new THREE.CylinderGeometry(0.43, 0.43, 0.22, 10), hullWhite);
      lowerBand.position.y = -0.55;
      podGroup.add(lowerBand);

      // Outer lateral vertical energy channel slot
      const slotX = isLeft ? -0.38 : 0.38;
      const slotFrame = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.95, 0.32), darkTrim);
      slotFrame.position.set(slotX, 0.05, 0);
      podGroup.add(slotFrame);

      // Bright glowing cyan vertical energy bar
      const energyBar = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.78, 0.18), cyanGlow);
      energyBar.position.set(slotX * 1.05, 0.05, 0);
      podGroup.add(energyBar);

      // Bottom engine bell nozzle
      const nozzleBell = new THREE.Mesh(new THREE.CylinderGeometry(0.38, 0.44, 0.26, 10), darkTrim);
      nozzleBell.position.y = -0.88;
      podGroup.add(nozzleBell);

      // Glowing cyan plasma nozzle core disc pointing downwards
      const plasmaDisc = new THREE.Mesh(new THREE.CircleGeometry(0.34, 12), cyanGlow);
      plasmaDisc.rotation.x = Math.PI * 0.5;
      plasmaDisc.position.y = -1.02;
      podGroup.add(plasmaDisc);

      return podGroup;
    };
    ship.add(createThrusterPod(true));
    ship.add(createThrusterPod(false));

    // 5. Downward Swept Delta Wings with Bold Red Wingtips & Chevron Stripes
    // Matching reference image: delta wings slope downwards and outwards from engine pods
    const createWing = (isLeft) => {
      const wingGroup = new THREE.Group();
      const sign = isLeft ? -1 : 1;

      // Main white delta wing panel angled downwards (-30 deg z-roll)
      const wingMesh = new THREE.Mesh(new THREE.BoxGeometry(1.55, 0.14, 1.35), hullWhite);
      wingMesh.position.set(sign * 1.95, 1.60, -0.12);
      wingMesh.rotation.y = sign * -0.24;
      wingMesh.rotation.z = sign * -0.48; // Downward swept delta angle matching reference!
      wingMesh.castShadow = true;
      wingGroup.add(wingMesh);

      // Angled bold red wingtip cap at the outer lower edge
      const tipMesh = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.40, 0.95), accentRed);
      tipMesh.position.set(sign * 2.65, 1.32, -0.28);
      tipMesh.rotation.y = sign * -0.24;
      tipMesh.rotation.z = sign * -0.48;
      tipMesh.castShadow = true;
      wingGroup.add(tipMesh);

      // Forward red diagonal stripe on lower wing face
      const stripeMesh = new THREE.Mesh(new THREE.BoxGeometry(1.25, 0.16, 0.22), accentRed);
      stripeMesh.position.set(sign * 1.92, 1.62, 0.20);
      stripeMesh.rotation.y = sign * -0.42;
      stripeMesh.rotation.z = sign * -0.48;
      wingGroup.add(stripeMesh);

      return wingGroup;
    };
    ship.add(createWing(true));
    ship.add(createWing(false));

    // 6. Auxiliary Upper Canard / Stabilizer Fins (above thruster pods)
    const createCanard = (isLeft) => {
      const canardGroup = new THREE.Group();
      const sign = isLeft ? -1 : 1;

      // White base fin with backward rake
      const finMesh = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.85, 0.48), hullWhite);
      finMesh.position.set(sign * 1.18, 3.15, -0.05);
      finMesh.rotation.x = -0.15;
      finMesh.castShadow = true;
      canardGroup.add(finMesh);

      // Red angular top/forward cap
      const finCap = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.38, 0.34), accentRed);
      finCap.position.set(sign * 1.18, 3.52, -0.02);
      finCap.rotation.x = -0.15;
      finCap.castShadow = true;
      canardGroup.add(finCap);

      return canardGroup;
    };
    ship.add(createCanard(true));
    ship.add(createCanard(false));

    // 7. Articulated Mechanical Landing Gear / Robotic Legs
    // Stands vertically on two landing gear legs with red footpad shoes resting firmly at Y = 0.0
    const createLandingLeg = (isLeft) => {
      const legGroup = new THREE.Group();
      const posX = isLeft ? -0.95 : 0.95;
      legGroup.position.set(posX, 0, 0);

      // 7a. Upper hydraulic cylinder extending down from under thruster pod
      const upperStrut = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.48, 8), legMetal);
      upperStrut.position.set(0, 0.94, 0);
      upperStrut.castShadow = true;
      legGroup.add(upperStrut);

      // 7b. Articulated knee joint block with white armor casing & red accent marking
      const kneeBlock = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.26, 0.30), hullWhite);
      kneeBlock.position.set(0, 0.68, 0.02);
      kneeBlock.castShadow = true;
      legGroup.add(kneeBlock);

      const kneeRedAccent = new THREE.Mesh(new THREE.BoxGeometry(0.30, 0.14, 0.12), accentRed);
      kneeRedAccent.position.set(0, 0.68, 0.15);
      legGroup.add(kneeRedAccent);

      // 7c. Lower telescoping piston rod
      const lowerPiston = new THREE.Mesh(new THREE.CylinderGeometry(0.065, 0.065, 0.44, 8), legMetal);
      lowerPiston.position.set(0, 0.38, 0);
      lowerPiston.castShadow = true;
      legGroup.add(lowerPiston);

      // 7d. Dark mechanical ankle hub
      const ankleHub = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.14, 0.28), darkTrim);
      ankleHub.position.set(0, 0.18, 0);
      legGroup.add(ankleHub);

      // 7e. Articulated foot assembly (resting flat on ground plane at Y = 0.0)
      // Main dark foot base
      const footBase = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.10, 0.50), darkTrim);
      footBase.position.set(0, 0.05, -0.02);
      footBase.castShadow = true;
      footBase.receiveShadow = true;
      legGroup.add(footBase);

      // Forward split red toe pads / shoes (resting flat at Y = 0.0 to 0.10)
      const toePadL = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.10, 0.30), accentRed);
      toePadL.position.set(-0.11, 0.05, 0.24);
      toePadL.castShadow = true;
      legGroup.add(toePadL);

      const toePadR = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.10, 0.30), accentRed);
      toePadR.position.set(0.11, 0.05, 0.24);
      toePadR.castShadow = true;
      legGroup.add(toePadR);

      // Rear red heel stabilizer pad
      const heelPad = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.08, 0.18), accentRed);
      heelPad.position.set(0, 0.04, -0.24);
      legGroup.add(heelPad);

      return legGroup;
    };
    ship.add(createLandingLeg(true));
    ship.add(createLandingLeg(false));

    // 8. Multi-Plume Plasma Rocket Flames (Firing vertically downwards beneath nozzles)
    const flameGroup = new THREE.Group();
    flameGroup.name = 'SpaceshipExhaustFlames';

    const createPlume = (x, y, z, radius, length) => {
      const pGroup = new THREE.Group();
      pGroup.position.set(x, y, z);

      // Outer glowing cyan/azure plume (pointing down along -Y)
      const outerGeo = new THREE.ConeGeometry(radius, length, 10);
      outerGeo.rotateX(Math.PI);
      const outerMesh = new THREE.Mesh(outerGeo, new THREE.MeshBasicMaterial({
        color: 0x00b4d8,
        transparent: true,
        opacity: 0.82,
        blending: THREE.AdditiveBlending
      }));
      pGroup.add(outerMesh);

      // Inner intense white core (pointing down along -Y)
      const innerGeo = new THREE.ConeGeometry(radius * 0.52, length * 0.72, 8);
      innerGeo.rotateX(Math.PI);
      const innerMesh = new THREE.Mesh(innerGeo, new THREE.MeshBasicMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0.95
      }));
      pGroup.add(innerMesh);

      return pGroup;
    };

    // 2 Main Thruster Flames beneath bottom nozzles
    flameGroup.add(createPlume(-1.18, 0.75, 0, 0.42, 2.5));
    flameGroup.add(createPlume(1.18, 0.75, 0, 0.42, 2.5));

    flameGroup.visible = false;
    ship.add(flameGroup);
    ship.userData.flame = flameGroup;

    // 9. Circular Sci-Fi Landing Pad Holographic Guidance Ring
    const padRing = new THREE.Mesh(
      new THREE.RingGeometry(2.3, 2.6, 24),
      new THREE.MeshBasicMaterial({
        color: 0x00f5d4,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.45
      })
    );
    padRing.rotation.x = -Math.PI * 0.5;
    padRing.position.y = 0.02;
    ship.add(padRing);

    ship.scale.set(1.0, 1.0, 1.0);
    return ship;
  }

  /**
   * Creates the exploration Boat (Watership Mode) matching the user's reference artwork:
   * Features:
   * - Stout rounded boat hull with bold orange-red waterline stripe curving around bow
   * - Low-poly translucent seafoam splash/wake ring surrounding hull at waterline
   * - Dark slate tubular bow safety railing / pulpit
   * - Matching panoramic faceted cobalt-blue cockpit canopy at the bow
   * - Raised white bridge/wheelhouse cabin with observation windows & roof grab-rails
   * - Tall antenna mast on wheelhouse roof with waving orange-red pennant flag
   * - Side outrigger propulsion sponsons (transformed wing thrusters) with orange bands & cyan portal cores
   * - Life preserver ring / buoy on cabin flank
   * - Large circular stern water-jet engine on the transom with swirling water spray
   * - High-energy thruster flame in boat.userData.flame for launching off ocean planets
   */
  static createExplorationBoat() {
    const boat = new THREE.Group();
    boat.name = 'ExplorationBoat';

    // Materials matching reference artwork
    const hullWhite = new THREE.MeshStandardMaterial({
      color: 0xf6f9fc,
      roughness: 0.35,
      metalness: 0.12,
      flatShading: true
    });

    const stripeOrange = new THREE.MeshStandardMaterial({
      color: 0xff4726,
      roughness: 0.38,
      metalness: 0.18,
      flatShading: true
    });

    const trimDark = new THREE.MeshStandardMaterial({
      color: 0x1e2530,
      roughness: 0.5,
      metalness: 0.55,
      flatShading: true
    });

    const deckGrey = new THREE.MeshStandardMaterial({
      color: 0x334155,
      roughness: 0.7,
      flatShading: true
    });

    const cabinGlass = new THREE.MeshStandardMaterial({
      color: 0x1d4ed8,
      roughness: 0.06,
      metalness: 0.88,
      transparent: true,
      opacity: 0.88,
      flatShading: true
    });

    const cyanGlow = new THREE.MeshBasicMaterial({
      color: 0x00f5d4
    });

    const seafoamWake = new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      roughness: 0.2,
      metalness: 0.1,
      transparent: true,
      opacity: 0.78,
      flatShading: true
    });

    const flagRed = new THREE.MeshBasicMaterial({
      color: 0xef233c
    });

    const logoNavy = new THREE.MeshBasicMaterial({
      color: 0x1e293b
    });

    // 1. Boat Main Hull & Deck
    // Rounded main hull body
    const hullGeo = new THREE.CylinderGeometry(1.25, 1.1, 4.4, 10);
    hullGeo.rotateX(Math.PI * 0.5);
    const hull = new THREE.Mesh(hullGeo, hullWhite);
    hull.position.set(0, 0.65, 0);
    hull.scale.set(1.05, 0.85, 1.0);
    hull.castShadow = true;
    boat.add(hull);

    // Forward curving bow wedge
    const bowGeo = new THREE.ConeGeometry(1.2, 1.8, 6);
    bowGeo.rotateX(Math.PI * 0.5);
    const bow = new THREE.Mesh(bowGeo, hullWhite);
    bow.position.set(0, 0.75, 2.5);
    bow.scale.set(1.05, 0.8, 1.0);
    bow.castShadow = true;
    boat.add(bow);

    // Waterline orange-red stripe wrapping all around the hull and bow
    const stripeGeo = new THREE.CylinderGeometry(1.28, 1.15, 0.35, 10, 1, true);
    stripeGeo.rotateX(Math.PI * 0.5);
    const waterlineStripe = new THREE.Mesh(stripeGeo, stripeOrange);
    waterlineStripe.position.set(0, 0.48, 0.2);
    waterlineStripe.scale.set(1.06, 0.85, 1.25);
    boat.add(waterlineStripe);

    const bowStripe = new THREE.Mesh(new THREE.ConeGeometry(1.22, 1.82, 6, 1, true), stripeOrange);
    bowStripe.rotateX(Math.PI * 0.5);
    bowStripe.position.set(0, 0.58, 2.5);
    bowStripe.scale.set(1.06, 0.82, 1.0);
    boat.add(bowStripe);

    // Non-skid deck floor
    const deckGeo = new THREE.BoxGeometry(2.1, 0.1, 4.2);
    const deck = new THREE.Mesh(deckGeo, deckGrey);
    deck.position.set(0, 0.98, 0.2);
    boat.add(deck);

    // Flat transom stern at rear
    const transom = new THREE.Mesh(new THREE.BoxGeometry(2.3, 1.0, 0.2), trimDark);
    transom.position.set(0, 0.75, -2.1);
    boat.add(transom);

    // 2. Low-Poly Seafoam Water Wake / Splash Ring
    const wakeGroup = new THREE.Group();
    wakeGroup.name = 'SeafoamSplashWake';

    // Water skirt collar
    const skirtGeo = new THREE.RingGeometry(1.4, 2.4, 12);
    skirtGeo.rotateX(-Math.PI * 0.5);
    const skirt = new THREE.Mesh(skirtGeo, seafoamWake);
    skirt.position.set(0, 0.22, 0.2);
    skirt.scale.set(1.0, 1.5, 1.0);
    wakeGroup.add(skirt);

    // Low-poly faceted bow splash crests
    for (let i = -3; i <= 3; i++) {
      const splashGeo = new THREE.ConeGeometry(0.35 + Math.abs(i) * 0.08, 0.65, 4);
      splashGeo.rotateX(0.4);
      splashGeo.rotateY(i * 0.3);
      const splash = new THREE.Mesh(splashGeo, seafoamWake);
      splash.position.set(i * 0.52, 0.32, 2.6 - Math.abs(i) * 0.35);
      wakeGroup.add(splash);
    }
    boat.add(wakeGroup);

    // 3. Dark Bow Safety Railing (Pulpit)
    const railGroup = new THREE.Group();
    const railMat = trimDark;

    // Curved front top railing
    const railArch = new THREE.Mesh(new THREE.TorusGeometry(1.05, 0.045, 6, 14, Math.PI), railMat);
    railArch.rotation.x = -Math.PI * 0.5;
    railArch.position.set(0, 1.25, 2.0);
    railArch.scale.set(1.0, 1.2, 1.0);
    railGroup.add(railArch);

    // Vertical stanchion posts
    const stanchionPositions = [
      [-1.0, 1.1, 1.2],
      [-0.8, 1.1, 2.2],
      [0.0, 1.1, 2.8],
      [0.8, 1.1, 2.2],
      [1.0, 1.1, 1.2]
    ];
    stanchionPositions.forEach(pos => {
      const post = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.35, 6), railMat);
      post.position.set(pos[0], pos[1], pos[2]);
      railGroup.add(post);
    });
    boat.add(railGroup);

    // 4. Front Panoramic Cobalt-Blue Cockpit Windshield (Matching Spaceship)
    const canopyGeo = new THREE.DodecahedronGeometry(0.95, 1);
    canopyGeo.scale(1.15, 0.85, 1.4);
    const canopy = new THREE.Mesh(canopyGeo, cabinGlass);
    canopy.position.set(0, 1.38, 1.1);
    canopy.rotation.x = -0.22;
    boat.add(canopy);

    const canopyTrim = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.1, 1.6), trimDark);
    canopyTrim.position.set(0, 1.05, 1.1);
    boat.add(canopyTrim);

    // 5. Raised Bridge / Wheelhouse Cabin
    const cabinGeo = new THREE.BoxGeometry(1.6, 1.25, 2.0);
    const cabin = new THREE.Mesh(cabinGeo, hullWhite);
    cabin.position.set(0, 1.55, -0.3);
    cabin.castShadow = true;
    boat.add(cabin);

    // Vertical orange accent stripe on wheelhouse sides
    const cabinStripe = new THREE.Mesh(new THREE.BoxGeometry(1.64, 1.28, 0.4), stripeOrange);
    cabinStripe.position.set(0, 1.55, -0.3);
    boat.add(cabinStripe);

    // Upper bridge observation windows
    const bridgeWindowGeo = new THREE.BoxGeometry(1.45, 0.45, 0.9);
    const bridgeWindow = new THREE.Mesh(bridgeWindowGeo, cabinGlass);
    bridgeWindow.position.set(0, 2.25, -0.15);
    boat.add(bridgeWindow);

    // Bridge roof visor cap
    const roofCap = new THREE.Mesh(new THREE.BoxGeometry(1.55, 0.12, 1.1), hullWhite);
    roofCap.position.set(0, 2.52, -0.15);
    boat.add(roofCap);

    // Roof safety grab-rails
    const roofRailL = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.15, 1.0), trimDark);
    roofRailL.position.set(-0.72, 2.62, -0.15);
    boat.add(roofRailL);

    const roofRailR = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.15, 1.0), trimDark);
    roofRailR.position.set(0.72, 2.62, -0.15);
    boat.add(roofRailR);

    // Decals: Planet with Ring on Wheelhouse Flanks
    const createBoatDecal = (isLeft) => {
      const decalGroup = new THREE.Group();
      decalGroup.position.set(isLeft ? -0.83 : 0.83, 1.65, -0.3);
      decalGroup.rotation.y = isLeft ? -Math.PI * 0.5 : Math.PI * 0.5;

      const disc = new THREE.Mesh(new THREE.CircleGeometry(0.14, 16), logoNavy);
      decalGroup.add(disc);

      const ringT = new THREE.Mesh(new THREE.TorusGeometry(0.22, 0.02, 4, 18), logoNavy);
      ringT.rotation.x = 0.45;
      ringT.position.z = 0.01;
      decalGroup.add(ringT);

      return decalGroup;
    };
    boat.add(createBoatDecal(true));
    boat.add(createBoatDecal(false));

    // 6. Mast & Waving Red Pennant Flag
    const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.055, 1.4, 8), hullWhite);
    mast.position.set(0, 3.25, -0.45);
    boat.add(mast);

    // Waving triangular pennant flag flying backward
    const flagGeo = new THREE.BoxGeometry(0.03, 0.35, 0.65);
    const flag = new THREE.Mesh(flagGeo, flagRed);
    flag.position.set(0, 3.75, -0.82);
    boat.add(flag);

    // 7. Side Outrigger Propulsion Sponsons (Transformed Thrusters)
    const createSideSponson = (isLeft) => {
      const spGroup = new THREE.Group();
      spGroup.position.set(isLeft ? -1.48 : 1.48, 0.72, -0.4);

      // White cylinder float body
      const spBody = new THREE.Mesh(new THREE.CylinderGeometry(0.48, 0.48, 1.5, 10), hullWhite);
      spBody.rotation.x = Math.PI * 0.5;
      spGroup.add(spBody);

      // Orange-red ring stripe
      const spStripe = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, 0.4, 10), stripeOrange);
      spStripe.rotation.x = Math.PI * 0.5;
      spGroup.add(spStripe);

      // Dark slate outer rim with glowing cyan portal core
      const outRim = new THREE.Mesh(new THREE.TorusGeometry(0.46, 0.05, 6, 16), trimDark);
      outRim.rotation.y = Math.PI * 0.5;
      outRim.position.x = isLeft ? -0.46 : 0.46;
      spGroup.add(outRim);

      const cyanCore = new THREE.Mesh(new THREE.CircleGeometry(0.4, 12), cyanGlow);
      cyanCore.rotation.y = isLeft ? -Math.PI * 0.5 : Math.PI * 0.5;
      cyanCore.position.x = isLeft ? -0.48 : 0.48;
      spGroup.add(cyanCore);

      return spGroup;
    };
    boat.add(createSideSponson(true));
    boat.add(createSideSponson(false));

    // 8. Life Preserver Ring / Buoy on Cabin Flanks
    const createLifeBuoy = (isLeft) => {
      const buoyGroup = new THREE.Group();
      buoyGroup.position.set(isLeft ? -1.15 : 1.15, 0.85, 0.45);
      buoyGroup.rotation.y = isLeft ? -Math.PI * 0.5 : Math.PI * 0.5;

      const ring = new THREE.Mesh(new THREE.TorusGeometry(0.18, 0.045, 6, 16), trimDark);
      buoyGroup.add(ring);

      // White cross lashings
      const lashing1 = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.4, 0.02), hullWhite);
      buoyGroup.add(lashing1);
      const lashing2 = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.04, 0.02), hullWhite);
      buoyGroup.add(lashing2);

      return buoyGroup;
    };
    boat.add(createLifeBuoy(true));
    boat.add(createLifeBuoy(false));

    // 9. Stern Water-Jet Propulsion Engine & Auxiliary Thrusters
    const sternJetGroup = new THREE.Group();
    sternJetGroup.position.set(0, 0.72, -2.25);

    const jetHousing = new THREE.Mesh(new THREE.CylinderGeometry(0.52, 0.52, 0.65, 12), hullWhite);
    jetHousing.rotation.x = Math.PI * 0.5;
    sternJetGroup.add(jetHousing);

    const jetStripe = new THREE.Mesh(new THREE.CylinderGeometry(0.54, 0.54, 0.25, 12), stripeOrange);
    jetStripe.rotation.x = Math.PI * 0.5;
    sternJetGroup.add(jetStripe);

    const jetRim = new THREE.Mesh(new THREE.TorusGeometry(0.5, 0.05, 6, 16), trimDark);
    jetRim.position.z = -0.32;
    sternJetGroup.add(jetRim);

    const jetCore = new THREE.Mesh(new THREE.CircleGeometry(0.44, 12), cyanGlow);
    jetCore.rotation.y = Math.PI;
    jetCore.position.z = -0.34;
    sternJetGroup.add(jetCore);

    boat.add(sternJetGroup);

    // Twin small auxiliary trim pods
    const auxL = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.24, 0.5, 8), trimDark);
    auxL.rotation.x = Math.PI * 0.5;
    auxL.position.set(-1.0, 0.85, -2.15);
    boat.add(auxL);

    const auxR = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.24, 0.5, 8), trimDark);
    auxR.rotation.x = Math.PI * 0.5;
    auxR.position.set(1.0, 0.85, -2.15);
    boat.add(auxR);

    // 10. Launch Thruster Flame System (boat.userData.flame)
    const flameGroup = new THREE.Group();
    flameGroup.name = 'BoatLaunchFlames';

    // Main rear water-jet blast plume
    const rearPlume = new THREE.Mesh(
      new THREE.ConeGeometry(0.55, 2.4, 10),
      new THREE.MeshBasicMaterial({ color: 0x00f5d4, transparent: true, opacity: 0.85, blending: THREE.AdditiveBlending })
    );
    rearPlume.rotation.x = -Math.PI * 0.5;
    rearPlume.position.set(0, 0.72, -3.8);
    flameGroup.add(rearPlume);

    // Downward lift plumes for ascending out of ocean into space
    const vtolL = new THREE.Mesh(
      new THREE.ConeGeometry(0.42, 1.5, 8),
      new THREE.MeshBasicMaterial({ color: 0x00b4d8, transparent: true, opacity: 0.8, blending: THREE.AdditiveBlending })
    );
    vtolL.rotation.x = Math.PI;
    vtolL.position.set(-1.48, 0.0, -0.4);
    flameGroup.add(vtolL);

    const vtolR = new THREE.Mesh(
      new THREE.ConeGeometry(0.42, 1.5, 8),
      new THREE.MeshBasicMaterial({ color: 0x00b4d8, transparent: true, opacity: 0.8, blending: THREE.AdditiveBlending })
    );
    vtolR.rotation.x = Math.PI;
    vtolR.position.set(1.48, 0.0, -0.4);
    flameGroup.add(vtolR);

    flameGroup.visible = false;
    boat.add(flameGroup);
    boat.userData.flame = flameGroup;

    boat.scale.set(1.1, 1.1, 1.1);
    return boat;
  }

  /**
   * Creates a mining drill station rig with animated rotating drill bit.
   */
  static createMiningDrill() {
    const drillGroup = new THREE.Group();
    drillGroup.name = 'MiningDrill';

    const steelMat = new THREE.MeshStandardMaterial({
      color: 0x4a4e69,
      roughness: 0.5,
      metalness: 0.6,
      flatShading: true
    });

    const hazardMat = new THREE.MeshStandardMaterial({
      color: 0xf77f00,
      roughness: 0.4,
      metalness: 0.3,
      flatShading: true
    });

    const glowMat = new THREE.MeshStandardMaterial({
      color: 0x00f5d4,
      emissive: 0x00bbf9,
      emissiveIntensity: 0.6,
      roughness: 0.2
    });

    // Tripod Rig Base
    for (let i = 0; i < 3; i++) {
      const angle = (i * Math.PI * 2) / 3;
      const legGeo = new THREE.CylinderGeometry(0.12, 0.16, 2.6, 6);
      legGeo.rotateZ(0.35);
      legGeo.translate(1.0, 1.1, 0);

      const leg = new THREE.Mesh(legGeo, steelMat);
      leg.rotation.y = angle;
      leg.castShadow = true;
      drillGroup.add(leg);
    }

    // Housing & Core
    const housingGeo = new THREE.CylinderGeometry(0.65, 0.75, 1.8, 8);
    const housing = new THREE.Mesh(housingGeo, hazardMat);
    housing.position.y = 1.9;
    housing.castShadow = true;
    drillGroup.add(housing);

    const coreGeo = new THREE.CylinderGeometry(0.4, 0.4, 0.8, 8);
    const core = new THREE.Mesh(coreGeo, glowMat);
    core.position.y = 1.9;
    drillGroup.add(core);

    // Rotating Auger / Drill Bit
    const bitGroup = new THREE.Group();
    bitGroup.position.y = 1.0;

    const bitStemGeo = new THREE.CylinderGeometry(0.15, 0.15, 1.4, 6);
    const bitStem = new THREE.Mesh(bitStemGeo, steelMat);
    bitStem.position.y = -0.4;
    bitGroup.add(bitStem);

    for (let j = 0; j < 4; j++) {
      const bladeGeo = new THREE.BoxGeometry(0.5, 0.12, 0.25);
      bladeGeo.translate(0.18, -j * 0.25, 0);
      bladeGeo.rotateY(j * 1.1);
      const blade = new THREE.Mesh(bladeGeo, hazardMat);
      bitGroup.add(blade);
    }

    drillGroup.add(bitGroup);
    drillGroup.userData.bitGroup = bitGroup;

    drillGroup.scale.set(1.1, 1.1, 1.1);
    return drillGroup;
  }

  /**
   * Creates stylized low-poly trees (Oak & Pine).
   */
  static createTree(isPine = false) {
    const tree = new THREE.Group();
    const trunkMat = new THREE.MeshStandardMaterial({
      color: 0x6f4e37,
      roughness: 0.9,
      flatShading: true
    });

    if (isPine) {
      const foliageMat = new THREE.MeshStandardMaterial({
        color: 0x2d6a4f,
        roughness: 0.8,
        flatShading: true
      });

      const trunkGeo = new THREE.CylinderGeometry(0.2, 0.3, 1.2, 5);
      const trunk = new THREE.Mesh(trunkGeo, trunkMat);
      trunk.position.y = 0.6;
      trunk.castShadow = true;
      tree.add(trunk);

      for (let i = 0; i < 3; i++) {
        const coneGeo = new THREE.ConeGeometry(1.4 - i * 0.35, 1.3, 6);
        const cone = new THREE.Mesh(coneGeo, foliageMat);
        cone.position.y = 1.4 + i * 0.75;
        cone.castShadow = true;
        tree.add(cone);
      }
    } else {
      const foliageMat = new THREE.MeshStandardMaterial({
        color: 0x52b788,
        roughness: 0.75,
        flatShading: true
      });

      const trunkGeo = new THREE.CylinderGeometry(0.25, 0.4, 1.4, 6);
      const trunk = new THREE.Mesh(trunkGeo, trunkMat);
      trunk.position.y = 0.7;
      trunk.castShadow = true;
      tree.add(trunk);

      const f1 = new THREE.Mesh(new THREE.DodecahedronGeometry(1.2, 1), foliageMat);
      f1.position.set(0, 2.0, 0);
      f1.castShadow = true;
      tree.add(f1);

      const f2 = new THREE.Mesh(new THREE.DodecahedronGeometry(0.8, 1), foliageMat);
      f2.position.set(0.5, 2.4, 0.3);
      f2.castShadow = true;
      tree.add(f2);
    }

    tree.userData.isFlora = true;
    return tree;
  }

  static createAlienFlora(color = 0x9d4edd) {
    const flora = new THREE.Group();
    const stemMat = new THREE.MeshStandardMaterial({
      color: 0x3c096c,
      roughness: 0.7,
      flatShading: true
    });
    const capMat = new THREE.MeshStandardMaterial({
      color: color,
      emissive: color,
      emissiveIntensity: 0.4,
      roughness: 0.4,
      flatShading: true
    });

    const stemGeo = new THREE.CylinderGeometry(0.12, 0.22, 1.6, 5);
    const stem = new THREE.Mesh(stemGeo, stemMat);
    stem.position.y = 0.8;
    stem.rotation.z = 0.15;
    flora.add(stem);

    const capGeo = new THREE.ConeGeometry(1.0, 0.7, 7);
    const cap = new THREE.Mesh(capGeo, capMat);
    cap.position.set(0.1, 1.7, 0);
    flora.add(cap);

    flora.userData.isFlora = true;
    return flora;
  }

  static createMineralCrystal(color = 0x00f5d4) {
    const crystal = new THREE.Group();
    const mat = new THREE.MeshStandardMaterial({
      color: color,
      emissive: color,
      emissiveIntensity: 0.5,
      roughness: 0.2,
      metalness: 0.8,
      flatShading: true
    });

    for (let i = 0; i < 3; i++) {
      const spireGeo = new THREE.ConeGeometry(0.35 - i * 0.08, 1.8 - i * 0.3, 5);
      const spire = new THREE.Mesh(spireGeo, mat);
      spire.position.set(
        Math.cos((i * Math.PI * 2) / 3) * 0.3,
        0.8,
        Math.sin((i * Math.PI * 2) / 3) * 0.3
      );
      spire.rotation.z = (Math.random() - 0.5) * 0.4;
      spire.rotation.x = (Math.random() - 0.5) * 0.4;
      spire.castShadow = true;
      crystal.add(spire);
    }

    crystal.userData.isMineral = true;
    return crystal;
  }

  static createRock(color = 0x8d99ae) {
    const geo = new THREE.DodecahedronGeometry(0.65, 1);
    const pos = geo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const scale = 0.85 + Math.random() * 0.3;
      pos.setXYZ(i, pos.getX(i) * scale, pos.getY(i) * scale, pos.getZ(i) * scale);
    }
    geo.computeVertexNormals();

    const mat = new THREE.MeshStandardMaterial({
      color: color,
      roughness: 0.9,
      flatShading: true
    });
    const rock = new THREE.Mesh(geo, mat);
    rock.position.y = 0.4;
    rock.castShadow = true;
    rock.receiveShadow = true;
    return rock;
  }
}
