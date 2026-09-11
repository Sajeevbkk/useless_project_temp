import React from 'react';
import { Avatar } from './Avatar';
import { MoodIndicator } from './MoodIndicator';

export const Header = ({
  characterName = 'Mira',
  characterState = {},
  hasMessages = false,
  soundEnabled = true,
  onToggleSound,
  onToggleDevPanel,
  isDevPanelOpen = false,
  onOpenSettings,
  onNewChat,
  onClearChat,
  activeModel = 'gemini-2.5-flash',
}) => {
  const currentMood = characterState.currentMood || 'normal';
  const intensity = characterState.moodIntensity ?? 0.5;
  const energy = characterState.energy ?? 0.7;
  const patience = characterState.patience ?? 0.8;

  return (
    <header className="fixed top-0 right-0 left-0 h-14 bg-surface/85 backdrop-blur-xl border-b border-outline-variant/20 z-40 flex items-center justify-between px-3 md:px-6 shadow-xs">
      {/* Left section: New Chat, Avatar, Name, MoodIndicator */}
      <div className="flex items-center gap-2.5 md:gap-3">
        <button
          type="button"
          onClick={onNewChat}
          title="Start fresh conversation"
          className="w-9 h-9 flex items-center justify-center rounded-full text-on-surface-variant hover:text-on-surface hover:bg-surface-container transition-colors cursor-pointer shrink-0"
        >
          <span className="material-symbols-outlined text-[20px]">edit_square</span>
        </button>

        <div className="flex items-center gap-2.5">
          <Avatar mood={currentMood} intensity={intensity} size="sm" showReaction={false} />

          <div className="flex flex-col">
            <span className="text-sm font-semibold leading-tight text-on-surface">
              {characterName}
            </span>
            <span className="text-[10px] font-label-sm text-on-surface-variant leading-none hidden sm:inline">
              Emotion-Aware Companion
            </span>
          </div>
        </div>

        {/* Dynamic Mood Indicator Badge */}
        <div className="hidden xs:block sm:block ml-1">
          <MoodIndicator
            mood={currentMood}
            intensity={intensity}
            energy={energy}
            patience={patience}
          />
        </div>
      </div>

      {/* Right section: Sound, Dev Panel, Settings, Clear, Model */}
      <div className="flex items-center gap-1 sm:gap-2">
        {/* Sound Toggle */}
        <button
          type="button"
          onClick={onToggleSound}
          title={soundEnabled ? 'Mute audio chimes' : 'Unmute audio chimes'}
          className={`w-8 h-8 flex items-center justify-center rounded-full transition-colors cursor-pointer ${
            soundEnabled
              ? 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container'
              : 'text-outline-variant hover:text-on-surface-variant hover:bg-surface-container'
          }`}
        >
          <span className="material-symbols-outlined text-[18px]">
            {soundEnabled ? 'volume_up' : 'volume_off'}
          </span>
        </button>

        {/* Developer Debug Toggle */}
        <button
          type="button"
          onClick={onToggleDevPanel}
          title="Toggle Mood Engine Debugger"
          className={`w-8 h-8 flex items-center justify-center rounded-full transition-colors relative cursor-pointer ${
            isDevPanelOpen
              ? 'bg-amber-400/20 text-amber-500 font-bold'
              : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container'
          }`}
        >
          <span className="material-symbols-outlined text-[18px]">terminal</span>
          {isDevPanelOpen && (
            <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-amber-400 animate-ping" />
          )}
        </button>

        {/* Settings Modal Toggle */}
        <button
          type="button"
          onClick={onOpenSettings}
          title="Settings & Persona"
          className="w-8 h-8 flex items-center justify-center rounded-full text-on-surface-variant hover:text-on-surface hover:bg-surface-container transition-colors cursor-pointer"
        >
          <span className="material-symbols-outlined text-[18px]">settings</span>
        </button>

        {/* Clear Conversation */}
        {hasMessages && (
          <button
            type="button"
            onClick={onClearChat}
            title="Clear current conversation"
            className="text-xs text-on-surface-variant hover:text-error hover:bg-surface-container px-2.5 py-1 rounded-full transition-colors hidden sm:flex items-center gap-1 cursor-pointer"
          >
            <span className="material-symbols-outlined text-[15px]">delete_outline</span>
            <span>Clear</span>
          </button>
        )}

        {/* Model Pill */}
        <div className="hidden md:flex items-center gap-1 bg-surface-container-high px-2 py-0.5 rounded-full text-[11px] font-label-sm text-on-surface-variant">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
          <span>{activeModel}</span>
        </div>
      </div>
    </header>
  );
};
