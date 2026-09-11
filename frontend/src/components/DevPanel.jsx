import React from 'react';
import { MOOD_META } from '../types';

const ALL_MOODS = [
  'happy',
  'sad',
  'angry',
  'mother',
  'drama',
  'normal',
  'curious',
  'tired',
];

export const DevPanel = ({
  state,
  onOverrideMood,
  onClose,
  characterName = 'Mira',
}) => {
  const currentMeta = MOOD_META[state.currentMood] || MOOD_META.normal;
  const lastMeta = MOOD_META[state.lastMood] || MOOD_META.normal;

  return (
    <div className="fixed inset-y-0 right-0 w-80 md:w-96 bg-slate-900/95 backdrop-blur-xl border-l border-slate-700/80 text-slate-100 shadow-2xl z-50 flex flex-col p-5 overflow-y-auto animate-in slide-in-from-right duration-300">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-amber-400 text-[20px]">
            terminal
          </span>
          <h2 className="font-mono text-sm font-semibold tracking-wider uppercase text-slate-200">
            Mood Engine Debugger
          </h2>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="text-slate-400 hover:text-white p-1 rounded-md transition-colors cursor-pointer"
          title="Close Debug Panel"
        >
          <span className="material-symbols-outlined text-[18px]">close</span>
        </button>
      </div>

      {/* Metrics Grid */}
      <div className="flex flex-col gap-4 py-4 text-xs font-mono">
        {/* Current Mood Card */}
        <div className="bg-slate-800/80 border border-slate-700/60 rounded-xl p-3.5 flex items-center justify-between">
          <div>
            <div className="text-[10px] uppercase tracking-wider text-slate-400">
              Current Mood
            </div>
            <div className="text-lg font-bold flex items-center gap-2 mt-0.5 text-white">
              <span>{currentMeta.emoji}</span>
              <span className="capitalize">{state.currentMood}</span>
            </div>
          </div>
          <div className="text-right">
            <div className="text-[10px] uppercase tracking-wider text-slate-400">
              Last Mood
            </div>
            <div className="text-sm font-semibold text-slate-300 flex items-center gap-1 justify-end mt-0.5">
              <span>{lastMeta.emoji}</span>
              <span className="capitalize">{state.lastMood}</span>
            </div>
          </div>
        </div>

        {/* Meters */}
        <div className="space-y-3 bg-slate-800/50 border border-slate-700/40 rounded-xl p-3.5">
          {/* Intensity */}
          <div>
            <div className="flex justify-between text-[11px] mb-1">
              <span className="text-slate-400">INTENSITY</span>
              <span className="text-amber-400 font-bold">
                {Math.round((state.moodIntensity || 0) * 100)}%
              </span>
            </div>
            <div className="w-full bg-slate-700/60 rounded-full h-1.5 overflow-hidden">
              <div
                className="bg-amber-400 h-1.5 rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, (state.moodIntensity || 0) * 100)}%` }}
              />
            </div>
          </div>

          {/* Energy */}
          <div>
            <div className="flex justify-between text-[11px] mb-1">
              <span className="text-slate-400">ENERGY</span>
              <span className="text-emerald-400 font-bold">
                {Math.round((state.energy || 0) * 100)}%
              </span>
            </div>
            <div className="w-full bg-slate-700/60 rounded-full h-1.5 overflow-hidden">
              <div
                className="bg-emerald-400 h-1.5 rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, (state.energy || 0) * 100)}%` }}
              />
            </div>
          </div>

          {/* Patience */}
          <div>
            <div className="flex justify-between text-[11px] mb-1">
              <span className="text-slate-400">PATIENCE</span>
              <span className="text-sky-400 font-bold">
                {Math.round((state.patience || 0) * 100)}%
              </span>
            </div>
            <div className="w-full bg-slate-700/60 rounded-full h-1.5 overflow-hidden">
              <div
                className="bg-sky-400 h-1.5 rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, (state.patience || 0) * 100)}%` }}
              />
            </div>
          </div>

          {/* Anger */}
          <div>
            <div className="flex justify-between text-[11px] mb-1">
              <span className="text-slate-400">ANGER LEVEL</span>
              <span className="text-rose-400 font-bold">
                {Math.round((state.angerLevel || 0) * 100)}%
              </span>
            </div>
            <div className="w-full bg-slate-700/60 rounded-full h-1.5 overflow-hidden">
              <div
                className="bg-rose-500 h-1.5 rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, (state.angerLevel || 0) * 100)}%` }}
              />
            </div>
          </div>

          {/* Sadness */}
          <div>
            <div className="flex justify-between text-[11px] mb-1">
              <span className="text-slate-400">SADNESS LEVEL</span>
              <span className="text-indigo-400 font-bold">
                {Math.round((state.sadnessLevel || 0) * 100)}%
              </span>
            </div>
            <div className="w-full bg-slate-700/60 rounded-full h-1.5 overflow-hidden">
              <div
                className="bg-indigo-400 h-1.5 rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, (state.sadnessLevel || 0) * 100)}%` }}
              />
            </div>
          </div>
        </div>

        {/* Attribute Cards */}
        <div className="grid grid-cols-2 gap-2 text-[11px]">
          <div className="bg-slate-800/60 border border-slate-700/40 rounded-lg p-2.5">
            <span className="text-slate-400 block text-[10px]">MESSAGE COUNT</span>
            <span className="text-slate-200 font-bold text-sm">
              {state.messageCount || 0}
            </span>
          </div>

          <div className="bg-slate-800/60 border border-slate-700/40 rounded-lg p-2.5">
            <span className="text-slate-400 block text-[10px]">IGNORED COUNT</span>
            <span className="text-slate-200 font-bold text-sm">
              {state.ignoredMessages || 0}
            </span>
          </div>

          <div className="bg-slate-800/60 border border-slate-700/40 rounded-lg p-2.5">
            <span className="text-slate-400 block text-[10px]">TYPING STYLE</span>
            <span className="text-slate-200 font-bold capitalize">
              {state.typingStyle || 'normal'}
            </span>
          </div>

          <div className="bg-slate-800/60 border border-slate-700/40 rounded-lg p-2.5">
            <span className="text-slate-400 block text-[10px]">CHARACTER</span>
            <span className="text-slate-200 font-bold">{characterName}</span>
          </div>
        </div>

        {/* Quick Mood Override Controls */}
        <div className="mt-2 pt-3 border-t border-slate-800">
          <div className="text-[10px] uppercase tracking-wider text-slate-400 mb-2">
            Force Mood Override (Testing)
          </div>
          <div className="grid grid-cols-2 gap-1.5">
            {ALL_MOODS.map((m) => {
              const meta = MOOD_META[m];
              const isActive = state.currentMood === m;
              return (
                <button
                  key={m}
                  type="button"
                  onClick={() => onOverrideMood(m)}
                  className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-left transition-all cursor-pointer ${
                    isActive
                      ? 'bg-slate-700 border-amber-400/80 text-white font-bold'
                      : 'bg-slate-800/40 border-slate-700/50 text-slate-300 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  <span>{meta.emoji}</span>
                  <span className="capitalize text-xs">{meta.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
