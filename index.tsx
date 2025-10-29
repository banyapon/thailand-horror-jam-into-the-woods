import React, { useEffect, useRef, useState, useCallback } from 'react';
import { createRoot } from 'react-dom/client';
import * as THREE from 'three';
import { PostProcessingCamera } from './camera';
import { Player } from './player';
import { NPC } from './npc';
import { Enemy } from './enemy';
import { allCases, CaseData, DialogueNode, Evidence, Clue, LoreObject } from './case';
import { useWeatherEffects } from './weather';
import { UIManager } from './UI';
import { createWorld } from './environment';
import { spawnCharacters } from './characters';
import { createAnimationLoop } from './gameLoop';
import { Language, translations } from './translations';
import { Ghost } from './ghost';
import { BloodSplatter } from './effects';
import { baseUrl, baseSoundUrl } from './global';
import { Altar } from './ritual';

const Game = () => {
    const mountRef = useRef<HTMLDivElement>(null);
    const minimapMountRef = useRef<HTMLDivElement>(null);
    const [gameState, setGameState] = useState<'loading' | 'intro' | 'start' | 'briefing' | 'playing' | 'paused' | 'gameover' | 'initial' | 'winning_cinematic' | 'finish_screen' | 'story' | 'losing_cinematic' | 'ritual_playing' | 'ritual_ending'>('initial');
    const [gameMode, setGameMode] = useState<'story' | 'ritual'>('story');
    const [activeMenu, setActiveMenu] = useState<'main' | 'options'>('main');
    const [interactingNpc, setInteractingNpc] = useState<NPC | null>(null);
    const [uiElements, setUiElements] = useState<{ id: string, x: number, y: number, hp: number, maxHp: number, visible: boolean, name?: string, isNpc: boolean }[]>([]);
    const [deathMarkerUiElements, setDeathMarkerUiElements] = useState<{ id: string, x: number, y: number, name: string }[]>([]);
    const [isInventoryOpen, setInventoryOpen] = useState(false);
    const [isSurvivalJournalOpen, setSurvivalJournalOpen] = useState(false);
    const [currentDialogue, setCurrentDialogue] = useState<{ npc: NPC, node: DialogueNode } | null>(null);
    const [conversationHistory, setConversationHistory] = useState<{ speaker: string, text: string }[]>([]);
    const [foundClue, setFoundClue] = useState<string | null>(null);
    const [weather, setWeather] = useState<'clear' | 'rain' | 'foggy'>('clear');
    const prevGameStateRef = useRef(gameState);
    const [focusedOptionIndex, setFocusedOptionIndex] = useState<number | null>(null);
    const [objective, setObjective] = useState<{ x: number, y: number, rotation: number, distance: number } | null>(null);
    const [startMenuFocusIndex, setStartMenuFocusIndex] = useState(0);
    const titleBgmRef = useRef<HTMLAudioElement | null>(null);
    const [bgmVolume, setBgmVolume] = useState(0.3);
    const [sfxVolume, setSfxVolume] = useState(0.5);
    const [mapViewTarget, setMapViewTarget] = useState<THREE.Vector3 | null>(null);
    const [isMapView, setMapView] = useState(false);
    const [language, setLanguage] = useState<Language>('en');
    const [gameOverReason, setGameOverReason] = useState<'accusation' | 'timeout'>('accusation');
    const [cinematicText, setCinematicText] = useState<string | null>(null);
    const startSoundRef = useRef<HTMLAudioElement | null>(null);
    const [interactionPrompt, setInteractionPrompt] = useState<string | null>(null);
    const cheatCodeSequence = useRef<string[]>([]);
    const targetWinCheatCode = "idkfa";
    const targetLoseCheatCode = "idead";
    const [isPresentingEvidence, setPresentingEvidence] = useState(false);
    const [hintText, setHintText] = useState<string | null>(null);
    const [joystickVector, setJoystickVector] = useState({ x: 0, y: 0 });
    
    const gameDataRef = useRef<{
        camera?: PostProcessingCamera,
        minimapCamera?: THREE.OrthographicCamera,
        scene?: THREE.Scene,
        renderer?: THREE.WebGLRenderer,
        minimapRenderer?: THREE.WebGLRenderer,
        player?: Player,
        npcs: NPC[],
        enemy?: Enemy,
        keys: Record<string, boolean>,
        clock: THREE.Clock,
        interactionTarget: NPC | null,
        collidables: THREE.Mesh[],
        worldBounds: THREE.Box2,
        audioListener?: THREE.AudioListener,
        audioBuffers: Record<string, AudioBuffer>,
        billboards: THREE.Mesh[],
        clueObjects: Clue[],
        clueLights: THREE.PointLight[],
        murderer: NPC | null,
        murdererId: string | null,
        activeCase: CaseData | null,
        collectedEvidence: Evidence[],
        foundClueIds: Set<string>,
        crucialEvidenceIds: string[],
        accusationsLeft: number,
        sfxAudio?: THREE.Audio,
        windAudio?: THREE.Audio,
        rainAudio?: THREE.Audio,
        ghostAudio?: THREE.Audio,
        music?: {
            exploration?: THREE.Audio;
            demon?: THREE.Audio;
        },
        rainGroup?: THREE.Group,
        splashMeshes: THREE.Mesh[],
        splashAnims: { mesh: THREE.Mesh, life: number, maxScale: number }[],
        raycaster?: THREE.Raycaster,
        groundMesh?: THREE.Mesh,
        gamepadPrevState: { buttons: boolean[] },
        crowTexture?: THREE.Texture,
        ghostTexture?: THREE.Texture,
        playerTexture?: THREE.Texture,
        altarTexture?: THREE.Texture,
        deadBodyTexture?: THREE.Texture,
        tigerTexture?: THREE.Texture,
        lightningEffect?: { mesh: THREE.Mesh, timer: number },
        crowTriggerObjects: { mesh: THREE.Mesh, triggered: boolean }[],
        activeCrows: { mesh: THREE.Mesh, animationTimer: number, frame: number }[],
        lightningFlashTimer: number;
        lightningTimer: number;
        nextLightningTime: number;
        gameState: 'loading' | 'intro' | 'start' | 'briefing' | 'playing' | 'paused' | 'gameover' | 'initial' | 'winning_cinematic' | 'finish_screen' | 'story' | 'losing_cinematic' | 'ritual_playing' | 'ritual_ending';
        gameMode: 'story' | 'ritual';
        activeMenu: 'main' | 'options';
        weather: 'clear' | 'rain' | 'foggy';
        currentDialogue: { npc: NPC, node: DialogueNode } | null;
        focusedOptionIndex: number | null;
        startMenuFocusIndex: number;
        gamepadNavCooldown: number;
        ambientLight?: THREE.AmbientLight;
        dirLight?: THREE.DirectionalLight;
        ambientLightTarget?: { color: THREE.Color; intensity: number };
        dirLightTarget?: { color: THREE.Color; intensity: number };
        godRay?: THREE.PointLight;
        fireflies?: THREE.Points;
        fireflyVelocities?: THREE.Vector3[];
        dustMotes?: THREE.Points;
        dustMoteVelocities?: THREE.Vector3[];
        isMapView: boolean;
        isSurvivalJournalOpen: boolean;
        mapViewTarget: THREE.Vector3 | null;
        sfxVolume: number;
        clueHighlightActive: boolean;
        clueHighlightTimer: number;
        clueHighlightCooldown: number;
        weatherChangeTimer: number;
        nextRainEventTime: number;
        rainEventActive: boolean;
        rainEventDuration: number;
        previousWeather: 'clear' | 'rain' | 'foggy';
        language: Language;
        cinematicData: { victim: NPC; ghost?: Ghost | null; phase?: 'approaching' | 'attacking' | 'finished'; timer?: number; } | null;
        bloodEffects: BloodSplatter[];
        bobTimer: number;
        introData: {
            timer: number;
            progress: number;
            path: THREE.CatmullRomCurve3;
            lookAtTarget: THREE.Vector3;
            shake: THREE.Vector3;
        } | null;
        winningCinematicData: { phase: 'running' | 'blood' | 'text', timer: number } | null;
        losingCinematicData: { ghost?: Ghost | null; phase?: 'running' | 'attacking' | 'finished'; timer?: number; target?: Player | NPC; } | null;
        gameplayTimer: number;
        nextNpcDeathTimer: number;
        symbolClues: { mesh: THREE.Mesh, clue: Clue }[];
        playerStationaryFor: number;
        interactionTargetClue: Clue | null;
        activeWhisperSound: THREE.PositionalAudio | null;
        isPresentingEvidence: boolean;
        ritualData: {
            timer: number;
            ghostSpawnTimer: number;
            altars: Altar[];
            survivors: number;
            controlledNpcIndex: number;
            interactionTargetAltar: Altar | null;
            activeGhost: Ghost | null;
            cameraMode: 'player_follow' | 'ghost_follow' | 'event_focus' | 'intro' | 'outro' | 'tiger_follow';
            endingData: { 
                timer: number; 
                outroTimer: number; 
                survivors: NPC[];
                phase: 'gathering' | 'exiting';
                rallyPoint: THREE.Vector3;
            } | null;
            cameraShake: { intensity: number; duration: number };
            lightningTimer: number;
            nextLightningStrike: number;
            lightningTargetNpc: NPC | null;
            lightningFlashTimer: number;
            pendingDeath: { victim: NPC; timer: number } | null;
            weatherChangeTimer: number;
            introData: {
                timer: number;
                progress: number;
                path: THREE.CatmullRomCurve3;
                lookAtTarget: THREE.Vector3;
                textVisible: boolean;
            } | null;
        } | null;
        cameraShake: { intensity: number, duration: number };
        lightningTargetNpc: NPC | null;
        deathMarkers: { id: string, name: string, position: THREE.Vector3 }[];
        deathMarkerObjects: { id: string, name: string, mesh: THREE.Mesh }[];
        tigerData: { 
            mesh: THREE.Mesh | null, 
            state: 'appearing' | 'attacking' | 'fleeing', 
            targetNpc: NPC, 
            timer: number, 
            frame: number,
            fleeTarget: THREE.Vector3,
        } | null,
        tigerSpawnCooldown: number,
        loreObjects: { object: LoreObject, mesh: THREE.Mesh }[],
        interactionTargetLore: LoreObject | null,
        joystickVector: { x: number; y: number };
    }>({ 
        npcs: [], 
        keys: {}, 
        clock: new THREE.Clock(), 
        interactionTarget: null,
        collidables: [],
        worldBounds: new THREE.Box2(new THREE.Vector2(-95, -95), new THREE.Vector2(95, 95)),
        audioBuffers: {},
        billboards: [],
        clueObjects: [],
        clueLights: [],
        murderer: null,
        murdererId: null,
        activeCase: null,
        collectedEvidence: [],
        foundClueIds: new Set(),
        crucialEvidenceIds: [],
        accusationsLeft: 3,
        splashMeshes: [],
        splashAnims: [],
        gamepadPrevState: { buttons: Array(16).fill(false) },
        crowTriggerObjects: [],
        activeCrows: [],
        lightningFlashTimer: 0,
        lightningTimer: 30 + Math.random() * 30,
        nextLightningTime: Math.random() * 45 + 30,
        gameState: 'initial',
        gameMode: 'story',
        activeMenu: 'main',
        weather: 'clear',
        currentDialogue: null,
        focusedOptionIndex: null,
        startMenuFocusIndex: 0,
        gamepadNavCooldown: 0,
        ambientLight: undefined,
        dirLight: undefined,
        ambientLightTarget: { color: new THREE.Color(0x405070), intensity: 0.24 }, // Initial clear weather values
        dirLightTarget: { color: new THREE.Color(0x9ab0d0), intensity: 0.84 },
        godRay: undefined,
        fireflies: undefined,
        fireflyVelocities: undefined,
        dustMotes: undefined,
        dustMoteVelocities: undefined,
        isMapView: false,
        isSurvivalJournalOpen: false,
        mapViewTarget: null,
        sfxVolume: 0.5,
        clueHighlightActive: false,
        clueHighlightTimer: 0,
        clueHighlightCooldown: 0,
        weatherChangeTimer: 60 + Math.random() * 60, // 1-2 minutes
        nextRainEventTime: 120 + Math.random() * 120, // 2-4 minutes
        rainEventActive: false,
        rainEventDuration: 0,
        previousWeather: 'clear',
        language: 'en',
        cinematicData: null,
        bloodEffects: [],
        bobTimer: 0,
        introData: null,
        winningCinematicData: null,
        losingCinematicData: null,
        gameplayTimer: 0,
        nextNpcDeathTimer: 900, // 15 minutes
        symbolClues: [],
        playerStationaryFor: 0,
        interactionTargetClue: null,
        activeWhisperSound: null,
        isPresentingEvidence: false,
        ritualData: null,
        cameraShake: { intensity: 0, duration: 0 },
        lightningTargetNpc: null,
        deathMarkers: [],
        deathMarkerObjects: [],
        tigerData: null,
        tigerSpawnCooldown: 5,
        loreObjects: [],
        interactionTargetLore: null,
        joystickVector: { x: 0, y: 0 },
    });

    useEffect(() => {
        const browserLang = navigator.language.split('-')[0];
        if (browserLang === 'th') {
            setLanguage('th');
        } else {
            setLanguage('en');
        }
    }, []);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            const gameData = gameDataRef.current;
            if (gameData.gameState !== 'playing' && gameData.gameState !== 'ritual_playing') {
                cheatCodeSequence.current = [];
                return;
            }

            const key = e.key.toLowerCase();
            
            // Ritual Mode Character Switching
            if (gameData.gameMode === 'ritual' && gameData.ritualData) {
                const numKey = parseInt(key);
                if (!isNaN(numKey) && numKey >= 1 && numKey <= 7) {
                    const targetIndex = numKey - 1;
                    if (targetIndex < gameData.npcs.length && gameData.npcs[targetIndex].status === 'alive') {
                        gameData.ritualData.controlledNpcIndex = targetIndex;
                    }
                }
            }
            
            if (key.length > 1) return;
            
            cheatCodeSequence.current.push(key);
            if (cheatCodeSequence.current.length > 5) {
                cheatCodeSequence.current.shift();
            }

            const currentSequence = cheatCodeSequence.current.join('');

            if (currentSequence === targetWinCheatCode) {
                if (gameData.gameMode === 'story' && gameData.murderer) {
                    console.log("Cheat code 'IDKFA' activated! You win.");
                    gameData.winningCinematicData = { phase: 'running', timer: 0 };
                    setGameState('winning_cinematic');
                }
                cheatCodeSequence.current = [];
            } else if (currentSequence === targetLoseCheatCode) {
                 if (gameData.gameMode === 'story') {
                    console.log("Cheat code 'IDEAD' activated! Game Over.");
                    setGameOverReason('accusation'); 
                    gameData.losingCinematicData = { target: gameData.player, phase: 'running', timer: 0 };
                    setGameState('losing_cinematic');
                }
                cheatCodeSequence.current = [];
            }
        };

        const handleContextMenu = (e: MouseEvent) => {
            const gameData = gameDataRef.current;
            if (gameData.gameMode === 'ritual' && gameData.ritualData) {
                e.preventDefault(); // Prevent context menu
                let nextIndex = (gameData.ritualData.controlledNpcIndex + 1) % gameData.npcs.length;
                let attempts = 0;
                // Find the next alive character
                while(gameData.npcs[nextIndex].status !== 'alive' && attempts < gameData.npcs.length) {
                    nextIndex = (nextIndex + 1) % gameData.npcs.length;
                    attempts++;
                }
                if (gameData.npcs[nextIndex].status === 'alive') {
                    gameData.ritualData.controlledNpcIndex = nextIndex;
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('contextmenu', handleContextMenu);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('contextmenu', handleContextMenu);
        };
    }, []);

    useEffect(() => { gameDataRef.current.gameState = gameState; }, [gameState]);
    useEffect(() => { gameDataRef.current.gameMode = gameMode; }, [gameMode]);
    useEffect(() => { gameDataRef.current.activeMenu = activeMenu; }, [activeMenu]);
    useEffect(() => { gameDataRef.current.weather = weather; }, [weather]);
    useEffect(() => { gameDataRef.current.currentDialogue = currentDialogue; }, [currentDialogue]);
    useEffect(() => { gameDataRef.current.focusedOptionIndex = focusedOptionIndex; }, [focusedOptionIndex]);
    useEffect(() => { gameDataRef.current.startMenuFocusIndex = startMenuFocusIndex; }, [startMenuFocusIndex]);
    useEffect(() => { gameDataRef.current.isMapView = isMapView; }, [isMapView]);
    useEffect(() => { gameDataRef.current.isSurvivalJournalOpen = isSurvivalJournalOpen; }, [isSurvivalJournalOpen]);
    useEffect(() => { gameDataRef.current.mapViewTarget = mapViewTarget; }, [mapViewTarget]);
    useEffect(() => { gameDataRef.current.sfxVolume = sfxVolume; }, [sfxVolume]);
    useEffect(() => { gameDataRef.current.language = language; }, [language]);
    useEffect(() => { gameDataRef.current.isPresentingEvidence = isPresentingEvidence; }, [isPresentingEvidence]);
    useEffect(() => { gameDataRef.current.joystickVector = joystickVector; }, [joystickVector]);

    useEffect(() => {
        if (gameDataRef.current.music?.exploration) {
            gameDataRef.current.music.exploration.setVolume(bgmVolume);
        }
        if (gameDataRef.current.music?.demon) {
            gameDataRef.current.music.demon.setVolume(bgmVolume * 0.8);
        }
        if (titleBgmRef.current) {
            titleBgmRef.current.volume = bgmVolume;
        }
    }, [bgmVolume]);

    useWeatherEffects(gameDataRef, weather, gameState);

    const playSfx = useCallback((soundId: string, volume = sfxVolume) => {
        const gameData = gameDataRef.current;
        if (gameData.sfxAudio && gameData.audioBuffers[soundId]) {
            if (soundId !== 'thunder' && gameData.sfxAudio.isPlaying) {
                gameData.sfxAudio.stop();
            }
            const audio = soundId === 'thunder' || soundId === 'crow' || soundId === 'die' || soundId === 'scream_death' || soundId === 'tiger_attack' ? new THREE.Audio(gameData.audioListener!) : gameData.sfxAudio;
            
            audio.setBuffer(gameData.audioBuffers[soundId]);
            audio.setVolume(volume);
            audio.play();
        }
    }, [sfxVolume]);

    const handleNpcDeath = useCallback((npcToKill: NPC) => {
        const gameData = gameDataRef.current;
        const npc = gameData.npcs.find(n => n.id === npcToKill.id);
        if (npc && npc.status === 'alive') {
            console.log(`${npc.name} has been killed.`);
            npc.status = 'deceased';
            npc.mesh.visible = false;
            npc.indicatorMesh.visible = false;
            
            gameData.deathMarkers.push({ id: npc.id, name: npc.name, position: npc.mesh.position.clone() });
    
            if(gameData.gameMode === 'ritual' && gameData.ritualData) {
                gameData.ritualData.survivors--;
                
                const deadNpc = npc;
                gameData.npcs.forEach(n => {
                    if (n.following === deadNpc) {
                        n.following = null;
                    }
                });
    
                const deadNpcIndex = gameData.npcs.findIndex(n => n.id === deadNpc.id);
                if (gameData.ritualData.controlledNpcIndex === deadNpcIndex) {
                    const livingSurvivors = gameData.npcs.filter(n => n.status === 'alive');
                    
                    if (livingSurvivors.length > 0) {
                        let closestSurvivor = livingSurvivors[0];
                        let minDistance = deadNpc.mesh.position.distanceTo(closestSurvivor.mesh.position);
    
                        for (let i = 1; i < livingSurvivors.length; i++) {
                            const dist = deadNpc.mesh.position.distanceTo(livingSurvivors[i].mesh.position);
                            if (dist < minDistance) {
                                minDistance = dist;
                                closestSurvivor = livingSurvivors[i];
                            }
                        }
                        
                        const newIndex = gameData.npcs.findIndex(n => n.id === closestSurvivor.id);
                        if (newIndex !== -1) {
                            gameData.ritualData.controlledNpcIndex = newIndex;
                        }
                    }
                }
                
                // Last survivor cinematic trigger
                if (gameData.ritualData.survivors === 1 && gameState === 'ritual_playing') {
                    const lastSurvivor = gameData.npcs.find(n => n.status === 'alive');
                    if (lastSurvivor) {
                        gameData.losingCinematicData = { target: lastSurvivor, phase: 'running', timer: 0 };
                        setGameState('losing_cinematic');
                    }
                }
            } else if (gameData.gameMode === 'story') {
                 // Last survivor cinematic trigger for story mode
                const livingNpcs = gameData.npcs.filter(n => n.status === 'alive');
                if (livingNpcs.length === 0 && gameState === 'playing') {
                     setGameOverReason('timeout'); // Or a new reason like 'overwhelmed'
                     gameData.losingCinematicData = { target: gameData.player, phase: 'running', timer: 0 };
                     setGameState('losing_cinematic');
                }
            }
        }
    }, [gameState]);

    const handleDialogueEnd = useCallback(() => {
        setCurrentDialogue(null);
        setInteractingNpc(null);
        setFocusedOptionIndex(null);
        setPresentingEvidence(false);
    }, []);

    const handleInteraction = useCallback(() => {
        if (isInventoryOpen) return;

        if (gameDataRef.current.gameMode === 'story') {
             // Priority 1: NPCs
            if (gameDataRef.current.interactionTarget) {
                setInteractingNpc(gameDataRef.current.interactionTarget);
                const startNode = gameDataRef.current.activeCase.npcs[gameDataRef.current.interactionTarget.id]?.dialogueTree['start'];
                if (startNode) {
                    setConversationHistory(prev => [...prev, { speaker: gameDataRef.current.interactionTarget!.name, text: startNode.text[language] }]);
                    setCurrentDialogue({ npc: gameDataRef.current.interactionTarget, node: startNode });
                    setFocusedOptionIndex(startNode.options ? 0 : null);
                }
                return;
            }

            // Priority 2: Clues
            const clueToCollect = gameDataRef.current.interactionTargetClue;
            if (clueToCollect) {
                gameDataRef.current.foundClueIds.add(clueToCollect.id);
                let popupText = clueToCollect.text[language];
                if (clueToCollect.evidenceId) {
                    const evidence = gameDataRef.current.activeCase.evidence.find(e => e.id === clueToCollect.evidenceId);
                    if (evidence && !gameDataRef.current.collectedEvidence.some(e => e.id === evidence.id)) {
                        gameDataRef.current.collectedEvidence.push(evidence);
                        playSfx('collect', sfxVolume * 1.2);
                        popupText += `\n(${translations[language].newEvidence}: ${evidence.name[language]})`;
                    } else { playSfx('clue', sfxVolume * 1.2); }
                } else { playSfx('clue', sfxVolume * 1.2); }
                setFoundClue(popupText);
                setTimeout(() => setFoundClue(null), 5000);
                gameDataRef.current.interactionTargetClue = null;
                return;
            }

            // Priority 3: Lore Objects
            if (gameDataRef.current.interactionTargetLore) {
                const lore = gameDataRef.current.interactionTargetLore;
                setFoundClue(lore.text[language]);
                playSfx('clue', sfxVolume * 0.7); // Quieter sound for lore
                setTimeout(() => setFoundClue(null), 5000);
            }

        } else if (gameDataRef.current.gameMode === 'ritual' && gameDataRef.current.ritualData?.interactionTargetAltar) {
            const altar = gameDataRef.current.ritualData.interactionTargetAltar;
            if (!altar.deactivated) {
                altar.deactivate();
                gameDataRef.current.ritualData.timer += 10;
                playSfx('collect', sfxVolume * 1.2);
                setFoundClue(translations[language].altarDeactivated);
                setTimeout(() => setFoundClue(null), 3000);
                 const controlledNpc = gameDataRef.current.npcs[gameDataRef.current.ritualData.controlledNpcIndex];
                if (controlledNpc) {
                    controlledNpc.hasPerformedRitual = true;
                }
            }
        }
    }, [isInventoryOpen, playSfx, sfxVolume, language]);

    const handlePresentEvidence = useCallback((evidenceId: string) => {
        if (!currentDialogue || !gameDataRef.current.activeCase) return;

        setPresentingEvidence(false);
        const gameData = gameDataRef.current;
        const presentedEvidence = gameData.activeCase.evidence.find(e => e.id === evidenceId);
        if (!presentedEvidence) return;

        const accusedNpc = currentDialogue.npc;
        const t = translations[language];
        setConversationHistory(prev => [...prev, { speaker: "You", text: `(${t.presented}: ${presentedEvidence.name[language]})` }]);
        
        const reactionNodeId = `react_${evidenceId}`;
        let nextNode = gameData.activeCase.npcs[accusedNpc.id]?.dialogueTree[reactionNodeId];
        
        // If a specific reaction isn't defined, use a generic one.
        if (!nextNode) {
            const isMurderer = accusedNpc === gameData.murderer;
            const genericReactions = isMurderer 
                ? gameData.activeCase.genericReactions.murderer
                : gameData.activeCase.genericReactions.innocent;
            const randomReaction = genericReactions[Math.floor(Math.random() * genericReactions.length)];
            nextNode = { text: randomReaction };
        }

        setConversationHistory(prev => [...prev, { speaker: accusedNpc.name, text: nextNode.text[language] }]);
        setCurrentDialogue({ npc: accusedNpc, node: nextNode as DialogueNode });
        setFocusedOptionIndex(null); // No options after presenting evidence.

    }, [currentDialogue, language]);

    const handleDialogueOption = useCallback((option: { text: any, action?: { type: string; payload?: any }, next: string }) => {
        if (!currentDialogue || !gameDataRef.current.activeCase) return;
        const gameData = gameDataRef.current;

        setConversationHistory(prev => [...prev, { speaker: "You", text: option.text[language] }]);

        if (option.action) {
             if (option.action.type === 'present_evidence') {
                setPresentingEvidence(true);
                setFocusedOptionIndex(null);
                return;
            }
            if (option.action.type === 'collect_evidence') {
                const evidenceId = option.action.payload.evidenceId;
                const evidence = gameData.activeCase.evidence.find(e => e.id === evidenceId);
                if (evidence && !gameData.collectedEvidence.some(e => e.id === evidenceId)) {
                    gameData.collectedEvidence.push(evidence);
                    const isCrucial = gameData.crucialEvidenceIds.includes(evidenceId);
                    let popupText = `${translations[language].evidenceCollected}: ${evidence.name[language]}`;
                    if (isCrucial) {
                        playSfx('collect', sfxVolume * 1.3);
                        popupText = `${translations[language].crucialEvidence}\n${evidence.name[language]}`;
                    } else { playSfx('collect', sfxVolume * 0.9); }
                    setFoundClue(popupText);
                    setTimeout(() => setFoundClue(null), 5000);
                }
            } else if (option.action.type === 'accuse') {
                const collectedEvidenceIds = new Set(gameData.collectedEvidence.map(e => e.id));
                const hasAllCrucialEvidence = gameData.crucialEvidenceIds.every(id => collectedEvidenceIds.has(id));

                if (hasAllCrucialEvidence) {
                    playSfx('accuse');
                    const accusedNpc = currentDialogue.npc;
                    handleDialogueEnd();
                    gameData.accusationsLeft--;
                    const isCorrect = accusedNpc === gameData.murderer;
                    if (isCorrect) {
                        gameData.winningCinematicData = { phase: 'running', timer: 0 };
                        setGameState('winning_cinematic');
                    } else {
                        if (gameData.accusationsLeft <= 0) {
                            setGameOverReason('accusation');
                            gameData.losingCinematicData = { target: gameData.player, phase: 'running', timer: 0 };
                            setGameState('losing_cinematic');
                        } else {
                            const livingNpcs = gameData.npcs.filter(n => n.status === 'alive' && n !== gameData.murderer && n !== accusedNpc);
                            if (livingNpcs.length > 0) {
                                const victim = livingNpcs[Math.floor(Math.random() * livingNpcs.length)];
                                gameData.cinematicData = { victim };
                            }
                        }
                    }
                } else {
                    handleDialogueEnd();
                    const message = translations[language].notEnoughEvidence;
                    setFoundClue(message);
                    setTimeout(() => setFoundClue(null), 5000);
                }
                return;
            }
        }
        
        const nextNodeId = option.next;
        const nextNode = gameData.activeCase.npcs[currentDialogue.npc.id]?.dialogueTree[nextNodeId];
        if (nextNode) {
            setConversationHistory(prev => [...prev, { speaker: currentDialogue.npc.name, text: nextNode.text[language] }]);
            setCurrentDialogue({ npc: currentDialogue.npc, node: nextNode });
            setFocusedOptionIndex(nextNode.options ? 0 : null);
        } else {
            handleDialogueEnd();
        }
    }, [currentDialogue, playSfx, handleDialogueEnd, sfxVolume, language]);

    const handleFollowToggle = useCallback(() => {
        const gameData = gameDataRef.current;
        if (gameData.gameMode !== 'ritual' || !gameData.ritualData) {
          return;
        }
        const controlledNpc = gameData.npcs[gameData.ritualData.controlledNpcIndex];
        if (!controlledNpc) return;

        let targetNpc: NPC | null = null;
        let closestDist = 4;
        
        gameData.npcs.forEach((npc: NPC) => {
            if (npc !== controlledNpc && npc.status === 'alive') {
                const dist = controlledNpc.mesh.position.distanceTo(npc.mesh.position);
                if (dist < 4 && dist < closestDist) {
                    closestDist = dist;
                    targetNpc = npc;
                }
            }
        });
        
        if (targetNpc) {
            if (targetNpc.following === controlledNpc) {
                targetNpc.following = null;
            } else if (targetNpc.following === null) {
                targetNpc.following = controlledNpc;
            }
        }
    }, []);

    const cleanupGame = useCallback(() => {
        const gameData = gameDataRef.current;
        const mount = mountRef.current;
        const minimapDiv = minimapMountRef.current;

        window.removeEventListener('keydown', gameData['keydownHandler' as any]);
        window.removeEventListener('keyup', gameData['keyupHandler' as any]);
        window.removeEventListener('resize', gameData['resizeHandler' as any]);
        
        if (gameData['weatherTimeoutId' as any]) clearTimeout(gameData['weatherTimeoutId' as any]);

        if (mount && gameData.renderer && mount.contains(gameData.renderer.domElement)) mount.removeChild(gameData.renderer.domElement);
        if (minimapDiv && gameData.minimapRenderer && minimapDiv.contains(gameData.minimapRenderer.domElement)) minimapDiv.removeChild(gameData.minimapRenderer.domElement);
        
        gameData.renderer?.dispose();
        gameData.minimapRenderer?.dispose();

        if (gameData['animationFrameId' as any]) cancelAnimationFrame(gameData['animationFrameId' as any]);

        if (gameData.music) {
            gameData.music.exploration?.stop();
            gameData.music.demon?.stop();
        }
        gameData.windAudio?.stop();
        gameData.rainAudio?.stop();
        gameData.ghostAudio?.stop();
        if (gameData.activeWhisperSound) {
            gameData.activeWhisperSound.stop();
            gameData.scene?.remove(gameData.activeWhisperSound);
        }

        const audioListener = gameData.audioListener;

        Object.assign(gameDataRef.current, {
            npcs: [], keys: {}, clock: new THREE.Clock(), interactionTarget: null, collidables: [],
            billboards: [], clueObjects: [], clueLights: [], murderer: null, collectedEvidence: [],
            foundClueIds: new Set(), accusationsLeft: 3, scene: undefined, player: undefined,
            enemy: undefined, camera: undefined, audioListener: audioListener, sfxAudio: undefined,
            windAudio: undefined, rainAudio: undefined, ghostAudio: undefined, music: undefined, rainGroup: undefined,
            splashMeshes: [], splashAnims: [], raycaster: undefined, groundMesh: undefined,
            gamepadPrevState: { buttons: Array(16).fill(false) }, crowTexture: undefined,
            crowTriggerObjects: [], activeCrows: [], lightningFlashTimer: 0, 
            activeMenu: 'main', weather: 'clear', currentDialogue: null, focusedOptionIndex: null, gamepadNavCooldown: 0, 
            startMenuFocusIndex: 0,
            ambientLight: undefined, dirLight: undefined, godRay: undefined, fireflies: undefined, fireflyVelocities: undefined,
            ambientLightTarget: undefined, dirLightTarget: undefined,
            dustMotes: undefined, dustMoteVelocities: undefined,
            isMapView: false, isSurvivalJournalOpen: false, mapViewTarget: null,
            clueHighlightActive: false, clueHighlightTimer: 0, clueHighlightCooldown: 0,
            weatherChangeTimer: 60 + Math.random() * 60,
            nextRainEventTime: 120 + Math.random() * 120,
            rainEventActive: false, rainEventDuration: 0, previousWeather: 'clear',
            minimapCamera: undefined, minimapRenderer: undefined,
            ghostTexture: undefined,
            playerTexture: undefined,
            altarTexture: undefined,
            deadBodyTexture: undefined,
            tigerTexture: undefined,
            lightningEffect: undefined,
            cinematicData: null, bloodEffects: [],
            bobTimer: 0, introData: null, winningCinematicData: null, losingCinematicData: null,
            gameplayTimer: 0, nextNpcDeathTimer: 900,
            symbolClues: [], playerStationaryFor: 0, interactionTargetClue: null, activeWhisperSound: null,
            isPresentingEvidence: false,
            ritualData: null,
            cameraShake: { intensity: 0, duration: 0 },
            lightningTargetNpc: null,
            lightningTimer: 30 + Math.random() * 30,
            deathMarkers: [],
            deathMarkerObjects: [],
            tigerData: null,
            tigerSpawnCooldown: 5,
            loreObjects: [],
            interactionTargetLore: null,
            joystickVector: { x: 0, y: 0 },
        });
    }, []);

    const initializeAndPlayTitleBgm = useCallback(() => {
        let bgm = titleBgmRef.current;
        if (!bgm) {
            bgm = new Audio(`${baseSoundUrl}bgm.mp3`);
            bgm.loop = true;
            titleBgmRef.current = bgm;
        }
        bgm.volume = bgmVolume;
        if (bgm.paused) {
            bgm.play().catch(e => {
                console.warn("Could not play audio. This should not happen after user interaction.", e);
            });
        }
    }, [bgmVolume]);

    const handleInitialInteraction = useCallback(() => {
        const gameData = gameDataRef.current;
        if (!gameData.audioListener) {
            gameData.audioListener = new THREE.AudioListener();
        }
        const listener = gameData.audioListener;
        if (listener.context.state === 'suspended') {
            listener.context.resume().then(() => {
                console.log("AudioContext resumed successfully.");
            });
        }
        
        setGameState('start');
        initializeAndPlayTitleBgm();
    }, [initializeAndPlayTitleBgm]);

    const handleStoryEnd = useCallback(() => {
        setGameState('start');
    }, []);

    const handleSkipRitualIntro = useCallback(() => {
        const gameData = gameDataRef.current;
        if (gameData.ritualData && gameData.ritualData.introData) {
            gameData.ritualData.introData = null;
            gameData.ritualData.cameraMode = 'player_follow';
        }
    }, []);

    useEffect(() => {
        const isTitleScreen = gameState === 'start' || gameState === 'initial' || gameState === 'story';
        if (!isTitleScreen && titleBgmRef.current && !titleBgmRef.current.paused) {
            titleBgmRef.current.pause();
            titleBgmRef.current.currentTime = 0;
        }
    }, [gameState]);

    useEffect(() => {
        const { music, rainAudio, windAudio } = gameDataRef.current;
        const isPlaying = gameState === 'playing' || gameState === 'ritual_playing';
    
        if (gameState === 'paused' || isSurvivalJournalOpen) {
            if (rainAudio?.isPlaying) rainAudio.pause();
            if (windAudio?.isPlaying) windAudio.pause();
            if (music?.exploration?.isPlaying) music.exploration.pause();
        } else if (isPlaying) {
            if (music?.exploration && !music.exploration.isPlaying && !music.demon?.isPlaying) {
                music.exploration.play();
            }

            if (weather === 'rain') {
                if (rainAudio && !rainAudio.isPlaying) rainAudio.play();
                if (windAudio && windAudio.isPlaying) windAudio.stop();
            } else {
                if (rainAudio && rainAudio.isPlaying) rainAudio.stop();
                if (windAudio && !windAudio.isPlaying) windAudio.play();
            }
        }
    }, [gameState, weather, isSurvivalJournalOpen]);
    
    useEffect(() => {
        const gameData = gameDataRef.current;
        if (gameData.windAudio) {
            gameData.windAudio.setVolume(sfxVolume * 0.4);
        }
        if (gameData.rainAudio) {
            gameData.rainAudio.setVolume(sfxVolume * 0.8);
        }
        if (gameData.ghostAudio) {
            gameData.ghostAudio.setVolume(sfxVolume * 0.7);
        }
    }, [sfxVolume]);

    useEffect(() => {
        if (prevGameStateRef.current !== 'playing' && gameState === 'playing') {
            gameDataRef.current.clock.getDelta();
        }
        if (prevGameStateRef.current !== 'ritual_playing' && gameState === 'ritual_playing') {
            gameDataRef.current.clock.getDelta();
        }
        if (prevGameStateRef.current === 'intro' && gameState !== 'intro') {
            gameDataRef.current.introData = null;
        }
        if (prevGameStateRef.current === 'winning_cinematic' && gameState !== 'winning_cinematic') {
            setCinematicText(null);
        }
        prevGameStateRef.current = gameState;
    }, [gameState]);
    

    useEffect(() => {
        const gameData = gameDataRef.current;
        const minimapDiv = minimapMountRef.current;
        const isPlaying = gameState === 'playing' || gameState === 'ritual_playing';

        if (isPlaying && minimapDiv && !gameData.minimapRenderer) {
            const mapSize = 100;
            gameData.minimapCamera = new THREE.OrthographicCamera(-mapSize / 2, mapSize / 2, mapSize / 2, -mapSize / 2, 1, 100);
            gameData.minimapCamera.layers.enable(1);
            gameData.minimapCamera.position.set(0, 50, 0);
            gameData.minimapCamera.lookAt(0, 0, 0);
            gameData.minimapRenderer = new THREE.WebGLRenderer({ antialias: true });
            gameData.minimapRenderer.setSize(minimapDiv.clientWidth * 2, minimapDiv.clientHeight * 2);
            minimapDiv.appendChild(gameData.minimapRenderer.domElement);
        }
    }, [gameState]);


    const handleMinimapClick = useCallback((worldCoords: THREE.Vector3) => {
        if (isMapView) return;
        setMapViewTarget(worldCoords);
        setMapView(true);
        setTimeout(() => {
            setMapView(false);
        }, 3500);
    }, [isMapView]);

    const handleMenuSelect = useCallback((key: string) => {
        if (activeMenu === 'main') {
            if (key === 'start') {
                if (!startSoundRef.current) {
                    startSoundRef.current = new Audio(`${baseSoundUrl}ring.mp3`);
                }
                startSoundRef.current.volume = sfxVolume;
                startSoundRef.current.play().catch(e => console.error("Error playing start sound:", e));

                const chosenCase = allCases[Math.floor(Math.random() * allCases.length)];
                const npcIds = Object.keys(chosenCase.npcs);
                const murdererId = npcIds[Math.floor(Math.random() * npcIds.length)];
                gameDataRef.current.activeCase = chosenCase;
                gameDataRef.current.murdererId = murdererId;
                gameDataRef.current.crucialEvidenceIds = chosenCase.murdererEvidenceMap[murdererId] || [];
                setGameMode('story');
                setGameState('intro');
            } else if (key === 'ritual') {
                if (!startSoundRef.current) {
                    startSoundRef.current = new Audio(`${baseSoundUrl}ring.mp3`);
                }
                startSoundRef.current.volume = sfxVolume;
                startSoundRef.current.play().catch(e => console.error("Error playing start sound:", e));
                setGameMode('ritual');
                setGameState('ritual_playing');
            } else if (key === 'story') {
                setGameState('story');
            } else if (key === 'options') {
                setActiveMenu('options');
                setStartMenuFocusIndex(0);
            } else if (key === 'language') {
                setLanguage(l => l === 'th' ? 'en' : 'th');
            }
        }
    }, [activeMenu, sfxVolume]);

    const handleBackFromOptions = useCallback(() => {
        setActiveMenu('main');
        setStartMenuFocusIndex(3);
    }, []);

    const handleStartGameplay = useCallback(() => {
        const gameData = gameDataRef.current;
        if (gameData.scene && !gameData.player && gameData.playerTexture) {
            spawnCharacters(gameData, gameData.playerTexture, new THREE.TextureLoader(), language);
        }
        setGameState('playing');
    }, [language]);

    const handleResize = useCallback(() => {
        const gameData = gameDataRef.current;
        const minimapDiv = minimapMountRef.current;
    
        if (gameData.camera && gameData.renderer) {
            gameData.camera.setSize(window.innerWidth, window.innerHeight);
        }
        
        if (minimapDiv && gameData.minimapRenderer) {
            gameData.minimapRenderer.setSize(minimapDiv.clientWidth * 2, minimapDiv.clientHeight * 2);
        }
    }, []);

    const handlePauseToggle = useCallback(() => {
        if (gameMode === 'ritual') {
            setSurvivalJournalOpen(prev => !prev);
        } else if (gameState === 'playing' || gameState === 'paused') {
            setGameState(s => s === 'paused' ? 'playing' : 'paused');
        }
    }, [gameState, gameMode]);

    const handleRestart = useCallback(() => {
        setConversationHistory([]);
        setGameOverReason('accusation');
        setCinematicText(null);
        setWeather('clear');
        setActiveMenu('main');
        setStartMenuFocusIndex(0);
        setMapView(false);
        setMapViewTarget(null);
        setGameState('initial');
        setSurvivalJournalOpen(false);
    }, []);

    const getHint = () => {
        const gameData = gameDataRef.current;
        if (gameData.clueHighlightCooldown > 0) return;
    
        // Visual highlight part
        gameData.clueHighlightActive = true;
        gameData.clueHighlightTimer = 5; // Highlight for 5 seconds
        gameData.clueHighlightCooldown = 30; // 30 second cooldown for hints
        playSfx('clue', sfxVolume * 0.5);
    
        const { clueObjects, foundClueIds, player } = gameData;
        if (!player) return;

        const uncollectedClues = clueObjects.filter((c: Clue) => !foundClueIds.has(c.id));

        if (uncollectedClues.length === 0) {
            setHintText(translations[language].noMoreClues);
            setTimeout(() => setHintText(null), 5000);
            return;
        }

        const hints = translations[language].genericHints;
        const randomHint = hints[Math.floor(Math.random() * hints.length)];
        setHintText(randomHint);
        
        setTimeout(() => setHintText(null), 8000); // Show hint for 8 seconds
    };

    useEffect(() => {
        if (gameDataRef.current.music?.exploration?.isPlaying) {
            gameDataRef.current.music.exploration.stop();
        }
        if (gameState === 'finish_screen') {
            if (gameMode === 'story') {
                const timer = setTimeout(() => {
                    handleRestart();
                }, 15000); 
                return () => clearTimeout(timer);
            }
        } else if (gameState === 'gameover') {
            // No automatic restart on game over for either mode
        }
    }, [gameState, gameMode, handleRestart]);

    useEffect(() => {
        if (gameState === 'paused' || isSurvivalJournalOpen) {
            return;
        }

        const isGameActive = ['playing', 'briefing', 'intro', 'winning_cinematic', 'losing_cinematic', 'ritual_playing', 'ritual_ending', 'gameover'].includes(gameState);

        if (!isGameActive) {
            cleanupGame();
            return;
        }

        if (!mountRef.current || gameDataRef.current.scene) {
            return;
        }

        const gameData = gameDataRef.current;
        if (gameData.activeCase) {
             console.log(`Playing Case: "${gameData.activeCase.title[language]}"`);
        }
        if (gameData.gameMode === 'ritual') {
            gameData.ritualData = {
                timer: 180, // 3 minutes
                ghostSpawnTimer: 60, // 1 minute
                altars: [],
                survivors: 7,
                controlledNpcIndex: 0,
                interactionTargetAltar: null,
                activeGhost: null,
                cameraMode: 'intro',
                endingData: null,
                cameraShake: { intensity: 0, duration: 0 },
                lightningTimer: 0,
                nextLightningStrike: 20 + Math.random() * 20,
                lightningTargetNpc: null,
                lightningFlashTimer: 0,
                pendingDeath: null,
                weatherChangeTimer: 40,
                introData: {
                    timer: 12,
                    progress: 0,
                    path: new THREE.CatmullRomCurve3([
                        new THREE.Vector3(80, 2, 80), 
                        new THREE.Vector3(-30, 1.5, 40), 
                        new THREE.Vector3(50, 2.5, -50), 
                        new THREE.Vector3(0, 2, 0)
                    ]),
                    lookAtTarget: new THREE.Vector3(),
                    textVisible: false,
                }
            };
        }

        gameData.scene = new THREE.Scene();
        const fogColor = new THREE.Color(0x0a1422);
        gameData.scene.fog = new THREE.FogExp2(fogColor, 0.0189);
        gameData.scene.background = new THREE.Color(0x0a1422);

        gameData.renderer = new THREE.WebGLRenderer({ antialias: true });
        gameData.renderer.setSize(window.innerWidth, window.innerHeight);
        gameData.renderer.shadowMap.enabled = true;
        gameData.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        mountRef.current.appendChild(gameData.renderer.domElement);

        gameData.camera = new PostProcessingCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000, gameData.scene, gameData.renderer);
        gameData.camera.camera.position.set(0, 10, 15);
        
        const lightningGeo = new THREE.PlaneGeometry(0.3, 20);
        const lightningMat = new THREE.MeshBasicMaterial({ color: 0xccddff, transparent: true, opacity: 0, depthWrite: false });
        const lightningMesh = new THREE.Mesh(lightningGeo, lightningMat);
        lightningMesh.visible = false;
        gameData.scene.add(lightningMesh);
        gameData.billboards.push(lightningMesh);
        gameData.lightningEffect = { mesh: lightningMesh, timer: 0 };
        
        if (!gameData.audioListener) {
            gameData.audioListener = new THREE.AudioListener();
        }
        gameData.camera.camera.add(gameData.audioListener);
        gameData.sfxAudio = new THREE.Audio(gameData.audioListener);
        gameData.windAudio = new THREE.Audio(gameData.audioListener);
        gameData.rainAudio = new THREE.Audio(gameData.audioListener);
        gameData.ghostAudio = new THREE.Audio(gameData.audioListener);
        gameData.raycaster = new THREE.Raycaster();
        
        const audioLoader = new THREE.AudioLoader();
        const loadSound = (id: string, url: string, targetNode?: THREE.Audio, loop = false, volume = 1.0) => {
            audioLoader.load(url, (buffer) => { 
                gameData.audioBuffers[id] = buffer;
                if (targetNode) {
                    targetNode.setBuffer(buffer);
                    targetNode.setLoop(loop);
                    const finalVolume = (id === 'wind' || id === 'rain' || id === 'ghost_loop' ? sfxVolume * volume : volume * sfxVolume);
                    targetNode.setVolume(finalVolume);
                    if (id === 'wind' && weather === 'clear' && gameState === 'playing') targetNode.play();
                }
            });
        };

        audioLoader.load(`${baseSoundUrl}bgm.mp3`, (buffer) => {
            if (!gameData.audioListener) return;
            const audio = new THREE.Audio(gameData.audioListener);
            audio.setBuffer(buffer);
            audio.setLoop(true);
            audio.setVolume(bgmVolume);
            if (['playing', 'ritual_playing', 'intro'].includes(gameDataRef.current.gameState)) {
                audio.play();
            }
            gameData.music = { ...gameData.music, exploration: audio };
        });

        audioLoader.load(`${baseSoundUrl}demons.mp3`, (buffer) => {
            if (!gameData.audioListener) return;
            const audio = new THREE.Audio(gameData.audioListener);
            audio.setBuffer(buffer);
            audio.setLoop(true);
            audio.setVolume(bgmVolume * 0.8);
            gameData.music = { ...gameData.music, demon: audio };
        });
        
        loadSound('die', `${baseSoundUrl}die.mp3`);
        loadSound('scream_death', `${baseSoundUrl}die.mp3`);
        loadSound('footsteps_grass', `${baseSoundUrl}footsteps.mp3`, undefined, true);
        loadSound('footsteps_splash', `${baseSoundUrl}footsteps.mp3`, undefined, true);
        loadSound('wind', `${baseSoundUrl}wind_clam.mp3`, gameData.windAudio, true, 0.4);
        loadSound('rain', `${baseSoundUrl}rain.ogg`, gameData.rainAudio, true, 0.8);
        loadSound('ghost_loop', `${baseSoundUrl}ghost.mp3`, gameData.ghostAudio, true, 0.7);
        loadSound('thunder', `${baseSoundUrl}thunder.ogg`);
        loadSound('clue', `${baseSoundUrl}clue.mp3`);
        loadSound('collect', `${baseSoundUrl}select.mp3`);
        loadSound('accuse', `${baseSoundUrl}accuse.mp3`);
        loadSound('crow', `${baseSoundUrl}raven.mp3`);
        loadSound('whisper', `${baseSoundUrl}whisper.mp3`);
        loadSound('tiger_attack', `${baseSoundUrl}tiger.mp3`);
        
        const textureLoader = new THREE.TextureLoader();
        gameData.crowTexture = textureLoader.load(`${baseUrl}crow.png`);
        gameData.ghostTexture = textureLoader.load(`${baseUrl}monk.png`);
        gameData.altarTexture = textureLoader.load(`${baseUrl}status.png`);
        gameData.deadBodyTexture = textureLoader.load(`${baseUrl}deadbody.png`);
        gameData.tigerTexture = textureLoader.load(`${baseUrl}tiger.png`);
        
        createWorld(gameData, textureLoader);
        
        textureLoader.load(`${baseUrl}player.png`, (playerTexture) => {
            gameData.playerTexture = playerTexture;
            // Spawn characters after player texture is loaded
            if (gameState !== 'briefing') { // Briefing handles its own start
                 spawnCharacters(gameData, playerTexture, textureLoader, language);
            }
        });

        const handleKeyDown = (e: KeyboardEvent) => { gameData.keys[e.key.toLowerCase()] = true; };
        const handleKeyUp = (e: KeyboardEvent) => { 
            const key = e.key.toLowerCase();
            gameData.keys[key] = false;
            if (key === 'e' && !isPresentingEvidence) handleInteraction();
            if (key === 'p') {
                handleFollowToggle();
            }
            if (key === 'enter' && currentDialogue && !isPresentingEvidence) {
                if (!currentDialogue.node.options) {
                    handleDialogueEnd();
                } else if (focusedOptionIndex !== null) {
                    handleDialogueOption(currentDialogue.node.options[focusedOptionIndex]);
                }
            }
            if (key === 'tab') {
                 if (gameMode === 'ritual') {
                    setSurvivalJournalOpen(prev => !prev);
                } else {
                    setInventoryOpen(prev => !prev);
                }
            }
            if (key === 'escape') {
                 if (isInventoryOpen) {
                    setInventoryOpen(false);
                    if (gameData.gameState === 'paused') setGameState(gameMode === 'ritual' ? 'ritual_playing' : 'playing');
                } else if (isSurvivalJournalOpen) {
                    setSurvivalJournalOpen(false);
                } else if (isPresentingEvidence) {
                    setPresentingEvidence(false);
                } else if (gameData.gameState === 'intro') {
                    setGameState('briefing');
                } else if (gameData.ritualData?.introData) {
                    handleSkipRitualIntro();
                } else if (activeMenu === 'options') {
                    handleBackFromOptions();
                } else if (['playing', 'paused', 'ritual_playing'].includes(gameData.gameState)) {
                    handlePauseToggle();
                }
            }
            if (key === 'h') {
                getHint();
            }
            if (key === 't' && (gameData.gameState === 'ritual_playing' || gameData.gameState === 'paused' || gameData.gameState === 'playing')) {
                const weathers: ('clear' | 'rain' | 'foggy')[] = ['clear', 'rain', 'foggy'];
                const currentIndex = weathers.indexOf(gameData.weather);
                const newWeather = weathers[(currentIndex + 1) % weathers.length];
                setWeather(newWeather);
                // Reset automatic weather timers to prevent immediate change back
                gameData.weatherChangeTimer = 60 + Math.random() * 60;
                gameData.nextRainEventTime = 120 + Math.random() * 120;
                gameData.rainEventActive = false;
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('keyup', handleKeyUp);
        gameData['keydownHandler' as any] = handleKeyDown;
        gameData['keyupHandler' as any] = handleKeyUp;

        window.addEventListener('resize', handleResize);
        gameData['resizeHandler' as any] = handleResize;

        const callbacks = { setUiElements, playSfx, setInventoryOpen, setGameState, handleInteraction, setFocusedOptionIndex, handleDialogueOption, setObjective, setStartMenuFocusIndex, handleMenuSelect, handleBackFromOptions, setWeather, setFoundClue, setGameOverReason, setCinematicText, setInteractionPrompt, handleNpcDeath, setDeathMarkerUiElements };
        const animate = createAnimationLoop(gameDataRef, callbacks);
        animate();

        return () => {
            window.removeEventListener('resize', handleResize);
        };
    }, [gameState, cleanupGame, handleDialogueOption, handleInteraction, playSfx, currentDialogue, focusedOptionIndex, handleDialogueEnd, activeMenu, sfxVolume, bgmVolume, handleNpcDeath, handleMenuSelect, handleBackFromOptions, language, handleResize, handlePauseToggle, handleStartGameplay, isInventoryOpen, isPresentingEvidence, isSurvivalJournalOpen, handleFollowToggle]);
    
    const controlledNpc = gameDataRef.current.ritualData ? gameDataRef.current.npcs[gameDataRef.current.ritualData.controlledNpcIndex] : null;
    const playerPositionForUI = gameDataRef.current.player?.mesh.position ?? controlledNpc?.mesh.position;

    return (
        <div ref={mountRef} style={{ width: '100vw', height: '100vh' }}>
            <UIManager
                gameState={gameState}
                gameMode={gameMode}
                activeMenu={activeMenu}
                onMenuSelect={handleMenuSelect}
                onBackFromOptions={handleBackFromOptions}
                onRestart={handleRestart}
                onContinue={() => setGameState(gameMode === 'ritual' ? 'ritual_playing' : 'playing')}
                onToggleInventory={() => setInventoryOpen(prev => !prev)}
                onPauseToggle={handlePauseToggle}
                murdererName={gameDataRef.current.murderer?.name || "Unknown"}
                accusationsLeft={gameDataRef.current.accusationsLeft}
                uiElements={uiElements}
                deathMarkerUiElements={deathMarkerUiElements}
                interactionTarget={gameDataRef.current.interactionTarget}
                interactingNpc={interactingNpc}
                interactionPrompt={interactionPrompt}
                onPrimaryAction={handleInteraction}
                onSecondaryAction={handleFollowToggle}
                currentDialogue={currentDialogue}
                focusedOptionIndex={focusedOptionIndex}
                onDialogueOption={handleDialogueOption}
                onDialogueEnd={handleDialogueEnd}
                isInventoryOpen={isInventoryOpen}
                isSurvivalJournalOpen={isSurvivalJournalOpen}
                onInventoryClose={() => {
                    setInventoryOpen(false);
                    if (gameDataRef.current.gameState === 'paused') setGameState(gameMode === 'ritual' ? 'ritual_playing' : 'playing');
                }}
                onSurvivalJournalClose={() => setSurvivalJournalOpen(false)}
                inventoryEvidence={gameDataRef.current.collectedEvidence}
                inventoryNpcs={gameDataRef.current.npcs}
                conversationHistory={gameDataRef.current.collectedEvidence.length > 0 ? conversationHistory : []}
                foundClue={foundClue}
                objective={objective}
                minimapRef={minimapMountRef}
                startMenuFocusIndex={startMenuFocusIndex}
                onMinimapClick={handleMinimapClick}
                playerPosition={playerPositionForUI}
                bgmVolume={bgmVolume}
                onBgmVolumeChange={setBgmVolume}
                sfxVolume={sfxVolume}
                onSfxVolumeChange={setSfxVolume}
                clueHighlightCooldown={gameDataRef.current.clueHighlightCooldown}
                activeCase={gameDataRef.current.activeCase}
                language={language}
                onLanguageChange={setLanguage}
                onStartGameplay={handleStartGameplay}
                onSkipIntro={() => setGameState('briefing')}
                onSkipRitualIntro={handleSkipRitualIntro}
                onInitialInteraction={handleInitialInteraction}
                onStoryEnd={handleStoryEnd}
                gameOverReason={gameOverReason}
                cinematicText={cinematicText}
                isPresentingEvidence={isPresentingEvidence}
                onPresentEvidence={handlePresentEvidence}
                onBackFromPresenting={() => setPresentingEvidence(false)}
                ritualData={gameDataRef.current.ritualData}
                controlledNpcIndex={gameDataRef.current.ritualData?.controlledNpcIndex}
                hintText={hintText}
                onJoystickMove={setJoystickVector}
            />
        </div>
    );
};

const container = document.getElementById('root');
const root = createRoot(container!);
root.render(<Game />);