import React, { useState, useEffect, useRef } from 'react';
import * as THREE from 'three';
import { NPC } from './npc';
import { DialogueNode, Evidence, CaseData } from './case';
import { Journal } from './inventory';
import { translations, Language } from './translations';
import { baseUrl } from './global';
import { Altar } from './ritual';
import { VirtualJoystick } from './joystick';

interface UIProps {
    gameState: 'loading' | 'intro' | 'start' | 'briefing' | 'playing' | 'paused' | 'gameover' | 'initial' | 'winning_cinematic' | 'finish_screen' | 'story' | 'losing_cinematic' | 'ritual_playing' | 'ritual_ending';
    gameMode: 'story' | 'ritual';
    activeMenu: 'main' | 'options';
    onMenuSelect: (key: string) => void;
    onBackFromOptions: () => void;
    onRestart: () => void;
    onContinue: () => void;
    onToggleInventory: () => void;
    onPauseToggle: () => void;
    murdererName: string;
    accusationsLeft: number;
    uiElements: { id: string, x: number, y: number, hp: number, maxHp: number, visible: boolean, name?: string, isNpc: boolean }[];
    deathMarkerUiElements: { id: string, x: number, y: number, name: string }[];
    interactionTarget: NPC | null;
    interactingNpc: NPC | null;
    interactionPrompt: string | null;
    onPrimaryAction: () => void;
    onSecondaryAction: () => void;
    currentDialogue: { npc: NPC, node: DialogueNode } | null;
    focusedOptionIndex: number | null;
    onDialogueOption: (option: any) => void;
    onDialogueEnd: () => void;
    isInventoryOpen: boolean;
    isSurvivalJournalOpen: boolean;
    onInventoryClose: () => void;
    onSurvivalJournalClose: () => void;
    inventoryEvidence: Evidence[];
    inventoryNpcs: NPC[];
    conversationHistory: { speaker: string, text: string }[];
    foundClue: string | null;
    objective: { x: number, y: number, rotation: number, distance: number } | null;
    minimapRef: React.RefObject<HTMLDivElement>;
    startMenuFocusIndex: number;
    onMinimapClick: (worldCoords: THREE.Vector3) => void;
    playerPosition: THREE.Vector3 | undefined;
    bgmVolume: number;
    onBgmVolumeChange: (volume: number) => void;
    sfxVolume: number;
    onSfxVolumeChange: (volume: number) => void;
    clueHighlightCooldown: number;
    activeCase: CaseData | null;
    language: Language;
    onLanguageChange: (lang: Language) => void;
    onStartGameplay: () => void;
    onSkipIntro: () => void;
    onSkipRitualIntro: () => void;
    onInitialInteraction: () => void;
    onStoryEnd: () => void;
    gameOverReason: 'accusation' | 'timeout';
    cinematicText: string | null;
    isPresentingEvidence: boolean;
    onPresentEvidence: (evidenceId: string) => void;
    onBackFromPresenting: () => void;
    ritualData: { 
        timer: number;
        survivors: number;
        introData: { textVisible: boolean } | null;
        endingData: {} | null;
    } | null;
    controlledNpcIndex?: number;
    hintText: string | null;
    onJoystickMove: (vector: { x: number; y: number; }) => void;
}

const SurvivorHUD: React.FC<{ npcs: NPC[], controlledIndex: number | undefined }> = ({ npcs, controlledIndex }) => {
    if (npcs.length === 0) return null;
    return (
        <div className="survivor-hud-container">
            {npcs.map((npc, index) => {
                const isControlled = index === controlledIndex;
                const isDeceased = npc.status === 'deceased';
                const podClass = `survivor-avatar-pod ${isControlled ? 'controlled' : ''} ${isDeceased ? 'deceased' : ''}`;

                return (
                    <div key={npc.id} className={podClass}>
                        <img src={npc.profileAvatar} alt={npc.name} />
                        <span>{index + 1}</span>
                    </div>
                );
            })}
        </div>
    );
};

