import * as THREE from 'three';

const ALTAR_HEIGHT = 4;
const ALTAR_WIDTH = 4;

export class Altar {
    mesh: THREE.Mesh;
    light1: THREE.PointLight;
    deactivated: boolean = false;
    private scene: THREE.Scene;

    constructor(scene: THREE.Scene, position: THREE.Vector3, texture: THREE.Texture) {
        this.scene = scene;

        const material = new THREE.MeshStandardMaterial({
            map: texture,
            transparent: true,
            alphaTest: 0.5,
        });

        const geometry = new THREE.PlaneGeometry(ALTAR_WIDTH, ALTAR_HEIGHT);
        this.mesh = new THREE.Mesh(geometry, material);
        this.mesh.position.copy(position);
        this.mesh.position.y = ALTAR_HEIGHT / 2;
        scene.add(this.mesh);

        // Faint blue light
        this.light1 = new THREE.PointLight(0x88ccff, 1.2, 12, 2);
        this.light1.position.set(position.x, position.y + 1, position.z);
        scene.add(this.light1);
    }

    update(delta: number, elapsedTime: number) {
        if (!this.deactivated) {
            // Flicker effect
            this.light1.intensity = 1.0 + Math.sin(elapsedTime * 5 + this.mesh.position.x) * 0.4;
        }
    }

    deactivate() {
        if (!this.deactivated) {
            this.deactivated = true;
            this.light1.intensity = 0;
            this.light1.visible = false;
        }
    }

    destroy() {
        this.scene.remove(this.mesh);
        this.scene.remove(this.light1);
        (this.mesh.material as THREE.Material).dispose();
        this.mesh.geometry.dispose();
    }
}