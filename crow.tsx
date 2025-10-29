import * as THREE from 'three';
import { Player } from './player';
import { NPC } from './npc';


interface CrowGameData {
    crowTriggerObjects: { mesh: THREE.Mesh; triggered: boolean }[];
    scene?: THREE.Scene;
    crowTexture?: THREE.Texture;
    billboards: THREE.Mesh[];
    activeCrows: { mesh: THREE.Mesh; animationTimer: number; frame: number }[];
}

export function updateCrows(
    gameData: CrowGameData,
    character: Player | NPC | null,
    delta: number,
    playSfx: (soundId: string, volume?: number) => void
) {
    if (!character || !gameData.scene || !gameData.crowTexture) return;

    const CROW_TRIGGER_DISTANCE = 8;
    gameData.crowTriggerObjects.forEach(trigger => {
        if (!trigger.triggered && character.mesh.position.distanceTo(trigger.mesh.position) < CROW_TRIGGER_DISTANCE) {
            trigger.triggered = true;
            playSfx('crow', 0.35);

            const crowMaterial = new THREE.MeshStandardMaterial({
                map: gameData.crowTexture!.clone(),
                transparent: true,
                alphaTest: 0.5,
            });
            crowMaterial.map!.repeat.set(1 / 4, 1);
            const crowMesh = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), crowMaterial);
            crowMesh.position.copy(trigger.mesh.position);
            crowMesh.position.y += 2;
            gameData.scene!.add(crowMesh);
            gameData.billboards.push(crowMesh);
            gameData.activeCrows.push({
                mesh: crowMesh,
                animationTimer: 0,
                frame: 0,
            });
        }
    });

    const CROW_ANIMATION_RATE = 100; // ms
    const CROW_SPEED = 8;
    gameData.activeCrows = gameData.activeCrows.filter(crow => {
        crow.animationTimer += delta * 1000;
        if (crow.animationTimer > CROW_ANIMATION_RATE) {
            crow.animationTimer = 0;
            crow.frame = (crow.frame + 1) % 4;
            (crow.mesh.material as THREE.MeshStandardMaterial).map!.offset.x = crow.frame / 4;
        }
        crow.mesh.position.y += CROW_SPEED * delta;
        crow.mesh.position.x += (Math.random() - 0.5) * 2 * delta;
        if (crow.mesh.position.y > 30) {
            gameData.scene!.remove(crow.mesh);
            const billboardIndex = gameData.billboards.indexOf(crow.mesh);
            if (billboardIndex > -1) gameData.billboards.splice(billboardIndex, 1);
            (crow.mesh.material as THREE.MeshStandardMaterial).map?.dispose();
            (crow.mesh.material as THREE.MeshStandardMaterial).dispose();
            crow.mesh.geometry.dispose();
            return false;
        }
        return true;
    });
}