const StoryScreen: React.FC<{ onStoryEnd: () => void; language: Language }> = ({ onStoryEnd, language }) => {
    const t = translations[language];
    const storySlides = [
        { img: `${baseUrl}intro/01.png`, textKey: 'story1' },
        { img: `${baseUrl}intro/02.png`, textKey: 'story2' },
        { img: `${baseUrl}intro/03.png`, textKey: 'story3' },
        { img: `${baseUrl}intro/04.png`, textKey: 'story4' },
    ];
    const [currentSlide, setCurrentSlide] = useState(0);

    const handleNextSlide = () => {
        setCurrentSlide(s => (s + 1) % storySlides.length);
    };

    return (
        <div className="story-screen" onClick={handleNextSlide}>
            {storySlides.map((slide, index) => (
                <div
                    key={index}
                    className={`story-slide ${index === currentSlide ? 'active' : ''}`}
                    style={{ backgroundImage: `url(${slide.img})` }}
                />
            ))}
            <div className="story-text-container">
                <p className="story-text">{t[storySlides[currentSlide].textKey as keyof typeof t]}</p>
            </div>
            <button className="story-skip-button" onClick={(e) => { e.stopPropagation(); onStoryEnd(); }}>
                {t.backButton.toLocaleUpperCase()}
            </button>
        </div>
    );
};


