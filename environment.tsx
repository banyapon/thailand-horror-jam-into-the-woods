
import * as THREE from 'three';
import { baseUrl } from './global';
import { createWorldBoundaries } from './boundaries';
import { Clue, LoreObject } from './case';
import { Altar } from './ritual';

const createBillboardObject = (
    gameData: any,
    position: THREE.Vector3,
    collisionSize: THREE.Vector3,
    billboardSize: THREE.Vector2,
    texture: THREE.Texture,
    yOffset = 0,
    isCrowTrigger = false
) => {
    const objectPos = new THREE.Vector3(position.x, collisionSize.y / 2, position.z);
    const collisionCube = new THREE.Mesh(
        new THREE.BoxGeometry(collisionSize.x, collisionSize.y, collisionSize.z),
        new THREE.MeshBasicMaterial({ visible: false })
    );
    collisionCube.position.copy(objectPos);
    collisionCube.castShadow = true;
    gameData.scene!.add(collisionCube);
    gameData.collidables.push(collisionCube);

    const billboard = new THREE.Mesh(
        new THREE.PlaneGeometry(billboardSize.x, billboardSize.y),
        new THREE.MeshStandardMaterial({ map: texture, transparent: true, alphaTest: 0.5 })
    );
    billboard.position.copy(objectPos);
    billboard.position.y += yOffset;
    billboard.receiveShadow = true;
    gameData.scene!.add(billboard);
    gameData.billboards.push(billboard);

    if (isCrowTrigger) {
        gameData.crowTriggerObjects.push({ mesh: collisionCube, triggered: false });
    }
};

const populateScenery = (gameData: any, textureLoader: THREE.TextureLoader) => {
    const treeTextures = [
        textureLoader.load(`${baseUrl}tree.png`),
        textureLoader.load(`${baseUrl}tree2.png`),
        textureLoader.load(`${baseUrl}tree3.png`),
        textureLoader.load(`${baseUrl}tree4.png`),
    ];
    const houseTextures = [
        textureLoader.load(`${baseUrl}house.png`),
        textureLoader.load(`${baseUrl}house2.png`),
        textureLoader.load(`${baseUrl}house3.png`),
    ];
    const scarecrowTexture = textureLoader.load(`${baseUrl}scarecrow.png`);
    const rockTexture = textureLoader.load(`${baseUrl}rock.png`);
    const grassTextures = [
        textureLoader.load(`${baseUrl}grassA.png`),
        textureLoader.load(`${baseUrl}grassB.png`),
        textureLoader.load(`${baseUrl}grassC.png`),
    ];

    // Spawn Trees
    for (let i = 0; i < 400; i++) {
        const treeTexture = treeTextures[Math.floor(Math.random() * treeTextures.length)];
        const isCrowTrigger = Math.random() < 0.15;

        let x, z;
        const SAFE_ZONE_RADIUS = 30;
        
        // Keep generating positions until one is outside the safe zone
        do {
            x = (Math.random() - 0.5) * 180;
            z = (Math.random() - 0.5) * 180;
        } while (Math.sqrt(x*x + z*z) < SAFE_ZONE_RADIUS);

        createBillboardObject(
            gameData,
            new THREE.Vector3(x, 0, z),
            new THREE.Vector3(1, 8, 1),
            new THREE.Vector2(8, 8),
            treeTexture,
            0,
            isCrowTrigger
        );
    }

    // Spawn Houses
    for (let i = 0; i < 20; i++) {
        const houseTexture = houseTextures[Math.floor(Math.random() * houseTextures.length)];
        let x, z;
        const SAFE_ZONE_RADIUS = 40; // Larger safe zone for houses
        do {
            x = (Math.random() - 0.5) * 180;
            z = (Math.random() - 0.5) * 180;
        } while (Math.sqrt(x*x + z*z) < SAFE_ZONE_RADIUS);
        createBillboardObject(
            gameData,
            new THREE.Vector3(x, 0, z),
            new THREE.Vector3(5, 5, 5),
            new THREE.Vector2(10, 10),
            houseTexture,
            2.5
        );
    }

    // Spawn other scenery
    const otherScenery = [
        { texture: scarecrowTexture, collisionSize: new THREE.Vector3(1, 4, 1), billboardSize: new THREE.Vector2(4, 4), yOffset: 1.5 },
        { texture: rockTexture, collisionSize: new THREE.Vector3(2, 2, 2), billboardSize: new THREE.Vector2(3, 3), yOffset: 0.5 }
    ];

    for (let i = 0; i < 40; i++) {
        const type = otherScenery[Math.floor(Math.random() * otherScenery.length)];
        createBillboardObject(
            gameData,
            new THREE.Vector3((Math.random() - 0.5) * 180, 0, (Math.random() - 0.5) * 180),
            type.collisionSize,
            type.billboardSize,
            type.texture,
            type.yOffset
        );
    }
    
    createWorldBoundaries(gameData, (pos, col, bill, tex, yOff, isCrow) => createBillboardObject(gameData, pos, col, bill, tex, yOff, isCrow), treeTextures[0]);

    for (let i = 0; i < 2000; i++) {
        const grassTexture = grassTextures[Math.floor(Math.random() * grassTextures.length)];
        const grassSize = Math.random() * 1.5 + 0.8;
        const grass = new THREE.Mesh(new THREE.PlaneGeometry(grassSize, grassSize), new THREE.MeshStandardMaterial({ map: grassTexture, transparent: true, alphaTest: 0.5 }));
        grass.position.set((Math.random() - 0.5) * 190, grassSize / 2 - 0.2, (Math.random() - 0.5) * 190);
        gameData.scene!.add(grass);
        gameData.billboards.push(grass);
    }
};

