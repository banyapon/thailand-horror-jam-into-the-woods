import { useEffect, RefObject } from 'react';
import * as THREE from 'three';

// A simplified type for the game data ref content for this module
interface WeatherGameData {
    scene?: THREE.Scene;
    rainGroup?: THREE.Group;
    rainAudio?: THREE.Audio;
    windAudio?: THREE.Audio;
    splashMeshes: THREE.Mesh[];
    ambientLight?: THREE.AmbientLight;
    dirLight?: THREE.DirectionalLight;
    ambientLightTarget?: { color: THREE.Color; intensity: number };
    dirLightTarget?: { color: THREE.Color; intensity: number };
    godRay?: THREE.PointLight;
}

export function useWeatherEffects(
    gameDataRef: RefObject<WeatherGameData>,
    weather: 'clear' | 'rain' | 'foggy',
    gameState: string
) {
    useEffect(() => {
        const gameData = gameDataRef.current;
        if (!gameData || !gameData.scene || !gameData.scene.fog || gameState === 'paused') return;

        if (!gameData.ambientLightTarget) {
            gameData.ambientLightTarget = { color: new THREE.Color(), intensity: 0 };
        }
        if (!gameData.dirLightTarget) {
            gameData.dirLightTarget = { color: new THREE.Color(), intensity: 0 };
        }
        
        const { scene, rainGroup, rainAudio, windAudio, splashMeshes, godRay, ambientLightTarget, dirLightTarget } = gameData;
        const fog = scene.fog as THREE.FogExp2;

        if (weather === 'rain') {
            if (rainGroup) rainGroup.visible = true;
            if (rainAudio && !rainAudio.isPlaying) rainAudio.play();
            if (windAudio && windAudio.isPlaying) windAudio.stop();
            fog.density = 0.0245;

            ambientLightTarget.color.setHex(0x303550);
            ambientLightTarget.intensity = 0.18;
            
            dirLightTarget.color.setHex(0x405070);
            dirLightTarget.intensity = 0.3;

            if(godRay) godRay.visible = false;

        } else if (weather === 'foggy') {
            if (rainGroup) rainGroup.visible = false;
            splashMeshes?.forEach(s => s.visible = false);
            if (rainAudio && rainAudio.isPlaying) rainAudio.stop();
            if (windAudio && !windAudio.isPlaying) windAudio.play();
            fog.density = 0.042;
            
            ambientLightTarget.color.setHex(0x404050);
            ambientLightTarget.intensity = 0.24;

            dirLightTarget.color.setHex(0x505560); 
            dirLightTarget.intensity = 0.096;

            if(godRay) godRay.visible = false;

        } else { // clear
            if (rainGroup) rainGroup.visible = false;
            splashMeshes?.forEach(s => s.visible = false);
            if (rainAudio && rainAudio.isPlaying) rainAudio.stop();
            if (windAudio && !windAudio.isPlaying) windAudio.play();
            fog.density = 0.0189;
            
            ambientLightTarget.color.setHex(0x405070);
            ambientLightTarget.intensity = 0.24;
            
            dirLightTarget.color.setHex(0x9ab0d0);
            dirLightTarget.intensity = 0.84;

            if(godRay) godRay.visible = true;
        }

    }, [weather, gameState, gameDataRef]);
}