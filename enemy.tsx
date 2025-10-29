import * as THREE from 'three';
import { NPC } from './npc';
import { Player } from './player';

export class Enemy {
  mesh: THREE.Mesh;
  target: NPC | Player | null = null;
  speed = 3.5;

  constructor(scene: THREE.Scene) {
    const geometry = new THREE.BoxGeometry(2, 2, 2);
    const material = new THREE.MeshStandardMaterial({
      color: 0xff0000,
    });
    this.mesh = new THREE.Mesh(geometry, material);
    this.mesh.position.y = 1;
    scene.add(this.mesh);
  }

  move(moveVector: THREE.Vector3, collidables: THREE.Mesh[], worldBounds: THREE.Box2) {
    const getEnemyBox = (position: THREE.Vector3) => {
        const center = new THREE.Vector3(position.x, this.mesh.position.y, position.z);
        const size = new THREE.Vector3(this.mesh.scale.x, this.mesh.scale.y, this.mesh.scale.z);
        return new THREE.Box3().setFromCenterAndSize(center, size);
    };

    // Move X axis and check for collision
    const newPositionX = this.mesh.position.clone();
    newPositionX.x = Math.max(worldBounds.min.x, Math.min(worldBounds.max.x, newPositionX.x + moveVector.x));
    const boxX = getEnemyBox(newPositionX);
    const collisionX = collidables.some(c => boxX.intersectsBox(new THREE.Box3().setFromObject(c)));
    if (!collisionX) {
        this.mesh.position.x = newPositionX.x;
    }

    // Move Z axis and check for collision
    const newPositionZ = this.mesh.position.clone();
    newPositionZ.z = Math.max(worldBounds.min.y, Math.min(worldBounds.max.y, newPositionZ.z + moveVector.z));
    const boxZ = getEnemyBox(newPositionZ);
    const collisionZ = collidables.some(c => boxZ.intersectsBox(new THREE.Box3().setFromObject(c)));
    if (!collisionZ) {
        this.mesh.position.z = newPositionZ.z;
    }
  }

  update(delta: number, collidables: THREE.Mesh[], worldBounds: THREE.Box2) {
    if (this.target && (this.target as any).status !== 'deceased') {
      const direction = this.target.mesh.position.clone().sub(this.mesh.position).normalize();
      const moveVector = direction.clone().multiplyScalar(this.speed * delta);
      this.move(moveVector, collidables, worldBounds);
    }
  }
}