const createClues = (gameData: any, textureLoader: THREE.TextureLoader) => {
    if (!gameData.activeCase) return;

    const symbolTexture = textureLoader.load(`${baseUrl}clue6.png`);

    gameData.activeCase.clues.forEach((clue: Clue) => {
        if (clue.type === 'symbol') {
            const symbolGeo = new THREE.PlaneGeometry(2, 2);
            const symbolMat = new THREE.MeshStandardMaterial({
                map: symbolTexture,
                transparent: true,
                opacity: 0,
                depthWrite: false,
                side: THREE.DoubleSide,
            });
            const symbolMesh = new THREE.Mesh(symbolGeo, symbolMat);
            symbolMesh.position.set(clue.position.x, 1, clue.position.z); // Slightly off ground
            symbolMesh.visible = false;
            gameData.scene!.add(symbolMesh);
            gameData.billboards.push(symbolMesh);
            gameData.symbolClues.push({ mesh: symbolMesh, clue: clue });
        }
        
        // Push all clues to the general list for proximity checks, regardless of type
        gameData.clueObjects.push(clue);

        // Add visual markers and lights only for static clues
        if (clue.type === 'static') {
            const geo = new THREE.RingGeometry(0.4, 0.5, 32);
            const mat = new THREE.MeshBasicMaterial({ color: 0xffff00, transparent: true, opacity: 0.5, side: THREE.DoubleSide });
            const clueMesh = new THREE.Mesh(geo, mat);
            clueMesh.position.set(clue.position.x, 0.1, clue.position.z);
            clueMesh.rotation.x = -Math.PI / 2;
            gameData.scene!.add(clueMesh);

            const clueLight = new THREE.PointLight(0xffffaa, 0.96, 5, 2);
            clueLight.position.copy(clueMesh.position).add(new THREE.Vector3(0, 0.5, 0));
            gameData.scene!.add(clueLight);
            gameData.clueLights.push(clueLight);
        }
    });
};

