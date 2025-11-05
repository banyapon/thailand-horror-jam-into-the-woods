
import * as THREE from 'three';

const FRAMES_PER_SPRITE_ROW = 4;
const TOTAL_SPRITE_ROWS = 3; // idle, walk, hurt

// --- Base Character Class ---
export class Character {
  id: string;
  mesh: THREE.Mesh;
  hp: number;
  maxHp: number;
  animationState: 'idle' | 'walk' | 'hurt';
  frame: number;
  lastFrameUpdate: number;
  animationData: {
    idle: { row: number, frameCount: number, frameRate: number, loop: boolean };
    walk: { row: number, frameCount: number, frameRate: number, loop: boolean };
    hurt: { row: number, frameCount: number, frameRate: number, loop: boolean };
  };
  direction: 'left' | 'right';
  width: number;
  indicatorMesh: THREE.Mesh;
  shadowMesh: THREE.Mesh;
  footstepAudio?: THREE.PositionalAudio;
  audioBuffers: Record<string, AudioBuffer>;
  spotLight: THREE.SpotLight;
  spotLightTarget: THREE.Object3D;
  currentWeather: 'clear' | 'rain' | 'foggy' = 'clear';
  sfxVolume: number = 0.5;

  constructor(
    id: string,
    scene: THREE.Scene, 
    texture: THREE.Texture, 
    scale: THREE.Vector3, 
    animationData: Character['animationData'],
    listener: THREE.AudioListener,
    audioBuffers: Record<string, AudioBuffer>,
    shadowTexture: THREE.Texture
  ) {
    this.id = id;
    this.hp = 100;
    this.maxHp = 100;
    this.animationState = 'idle';
    this.frame = 0;
    this.lastFrameUpdate = 0;
    this.animationData = animationData;
    this.direction = 'right';
    this.width = scale.x;
    this.audioBuffers = audioBuffers;

    texture.magFilter = THREE.NearestFilter;
    texture.minFilter = THREE.NearestFilter;

    const material = new THREE.MeshStandardMaterial({
        color: 0xffffff,
        map: texture,
        emissiveMap: texture,
        emissive: 0xbbbbbb,
        emissiveIntensity: 0.4,
        transparent: true,
        alphaTest: 0.5,
        side: THREE.DoubleSide,
    });
    const geometry = new THREE.PlaneGeometry(1, 1);
    this.mesh = new THREE.Mesh(geometry, material);
    this.mesh.scale.copy(scale);
    this.mesh.castShadow = false;
    this.mesh.receiveShadow = true;
    scene.add(this.mesh);

    const indicatorGeo = new THREE.CircleGeometry(1.5, 16);
    const indicatorMat = new THREE.MeshBasicMaterial({ color: 0xff0000, side: THREE.DoubleSide });
    this.indicatorMesh = new THREE.Mesh(indicatorGeo, indicatorMat);
    this.indicatorMesh.rotation.x = -Math.PI / 2;
    this.indicatorMesh.layers.set(1);
    scene.add(this.indicatorMesh);

    const shadowGeo = new THREE.PlaneGeometry(1.5, 1.5);
    const shadowMat = new THREE.MeshBasicMaterial({
        map: shadowTexture,
        transparent: true,
        opacity: 0.4,
        depthWrite: false,
    });
    this.shadowMesh = new THREE.Mesh(shadowGeo, shadowMat);
    this.shadowMesh.rotation.x = -Math.PI / 2;
    scene.add(this.shadowMesh);

    if (listener) {
        this.footstepAudio = new THREE.PositionalAudio(listener);
        this.mesh.add(this.footstepAudio);
    }
    
    // Create a soft spotlight for the character
    this.spotLight = new THREE.SpotLight(0xffeedd, 0.48, 15, Math.PI / 4, 0.8, 1.5);
    this.spotLight.castShadow = false;
    scene.add(this.spotLight);
    
    this.spotLightTarget = new THREE.Object3D();
    this.spotLight.target = this.spotLightTarget;
    scene.add(this.spotLightTarget);

    this.updateTexture();
  }