export const UIManager: React.FC<UIProps> = (props) => {
    const {
        gameState, gameMode, activeMenu, onMenuSelect, onBackFromOptions, onRestart, onContinue, onToggleInventory, onPauseToggle, murdererName, accusationsLeft,
        uiElements, deathMarkerUiElements, interactionTarget, interactingNpc, interactionPrompt, onPrimaryAction, onSecondaryAction, currentDialogue,
        focusedOptionIndex, onDialogueOption, onDialogueEnd, isInventoryOpen, isSurvivalJournalOpen, onInventoryClose, onSurvivalJournalClose,
        inventoryEvidence, inventoryNpcs, conversationHistory, foundClue,
        objective, minimapRef, startMenuFocusIndex, onMinimapClick, playerPosition,
        bgmVolume, onBgmVolumeChange, sfxVolume, onSfxVolumeChange, clueHighlightCooldown,
        activeCase, language, onStartGameplay, onSkipIntro, onInitialInteraction, onStoryEnd, onSkipRitualIntro,
        gameOverReason, cinematicText, isPresentingEvidence, onPresentEvidence, onBackFromPresenting,
        ritualData, controlledNpcIndex, hintText, onJoystickMove
    } = props;

    const [isDialogueVisible, setDialogueVisible] = useState(false);
    const [introTextVisible, setIntroTextVisible] = useState(false);
    const [introText, setIntroText] = useState({ title: "", line1: "" });
    const dialogueTimerRef = useRef<number | null>(null);
    const t = translations[language];
    const [finishImage, setFinishImage] = useState(1);
    const [showSurvivedText, setShowSurvivedText] = useState(false);
    const [parallaxOffset, setParallaxOffset] = useState({ x: 0, y: 0 });

    useEffect(() => {
        const handleMouseMove = (event: MouseEvent) => {
            if (gameState !== 'start' || activeMenu !== 'main') return;
    
            const { clientX, clientY } = event;
            const { innerWidth, innerHeight } = window;
    
            const intensity = 30;
            const xOffset = (clientX / innerWidth - 0.5) * -intensity;
            const yOffset = (clientY / innerHeight - 0.5) * -intensity;
    
            setParallaxOffset({ x: xOffset, y: yOffset });
        };
    
        window.addEventListener('mousemove', handleMouseMove);
    
        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            setParallaxOffset({ x: 0, y: 0 }); // Reset offset on cleanup
        };
    }, [gameState, activeMenu]);

    useEffect(() => {
        if (gameState === 'ritual_ending' && (ritualData?.survivors ?? 0) > 0) {
            const timer = setTimeout(() => setShowSurvivedText(true), 4000);
            return () => clearTimeout(timer);
        } else {
            setShowSurvivedText(false);
        }
    }, [gameState, ritualData?.survivors]);
    
    useEffect(() => {
        if (gameState === 'finish_screen') {
            const timer = setTimeout(() => {
                setFinishImage(2);
            }, 4000); // Change image after 4 seconds
            return () => clearTimeout(timer);
        } else {
            // Reset for next game session
            const resetTimer = setTimeout(() => setFinishImage(1), 1500); // Reset after fade out
            return () => clearTimeout(resetTimer);
        }
    }, [gameState]);
    
    useEffect(() => {
        if (gameState === 'intro') {
            setTimeout(() => {
                setIntroText({ title: t.introTitle, line1: t.introText1 });
                setIntroTextVisible(true);
            }, 3000); // Fade in after 3s
    
            setTimeout(() => {
                setIntroTextVisible(false);
            }, 12000); // Fade out before intro ends (15s total)
        } else {
            setIntroTextVisible(false);
        }
    }, [gameState, t]);

    useEffect(() => {
        if (dialogueTimerRef.current) {
            clearTimeout(dialogueTimerRef.current);
            dialogueTimerRef.current = null;
        }

        if (currentDialogue) {
            setDialogueVisible(true);
            if (!currentDialogue.node.options && !isPresentingEvidence) {
                dialogueTimerRef.current = window.setTimeout(() => {
                    onDialogueEnd();
                }, 7000);
            }
        } else {
            setDialogueVisible(false);
        }

        return () => {
            if (dialogueTimerRef.current) {
                clearTimeout(dialogueTimerRef.current);
            }
        };
    }, [currentDialogue, onDialogueEnd, isPresentingEvidence]);

    const handleMapClick = (e: React.MouseEvent<HTMLDivElement>) => {
        if (!['playing', 'ritual_playing'].includes(gameState) || !playerPosition) return;
        const rect = e.currentTarget.getBoundingClientRect();
        const relativeX = (e.clientX - rect.left) / rect.width;
        const relativeY = (e.clientY - rect.top) / rect.height;
        const MAP_VIEW_SIZE = 100;
        const worldX = playerPosition.x + (relativeX - 0.5) * MAP_VIEW_SIZE;
        const worldZ = playerPosition.z + (relativeY - 0.5) * MAP_VIEW_SIZE;
        onMinimapClick(new THREE.Vector3(worldX, 0, worldZ));
    };

    const handlePromptClick = () => {
        if (!interactionPrompt) return;
        if (interactionPrompt.includes('[E]')) {
            onPrimaryAction();
        } else if (interactionPrompt.includes('[P]')) {
            onSecondaryAction();
        }
    };

    const renderStartMenu = () => (
        <div className="title-menu">
            <h1 className="thename">In to the Woods</h1>
            <div className="start-menu-buttons">
                <div onClick={() => onMenuSelect('start')} className={`menu-item ${startMenuFocusIndex === 0 ? 'focused' : ''}`}>
                    {t.startGame}
                </div>
                <div onClick={() => onMenuSelect('ritual')} className={`menu-item ${startMenuFocusIndex === 1 ? 'focused' : ''}`}>
                    {t.ritualMode}
                </div>
                <div onClick={() => onMenuSelect('story')} className={`menu-item ${startMenuFocusIndex === 2 ? 'focused' : ''}`}>
                    {t.storyMenuButton}
                </div>
            </div>
             <div className="top-right-menu">
                <div onClick={() => onMenuSelect('options')} className={`menu-item ${startMenuFocusIndex === 3 ? 'focused' : ''}`}>
                    {t.options}
                </div>
                <div onClick={() => onMenuSelect('language')} className={`menu-item ${startMenuFocusIndex === 4 ? 'focused' : ''}`}>
                    {language === 'th' ? t.english : t.thai}
                </div>
            </div>
        </div>
    );

    const renderOptionsMenu = () => (
        <div className="options-menu">
            <div>
                <h1>{t.options}</h1>
                <div className="options-panel">
                    <div className="options-credits">WASD, Arrows Keys and Virtual Joystick for Movement, Mouse Click or (E) (H) and (P) for Inspect/ Hint and Communication, Hold (Shift) Button to Run </div>
                    <div className="option-item">
                        <label className={startMenuFocusIndex === 0 ? 'focused' : ''}>BGM</label>
                        <input type="range" min="0" max="1" step="0.1" value={bgmVolume} onChange={(e) => onBgmVolumeChange(parseFloat(e.target.value))} />
                    </div>
                    <div className="option-item">
                        <label className={startMenuFocusIndex === 1 ? 'focused' : ''}>SFX</label>
                        <input type="range" min="0" max="1" step="0.1" value={sfxVolume} onChange={(e) => onSfxVolumeChange(parseFloat(e.target.value))} />
                    </div>
                </div>
            </div>

            <div className="options-footer">
                <div className="options-credits">Adhoc Alliance, Daydev and Bastard Studio</div>
                <div onClick={onBackFromOptions} className={`back-button ${startMenuFocusIndex === 2 ? 'focused' : ''}`}>
                    BACK
                </div>
            </div>
        </div>
    );

    const renderBriefingScreen = () => (
        <div className="overlay-screen briefing-overlay">
            {activeCase && (
                <div className="briefing-panel">
                    <h1>{t.caseBriefing}: {activeCase.title[language]}</h1>
                    <p>{activeCase.description[language]}</p>
                    <button onClick={onStartGameplay}>{t.startInvestigation}</button>
                </div>
            )}
        </div>
    );

    const renderRitualEndScreen = () => {
        if (!ritualData || !ritualData.endingData) return null;
        
        let message;
        const survivorCount = ritualData.survivors;

        if (survivorCount === 0) {
            message = t.ritualEndNone;
        } else if (survivorCount === 1) {
            message = t.ritualEndOne;
        } else {
            message = t.ritualEndMultiple.replace('{count}', survivorCount.toString());
        }

        return (
            <div className="overlay-screen ritual-end-screen">
                {!showSurvivedText && <h1 className="ritual-end-text">{message}</h1>}
                {showSurvivedText && <h1 className="ritual-end-text survived-text">{t.ritualSurvived}</h1>}
                <button onClick={onRestart}>{t.backToTitle}</button>
            </div>
        );
    }
    
    const renderSurvivalJournal = () => (
        <div className="survival-journal-overlay" onClick={onSurvivalJournalClose}>
            <div className="survival-journal-panel" onClick={(e) => e.stopPropagation()}>
                <p className="survival-journal-text">{t.ritualIntroText}</p>
            </div>
        </div>
    );

    if (gameState === 'story') {
        return <StoryScreen onStoryEnd={onStoryEnd} language={language} />;
    }

    const isJoystickVisible = (gameState === 'playing' || gameState === 'ritual_playing') && !isInventoryOpen && !isSurvivalJournalOpen;

    return (
        <>
            {gameState === 'intro' && (
                 <>
                    <div className={`intro-overlay ${introTextVisible ? 'visible' : ''}`}>
                        <h1>{introText.title}</h1>
                        <p>{introText.line1}</p>
                    </div>
                    <button className="skip-button" onClick={onSkipIntro}>{t.skip}</button>
                 </>
            )}
            {gameMode === 'ritual' && ritualData?.introData && (
                 <>
                    <button className="skip-button" onClick={onSkipRitualIntro}>{t.skip}</button>
                 </>
            )}
            {(gameState === 'initial' || gameState === 'start') && (
                 <>
                    <div className="start-screen-wrapper">
                        <div
                            className={`start-screen-background ${activeMenu === 'options' ? 'options-bg' : ''}`}
                            style={(gameState === 'start' && activeMenu === 'main') ? { transform: `translate(${parallaxOffset.x}px, ${parallaxOffset.y}px)` } : {}}
                        ></div>
                        <div className={`start-screen-ui ${activeMenu === 'options' ? 'options-ui' : ''}`}>
                            {gameState === 'start' && (
                                <>
                                    {activeMenu === 'main' && renderStartMenu()}
                                    {activeMenu === 'options' && renderOptionsMenu()}
                                    {activeMenu === 'main' && <div className="footer-credits">Adhoc Alliance, Daydev and Bastard Studio</div>}
                                </>
                            )}
                        </div>
                    </div>
                    <div
                        className={`logo-screen ${gameState === 'start' ? 'fade-out' : ''}`}
                        onClick={gameState === 'initial' ? onInitialInteraction : undefined}
                    >
                        <img src={`${baseUrl}horrorjam.png`} alt="Horror Jam Logo" className="logo-image" />
                        <div className="logo-prompt">
                            {t.clickToBegin}
                        </div>
                    </div>
                </>
            )}
            {gameState === 'briefing' && renderBriefingScreen()}
            {gameState === 'gameover' && (
                <div className="overlay-screen gameover-bg">
                    <div className="gameover-panel">
                        <h1>{t.gameOver}</h1>
                        <p>
                            {gameMode === 'story'
                                ? (gameOverReason === 'timeout' 
                                    ? t.gameOverTimeoutDescription
                                    : `${t.gameOverDescription} ${murdererName}`
                                )
                                : t.ritualEndNone
                            }
                        </p>
                        <button onClick={onRestart}>{gameMode === 'story' ? t.restart : t.backToTitle}</button>
                    </div>
                </div>
            )}
            {gameState === 'ritual_ending' && renderRitualEndScreen()}
            {gameState === 'finish_screen' && (
                <div className="overlay-screen finish-screen">
                    <div className="finish-image-container">
                        <div 
                            className={`finish-image image-1 ${finishImage === 1 ? 'visible' : ''}`} 
                        />
                        <div 
                            className={`finish-image image-2 ${finishImage === 2 ? 'visible' : ''}`}
                        />
                    </div>
                    <p className="finish-text">{t.finishScreenText}</p>
                </div>
            )}
            {gameState === 'paused' && (
                <div className="pause-screen">
                    <div className="pause-image-panel" />
                    <div className="pause-menu-panel">
                        <div className="pause-buttons">
                            <button onClick={onContinue}>{t.continue}</button>
                            {gameMode === 'story' && (
                                <button onClick={onToggleInventory}>
                                    {t.openJournal}
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}
            {(['playing', 'paused', 'ritual_playing'].includes(gameState)) && (
                <>
                    <div className="ui-container">
                        {gameMode === 'ritual' && ritualData && (
                            <div className="top-center-hud">
                                <div className={`ritual-timer prominent ${ritualData.timer < 30 ? 'low-time' : ''}`}>
                                    {Math.floor(ritualData.timer / 60)}:{String(Math.floor(ritualData.timer % 60)).padStart(2, '0')}
                                </div>
                            </div>
                        )}
                        <div ref={minimapRef} className="minimap-container" onClick={handleMapClick}></div>
                        <div className="game-hud-top-left">
                            {gameMode === 'story' && (
                                <>
                                <div className="accusations-counter">
                                    {t.accusationsLeft}: {accusationsLeft}
                                </div>
                                {clueHighlightCooldown > 0 && (
                                    <div className="ability-cooldown">
                                        {t.hintCooldown}: {Math.ceil(clueHighlightCooldown)}s
                                    </div>
                                )}
                                </>
                            )}
                             {gameMode === 'ritual' && ritualData && (
                                <div className="survivor-count">
                                    {t.ritualSurvivors}: {ritualData.survivors} / 7
                                </div>
                            )}
                        </div>
                        {objective && (
                            <div className="objective-marker" style={{ left: `${objective.x}px`, top: `${objective.y}px`, transform: `translate(-50%, -50%) rotate(${objective.rotation}deg)` }}>
                                <div className="objective-arrow"></div>
                                <span className="objective-distance">{objective.distance}m</span>
                            </div>
                        )}
                        {uiElements.map((el, index) => (
                            el.visible && (
                                <React.Fragment key={el.id}>
                                    {el.isNpc && el.name && ( 
                                        <div className={`character-name-tag ${gameMode === 'ritual' && controlledNpcIndex === index ? 'controlled' : ''}`} style={{ top: el.y - 50, left: el.x }}>
                                            {el.name}
                                        </div> 
                                    )}
                                    <div className="hp-bar-container" style={{ top: el.y - 30, left: el.x }}>
                                        <div className="hp-bar-fill" style={{ width: `${(el.hp / el.maxHp) * 100}%` }}></div>
                                    </div>
                                </React.Fragment>
                            )
                        ))}
                        {deathMarkerUiElements.map(marker => (
                            <div key={marker.id} className="death-marker" style={{ left: marker.x, top: marker.y }}>
                                <span className="death-marker-name">{marker.name}</span>
                            </div>
                        ))}
                        {interactionPrompt && uiElements.find(el => el.id === (gameMode === 'story' ? 'player' : inventoryNpcs[controlledNpcIndex!]?.id)) && (
                            <div className="interaction-prompt" onClick={handlePromptClick}>
                                {interactionPrompt}
                            </div>
                        )}
                        {currentDialogue && (
                            <div className={`dialogue-box ${!isDialogueVisible ? 'hidden' : ''}`}>
                                <img src={currentDialogue.npc.profileAvatar} alt={currentDialogue.npc.name} className="dialogue-avatar" />
                                <div className="dialogue-content">
                                    <h3>{currentDialogue.npc.name}</h3>
                                    <p>{currentDialogue.node.text[language]}</p>
                                    <div className="dialogue-box-footer">
                                        {isPresentingEvidence ? (
                                            <div className="evidence-presentation-container">
                                                <div className="evidence-presentation-grid">
                                                    {inventoryEvidence.length > 0 ? inventoryEvidence.map(item => (
                                                        <div key={item.id} className="evidence-presentation-item" onClick={() => onPresentEvidence(item.id)}>
                                                            <img src={item.image} alt={item.name[language]} />
                                                            <span>{item.name[language]}</span>
                                                        </div>
                                                    )) : <p>{t.noEvidence}</p>}
                                                </div>
                                                <button className="evidence-presentation-back" onClick={onBackFromPresenting}>{t.backButton}</button>
                                            </div>
                                        ) : currentDialogue.node.options ? (
                                            <div className="dialogue-options">
                                                {currentDialogue.node.options.map((opt, i) => (
                                                    <button key={i} onClick={() => onDialogueOption(opt)} className={focusedOptionIndex === i ? 'focused' : ''}>
                                                        {opt.text[language]}
                                                    </button>
                                                ))}
                                            </div>
                                        ) : ( <small>{t.dialogueClose}</small> )}
                                    </div>
                                </div>
                            </div>
                        )}
                        {gameMode === 'ritual' && ritualData && (
                            <SurvivorHUD npcs={inventoryNpcs} controlledIndex={controlledNpcIndex} />
                        )}
                        {(gameState === 'playing' || gameState === 'ritual_playing') && !ritualData?.introData && (
                            <div className="pause-toggle-button" onClick={onPauseToggle} aria-label={t.pause}>
                                <img src={`${baseUrl}book.png`} alt={t.openJournal} />
                            </div>
                        )}
                    </div>
                    {isInventoryOpen && activeCase && gameMode === 'story' && (
                        <Journal
                            isOpen={isInventoryOpen}
                            onClose={onInventoryClose}
                            evidence={inventoryEvidence}
                            npcs={inventoryNpcs}
                            conversationHistory={conversationHistory}
                            suspects={activeCase.suspects}
                            language={language}
                            activeCase={activeCase}
                        />
                    )}
                    {isSurvivalJournalOpen && gameMode === 'ritual' && renderSurvivalJournal()}
                    {foundClue && ( <div className="clue-popup"><p style={{ whiteSpace: 'pre-wrap' }}>{foundClue}</p></div> )}
                    {hintText && ( <div className="clue-popup" style={{backgroundColor: "rgba(60, 20, 40, 0.9)", borderColor: "#ff66cc"}}><p style={{ whiteSpace: 'pre-wrap' }}>{hintText}</p></div> )}
                </>
            )}
            {cinematicText && gameState === 'winning_cinematic' && (
                <div className="cinematic-footer-text">
                    {cinematicText}
                </div>
            )}
            <VirtualJoystick onMove={onJoystickMove} visible={isJoystickVisible} />
        </>
    );
};