const createLoreObjects = (gameData: any) => {
    if (!gameData.activeCase) return;

    gameData.activeCase.loreObjects.forEach((lore: LoreObject) => {
        const geo = new THREE.RingGeometry(0.4, 0.5, 16);
        // Using a different color to distinguish from clues
        const mat = new THREE.MeshBasicMaterial({ color: 0x00ffff, transparent: true, opacity: 0.4, side: THREE.DoubleSide });
        const loreMesh = new THREE.Mesh(geo, mat);
        loreMesh.position.set(lore.position.x, 0.1, lore.position.z);
        loreMesh.rotation.x = -Math.PI / 2;
        gameData.scene!.add(loreMesh);
        gameData.loreObjects.push({ object: lore, mesh: loreMesh });
    });
};

const createAltars = (gameData: any) => {
    if (!gameData.ritualData) return;

    const altarTexture = gameData.altarTexture;
    const NUM_ALTARS = 7;

    for (let i = 0; i < NUM_ALTARS; i++) {
        let x, z;
        const SAFE_ZONE_RADIUS = 20;
        
        // Keep generating positions until one is outside the safe zone
        do {
            x = (Math.random() - 0.5) * 160;
            z = (Math.random() - 0.5) * 160;
        } while (Math.sqrt(x*x + z*z) < SAFE_ZONE_RADIUS);

        const position = new THREE.Vector3(x, 0, z);
        const altar = new Altar(gameData.scene, position, altarTexture);
        gameData.ritualData.altars.push(altar);
        gameData.billboards.push(altar.mesh);
    }
}

const createRainEffect = (gameData: any, textureLoader: THREE.TextureLoader) => {
    const rainCount = 1000;
    const rainGroup = new THREE.Group();
    gameData.rainGroup = rainGroup;

    const canvas = document.createElement('canvas');
    canvas.width = 2;
    canvas.height = 64;
    const context = canvas.getContext('2d')!;
    const gradient = context.createLinearGradient(0, 0, 0, 64);
    gradient.addColorStop(0, 'rgba(170,170,170,0)');
    gradient.addColorStop(0.2, 'rgba(170,170,170,0.7)');
    gradient.addColorStop(1, 'rgba(200,200,200,0.9)');
    context.fillStyle = gradient;
    context.fillRect(0, 0, 2, 64);
    const rainTexture = new THREE.CanvasTexture(canvas);
    const rainMat = new THREE.MeshBasicMaterial({ map: rainTexture, transparent: true, depthWrite: false });
    const rainGeo = new THREE.PlaneGeometry(0.05, 1.2);

    for (let i = 0; i < rainCount; i++) {
        const rainDrop = new THREE.Mesh(rainGeo, rainMat);
        rainDrop.position.set((Math.random() - 0.5) * 200, Math.random() * 50, (Math.random() - 0.5) * 200);
        rainGroup.add(rainDrop);
    }
    rainGroup.visible = false;
    gameData.scene.add(rainGroup);

    const splashTexture = textureLoader.load(`${baseUrl}splash.png`);
    const splashMat = new THREE.MeshBasicMaterial({ map: splashTexture, transparent: true, opacity: 0, side: THREE.DoubleSide });
    for (let i = 0; i < 50; i++) {
        const splashGeo = new THREE.PlaneGeometry(1, 1);
        const splashMesh = new THREE.Mesh(splashGeo, splashMat.clone());
        splashMesh.visible = false;
        gameData.scene.add(splashMesh);
        gameData.splashMeshes.push(splashMesh);
    }
};

