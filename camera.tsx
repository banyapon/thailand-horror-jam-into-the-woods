import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass';

export class PostProcessingCamera {
    camera: THREE.PerspectiveCamera;
    private composer: EffectComposer;
    private renderer: THREE.WebGLRenderer;
    private bloomPass: UnrealBloomPass;

    constructor(fov: number, aspect: number, near: number, far: number, scene: THREE.Scene, renderer: THREE.WebGLRenderer) {
        this.camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
        this.renderer = renderer;
        
        const renderScene = new RenderPass(scene, this.camera);

        this.bloomPass = new UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), 1.5, 0.4, 0.85);
        this.bloomPass.threshold = 0;
        this.bloomPass.strength = 0.35; 
        this.bloomPass.radius = 0.1; 

        this.composer = new EffectComposer(renderer);
        this.composer.addPass(renderScene);
        this.composer.addPass(this.bloomPass);
    }

    setBloomStrength(strength: number) {
        this.bloomPass.strength = strength;
    }

    setSize(width: number, height: number) {
        this.camera.aspect = width / height;
        this.camera.updateProjectionMatrix();
        this.composer.setSize(width, height);
        this.renderer.setSize(width, height);
    }

    render(delta: number) {
        this.composer.render(delta);
    }
}