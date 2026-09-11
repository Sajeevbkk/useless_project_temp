import React from 'react';
import { MOOD_META } from '../types';

export const MoodIndicator = ({
  mood = 'normal',
  intensity = 0.5,
  energy = 0.7,
  patience = 0.8,
}) => {
  const meta = MOOD_META[mood] || MOOD_META.normal;
  const intensityPct = Math.round(intensity * 100);

  return (
    <div
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-medium transition-all duration-300 shadow-2xs select-none ${meta.badgeBg} ${meta.badgeText} ${meta.borderColor}`}
      title={`Mood: ${meta.label} (${intensityPct}%) | Energy: ${Math.round(energy * 100)}% | Patience: ${Math.round(patience * 100)}%`}
    >
      <span className="text-sm">{meta.emoji}</span>
      <span className="font-semibold">{meta.label}</span>
      <span className="opacity-40">•</span>
      <span className="font-mono text-[11px] opacity-90">{intensityPct}%</span>
      <span
        className="w-1.5 h-1.5 rounded-full animate-pulse"
        style={{ backgroundColor: meta.color }}
      />
    </div>
  );
};
