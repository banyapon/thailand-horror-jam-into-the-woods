import React, { useState, useEffect } from 'react';
import { NPC } from './npc';
import { Evidence, CaseData } from './case';
import { Language, translations } from './translations';

interface JournalProps {
  isOpen: boolean;
  onClose: () => void;
  evidence: Evidence[];
  npcs: NPC[];
  conversationHistory: { speaker: string, text: string }[];
  suspects: CaseData['suspects'];
  language: Language;
  activeCase: CaseData | null;
}

export const Journal: React.FC<JournalProps> = ({ isOpen, onClose, evidence, npcs, conversationHistory, suspects, language, activeCase }) => {
  const [activeTab, setActiveTab] = useState<'case' | 'suspects' | 'evidence' | 'history'>('case');
  const [selectedNpc, setSelectedNpc] = useState<NPC | null>(null);
  const t = translations[language];

  useEffect(() => {
    if (isOpen && npcs.length > 0 && (!selectedNpc || !npcs.some(n => n.id === selectedNpc.id))) {
      setSelectedNpc(npcs[0]);
    }
  }, [isOpen, npcs, selectedNpc]);
  
  if (!isOpen) return null;

  const renderContent = () => {
    switch (activeTab) {
      case 'case':
        return activeCase ? (
            <div className="journal-section case-details-view">
                <h1>{activeCase.title[language]}</h1>
                <p>{activeCase.description[language]}</p>
            </div>
        ) : null;
      case 'suspects':
        const suspectDetails = selectedNpc ? suspects[selectedNpc.id] : null;
        const hasSpoken = selectedNpc ? conversationHistory.some(entry => entry.speaker === selectedNpc.name) : false;
        return (
          <div className="suspects-view">
            <div className="suspect-list">
              {npcs.map(npc => (
                <div
                  key={npc.id}
                  className={`suspect-list-item ${selectedNpc?.id === npc.id ? 'active' : ''} ${npc.status === 'deceased' ? 'deceased' : ''}`}
                  onClick={() => setSelectedNpc(npc)}
                >
                  {npc.name}
                  <div className="suspect-list-role">{npc.role[language]}</div>
                </div>
              ))}
            </div>
            {selectedNpc && (
              <div className="suspect-details">
                <img src={selectedNpc.profileAvatar} alt={selectedNpc.name} className="suspect-avatar" />
                <h2>{selectedNpc.name}</h2>
                <p><strong>{selectedNpc.role[language]}</strong></p>
                <p><strong>{t.journalStatus}:</strong> <span className={selectedNpc.status}>{selectedNpc.status}</span></p>
                {suspectDetails && hasSpoken ? (
                  <>
                    <h4>{t.journalMotive}</h4>
                    <p>{suspectDetails.motive[language]}</p>
                    <h4>{t.journalAlibi}</h4>
                    <p>{suspectDetails.alibi[language]}</p>
                  </>
                ) : (
                  <p>{t.noInfo}</p>
                )}
              </div>
            )}
          </div>
        );
      case 'evidence':
        return (
            <div className="evidence-container journal-section">
                <div className="evidence-list">
                     {evidence.length === 0 ? <p>{t.noEvidence}</p> : evidence.map(item => (
                        <div key={item.id} className="evidence-item">
                            <img src={item.image} alt={item.name[language]} />
                            <h4>{item.name[language]}</h4>
                            <p>{item.description[language]}</p>
                        </div>
                    ))}
                </div>
            </div>
        );
      case 'history':
        return (
            <div className="history-container journal-section">
                {conversationHistory.length === 0 ? <p>{t.noHistory}</p> : 
                 conversationHistory.map((entry, index) => (
                    <div key={index} className="history-entry">
                        <strong>{entry.speaker}:</strong> 
                        <span>{entry.text}</span>
                    </div>
                ))}
            </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="journal-overlay" onClick={onClose}>
      <div className="journal-panel" onClick={(e) => e.stopPropagation()}>
        <div className="journal-header">
          <div>
            <h1>{t.journalTitle}</h1>
            {activeCase && <h2 className="journal-case-title">{activeCase.title[language]}</h2>}
          </div>
          <button onClick={onClose} className="close-button">X</button>
        </div>
        <div className="journal-tabs">
          <button className={`journal-tab ${activeTab === 'case' ? 'active' : ''}`} onClick={() => setActiveTab('case')}>{t.journalCaseFile}</button>
          <button className={`journal-tab ${activeTab === 'suspects' ? 'active' : ''}`} onClick={() => setActiveTab('suspects')}>{t.journalSuspects}</button>
          <button className={`journal-tab ${activeTab === 'evidence' ? 'active' : ''}`} onClick={() => setActiveTab('evidence')}>{t.journalEvidence}</button>
          <button className={`journal-tab ${activeTab === 'history' ? 'active' : ''}`} onClick={() => setActiveTab('history')}>{t.journalHistory}</button>
        </div>
        <div className="journal-content">
          {renderContent()}
        </div>
      </div>
    </div>
  );
};