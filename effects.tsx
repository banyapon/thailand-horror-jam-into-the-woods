import * as THREE from 'three';

const PARTICLE_COUNT = 300;
const PARTICLE_LIFETIME = 1.5; // seconds
const PARTICLE_SPEED = 3;

export class BloodSplatter {
    private scene: THREE.Scene;
    private group: THREE.Group;
    private particles: { mesh: THREE.Mesh; velocity: THREE.Vector3; life: number }[] = [];
    private isFinished = false;

    constructor(scene: THREE.Scene, position: THREE.Vector3) {
        this.scene = scene;
        this.group = new THREE.Group();
        this.group.position.copy(position);

        const particleGeo = new THREE.PlaneGeometry(0.15, 0.15);
        const particleMat = new THREE.MeshBasicMaterial({
            color: 0xaa0000,
            side: THREE.DoubleSide,
            transparent: true,
        });

        for (let i = 0; i < PARTICLE_COUNT; i++) {
            const mesh = new THREE.Mesh(particleGeo, particleMat.clone());
            const velocity = new THREE.Vector3(
                (Math.random() - 0.5),
                (Math.random() - 0.5),
                (Math.random() - 0.5)
            ).normalize().multiplyScalar(PARTICLE_SPEED * (0.5 + Math.random() * 0.5));
            
            this.particles.push({ mesh, velocity, life: PARTICLE_LIFETIME });
            this.group.add(mesh);
        }

        scene.add(this.group);
    }

    update(delta: number): boolean { // returns true if still active
        if (this.isFinished) return false;
        
        let activeParticles = false;
        this.particles.forEach(p => {
            if (p.life > 0) {
                activeParticles = true;
                p.life -= delta;
                p.mesh.position.add(p.velocity.clone().multiplyScalar(delta));
                p.velocity.y -= 9.8 * delta * 0.5; // gravity
                (p.mesh.material as THREE.MeshBasicMaterial).opacity = Math.max(0, p.life / PARTICLE_LIFETIME);
            }
        });
        
        if (!activeParticles) {
            this.destroy();
            this.isFinished = true;
            return false;
        }
        
        return true;
    }
    
    private destroy() {
        this.particles.forEach(p => {
            p.mesh.geometry.dispose();
            (p.mesh.material as THREE.Material).dispose();
        });
        this.scene.remove(this.group);
    }
}