const createDustMotes = (gameData: any) => {
    const moteCount = 500;
    const geometry = new THREE.BufferGeometry();
    const positions = [];
    const velocities = [];

    // Create a canvas texture for the motes
    const canvas = document.createElement('canvas');
    canvas.width = 32;
    canvas.height = 32;
    const context = canvas.getContext('2d')!;
    const gradient = context.createRadialGradient(16, 16, 0, 16, 16, 16);
    gradient.addColorStop(0, 'rgba(255,255,255,0.3)');
    gradient.addColorStop(1, 'rgba(255,255,255,0)');
    context.fillStyle = gradient;
    context.fillRect(0, 0, 32, 32);
    const moteTexture = new THREE.CanvasTexture(canvas);

    for (let i = 0; i < moteCount; i++) {
        positions.push(
            (Math.random() - 0.5) * 190, // x
            Math.random() * 10,          // y
            (Math.random() - 0.5) * 190 // z
        );
        velocities.push(
            new THREE.Vector3(
                (Math.random() - 0.5) * 0.1,
                (Math.random() - 0.5) * 0.1,
                (Math.random() - 0.5) * 0.1
            )
        );
    }

    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    gameData.dustMoteVelocities = velocities;

    const material = new THREE.PointsMaterial({
        map: moteTexture,
        size: 0.5,
        blending: THREE.AdditiveBlending,
        transparent: true,
        depthWrite: false,
        opacity: 0.2
    });

    gameData.dustMotes = new THREE.Points(geometry, material);
    gameData.scene.add(gameData.dustMotes);
};

const createFireflies = (gameData: any) => {
    const fireflyCount = 200;
    const geometry = new THREE.BufferGeometry();
    const positions = [];
    const velocities = [];

    for (let i = 0; i < fireflyCount; i++) {
        positions.push(
            (Math.random() - 0.5) * 190, // x
            Math.random() * 8,           // y
            (Math.random() - 0.5) * 190  // z
        );
        velocities.push(
            new THREE.Vector3(
                (Math.random() - 0.5) * 0.5,
                (Math.random() - 0.5) * 0.2,
                (Math.random() - 0.5) * 0.5
            )
        );
    }

    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    gameData.fireflyVelocities = velocities;

    const material = new THREE.PointsMaterial({
        color: 0x88ff88,
        size: 0.2,
        blending: THREE.AdditiveBlending,
        transparent: true,
        depthWrite: false
    });

    gameData.fireflies = new THREE.Points(geometry, material);
    gameData.scene.add(gameData.fireflies);
};

export const createWorld = (gameData: any, textureLoader: THREE.TextureLoader) => {
    // Lights
    const ambientLight = new THREE.AmbientLight(0x404060, 0.37);
    gameData.scene.add(ambientLight);
    gameData.ambientLight = ambientLight;

    const dirLight = new THREE.DirectionalLight(0x556688, 0.28);
    dirLight.position.set(25, 40, 15);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 2048;
    dirLight.shadow.mapSize.height = 2048;
    dirLight.shadow.camera.left = -100;
    dirLight.shadow.camera.right = 100;
    dirLight.shadow.camera.top = 100;
    dirLight.shadow.camera.bottom = -100;
    dirLight.shadow.camera.near = 0.5;
    dirLight.shadow.camera.far = 100;
    gameData.scene.add(dirLight);
    gameData.dirLight = dirLight;

    const godRay = new THREE.PointLight(0x88aaff, 1.2, 100, 2);
    godRay.position.set(-20, 15, -20);
    gameData.scene.add(godRay);
    gameData.godRay = godRay;

    // Ground
    const groundGeometry = new THREE.PlaneGeometry(200, 200);
    const groundTexture = textureLoader.load(`${baseUrl}grass.jpg`);
    groundTexture.wrapS = THREE.RepeatWrapping;
    groundTexture.wrapT = THREE.RepeatWrapping;
    groundTexture.repeat.set(50, 50);
    const ground = new THREE.Mesh(groundGeometry, new THREE.MeshStandardMaterial({ map: groundTexture, color: 0x080c08 }));
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    gameData.scene.add(ground);
    gameData.groundMesh = ground;
    
    // Scenery
    populateScenery(gameData, textureLoader);
    
    // Game Mode specific objects
    if (gameData.gameMode === 'story') {
        createClues(gameData, textureLoader);
        createLoreObjects(gameData);
    } else if (gameData.gameMode === 'ritual') {
        createAltars(gameData);
    }
    
    // Weather effects
    createRainEffect(gameData, textureLoader);

    // Atmospheric effects
    createFireflies(gameData);
    createDustMotes(gameData);
};