  updateAnimation(delta: number, isMoving: boolean, moveDirectionX: number = 0) {
    const now = performance.now();
    let needsUpdate = false;
    const oldState = this.animationState;
    const oldDirection = this.direction;

    const currentAnimData = this.animationData[this.animationState];
    const isFinished = !currentAnimData.loop && this.frame >= currentAnimData.frameCount - 1;

    if (this.animationState === 'hurt' && isFinished) {
      this.animationState = 'idle';
    } else if (this.animationState !== 'hurt') {
      this.animationState = isMoving ? 'walk' : 'idle';
    }
    
    if (this.footstepAudio) {
        const soundId = this.currentWeather === 'rain' ? 'footsteps_splash' : 'footsteps_grass';
        if (this.animationState === 'walk') {
            if (!this.footstepAudio.isPlaying || this.footstepAudio.buffer !== this.audioBuffers[soundId]) {
                if (this.footstepAudio.isPlaying) this.footstepAudio.stop();
                
                if (this.audioBuffers[soundId]) {
                    this.footstepAudio.setBuffer(this.audioBuffers[soundId]);
                    this.footstepAudio.setLoop(true);
                    this.footstepAudio.setVolume((this.currentWeather === 'rain' ? 0.8 : 0.6) * this.sfxVolume);
                    this.footstepAudio.setPlaybackRate(0.9 + Math.random() * 0.2);
                    this.footstepAudio.play();
                }
            }
        } else if (this.footstepAudio.isPlaying) {
            this.footstepAudio.stop();
        }
    }

    if (this.animationState !== oldState) {
      this.frame = 0;
      this.lastFrameUpdate = now;
      needsUpdate = true;
    }
    
    const newAnimData = this.animationData[this.animationState];
    if (now - this.lastFrameUpdate > newAnimData.frameRate) {
      const isLastFrame = this.frame >= newAnimData.frameCount - 1;
      if (!isLastFrame) this.frame++;
      else if (newAnimData.loop) this.frame = 0;
      this.lastFrameUpdate = now;
      needsUpdate = true;
    }
    
    if (moveDirectionX < -0.01) this.direction = 'left';
    else if (moveDirectionX > 0.01) this.direction = 'right';

    if (this.direction !== oldDirection) needsUpdate = true;
    if (needsUpdate) this.updateTexture();
  }

  updateTexture() {
    const material = this.mesh.material as THREE.MeshStandardMaterial;
    const texture = (material.map || material.emissiveMap) as THREE.Texture;
    if (!texture) return;

    const currentAnimData = this.animationData[this.animationState];
    const baseRepeatX = 1 / FRAMES_PER_SPRITE_ROW;
    
    if (this.direction === 'left') {
      texture.repeat.x = -baseRepeatX;
      texture.offset.x = ((this.frame % FRAMES_PER_SPRITE_ROW) + 1) / FRAMES_PER_SPRITE_ROW;
    } else {
      texture.repeat.x = baseRepeatX;
      texture.offset.x = (this.frame % FRAMES_PER_SPRITE_ROW) / FRAMES_PER_SPRITE_ROW;
    }
    texture.offset.y = (TOTAL_SPRITE_ROWS - 1 - currentAnimData.row) / TOTAL_SPRITE_ROWS;
  }

  move(moveVector: THREE.Vector3, collidables: THREE.Mesh[], worldBounds: THREE.Box2) {
    const getCharacterBox = (position: THREE.Vector3) => {
        const center = new THREE.Vector3(position.x, this.mesh.scale.y / 2, position.z);
        const size = new THREE.Vector3(this.width, this.mesh.scale.y, this.width);
        return new THREE.Box3().setFromCenterAndSize(center, size);
    };

    // Move X axis and check for collision
    const newPositionX = this.mesh.position.clone();
    newPositionX.x = Math.max(worldBounds.min.x, Math.min(worldBounds.max.x, newPositionX.x + moveVector.x));
    const boxX = getCharacterBox(newPositionX);
    const collisionX = collidables.some(c => boxX.intersectsBox(new THREE.Box3().setFromObject(c)));
    if (!collisionX) {
        this.mesh.position.x = newPositionX.x;
    }

    // Move Z axis and check for collision
    const newPositionZ = this.mesh.position.clone();
    newPositionZ.z = Math.max(worldBounds.min.y, Math.min(worldBounds.max.y, newPositionZ.z + moveVector.z));
    const boxZ = getCharacterBox(newPositionZ);
    const collisionZ = collidables.some(c => boxZ.intersectsBox(new THREE.Box3().setFromObject(c)));
    if (!collisionZ) {
        this.mesh.position.z = newPositionZ.z;
    }

    this.indicatorMesh.position.set(this.mesh.position.x, 0.1, this.mesh.position.z);
    this.shadowMesh.position.set(this.mesh.position.x, 0.01, this.mesh.position.z);
    
    // Update spotlight position and flicker based on weather
    this.spotLight.position.set(this.mesh.position.x, this.mesh.position.y + 6, this.mesh.position.z);
    this.spotLightTarget.position.copy(this.mesh.position);
    this.spotLightTarget.position.y = 0; // Target the ground
    
    let baseIntensity = 0.48;
    let flickerAmount = 0.1;
    if (this.currentWeather === 'rain') {
        baseIntensity = 0.42;
        flickerAmount = 0.25; // More noticeable flicker
    } else if (this.currentWeather === 'foggy') {
        baseIntensity = 0.36; // Dimmer in fog
        flickerAmount = 0.05;
    }
    this.spotLight.intensity = baseIntensity + (Math.random() - 0.5) * flickerAmount;
  }

