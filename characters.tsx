import * as THREE from 'three';
import { Player } from './player';
import { NPC } from './npc';
import { maleNames, femaleNames, lastNames, maleNamesEn, femaleNamesEn, lastNamesEn } from './names';
import { baseUrl } from './global';
import { Language } from './translations';

const CHARACTER_WIDTH = 3.8 * (64 / 170);

const femalePortraits = Array.from({ length: 6 }, (_, i) => `${baseUrl}f${i + 1}.png`);
const femaleSprites = Array.from({ length: 6 }, (_, i) => `${baseUrl}sf${i + 1}.png`);
const malePortraits = Array.from({ length: 6 }, (_, i) => `${baseUrl}m${i + 1}.png`);
const maleSprites = Array.from({ length: 6 }, (_, i) => `${baseUrl}sm${i + 1}.png`);

const getSafeSpawnPosition = (
    gameData: any,
    desiredPosition: THREE.Vector3,
    maxAttempts = 100
): THREE.Vector3 => {
    const characterBox = new THREE.Box3();
    const characterSize = new THREE.Vector3(CHARACTER_WIDTH, Player.CHARACTER_HEIGHT, CHARACTER_WIDTH);

    const isPositionSafe = (pos: THREE.Vector3) => {
        characterBox.setFromCenterAndSize(new THREE.Vector3(pos.x, Player.CHARACTER_HEIGHT / 2, pos.z), characterSize);
        for (const collidable of gameData.collidables) {
            if (characterBox.intersectsBox(new THREE.Box3().setFromObject(collidable))) return false;
        }
        return true;
    };

    if (isPositionSafe(desiredPosition)) return desiredPosition;

    for (let i = 0; i < maxAttempts; i++) {
        const randomPosition = new THREE.Vector3(
            THREE.MathUtils.mapLinear(Math.random(), 0, 1, gameData.worldBounds.min.x, gameData.worldBounds.max.x),
            desiredPosition.y,
            THREE.MathUtils.mapLinear(Math.random(), 0, 1, gameData.worldBounds.min.y, gameData.worldBounds.max.y)
        );
        if (isPositionSafe(randomPosition)) return randomPosition;
    }
    return new THREE.Vector3(0, desiredPosition.y, 0);
};

export const spawnCharacters = (gameData: any, playerTexture: THREE.Texture, textureLoader: THREE.TextureLoader, language: Language) => {
    const TOTAL_SPRITE_ROWS = 3;
    playerTexture.repeat.y = 1 / TOTAL_SPRITE_ROWS;

    const shadowTexture = textureLoader.load('images/shadow.png');

    if (gameData.gameMode === 'story') {
        if (!gameData.activeCase) return;
        const playerSafePos = getSafeSpawnPosition(gameData, new THREE.Vector3(0, 0, 0));
        gameData.player = new Player(gameData.scene!, playerTexture, gameData.audioListener!, gameData.audioBuffers, shadowTexture);
        gameData.player.mesh.position.set(playerSafePos.x, gameData.player.mesh.position.y, playerSafePos.z);
    }
    
    const npcPositions = [
        new THREE.Vector3(10, 0, 0), new THREE.Vector3(-10, 0, 5), new THREE.Vector3(15, 0, -10), 
        new THREE.Vector3(-15, 0, -15), new THREE.Vector3(20, 0, 20), new THREE.Vector3(-20, 0, -5),
        new THREE.Vector3(0, 0, 25)
    ];

    const currentMaleNames = language === 'th' ? maleNames : maleNamesEn;
    const currentFemaleNames = language === 'th' ? femaleNames : femaleNamesEn;
    const currentLastNames = language === 'th' ? lastNames : lastNamesEn;

    const usedMaleNames = new Set<string>();
    const usedFemaleNames = new Set<string>();
    
    const maleAppearanceIndices = Array.from({ length: maleSprites.length }, (_, i) => i).sort(() => Math.random() - 0.5);
    const femaleAppearanceIndices = Array.from({ length: femaleSprites.length }, (_, i) => i).sort(() => Math.random() - 0.5);
    let maleNpcCount = 0;
    let femaleNpcCount = 0;

    const npcIds = gameData.gameMode === 'story' ? Object.keys(gameData.activeCase.npcs) : Array.from({length: 7}, (_, i) => `ritual_npc_${i}`);
    
    for (let i = 0; i < npcIds.length; i++) {
        const npcId = npcIds[i];
        const npcData = gameData.gameMode === 'story' ? gameData.activeCase.npcs[npcId] : { role: { th: 'ผู้รอดชีวิต', en: 'Survivor' } };
        const npcSafePos = getSafeSpawnPosition(gameData, npcPositions[i % npcPositions.length]);
        
        const isMale = Math.random() > 0.5;
        let firstName: string;
        if(isMale) {
            do { firstName = currentMaleNames[Math.floor(Math.random() * currentMaleNames.length)] }
            while(usedMaleNames.has(firstName));
            usedMaleNames.add(firstName);
        } else {
            do { firstName = currentFemaleNames[Math.floor(Math.random() * currentFemaleNames.length)] }
            while(usedFemaleNames.has(firstName));
            usedFemaleNames.add(firstName);
        }
        const lastName = currentLastNames[Math.floor(Math.random() * currentLastNames.length)];
        const fullName = `${firstName} ${lastName}`;

        let spriteUrl: string;
        let profileAvatar: string;
        const gender = isMale ? 'male' : 'female';

        if (isMale) {
            const appearanceIndex = maleAppearanceIndices[maleNpcCount % maleAppearanceIndices.length];
            spriteUrl = maleSprites[appearanceIndex];
            profileAvatar = malePortraits[appearanceIndex];
            maleNpcCount++;
        } else {
            const appearanceIndex = femaleAppearanceIndices[femaleNpcCount % femaleAppearanceIndices.length];
            spriteUrl = femaleSprites[appearanceIndex];
            profileAvatar = femalePortraits[appearanceIndex];
            femaleNpcCount++;
        }

        const npcTexture = textureLoader.load(spriteUrl);
        npcTexture.repeat.y = 1 / TOTAL_SPRITE_ROWS;
        
        gameData.npcs.push(new NPC(gameData.scene!, npcTexture, fullName, npcId, npcData.role, npcSafePos, gameData.audioListener!, gameData.audioBuffers, gender, profileAvatar, shadowTexture));
    }
    
    if (gameData.gameMode === 'story') {
        gameData.murderer = gameData.npcs.find((npc: NPC) => npc.id === gameData.murdererId);
        if(gameData.murderer) {
           console.log("Murderer is:", gameData.murderer.name, `(${gameData.murderer.role[language]})`);
        }
    }
};