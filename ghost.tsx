import * as THREE from 'three';
import { NPC } from './npc';
import { Player } from './player';

const GHOST_SPRITE_FRAMES = 4;
const GHOST_ANIMATION_RATE = 150; // ms per frame
const GHOST_SPEED = 6;
const GHOST_ASPECT_RATIO = 84 / 223;
const GHOST_HEIGHT = Player.CHARACTER_HEIGHT * 1.1; 
const GHOST_WIDTH = GHOST_HEIGHT * GHOST_ASPECT_RATIO;

export class Ghost {
    mesh: THREE.Mesh;
    target: NPC | Player;
    scene: THREE.Scene;
    animationTimer = 0;
    currentFrame = 0;
    direction: 'left' | 'right' = 'right';

    constructor(scene: THREE.Scene, texture: THREE.Texture, target: NPC | Player, playerPosition: THREE.Vector3 | null, isLosingCinematic = false) {
        this.scene = scene;
        this.target = target;

        texture.magFilter = THREE.NearestFilter;
        texture.minFilter = THREE.NearestFilter;
        
        const material = new THREE.MeshStandardMaterial({
            map: texture.clone(),
            transparent: true,
            alphaTest: 0.5,
        });
        material.map!.repeat.set(1 / GHOST_SPRITE_FRAMES, 1);

        const geometry = new THREE.PlaneGeometry(GHOST_WIDTH, GHOST_HEIGHT);
        this.mesh = new THREE.Mesh(geometry, material);

        let spawnPosition: THREE.Vector3;
        if (isLosingCinematic) {
            // Spawn at a random corner relative to the player
            const angle = Math.random() * Math.PI * 2;
            const radius = 25; // Far away
            const spawnX = target.mesh.position.x + Math.cos(angle) * radius;
            const spawnZ = target.mesh.position.z + Math.sin(angle) * radius;
            spawnPosition = new THREE.Vector3(spawnX, GHOST_HEIGHT / 2, spawnZ);

        } else if (playerPosition) {
            // Original logic for NPC cinematic: Spawn behind the player, away from the victim
            const spawnDirection = playerPosition.clone().sub(target.mesh.position).normalize();
            spawnDirection.y = 0;
            spawnPosition = playerPosition.clone().add(spawnDirection.multiplyScalar(15));
            spawnPosition.y = GHOST_HEIGHT / 2;
        } else {
            // Failsafe spawn
            spawnPosition = target.mesh.position.clone().add(new THREE.Vector3(15, 0, 15));
            spawnPosition.y = GHOST_HEIGHT / 2;
        }


        this.mesh.position.copy(spawnPosition);
        scene.add(this.mesh);
    }

    private updateTexture() {
        const material = this.mesh.material as THREE.MeshStandardMaterial;
        if (!material.map) return;

        const baseRepeatX = 1 / GHOST_SPRITE_FRAMES;
        
        if (this.direction === 'left') {
          material.map.repeat.x = -baseRepeatX;
          material.map.offset.x = (this.currentFrame + 1) / GHOST_SPRITE_FRAMES;
        } else { // right
          material.map.repeat.x = baseRepeatX;
          material.map.offset.x = this.currentFrame / GHOST_SPRITE_FRAMES;
        }
    }

    update(delta: number) {
        const directionVector = this.target.mesh.position.clone().sub(this.mesh.position);
        const oldDirection = this.direction;


        if (directionVector.x < 0) {
            this.direction = 'left';
        } else if (directionVector.x > 0) {
            this.direction = 'right';
        }
        // If directionVector.x is 0
        
        let textureNeedsUpdate = oldDirection !== this.direction;

        // Animation
        this.animationTimer += delta * 1000;
        if (this.animationTimer > GHOST_ANIMATION_RATE) {
            this.animationTimer = 0;
            this.currentFrame = (this.currentFrame + 1) % GHOST_SPRITE_FRAMES;
            textureNeedsUpdate = true;
        }

        if (textureNeedsUpdate) {
            this.updateTexture();
        }

        // Movement
        const moveVector = directionVector.normalize().multiplyScalar(GHOST_SPEED * delta);
        this.mesh.position.add(moveVector);
    }
    
    destroy() {
        if (this.mesh.parent) {
             this.scene.remove(this.mesh);
        }
        (this.mesh.material as THREE.MeshStandardMaterial).map?.dispose();
        (this.mesh.material as THREE.MeshStandardMaterial).dispose();
        this.mesh.geometry.dispose();
    }
}