import * as THREE from 'three';


type GameData = {
    worldBounds: THREE.Box2;
};


type CreateBillboardObjectFunc = (
    position: THREE.Vector3,
    collisionSize: THREE.Vector3,
    billboardSize: THREE.Vector2,
    texture: THREE.Texture,
    yOffset: number,
    isCrowTrigger: boolean
) => void;

export function createWorldBoundaries(
    gameData: GameData,
    createBillboardObject: CreateBillboardObjectFunc,
    treeTexture: THREE.Texture
) {
    const treeParams = {
        collisionSize: new THREE.Vector3(1, 8, 1),
        billboardSize: new THREE.Vector2(8, 8),
        texture: treeTexture,
        yOffset: 0,
        isCrowTrigger: false
    };

    for (let z = gameData.worldBounds.min.y; z <= gameData.worldBounds.max.y; z += 6) {
        // Left wall
        createBillboardObject(new THREE.Vector3(gameData.worldBounds.min.x, 0, z), treeParams.collisionSize, treeParams.billboardSize, treeParams.texture, treeParams.yOffset, treeParams.isCrowTrigger);
        // Right wall
        createBillboardObject(new THREE.Vector3(gameData.worldBounds.max.x, 0, z), treeParams.collisionSize, treeParams.billboardSize, treeParams.texture, treeParams.yOffset, treeParams.isCrowTrigger);
    }
    for (let x = gameData.worldBounds.min.x; x <= gameData.worldBounds.max.x; x += 6) {
        // Top wall
        createBillboardObject(new THREE.Vector3(x, 0, gameData.worldBounds.min.y), treeParams.collisionSize, treeParams.billboardSize, treeParams.texture, treeParams.yOffset, treeParams.isCrowTrigger);
    }
}
