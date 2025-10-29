
import * as THREE from 'three';
import { Character, Player } from './player'; // Player contains Character export
import { LangString } from './case';

const NPC_SCALE = new THREE.Vector3(Player.CHARACTER_WIDTH, Player.CHARACTER_HEIGHT, 1);
const NPC_SPEED = 2;

export class NPC extends Character {
  name: string;
  role: LangString;
  status: 'alive' | 'deceased';
  targetPosition: THREE.Vector3 | null = null;
  idleTimer: number = 0;
  gender: 'male' | 'female';
  profileAvatar: string;
  velocity: THREE.Vector3 = new THREE.Vector3();
  isControlled: boolean = false;
  following: NPC | Player | null = null;
  isWalking: boolean = false;
  hasPerformedRitual: boolean = false;

  constructor(
    scene: THREE.Scene,
    texture: THREE.Texture,
    name: string,
    id: string,
    role: LangString,
    position: THREE.Vector3,
    listener: THREE.AudioListener,
    audioBuffers: Record<string, AudioBuffer>,
    gender: 'male' | 'female',
    profileAvatar: string,
    shadowTexture: THREE.Texture
  ) {
    const animationData = {
        idle: { row: 0, frameCount: 4, frameRate: 250, loop: true },
        walk: { row: 1, frameCount: 4, frameRate: 180, loop: true },
        hurt: { row: 2, frameCount: 4, frameRate: 120, loop: false }
    };
    super(id, scene, texture, NPC_SCALE, animationData, listener, audioBuffers, shadowTexture);
    this.name = name;
    this.role = role;
    this.status = 'alive';
    this.mesh.position.copy(position);
    this.mesh.position.y = NPC_SCALE.y / 2;
    this.indicatorMesh.position.set(this.mesh.position.x, 0.1, this.mesh.position.z);
    this.idleTimer = Math.random() * 5 + 2;
    this.gender = gender;
    this.profileAvatar = profileAvatar;
  }

  update(delta: number, collidables: THREE.Mesh[], worldBounds: THREE.Box2, isPaused: boolean, sfxVolume: number, weather: 'clear' | 'rain' | 'foggy') {
      this.sfxVolume = sfxVolume;
      this.currentWeather = weather;
      this.spotLight.visible = this.status === 'alive';
      this.shadowMesh.visible = this.status === 'alive';
      
      if (isPaused) {
          this.updateAnimation(delta, false, 0);
          return;
      }

      if (this.isWalking) {
          this.updateAnimation(delta, true, 1);
          return;
      }

      if (this.following && this.status === 'alive') {
        const targetPos = this.following.mesh.position;
        const distance = this.mesh.position.distanceTo(targetPos);
        let isMoving = false;
        let moveDirectionX = 0;
        
        if (distance > 3) { // Keep some distance
            isMoving = true;
            const direction = targetPos.clone().sub(this.mesh.position).normalize();
            const moveVector = direction.clone().multiplyScalar(NPC_SPEED * 1.2 * delta); // Move a bit faster when following
            this.move(moveVector, collidables, worldBounds);
            moveDirectionX = direction.x;
        }
        
        this.updateAnimation(delta, isMoving, moveDirectionX);
        return; 
      }


      if (this.isControlled) {
          const isMoving = this.velocity.lengthSq() > 0.1;
          if (!isMoving && this.footstepAudio?.isPlaying) {
              this.footstepAudio.stop();
          }
          return;
      }

      let isMoving = false;
      let moveDirectionX = 0;

      this.idleTimer -= delta;

      if (!this.targetPosition && this.idleTimer <= 0) {
          const newX = THREE.MathUtils.mapLinear(Math.random(), 0, 1, worldBounds.min.x, worldBounds.max.x);
          const newZ = THREE.MathUtils.mapLinear(Math.random(), 0, 1, worldBounds.min.y, worldBounds.max.y);
          this.targetPosition = new THREE.Vector3(newX, this.mesh.position.y, newZ);
      }

      if (this.targetPosition) {
          const distance = this.mesh.position.distanceTo(this.targetPosition);

          if (distance > 1) {
              isMoving = true;
              const direction = this.targetPosition.clone().sub(this.mesh.position).normalize();
              const moveVector = direction.clone().multiplyScalar(NPC_SPEED * delta);
              this.move(moveVector, collidables, worldBounds);
              moveDirectionX = direction.x;
          } else {
              this.targetPosition = null;
              this.idleTimer = Math.random() * 7 + 3;
          }
      }

      this.updateAnimation(delta, isMoving, moveDirectionX);
  }
}