  lookAt(target: THREE.Vector3) {
      this.mesh.lookAt(new THREE.Vector3(target.x, this.mesh.position.y, target.z));
  }
}

// --- Player Class ---
export class Player extends Character {
  static CHARACTER_HEIGHT = 3.8;
  static CHARACTER_ASPECT_RATIO = 64 / 170;
  static CHARACTER_WIDTH = Player.CHARACTER_HEIGHT * Player.CHARACTER_ASPECT_RATIO;
  static PLAYER_SCALE = new THREE.Vector3(Player.CHARACTER_WIDTH, Player.CHARACTER_HEIGHT, 1);
  static PLAYER_SPEED = 5;
  velocity: THREE.Vector3 = new THREE.Vector3();
  isMoving: boolean = false;

  constructor(scene: THREE.Scene, texture: THREE.Texture, listener: THREE.AudioListener, audioBuffers: Record<string, AudioBuffer>, shadowTexture: THREE.Texture) {
    const animationData = {
        idle: { row: 0, frameCount: 4, frameRate: 200, loop: true },
        walk: { row: 1, frameCount: 4, frameRate: 150, loop: true },
        hurt: { row: 2, frameCount: 4, frameRate: 100, loop: false }
    };
    super('player', scene, texture, Player.PLAYER_SCALE, animationData, listener, audioBuffers, shadowTexture);
    this.mesh.position.y = Player.PLAYER_SCALE.y / 2;
    (this.indicatorMesh.material as THREE.MeshBasicMaterial).color.set(0x00ff00);
  }
    
  update(delta: number, keys: Record<string, boolean>, collidables: THREE.Mesh[], isPaused: boolean, worldBounds: THREE.Box2, gamepad: Gamepad | null | undefined, weather: 'clear' | 'rain' | 'foggy', sfxVolume: number, joystickVector?: { x: number, y: number }) {
    this.sfxVolume = sfxVolume;
    this.currentWeather = weather;
    
    const targetVelocity = new THREE.Vector3();
    const speed = keys['shift'] ? Player.PLAYER_SPEED * 1.75 : Player.PLAYER_SPEED;

    if (!isPaused) {
        // Keyboard controls
        if (keys['w'] || keys['arrowup']) targetVelocity.z -= 1;
        if (keys['s'] || keys['arrowdown']) targetVelocity.z += 1;
        if (keys['a'] || keys['arrowleft']) targetVelocity.x -= 1;
        if (keys['d'] || keys['arrowright']) targetVelocity.x += 1;
        
        // Gamepad controls
        if (gamepad) {
            const stickX = gamepad.axes[0] ?? 0;
            const stickY = gamepad.axes[1] ?? 0;
            const deadzone = 0.15;

            if (Math.abs(stickY) > deadzone) {
                targetVelocity.z += stickY;
            }
            if (Math.abs(stickX) > deadzone) {
                targetVelocity.x += stickX;
            }
        }

        // Joystick controls (additive)
        if (joystickVector) {
            targetVelocity.x += joystickVector.x;
            targetVelocity.z += joystickVector.y;
        }
    }

    // Normalize to prevent faster diagonal movement and scale to player speed
    if (targetVelocity.lengthSq() > 1) {
        targetVelocity.normalize();
    }
    targetVelocity.multiplyScalar(speed);

    // Smoothly interpolate current velocity towards the target for acceleration/deceleration
    const smoothing = 0.1; 
    this.velocity.lerp(targetVelocity, smoothing);

    // If velocity is very low, stop completely to prevent drifting
    if (this.velocity.lengthSq() < 0.01) {
        this.velocity.set(0, 0, 0);
    }
    
    const moveVector = this.velocity.clone().multiplyScalar(delta);
    this.isMoving = this.velocity.lengthSq() > 0.1; // Use a small threshold to define movement

    if (this.isMoving) {
        this.move(moveVector, collidables, worldBounds);
    }
    
    // Use velocity for animation direction
    let moveDirectionX = 0;
    if (this.velocity.x < -0.1) {
        moveDirectionX = -1;
    } else if (this.velocity.x > 0.1) {
        moveDirectionX = 1;
    }

    this.updateAnimation(delta, this.isMoving, moveDirectionX);
  }
}
