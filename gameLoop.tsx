import * as React from 'react';
import * as THREE from 'three';
import { NPC } from './npc';
import { Player } from './player';
import { updateCrows } from './crow';
import { Ghost } from './ghost';
import { BloodSplatter } from './effects';
import { translations } from './translations';
import { Enemy } from './enemy';
import { Clue, LoreObject } from './case';

const TIGER_WIDTH = 2.58 * 1.5;
const TIGER_HEIGHT = 1.13 * 1.5;

export const createAnimationLoop = (gameDataRef: React.MutableRefObject<any>, callbacks: any) => {
    const { setUiElements, playSfx, setInventoryOpen, setGameState, handleInteraction, setFocusedOptionIndex, handleDialogueOption, setObjective, setStartMenuFocusIndex, handleMenuSelect, handleBackFromOptions, setWeather, setFoundClue, setGameOverReason, setCinematicText, setInteractionPrompt, handleNpcDeath, setDeathMarkerUiElements } = callbacks;
    const HIGHLIGHT_RADIUS = 15;

    const playDemonMusic = () => {
        const gameData = gameDataRef.current;
        if (gameData.music?.exploration?.isPlaying) gameData.music.exploration.pause();
        if (gameData.music?.demon && !gameData.music.demon.isPlaying) gameData.music.demon.play();
    };

    const stopDemonMusic = () => {
        const gameData = gameDataRef.current;
        if (gameData.music?.demon?.isPlaying) gameData.music.demon.stop();
        if (gameData.music?.exploration && !gameData.music.exploration.isPlaying && ['playing', 'ritual_playing'].includes(gameData.gameState)) {
            gameData.music.exploration.play();
        }
    };

    const animate = () => {
        const gameData = gameDataRef.current;
        gameData['animationFrameId' as any] = requestAnimationFrame(animate);
        const delta = gameData.clock.getDelta();
        
        const gamepad = navigator.getGamepads()[0];
        if (gamepad) {

            if (gameData.gameState === 'start') {
                if (gameData.gamepadNavCooldown <= 0) {
                    const yAxis = gamepad.axes[1] ?? 0;
                    const dpadUp = gamepad.buttons[12].pressed;
                    const dpadDown = gamepad.buttons[13].pressed;
                    const deadzone = 0.5;
                    const numOptions = gameData.activeMenu === 'main' ? 5 : 3;
                    
                    if (yAxis > deadzone || dpadDown) {
                        setStartMenuFocusIndex((prev: number) => (prev + 1) % numOptions);
                        gameData.gamepadNavCooldown = 0.25;
                    } else if (yAxis < -deadzone || dpadUp) {
                        setStartMenuFocusIndex((prev: number) => (prev - 1 + numOptions) % numOptions);
                        gameData.gamepadNavCooldown = 0.25;
                    }
                }
                
                const confirmPressed = (gamepad.buttons[0].pressed && !gameData.gamepadPrevState.buttons[0]);
                
                if (confirmPressed) {
                    if (gameData.activeMenu === 'main') {
                        const menuItems = ['start', 'ritual', 'story', 'options', 'language'];
                        handleMenuSelect(menuItems[gameData.startMenuFocusIndex]);
                    } else if (gameData.activeMenu === 'options') {
                        if (gameData.startMenuFocusIndex === 2) {
                            handleBackFromOptions();
                        }
                    }
                }
            }


            const lShoulderPressed = gamepad.buttons[4].pressed;
            const rShoulderPressed = gamepad.buttons[5].pressed;
            if ((lShoulderPressed && !gameData.gamepadPrevState.buttons[4]) || (rShoulderPressed && !gameData.gamepadPrevState.buttons[5])) {
                if ((gameData.gameState === 'playing' || gameData.gameState === 'paused') && gameData.gameMode === 'story' ) {
                    setInventoryOpen((prev: boolean) => !prev);
                }
            }
            if (gamepad.buttons[9].pressed && !gameData.gamepadPrevState.buttons[9]) {
                if (['playing', 'paused', 'ritual_playing'].includes(gameData.gameState)) {
                    setGameState((s: string) => s === 'playing' || s === 'ritual_playing' ? 'paused' : (gameData.gameMode === 'ritual' ? 'ritual_playing' : 'playing'));
                }
            }
            if ((gamepad.buttons[3].pressed && !gameData.gamepadPrevState.buttons[3]) || (gamepad.buttons[4].pressed && !gameData.gamepadPrevState.buttons[4])) {
                handleInteraction();
            }
            if (gameData.gamepadNavCooldown > 0) {
                gameData.gamepadNavCooldown = Math.max(0, gameData.gamepadNavCooldown - delta);
            }
            if (gameData.currentDialogue?.node.options && gameData.focusedOptionIndex !== null && gameData.gamepadNavCooldown <= 0) {
                const yAxis = gamepad.axes[1] ?? 0;
                const deadzone = 0.5;
                const numOptions = gameData.currentDialogue.node.options.length;
                if (yAxis > deadzone) {
                    setFocusedOptionIndex((prev: number) => (prev! + 1) % numOptions);
                    gameData.gamepadNavCooldown = 0.25;
                } else if (yAxis < -deadzone) {
                    setFocusedOptionIndex((prev: number) => (prev! - 1 + numOptions) % numOptions);
                    gameData.gamepadNavCooldown = 0.25;
                }
            }
            const dialogueConfirmPressed = (gamepad.buttons[0].pressed && !gameData.gamepadPrevState.buttons[0]);
            if (dialogueConfirmPressed && gameData.currentDialogue?.node.options && gameData.focusedOptionIndex !== null) {
                handleDialogueOption(gameData.currentDialogue.node.options[gameData.focusedOptionIndex]);
            }
            gameData.gamepadPrevState.buttons = gamepad.buttons.map((b: { pressed: any; }) => b.pressed);
        }
        
        if (gameData.gameState === 'intro') {
            if (!gameData.introData) {
                gameData.introData = {
                    timer: 15, // 15 seconds
                    progress: 0,
                    path: new THREE.CatmullRomCurve3([
                        new THREE.Vector3(-80, 2, 80), 
                        new THREE.Vector3(0, 1.5, 60), 
                        new THREE.Vector3(70, 2, 0), 
                        new THREE.Vector3(0, 1.5, -50),
                        new THREE.Vector3(-60, 2.5, -60),
                        new THREE.Vector3(-80, 2, 80) // Loop back
                    ]),
                    lookAtTarget: new THREE.Vector3(),
                    shake: new THREE.Vector3(),
                };
            }
    
            gameData.introData.timer -= delta;
            if (gameData.introData.timer <= 0) {
                setGameState('briefing');
                return;
            }
    
            gameData.introData.progress = Math.min(1, gameData.introData.progress + delta / 15);
            const cameraPos = gameData.introData.path.getPointAt(gameData.introData.progress);
            
            const lookAtProgress = Math.min(1, gameData.introData.progress + 0.05);
            gameData.introData.lookAtTarget.copy(gameData.introData.path.getPointAt(lookAtProgress));
    
            gameData.introData.shake.set(
                (Math.random() - 0.5) * 0.4,
                (Math.random() - 0.5) * 0.2,
                (Math.random() - 0.5) * 0.4
            );
    
            gameData.camera.camera.position.copy(cameraPos);
            gameData.camera.camera.lookAt(gameData.introData.lookAtTarget.add(gameData.introData.shake));
            gameData.renderer.render(gameData.scene, gameData.camera.camera);
            return;
        }

        if (gameData.gameState === 'paused' || gameData.gameState === 'finish_screen') {
            gameData.camera?.render(delta);
            return;
        }

        if (gameData.gameState === 'ritual_ending') {
            const ritual = gameData.ritualData;
            if (ritual && ritual.endingData) {
                const ending = ritual.endingData;
                ending.outroTimer += delta;
                const WALK_SPEED = 2.5;

                if (ending.phase === 'gathering') {
                    let arrivedCount = 0;
                    ending.survivors.forEach((npc: NPC) => {
                        const distanceToRally = npc.mesh.position.distanceTo(ending.rallyPoint);
                        if (distanceToRally > 2.0) {
                            npc.isWalking = true;
                            const direction = ending.rallyPoint.clone().sub(npc.mesh.position).normalize();
                            const moveVector = direction.clone().multiplyScalar(WALK_SPEED * delta);
                            npc.move(moveVector, [], gameData.worldBounds);
                        } else {
                            arrivedCount++;
                            npc.isWalking = false;
                        }
                    });
                    if (arrivedCount === ending.survivors.length) {
                        ending.phase = 'exiting';
                    }
                } else if (ending.phase === 'exiting') {
                    const EXIT_Z = -110;
                    ending.survivors.forEach((npc: NPC) => {
                        if (npc.mesh.visible) {
                            if (npc.mesh.position.z > EXIT_Z) {
                                npc.isWalking = true;
                                const exitPoint = new THREE.Vector3(npc.mesh.position.x, 0, EXIT_Z);
                                const direction = exitPoint.clone().sub(npc.mesh.position).normalize();
                                const moveVector = direction.clone().multiplyScalar(WALK_SPEED * 1.2 * delta); // Move faster
                                npc.move(moveVector, [], gameData.worldBounds);
                            } else {
                                npc.mesh.visible = false;
                                npc.indicatorMesh.visible = false;
                                npc.isWalking = false;
                            }
                        }
                    });
                }
            }
        }

        if (!gameData.scene || !gameData.camera || !gameData.renderer) return;

        if (gameData.gameMode === 'story') {
            if (!gameData.player || gameData.npcs.length < 7) return;
        } else if (gameData.gameMode === 'ritual') {
            if (!gameData.ritualData || gameData.npcs.length < 7) return;
        } else {
            return; // Should not happen
        }

        if (gameData.gameMode === 'ritual' && gameData.ritualData?.introData) {
            const intro = gameData.ritualData.introData;
            intro.timer -= delta;

            if (intro.timer <= 0) {
                gameData.ritualData.introData = null;
                gameData.ritualData.cameraMode = 'player_follow';
            } else {
                intro.progress = Math.min(1, intro.progress + delta / 12);
                const cameraPos = intro.path.getPointAt(intro.progress);
                const lookAtProgress = Math.min(1, intro.progress + 0.05);
                intro.lookAtTarget.copy(intro.path.getPointAt(lookAtProgress));
        
                gameData.camera.camera.position.copy(cameraPos);
                gameData.camera.camera.lookAt(intro.lookAtTarget);
                gameData.renderer.render(gameData.scene, gameData.camera.camera);
                return;
            }
        }


        // --- Winning Cinematic ---
        if (gameData.gameState === 'winning_cinematic') {
            const cinematic = gameData.winningCinematicData;
            const murderer = gameData.murderer;
            if (!cinematic || !murderer) return;

            const billboardMeshes = [gameData.player.mesh, ...gameData.billboards, ...gameData.npcs.map((n: NPC) => n.mesh)];
            billboardMeshes.forEach((obj: { quaternion: { copy: (arg0: any) => void; }; }) => {
                if(obj) obj.quaternion.copy(gameData.camera!.camera.quaternion);
            });

            const cameraTarget = murderer.mesh.position.clone();
            const cameraPos = cameraTarget.clone().add(new THREE.Vector3(8, 8, 8));
            gameData.camera.camera.position.lerp(cameraPos, 0.05);
            gameData.camera.camera.lookAt(cameraTarget);
        
            if (cinematic.phase === 'running') {
                cinematic.timer += delta;
                const livingNpcs = gameData.npcs.filter((n: NPC) => n.status === 'alive' && n !== murderer);
                let arrivedCount = 0;
                const CINEMATIC_NPC_SPEED = 12;
                const MAX_DISTANCE_BEFORE_TELEPORT = 40;
                const TELEPORT_CHECK_TIME = 2.5;

                const playerRetreatDirection = gameData.player.mesh.position.clone().sub(murderer.mesh.position).normalize();
                const PLAYER_RETREAT_SPEED = 2;
                const playerRetreatVector = playerRetreatDirection.clone().multiplyScalar(PLAYER_RETREAT_SPEED * delta);
                const playerDistToMurderer = gameData.player.mesh.position.distanceTo(murderer.mesh.position);
                
                if (playerDistToMurderer < 20) {
                    gameData.player.move(playerRetreatVector, gameData.collidables, gameData.worldBounds);
                    gameData.player.updateAnimation(delta, true, playerRetreatDirection.x);
                } else {
                    gameData.player.updateAnimation(delta, false, 0);
                }

                livingNpcs.forEach((npc: NPC) => {
                    const distance = npc.mesh.position.distanceTo(murderer.mesh.position);
                    
                    if (cinematic.timer > TELEPORT_CHECK_TIME && distance > MAX_DISTANCE_BEFORE_TELEPORT) {
                        const angle = Math.random() * Math.PI * 2;
                        const radius = 4 + Math.random() * 4;
                        const newX = murderer.mesh.position.x + Math.cos(angle) * radius;
                        const newZ = murderer.mesh.position.z + Math.sin(angle) * radius;
                        npc.mesh.position.set(newX, npc.mesh.position.y, newZ);
                    } else if (distance > 2.5) {
                        const direction = murderer.mesh.position.clone().sub(npc.mesh.position).normalize();
                        const moveVector = direction.clone().multiplyScalar(CINEMATIC_NPC_SPEED * delta);
                        npc.move(moveVector, [], gameData.worldBounds);
                        npc.updateAnimation(delta, true, direction.x);
                    } else {
                        npc.updateAnimation(delta, false, 0);
                        arrivedCount++;
                    }
                });
        
                if (livingNpcs.length === 0 || arrivedCount >= livingNpcs.length) {
                    cinematic.phase = 'blood';
                    cinematic.timer = 1.5;
                    gameData.bloodEffects.push(new BloodSplatter(gameData.scene, murderer.mesh.position));
                    playSfx('scream_death', gameData.sfxVolume * 1.5);
                    
                    murderer.mesh.visible = false;
                    murderer.indicatorMesh.visible = false;
                }
            } else if (cinematic.phase === 'blood') {
                cinematic.timer -= delta;
                if (cinematic.timer <= 0) {
                    cinematic.phase = 'text';
                    cinematic.timer = 5;
                    const t = translations[gameData.language];
                    const revealText = t.murdererRevealed.replace('{name}', murderer.name);
                    setCinematicText(revealText);
                }
            } else if (cinematic.phase === 'text') {
                cinematic.timer -= delta;
                if (cinematic.timer <= 0) {
                    setGameState('finish_screen');
                    gameData.winningCinematicData = null;
                }
            }
        
            gameData.bloodEffects = gameData.bloodEffects.filter((effect: BloodSplatter) => effect.update(delta));
            gameData.camera.render(delta);
            return;
        }
        
        if (gameData.gameState === 'losing_cinematic') {
            const cinematic = gameData.losingCinematicData;
            if (!cinematic || !cinematic.target) return;
        
            if (!cinematic.ghost && cinematic.phase !== 'attacking' && cinematic.phase !== 'finished') {
                cinematic.ghost = new Ghost(gameData.scene, gameData.ghostTexture, cinematic.target, null, true);
                cinematic.phase = 'running';
                playDemonMusic();
                if (gameData.ghostAudio && !gameData.ghostAudio.isPlaying) {
                    gameData.ghostAudio.play();
                }
            }
        
            if (cinematic.ghost) cinematic.ghost.update(delta);
        
            const cameraOffset = new THREE.Vector3(0, 5, 8);
            const targetCameraPosition = cinematic.target.mesh.position.clone().add(cameraOffset);
            gameData.camera.camera.position.lerp(targetCameraPosition, 0.08);
            gameData.camera.camera.lookAt(cinematic.target.mesh.position);
        
            if (cinematic.phase === 'running' && cinematic.ghost && cinematic.ghost.mesh.position.distanceTo(cinematic.target.mesh.position) < 1.5) {
                cinematic.phase = 'attacking';
                cinematic.timer = 0.88;
                playSfx('scream_death', gameData.sfxVolume * 1.5);
                cinematic.target.mesh.visible = false;
                cinematic.target.indicatorMesh.visible = false;

                if (cinematic.target instanceof NPC) {
                    handleNpcDeath(cinematic.target);
                }

                gameData.bloodEffects.push(new BloodSplatter(gameData.scene, cinematic.target.mesh.position));
                cinematic.ghost.destroy();
                cinematic.ghost = null;
            }
        
            if (cinematic.phase === 'attacking') {
                cinematic.timer -= delta;
                if (cinematic.timer <= 0) {
                    cinematic.phase = 'finished';
                }
            }

            if (cinematic.phase === 'finished') {
                 gameData.losingCinematicData = null;
                 stopDemonMusic();
                 setGameState('gameover');
            }
        
            const billboardMeshes = [cinematic.target.mesh, ...gameData.billboards, ...gameData.npcs.map((n: NPC) => n.mesh)];
            if(cinematic.ghost) billboardMeshes.push(cinematic.ghost.mesh);
            billboardMeshes.forEach((obj: { quaternion: { copy: (arg0: any) => void; }; }) => {
                if(obj) obj.quaternion.copy(gameData.camera!.camera.quaternion);
            });
            gameData.bloodEffects = gameData.bloodEffects.filter((effect: BloodSplatter) => effect.update(delta));
            gameData.camera.render(delta);
            return;
        }

        if (gameData.cinematicData) {
            const cinematic = gameData.cinematicData;
        
            if (!cinematic.ghost && cinematic.phase !== 'attacking' && cinematic.phase !== 'finished') {
                cinematic.ghost = new Ghost(gameData.scene, gameData.ghostTexture, cinematic.victim, gameData.player.mesh.position);
                cinematic.phase = 'approaching';
                playDemonMusic();
            }
        
            if (cinematic.ghost) {
                cinematic.ghost.update(delta);
            }
        
            const victimPos = cinematic.victim.mesh.position;
            const ghostPos = cinematic.ghost ? cinematic.ghost.mesh.position : victimPos.clone().add(new THREE.Vector3(5,0,5));
            const midpoint = victimPos.clone().lerp(ghostPos, 0.5);
            midpoint.y = Player.CHARACTER_HEIGHT / 2;
            
            const cameraPos = midpoint.clone().add(new THREE.Vector3(5, 5, 5));
            
            gameData.camera.camera.position.lerp(cameraPos, 0.18);
            gameData.camera.camera.lookAt(midpoint);
        
            if (cinematic.phase === 'approaching' && cinematic.ghost && cinematic.ghost.mesh.position.distanceTo(victimPos) < 1.5) {
                cinematic.phase = 'attacking';
                cinematic.timer = 0.88;
                
                playSfx('scream_death', gameData.sfxVolume * 1.5);
                const victim = cinematic.victim;
                if (victim.status === 'alive') {
                    handleNpcDeath(victim);
                }
                gameData.bloodEffects.push(new BloodSplatter(gameData.scene, victimPos));
                
                cinematic.ghost.destroy();
                cinematic.ghost = null;
            }
        
            if (cinematic.phase === 'attacking') {
                cinematic.timer -= delta;
                if (cinematic.timer <= 0) {
                    cinematic.phase = 'finished';
                    const t = translations[gameData.language];
                    const message = gameData.language === 'th'
                        ? `${t.wrongAccusation} ${cinematic.victim.name} ${t.isDead}`
                        : `${t.wrongAccusation} ${cinematic.victim.name}.`;
                    setFoundClue(message);
                    setTimeout(() => setFoundClue(null), 5000);
                    stopDemonMusic();
                    gameData.cinematicData = null;
                }
            }
        }
        
        gameData.bloodEffects = gameData.bloodEffects.filter((effect: { update: (arg0: number) => any; }) => effect.update(delta));

        if (gameData.ambientLight && gameData.ambientLightTarget && gameData.dirLight && gameData.dirLightTarget) {
            const lerpSpeed = delta * 1.5;
            gameData.ambientLight.color.lerp(gameData.ambientLightTarget.color, lerpSpeed);
            gameData.dirLight.color.lerp(gameData.dirLightTarget.color, lerpSpeed);

            let targetAmbientIntensity = gameData.ambientLightTarget.intensity;
            let targetDirIntensity = gameData.dirLightTarget.intensity;

            if (gameData.weather === 'rain') {
                targetAmbientIntensity += (Math.random() - 0.5) * 0.1;
                targetDirIntensity += (Math.random() - 0.5) * 0.2;
            }

            gameData.ambientLight.intensity = THREE.MathUtils.lerp(gameData.ambientLight.intensity, targetAmbientIntensity, lerpSpeed);
            gameData.dirLight.intensity = THREE.MathUtils.lerp(gameData.dirLight.intensity, targetDirIntensity, lerpSpeed);
        }

        const isGameLogicPaused = !!gameData.interactingNpc || gameData.isInventoryOpen || gameData.isSurvivalJournalOpen || gameData.isMapView || !!gameData.cinematicData || !!gameData.ritualData?.pendingDeath || !!gameData.ritualData?.endingData || !!gameData.tigerData;

        // --- Weather Logic (Story Mode) ---
        if (gameData.gameMode === 'story' && gameData.gameState === 'playing' && !isGameLogicPaused) {
            gameData.weatherChangeTimer -= delta;
            if (gameData.weatherChangeTimer <= 0) {
                const weathers: ('clear' | 'rain' | 'foggy')[] = ['clear', 'rain', 'foggy'];
                const availableWeathers = weathers.filter(w => w !== gameData.weather);
                const newWeather = availableWeathers[Math.floor(Math.random() * availableWeathers.length)];
                setWeather(newWeather);
                gameData.weatherChangeTimer = 90; // Reset to 1.5 minutes
            }
        }

        // --- Lightning Logic (Story Mode) ---
        if (gameData.gameMode === 'story' && gameData.gameState === 'playing' && !isGameLogicPaused) {
            gameData.lightningTimer -= delta;
            if (gameData.lightningTimer <= 0) {
                if (gameData.weather === 'rain' && Math.random() < 0.2) {
                    const livingInnocents = gameData.npcs.filter((n: NPC) => n.status === 'alive' && n !== gameData.murderer);
                    if (livingInnocents.length > 0) {
                        gameData.lightningTargetNpc = livingInnocents[Math.floor(Math.random() * livingInnocents.length)];
                        gameData.lightningFlashTimer = 1.5;
                    }
                }
                gameData.lightningTimer = 30 + Math.random() * 30; // Reset timer
            }
        }

        if (gameData.ritualData) {
            if (gameData.ritualData.pendingDeath) {
                gameData.ritualData.pendingDeath.timer -= delta;
                if (gameData.ritualData.pendingDeath.timer <= 0) {
                    handleNpcDeath(gameData.ritualData.pendingDeath.victim);
                    gameData.ritualData.pendingDeath = null;
                    gameData.ritualData.cameraMode = 'player_follow';
                }
            }

            if (!isGameLogicPaused) {
                gameData.ritualData.timer -= delta;
                gameData.ritualData.ghostSpawnTimer -= delta;
                gameData.ritualData.weatherChangeTimer = (gameData.ritualData.weatherChangeTimer || 40) - delta;
            }

            if (gameData.ritualData.weatherChangeTimer <= 0) {
                const weathers: ('clear' | 'rain' | 'foggy')[] = ['clear', 'rain', 'foggy'];
                const newWeather = weathers[Math.floor(Math.random() * weathers.length)];
                setWeather(newWeather);
                gameData.ritualData.weatherChangeTimer = 40; // Reset
            }
           
            if (gameData.ritualData.ghostSpawnTimer <= 0) {
                if (!gameData.ritualData.activeGhost) {
                    const livingNpcs = gameData.npcs.filter((n: NPC) => n.status === 'alive');
                    if (livingNpcs.length > 0) {
                        const unprotectedNpcs = livingNpcs.filter((n: NPC) => !n.hasPerformedRitual);
                        let target;
                        if (unprotectedNpcs.length > 0) {
                            target = unprotectedNpcs[Math.floor(Math.random() * unprotectedNpcs.length)];
                        } else {
                            target = livingNpcs[Math.floor(Math.random() * livingNpcs.length)];
                        }
                        
                        gameData.ritualData.activeGhost = new Ghost(gameData.scene, gameData.ghostTexture, target, null, true);
                        gameData.ritualData.cameraMode = 'ghost_follow';
                        playDemonMusic();
                        if (gameData.ghostAudio && !gameData.ghostAudio.isPlaying) gameData.ghostAudio.play();
                    }
                }
                gameData.ritualData.ghostSpawnTimer = 60; // Reset for next spawn
            }
            if (gameData.ritualData.activeGhost) {
                gameData.ritualData.activeGhost.update(delta);
                const distance = gameData.ritualData.activeGhost.mesh.position.distanceTo(gameData.ritualData.activeGhost.target.mesh.position);
                if (distance < 1.5 && !gameData.ritualData.pendingDeath) {
                    const victim = gameData.ritualData.activeGhost.target;
                    gameData.ritualData.pendingDeath = { victim, timer: 1.5 };

                    playSfx('scream_death', gameData.sfxVolume * 1.5);
                    gameData.cameraShake = { intensity: 0.8, duration: 0.6 };
                    gameData.bloodEffects.push(new BloodSplatter(gameData.scene, victim.mesh.position));
                    
                    gameData.ritualData.activeGhost.destroy();
                    gameData.ritualData.activeGhost = null;
                    stopDemonMusic();
                    if (gameData.ghostAudio?.isPlaying) gameData.ghostAudio.stop();
                }
            }
            if (gameData.weather === 'rain' && gameData.ritualData.cameraMode === 'player_follow' && !isGameLogicPaused) {
                gameData.ritualData.lightningTimer -= delta;
                const lightningChance = 0.3 + Math.random() * 0.6; // 30% to 90%
                if (gameData.ritualData.lightningTimer <= 0 && Math.random() < lightningChance) {
                    const livingNpcs = gameData.npcs.filter((n: NPC) => n.status === 'alive');
                    if (livingNpcs.length > 0) {
                        gameData.lightningTargetNpc = livingNpcs[Math.floor(Math.random() * livingNpcs.length)];
                        gameData.lightningFlashTimer = 1.5;
                        gameData.ritualData.cameraMode = 'event_focus';
                    }
                }
                // Always reset the timer whether it struck or not
                if (gameData.ritualData.lightningTimer <= 0) {
                    gameData.ritualData.lightningTimer = 20 + Math.random() * 15;
                }
            }
            if (!gameData.ritualData.endingData) { // Only check if the game hasn't already ended
                if (gameData.ritualData.survivors <= 0) {
                    setGameState('gameover');
                } else if (gameData.ritualData.timer <= 0) {
                    const livingSurvivors = gameData.npcs.filter((n: NPC) => n.status === 'alive');
                    const rallyPoint = new THREE.Vector3(0, 0, -80);
                    
                    gameData.ritualData.endingData = {
                        timer: 0,
                        outroTimer: 0,
                        survivors: livingSurvivors,
                        phase: 'gathering',
                        rallyPoint: rallyPoint,
                    };
                    gameData.ritualData.cameraMode = 'outro';
                    setGameState('ritual_ending');
                }
            }
        }
        
        if (gameData.gameState === 'playing' && !isGameLogicPaused) {
            gameData.nextNpcDeathTimer -= delta;
            if (gameData.nextNpcDeathTimer <= 0) {
                const livingInnocents = gameData.npcs.filter((n: NPC) => n.status === 'alive' && n !== gameData.murderer);
                if (livingInnocents.length > 0) {
                    const victim = livingInnocents[Math.floor(Math.random() * livingInnocents.length)];
                    if (!gameData.cinematicData) {
                        gameData.cinematicData = { victim };
                    }
                    gameData.nextNpcDeathTimer = 120;
                } else if (gameData.npcs.filter((n: NPC) => n.status === 'alive').length <= 1) {
                    setGameOverReason('timeout');
                    gameData.losingCinematicData = { target: gameData.player, phase: 'running', timer: 0 };
                    setGameState('losing_cinematic');
                }
            }
        }
        
        // --- Lightning Flash Effect (Both Modes) ---
        if (gameData.lightningFlashTimer > 0 && gameData.lightningTargetNpc) {
            gameData.lightningFlashTimer -= delta;
            
            const lightningEffect = gameData.lightningEffect;
            if (lightningEffect) {
                lightningEffect.mesh.position.set(gameData.lightningTargetNpc.mesh.position.x, 10, gameData.lightningTargetNpc.mesh.position.z);
            }
        
            if (gameData.lightningFlashTimer > 0.8 && gameData.lightningFlashTimer < 1.0) {
                playSfx('thunder', 0.9);
                gameData.camera!.setBloomStrength(2.5);
                if (lightningEffect) {
                    lightningEffect.mesh.visible = true;
                    (lightningEffect.mesh.material as THREE.Material).opacity = 1.0;
                }
                if (gameData.lightningTargetNpc.status === 'alive') {
                    handleNpcDeath(gameData.lightningTargetNpc);
                    gameData.bloodEffects.push(new BloodSplatter(gameData.scene, gameData.lightningTargetNpc.mesh.position));
                    gameData.cameraShake = { intensity: 1.0, duration: 0.7 };
                }
            } else if (gameData.lightningFlashTimer <= 0.8) {
                gameData.camera!.setBloomStrength(0.35);
                 if (lightningEffect) {
                    (lightningEffect.mesh.material as THREE.Material).opacity -= delta * 5;
                    if ((lightningEffect.mesh.material as THREE.Material).opacity <= 0) {
                        lightningEffect.mesh.visible = false;
                    }
                }
            }
            
            if (gameData.lightningFlashTimer <= 0) {
                gameData.lightningTargetNpc = null;
                if (gameData.ritualData) gameData.ritualData.cameraMode = 'player_follow';
            }
        }

        const controlledCharacter = gameData.gameMode === 'ritual' 
            ? gameData.npcs[gameData.ritualData.controlledNpcIndex]
            : gameData.player;
        
        if (!controlledCharacter) return;
        
        let closestWhisperClue: Clue | null = null;
        let minWhisperDist = 15;

        if (!isGameLogicPaused) {
            gameData.clueObjects.forEach((clue: Clue) => {
                if (clue.type === 'whisper' && !gameData.foundClueIds.has(clue.id)) {
                    const cluePos = new THREE.Vector3(clue.position.x, 1, clue.position.z);
                    const dist = controlledCharacter.mesh.position.distanceTo(cluePos);
                    if (dist < minWhisperDist) {
                        minWhisperDist = dist;
                        closestWhisperClue = clue;
                    }
                }
            });
        }

        if (closestWhisperClue) {
            if (!gameData.activeWhisperSound) {
                const whisperSound = new THREE.PositionalAudio(gameData.audioListener);
                whisperSound.setBuffer(gameData.audioBuffers.whisper);
                whisperSound.setLoop(true);
                whisperSound.setRefDistance(3);
                whisperSound.setRolloffFactor(2);
                gameData.scene.add(whisperSound);
                gameData.activeWhisperSound = whisperSound;
            }
            gameData.activeWhisperSound.position.set(closestWhisperClue.position.x, 1, closestWhisperClue.position.z);
            if (!gameData.activeWhisperSound.isPlaying) {
                gameData.activeWhisperSound.play();
            }
            gameData.activeWhisperSound.setVolume(gameData.sfxVolume * 0.8);

        } else {
            if (gameData.activeWhisperSound && gameData.activeWhisperSound.isPlaying) {
                gameData.activeWhisperSound.stop();
            }
        }

        let closestClueDist = Infinity;
        let closestClueForMarker: { position: { x: number, z: number }; id: string } | null = null;
        
        if (gameData.gameMode === 'story') {
            gameData.clueObjects.forEach((clue: Clue) => {
                if (!gameData.foundClueIds.has(clue.id)) {
                    const cluePos = clue.type === 'symbol' 
                        ? gameData.symbolClues.find((sc: any) => sc.clue.id === clue.id)?.mesh.position
                        : new THREE.Vector3(clue.position.x, 0, clue.position.z);
                    
                    if (cluePos) {
                        const dist = controlledCharacter.mesh.position.distanceTo(cluePos);
                        if (dist < closestClueDist) {
                            closestClueDist = dist;
                            closestClueForMarker = { position: cluePos, id: clue.id };
                        }
                    }
                }
            });
        }
        
        if (closestClueForMarker) {
            const cluePosVec = new THREE.Vector3(closestClueForMarker.position.x, 1, closestClueForMarker.position.z);
            const targetVec = new THREE.Vector3().subVectors(cluePosVec, gameData.camera.camera.position);
            const camForward = new THREE.Vector3();
            gameData.camera.camera.getWorldDirection(camForward);

            if (targetVec.dot(camForward) < 0) {
                setObjective(null);
            } else {
                const screenPos = cluePosVec.clone().project(gameData.camera.camera);
                const isOffScreen = screenPos.x < -1 || screenPos.x > 1 || screenPos.y < -1 || screenPos.y > 1;

                if (isOffScreen) {
                    const centerX = window.innerWidth / 2;
                    const centerY = window.innerHeight / 2;
                    const angleRad = Math.atan2(screenPos.y, screenPos.x);
                    const angleDeg = angleRad * (180 / Math.PI);
                    const PADDING = 60;
                    const xEdge = Math.cos(angleRad) * (centerX - PADDING) + centerX;
                    const yEdge = Math.sin(angleRad) * (centerY - PADDING) * -1 + centerY;

                    setObjective({ x: xEdge, y: yEdge, rotation: -angleDeg + 90, distance: Math.round(closestClueDist) });
                } else {
                    setObjective(null);
                }
            }
        } else {
            setObjective(null);
        }

        if (gameData.clueHighlightCooldown > 0) gameData.clueHighlightCooldown = Math.max(0, gameData.clueHighlightCooldown - delta);
        if (gameData.clueHighlightActive) {
            gameData.clueHighlightTimer -= delta;
            if (gameData.clueHighlightTimer <= 0) gameData.clueHighlightActive = false;
        }
        gameData.symbolClues.forEach((symbol: { clue: { id: any; }; mesh: { visible: boolean; material: { opacity: any; }; }; }) => {
            const isFound = gameData.foundClueIds.has(symbol.clue.id);
            const material = symbol.mesh.material as THREE.MeshStandardMaterial;
            if (gameData.clueHighlightActive && !isFound) {
                symbol.mesh.visible = true;
                material.opacity = Math.min(1, material.opacity + delta * 2);
            } else {
                material.opacity = Math.max(0, material.opacity - delta * 2);
                if (material.opacity === 0) symbol.mesh.visible = false;
            }
        });


        gameData.clueLights.forEach((light: THREE.PointLight) => {
            const clue = gameData.clueObjects.find((c: any) => c.type === 'static' && new THREE.Vector3(c.position.x, 0.1, c.position.z).distanceTo(light.position) < 1);
            if (clue && gameData.foundClueIds.has(clue.id)) {
                light.intensity = Math.max(0, light.intensity - delta * 2);
            } else if (clue) {
                const distanceToPlayer = controlledCharacter.mesh.position.distanceTo(new THREE.Vector3(clue.position.x, 0, clue.position.z));
                if (gameData.clueHighlightActive && distanceToPlayer < HIGHLIGHT_RADIUS) {
                    light.intensity = 2.5 + Math.sin(gameData.clock.elapsedTime * 15) * 1.5;
                    light.color.setHex(0xFFFF99); 
                } else {
                    if (Math.random() > 0.95) light.intensity = 0.8 + (Math.random() - 0.5) * 0.4;
                    light.color.setHex(0xffffaa);
                }
            }
        });


        if (gameData.godRay && gameData.godRay.visible) {
            gameData.godRay.intensity = (Math.sin(gameData.clock.elapsedTime * 2) * 0.25 + 0.75) * 0.9;
            gameData.godRay.position.x = Math.sin(gameData.clock.elapsedTime * 0.5) * 30;
            gameData.godRay.position.z = Math.cos(gameData.clock.elapsedTime * 0.5) * 30;
        }

        if (gameData.weather === 'foggy' && gameData.scene.fog) {
            (gameData.scene.fog as THREE.FogExp2).density = 0.042 + Math.sin(gameData.clock.elapsedTime * 0.5) * 0.005;
        }

        if (gameData.weather === 'rain') {
            if (gameData.rainGroup) {
                gameData.rainGroup.children.forEach((drop: { position: { y: number; }; }) => {
                    drop.position.y -= 35 * delta;
                    if (drop.position.y < -5) drop.position.y = 50;
                });
            }

            if (gameData.raycaster && controlledCharacter && gameData.groundMesh) {
                const objectsToTest = [gameData.groundMesh, ...gameData.collidables, controlledCharacter.mesh, ...gameData.npcs.filter((n: { status: string; }) => n.status === 'alive').map((n: { mesh: any; }) => n.mesh)];
                for (let i = 0; i < 5; i++) {
                    const splashMesh = gameData.splashMeshes.find((s: { visible: any; }) => !s.visible);
                    if (!splashMesh) continue;
                    const randomX = controlledCharacter.mesh.position.x + (Math.random() - 0.5) * 40;
                    const randomZ = controlledCharacter.mesh.position.z + (Math.random() - 0.5) * 40;
                    gameData.raycaster.set(new THREE.Vector3(randomX, 50, randomZ), new THREE.Vector3(0, -1, 0));
                    const intersects = gameData.raycaster.intersectObjects(objectsToTest);
                    if (intersects.length > 0) {
                        const { point, face } = intersects[0];
                        splashMesh.visible = true;
                        splashMesh.position.copy(point).add(face!.normal.clone().multiplyScalar(0.05));
                        splashMesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), face!.normal);
                        gameData.splashAnims.push({ mesh: splashMesh, life: 1.0, maxScale: Math.random() * 1.0 + 0.8 });
                    }
                }
            }
        }

        gameData.splashAnims = gameData.splashAnims.filter((anim: { life: number; mesh: { visible: boolean; scale: { set: (arg0: any, arg1: any, arg2: any) => void; }; material: { opacity: any; }; }; maxScale: number; }) => {
            anim.life -= delta * 4.0;
            if (anim.life <= 0) {
                anim.mesh.visible = false;
                return false;
            }
            const scale = (1.0 - anim.life) * anim.maxScale;
            anim.mesh.scale.set(scale, scale, scale);
            (anim.mesh.material as THREE.MeshBasicMaterial).opacity = anim.life;
            return true;
        });

        if (gameData.fireflies) {
            const positions = gameData.fireflies.geometry.attributes.position;
            const velocities = gameData.fireflyVelocities;
            const bounds = gameData.worldBounds;

            for (let i = 0; i < positions.count; i++) {
                const i3 = i * 3;
                positions.array[i3] += velocities[i].x * delta;
                positions.array[i3 + 1] += velocities[i].y * delta;
                positions.array[i3 + 2] += velocities[i].z * delta;
                positions.array[i3 + 1] += Math.sin(gameData.clock.elapsedTime * 2 + i) * 0.01;
                if (positions.array[i3] > bounds.max.x) positions.array[i3] = bounds.min.x;
                if (positions.array[i3] < bounds.min.x) positions.array[i3] = bounds.max.x;
                if (positions.array[i3 + 2] > bounds.max.y) positions.array[i3 + 2] = bounds.min.y;
                if (positions.array[i3 + 2] < bounds.min.y) positions.array[i3 + 2] = bounds.max.y;
                if (positions.array[i3 + 1] > 8 || positions.array[i3 + 1] < 0.5) velocities[i].y *= -1;
            }
            positions.needsUpdate = true;
            (gameData.fireflies.material as THREE.PointsMaterial).opacity = 0.5 + Math.sin(gameData.clock.elapsedTime * 3) * 0.5;
        }

        if (gameData.dustMotes) {
            const positions = gameData.dustMotes.geometry.attributes.position;
            const velocities = gameData.dustMoteVelocities;
            const bounds = gameData.worldBounds;

            for (let i = 0; i < positions.count; i++) {
                const i3 = i * 3;
                positions.array[i3] += velocities[i].x * delta;
                positions.array[i3 + 1] += velocities[i].y * delta;
                positions.array[i3 + 2] += velocities[i].z * delta;
                positions.array[i3] += Math.sin(gameData.clock.elapsedTime * 0.1 + i) * 0.005;
                positions.array[i3 + 2] += Math.cos(gameData.clock.elapsedTime * 0.1 + i * 0.5) * 0.005;
                if (positions.array[i3] > bounds.max.x) positions.array[i3] = bounds.min.x;
                if (positions.array[i3] < bounds.min.x) positions.array[i3] = bounds.max.x;
                if (positions.array[i3 + 2] > bounds.max.y) positions.array[i3 + 2] = bounds.min.y;
                if (positions.array[i3 + 2] < bounds.min.y) positions.array[i3 + 2] = bounds.max.y;
                if (positions.array[i3 + 1] > 10 || positions.array[i3 + 1] < 0) {
                     positions.array[i3 + 1] = (positions.array[i3 + 1] > 10) ? 0 : 10;
                }
            }
            positions.needsUpdate = true;
            
            const material = (gameData.dustMotes.material as THREE.PointsMaterial);
            let targetOpacity = 0.2;
            if (gameData.weather === 'foggy') {
                targetOpacity = 0.4;
            } else if (gameData.weather === 'rain') {
                targetOpacity = 0.1;
            }
            material.opacity += (targetOpacity - material.opacity) * 0.1;
        }

        if (gameData.gameMode === 'ritual') {
            const ritual = gameData.ritualData;
            gameData.npcs.forEach((npc: NPC, index: number) => {
                npc.isControlled = (index === ritual.controlledNpcIndex && npc.status === 'alive');
                if (npc.isControlled) {
                    const speed = Player.PLAYER_SPEED;
                    const targetVelocity = new THREE.Vector3();
    
                    if (!isGameLogicPaused) {
                        if (gameData.keys['w'] || gameData.keys['arrowup']) targetVelocity.z -= 1;
                        if (gameData.keys['s'] || gameData.keys['arrowdown']) targetVelocity.z += 1;
                        if (gameData.keys['a'] || gameData.keys['arrowleft']) targetVelocity.x -= 1;
                        if (gameData.keys['d'] || gameData.keys['arrowright']) targetVelocity.x += 1;
                        if (gamepad) {
                            const stickX = gamepad.axes[0] ?? 0;
                            const stickY = gamepad.axes[1] ?? 0;
                            const deadzone = 0.15;
                            if (Math.abs(stickY) > deadzone) targetVelocity.z += stickY;
                            if (Math.abs(stickX) > deadzone) targetVelocity.x += stickX;
                        }
                        if (gameData.joystickVector) {
                            targetVelocity.x += gameData.joystickVector.x;
                            targetVelocity.z += gameData.joystickVector.y;
                        }
                    }
                    if (targetVelocity.lengthSq() > 1) targetVelocity.normalize();
                    targetVelocity.multiplyScalar(speed);
                    
                    const smoothing = 0.1;
                    npc.velocity.lerp(targetVelocity, smoothing);
                    if (npc.velocity.lengthSq() < 0.01) npc.velocity.set(0, 0, 0);
    
                    const moveVector = npc.velocity.clone().multiplyScalar(delta);
                    const isMoving = npc.velocity.lengthSq() > 0.1;
    
                    if (isMoving) npc.move(moveVector, gameData.collidables, gameData.worldBounds);
                    
                    let moveDirectionX = 0;
                    if (npc.velocity.x < -0.1) moveDirectionX = -1;
                    else if (npc.velocity.x > 0.1) moveDirectionX = 1;
                    
                    npc.updateAnimation(delta, isMoving, moveDirectionX);
                } else {
                    if (npc.status === 'alive') npc.update(delta, gameData.collidables, gameData.worldBounds, isGameLogicPaused, gameData.sfxVolume, gameData.weather);
                }
            });
        } else {
            gameData.player.update(delta, gameData.keys, gameData.collidables, isGameLogicPaused, gameData.worldBounds, gamepad, gameData.weather, gameData.sfxVolume, gameData.joystickVector);
            gameData.npcs.forEach((npc: NPC) => {
                if (npc.status === 'alive') npc.update(delta, gameData.collidables, gameData.worldBounds, isGameLogicPaused, gameData.sfxVolume, gameData.weather);
            });
        }
        
        const isControlledMoving = gameData.gameMode === 'ritual' 
            ? controlledCharacter.velocity.lengthSq() > 0.1
            : controlledCharacter.isMoving;

        if (isControlledMoving) {
            gameData.playerStationaryFor = 0;
        } else {
            gameData.playerStationaryFor += delta;
        }
        
        // Tiger Gimmick Logic (All Modes)
        if (!isGameLogicPaused) {
            gameData.tigerSpawnCooldown -= delta;
        
            if (gameData.tigerSpawnCooldown <= 0 && !gameData.tigerData && gameData.playerStationaryFor > 5) {
                const EDGE_THRESHOLD = 80;
                const playerPos = controlledCharacter.mesh.position;
                const isPlayerAtEdge = Math.abs(playerPos.x) > EDGE_THRESHOLD || Math.abs(playerPos.z) > EDGE_THRESHOLD;
        
                let closestTargetNpc: NPC | null = null;
                let minDistance = Infinity;
        
                if (isPlayerAtEdge) {
                    gameData.npcs.forEach((npc: NPC) => {
                        if (npc.status !== 'alive' || npc === controlledCharacter) return;
        
                        const distanceToPlayer = npc.mesh.position.distanceTo(playerPos);
                        if (distanceToPlayer < 10) { // NPC is within 10 units
                            const npcPos = npc.mesh.position;
                            const isNpcAtEdge = Math.abs(npcPos.x) > EDGE_THRESHOLD || Math.abs(npcPos.z) > EDGE_THRESHOLD;
                            
                            if (isNpcAtEdge) { // Both player and NPC are at the edge
                                if (distanceToPlayer < minDistance) {
                                    minDistance = distanceToPlayer;
                                    closestTargetNpc = npc;
                                }
                            }
                        }
                    });
                }
        
                if (closestTargetNpc && Math.random() < 0.5) {
                    const targetNpc = closestTargetNpc;
                    const WORLD_BOUNDARY = 95;
                    const targetPos = targetNpc.mesh.position;
                    
                    let spawnPos = new THREE.Vector3();
                    const spawnOffset = 5;
                    
                    if (Math.abs(targetPos.x) > Math.abs(targetPos.z)) {
                        spawnPos.x = (targetPos.x > 0 ? WORLD_BOUNDARY + spawnOffset : -WORLD_BOUNDARY - spawnOffset);
                        spawnPos.z = targetPos.z;
                    } else {
                        spawnPos.x = targetPos.x;
                        spawnPos.z = (targetPos.z > 0 ? WORLD_BOUNDARY + spawnOffset : -WORLD_BOUNDARY - spawnOffset);
                    }
                    spawnPos.y = TIGER_HEIGHT / 2;
    
                    const tigerMat = new THREE.MeshStandardMaterial({ map: gameData.tigerTexture.clone(), transparent: true, alphaTest: 0.5 });
                    tigerMat.map!.repeat.set(1 / 3, 1);
                    const tigerMesh = new THREE.Mesh(new THREE.PlaneGeometry(TIGER_WIDTH, TIGER_HEIGHT), tigerMat);
                    tigerMesh.position.copy(spawnPos);
                    gameData.scene.add(tigerMesh);
                    gameData.billboards.push(tigerMesh);
    
                    const fleeTarget = spawnPos.clone().multiplyScalar(1.5);
    
                    gameData.tigerData = {
                        mesh: tigerMesh,
                        state: 'appearing',
                        targetNpc: targetNpc,
                        timer: 0,
                        frame: 0,
                        fleeTarget: fleeTarget,
                    };
                    playDemonMusic();

                    if (gameData.gameMode === 'ritual' && gameData.ritualData) {
                        gameData.ritualData.cameraMode = 'tiger_follow';
                    }

                    playSfx('tiger_attack', 0.8);
                    gameData.tigerSpawnCooldown = 10 + Math.random() * 5;
                } else if (gameData.tigerSpawnCooldown <= 0) {
                     gameData.tigerSpawnCooldown = 1; // Check again in 1 second
                }
            }
        }


        if (gameData.tigerData) {
            const tiger = gameData.tigerData;
            const TIGER_SPEED = 15;
        

            if (tiger.mesh && tiger.state !== 'attacking') {
                tiger.timer += delta * 10; // Animation speed
                tiger.frame = Math.floor(tiger.timer) % 3;
                (tiger.mesh.material as THREE.MeshStandardMaterial).map!.offset.x = tiger.frame / 3;
            }
        
            if (tiger.state === 'appearing') {
                // Check if target is valid and alive 
                if (tiger.targetNpc && tiger.targetNpc.status === 'alive' && tiger.mesh && tiger.targetNpc.mesh) {
                    const direction = tiger.targetNpc.mesh.position.clone().sub(tiger.mesh.position).normalize();
                    tiger.mesh.position.add(direction.multiplyScalar(TIGER_SPEED * delta));
                    if (tiger.mesh.position.distanceTo(tiger.targetNpc.mesh.position) < 1) {
                        tiger.state = 'attacking';
                        tiger.timer = 1; // Use timer for attack duration
                    }
                } else {
                    // Target died 
                    tiger.state = 'fleeing';
                }
            } else if (tiger.state === 'attacking') {
                tiger.timer -= delta;
                if (tiger.timer <= 0) {
                    // Check if target is still alive 
                    if (tiger.targetNpc && tiger.targetNpc.status === 'alive' && tiger.targetNpc.mesh) {
                        handleNpcDeath(tiger.targetNpc);
                        gameData.bloodEffects.push(new BloodSplatter(gameData.scene, tiger.targetNpc.mesh.position));
                    }
                    tiger.state = 'fleeing';
                    if (gameData.ritualData) {
                        gameData.ritualData.cameraMode = 'player_follow';
                    }
                }
            } else if (tiger.state === 'fleeing') {
                if (tiger.mesh) {
                    const direction = tiger.fleeTarget.clone().sub(tiger.mesh.position).normalize();
                    tiger.mesh.position.add(direction.multiplyScalar(TIGER_SPEED * delta));
                    if (tiger.mesh.position.length() > 110) { // Flee off-screen
                        gameData.scene.remove(tiger.mesh);
                        const billboardIndex = gameData.billboards.indexOf(tiger.mesh);
                        if (billboardIndex > -1) gameData.billboards.splice(billboardIndex, 1);
                        (tiger.mesh.material as THREE.MeshStandardMaterial).map?.dispose();
                        (tiger.mesh.material as THREE.MeshStandardMaterial).dispose();
                        tiger.mesh.geometry.dispose();
                        gameData.tigerData = null;
                        stopDemonMusic();
                    }
                } else {
                    //clear data to prevent errors
                    gameData.tigerData = null;
                    stopDemonMusic();
                }
            }
        }

        if (!gameData.cinematicData) {
            let cameraTargetObject: THREE.Object3D | null = null;
            if (gameData.gameMode === 'ritual' && gameData.ritualData) {
                const ritual = gameData.ritualData;
                if (ritual.endingData) {
                    const centerPoint = ritual.endingData.survivors.reduce((acc: THREE.Vector3, npc: NPC) => acc.add(npc.mesh.position), new THREE.Vector3()).divideScalar(ritual.endingData.survivors.length || 1);
                    cameraTargetObject = new THREE.Object3D();
                    cameraTargetObject.position.copy(centerPoint);
                } else if (ritual.pendingDeath) {
                    cameraTargetObject = ritual.pendingDeath.victim.mesh;
                } else if (gameData.tigerData && ritual.cameraMode === 'tiger_follow') {
                    cameraTargetObject = gameData.tigerData.mesh;
                } else if (gameData.lightningTargetNpc && ritual.cameraMode === 'event_focus') {
                    cameraTargetObject = gameData.lightningTargetNpc.mesh;
                } else if (ritual.cameraMode === 'ghost_follow' && ritual.activeGhost) {
                    cameraTargetObject = ritual.activeGhost.mesh;
                } else {
                    cameraTargetObject = controlledCharacter.mesh;
                }
            } else { // Story mode
                if (gameData.tigerData) {
                    cameraTargetObject = gameData.tigerData.mesh;
                } else if (gameData.lightningTargetNpc) {
                    cameraTargetObject = gameData.lightningTargetNpc.mesh;
                } else {
                    cameraTargetObject = controlledCharacter.mesh;
                }
            }
        
            if (gameData.isMapView && gameData.mapViewTarget) {
                const mapCameraPos = gameData.mapViewTarget.clone().add(new THREE.Vector3(0, 40, 0));
                gameData.camera.camera.position.lerp(mapCameraPos, 0.05);
                gameData.camera.camera.lookAt(gameData.mapViewTarget);
            } else {
                 let cameraOffset = new THREE.Vector3(0, 8, 12);
                if (gameData.ritualData?.cameraMode === 'outro' && gameData.ritualData?.endingData) {
                    const zoomFactor = 1 + gameData.ritualData.endingData.outroTimer * 0.2;
                    cameraOffset = new THREE.Vector3(0, 20 * zoomFactor, 25 * zoomFactor);
                }
                const targetCameraPosition = cameraTargetObject.position.clone().add(cameraOffset);
                const isCameraPaused = !!gameData.interactingNpc || gameData.isInventoryOpen || gameData.isMapView;
                
                const isCharacterMoving = gameData.gameMode === 'ritual' ? controlledCharacter.velocity.lengthSq() > 0.1 : controlledCharacter.isMoving;
        
                if (isCharacterMoving && !isCameraPaused) {
                    gameData.bobTimer = (gameData.bobTimer || 0) + delta;
                    const bobFrequency = 10;
                    const bobAmplitude = 0.08;
                    const shakeAmplitude = 0.03;
                    targetCameraPosition.y += Math.sin(gameData.bobTimer * bobFrequency) * bobAmplitude;
                    targetCameraPosition.x += (Math.random() - 0.5) * shakeAmplitude;
                    targetCameraPosition.y += (Math.random() - 0.5) * shakeAmplitude;
                } else {
                    gameData.bobTimer = 0;
                }

                if (gameData.cameraShake && gameData.cameraShake.duration > 0) {
                    const shake = gameData.cameraShake;
                    shake.duration -= delta;
                    const currentIntensity = shake.intensity * (shake.duration / 0.5); // Fade out
                    targetCameraPosition.x += (Math.random() - 0.5) * currentIntensity;
                    targetCameraPosition.y += (Math.random() - 0.5) * currentIntensity;
                    if (shake.duration <= 0) {
                        shake.intensity = 0;
                    }
                }
                
                gameData.camera.camera.position.lerp(targetCameraPosition, 0.08);
                gameData.camera.camera.lookAt(cameraTargetObject.position);
            }
        }
        
        if (gameData.minimapCamera) {
            gameData.minimapCamera.position.x = controlledCharacter.mesh.position.x;
            gameData.minimapCamera.position.z = controlledCharacter.mesh.position.z;
        }
        
        const billboardMeshes = [controlledCharacter.mesh, ...gameData.billboards, ...gameData.npcs.map((n: { mesh: any; }) => n.mesh)];
        if (gameData.cinematicData?.ghost) billboardMeshes.push(gameData.cinematicData.ghost.mesh);

        billboardMeshes.forEach((obj: { quaternion: { copy: (arg0: any) => void; }; }) => {
            if(obj) obj.quaternion.copy(gameData.camera!.camera.quaternion);
        });
        
        if (gameData.interactingNpc) {
            controlledCharacter.lookAt(gameData.interactingNpc.mesh.position);
            gameData.interactingNpc.lookAt(controlledCharacter.mesh.position);
        }

        const t = translations[gameData.language];
        let newInteractionPrompt = null;
        gameData.interactionTargetClue = null;
        gameData.interactionTarget = null;
        gameData.interactionTargetLore = null;
        if (gameData.ritualData) gameData.ritualData.interactionTargetAltar = null;
        
        let closestDist = Infinity;

        if (!isGameLogicPaused) {
            if (gameData.gameMode === 'story') {
                gameData.npcs.forEach((npc: NPC) => {
                    if (npc.status === 'alive') {
                        const distance = controlledCharacter!.mesh.position.distanceTo(npc.mesh.position);
                        if (distance < 3 && distance < closestDist) {
                            closestDist = distance;
                            gameData.interactionTarget = npc;
                        }
                    }
                });
                
                if (!gameData.interactionTarget) {
                    gameData.clueObjects.forEach((clue: Clue) => {
                        if (gameData.foundClueIds.has(clue.id)) return;
                        const cluePos = new THREE.Vector3(clue.position.x, 0, clue.position.z);
                        const distance = controlledCharacter.mesh.position.distanceTo(cluePos);
                        if(distance < 3 && distance < closestDist) {
                            closestDist = distance;
                            gameData.interactionTargetClue = clue;
                        }
                    });
                }
                 if (!gameData.interactionTarget && !gameData.interactionTargetClue) {
                    gameData.loreObjects.forEach((loreItem: { object: LoreObject, mesh: THREE.Mesh }) => {
                        const distance = controlledCharacter.mesh.position.distanceTo(loreItem.mesh.position);
                        if (distance < 3 && distance < closestDist) {
                            closestDist = distance;
                            gameData.interactionTargetLore = loreItem.object;
                        }
                    });
                }
            } else if (gameData.gameMode === 'ritual' && gameData.ritualData) {
                let closestOtherNpc: NPC | null = null;
                let closestFollowDist = 4;
                gameData.npcs.forEach((npc: NPC) => {
                    if (npc !== controlledCharacter && npc.status === 'alive') {
                        const dist = controlledCharacter.mesh.position.distanceTo(npc.mesh.position);
                        if (dist < closestFollowDist) {
                            closestFollowDist = dist;
                            closestOtherNpc = npc;
                        }
                    }
                });
                if (closestOtherNpc) {
                    newInteractionPrompt = closestOtherNpc.following === controlledCharacter ? t.interactionUnfollow : t.interactionFollow;
                }

                if (!newInteractionPrompt) {
                    gameData.ritualData.altars.forEach((altar: any) => {
                        if (!altar.deactivated) {
                            const distance = controlledCharacter.mesh.position.distanceTo(altar.mesh.position);
                            if (distance < 4 && distance < closestDist) {
                                closestDist = distance;
                                gameData.ritualData.interactionTargetAltar = altar;
                            }
                        }
                    });
                }
            }
        }

        if (gameData.interactionTarget) newInteractionPrompt = `${t.interactionTalk} ${gameData.interactionTarget.name}`;
        else if (gameData.interactionTargetClue) {
            if (gameData.interactionTargetClue.type === 'static') newInteractionPrompt = t.interactionInvestigate;
            else if (gameData.interactionTargetClue.type === 'symbol') {
                const symbolData = gameData.symbolClues.find((s: any) => s.clue.id === gameData.interactionTargetClue.id);
                if (symbolData && symbolData.mesh.visible) newInteractionPrompt = t.interactionDecipher;
            }
             else if (gameData.interactionTargetClue.type === 'whisper') {
                 const dist = controlledCharacter.mesh.position.distanceTo(new THREE.Vector3(gameData.interactionTargetClue.position.x, 0, gameData.interactionTargetClue.position.z));
                 if(dist < 4 && gameData.playerStationaryFor > 1.5) newInteractionPrompt = t.interactionFocus;
                 else newInteractionPrompt = t.nearbyWhisper;
            }
        } else if (gameData.interactionTargetLore) {
            newInteractionPrompt = t.interactionInvestigate;
        } else if (gameData.ritualData?.interactionTargetAltar) {
            newInteractionPrompt = t.interactionDeactivate;
        }

        setInteractionPrompt(newInteractionPrompt);

        updateCrows(gameData, controlledCharacter, delta, playSfx);

        const allCharacters = gameData.gameMode === 'story' ? [gameData.player, ...gameData.npcs] : [...gameData.npcs];
        const newUiElements = allCharacters.map((char) => {
            if (!char) return null;
            const isNpc = char instanceof NPC;
            const screenPos = char.mesh.position.clone().add(new THREE.Vector3(0, char.mesh.scale.y / 2, 0)).project(gameData.camera!.camera);
            return {
                id: `${char.id}`,
                x: (screenPos.x + 1) / 2 * window.innerWidth,
                y: (-screenPos.y + 1) / 2 * window.innerHeight,
                hp: char.hp,
                maxHp: char.maxHp,
                visible: char.mesh.visible,
                name: isNpc ? (char as NPC).name : undefined,
                isNpc: isNpc,
            }
        }).filter(el => el !== null) as any[];
        setUiElements(newUiElements);
        
        //Death Marker 3D Object Creation
        if (gameData.deathMarkers.length > gameData.deathMarkerObjects.length) {
            const newMarkers = gameData.deathMarkers.slice(gameData.deathMarkerObjects.length);
            newMarkers.forEach((marker: { position: THREE.Vector3; id: any; name: any; }) => {
                const markerSize = 2.25;
                const markerGeo = new THREE.PlaneGeometry(markerSize, markerSize);

                const markerMat = new THREE.MeshStandardMaterial({
                    map: gameData.deadBodyTexture,
                    transparent: true,
                    alphaTest: 0.5,
                });

                const markerMesh = new THREE.Mesh(markerGeo, markerMat);
                markerMesh.position.copy(marker.position);
                markerMesh.position.y = markerSize / 2; // Position based on its own height
                
                gameData.scene.add(markerMesh);
                gameData.billboards.push(markerMesh);
                gameData.deathMarkerObjects.push({ mesh: markerMesh, name: marker.name, id: marker.id });
            });
        }
        //UI Death Update
        const newDeathMarkerElements = gameData.deathMarkerObjects.map((markerObj: { id: any; name: any; mesh: { position: { clone: () => { (): any; new(): any; add: { (arg0: THREE.Vector3): { (): any; new(): any; project: { (arg0: any): any; new(): any; }; }; new(): any; }; }; }; }; }) => {
            const markerTopPosition = markerObj.mesh.position.clone().add(new THREE.Vector3(0, Player.CHARACTER_HEIGHT * 0.9, 0));
            const screenPos = markerTopPosition.project(gameData.camera!.camera);
            return {
                id: markerObj.id,
                name: markerObj.name,
                x: (screenPos.x + 1) / 2 * window.innerWidth,
                y: (-screenPos.y + 1) / 2 * window.innerHeight,
            };
        });
        setDeathMarkerUiElements(newDeathMarkerElements);


        gameData.camera.render(delta);
        if (gameData.minimapRenderer && gameData.minimapCamera) {
            gameData.minimapRenderer.render(gameData.scene, gameData.minimapCamera);
        }
    };
    return animate;
};