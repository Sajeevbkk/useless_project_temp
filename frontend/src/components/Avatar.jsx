import React from 'react';
import { MOOD_META, REACTION_EMOJIS } from '../types';

export const Avatar = ({
  mood = 'normal',
  intensity = 0.5,
  reaction,
  size = 'md',
  showReaction = true,
}) => {
  const meta = MOOD_META[mood] || MOOD_META.normal;

  const sizeClasses = {
    sm: 'w-8 h-8 text-base',
    md: 'w-10 h-10 text-xl',
    lg: 'w-14 h-14 text-2xl',
  }[size] || 'w-10 h-10 text-xl';

  const glowStyle = {
    boxShadow: `0 0 ${8 + intensity * 14}px ${meta.color}55`,
    borderColor: meta.color,
  };

  return (
    <div className="relative inline-flex items-center justify-center shrink-0 select-none">
      {/* Outer Pulse Ring */}
      <div
        className="absolute inset-0 rounded-full animate-ping opacity-25 pointer-events-none"
        style={{ backgroundColor: meta.color }}
      />

      {/* Main Avatar Circle */}
      <div
        style={glowStyle}
        className={`${sizeClasses} rounded-full flex items-center justify-center transition-all duration-500 bg-white border-2 shadow-xs relative z-10`}
      >
        <span className="transform hover:scale-110 transition-transform">
          {meta.emoji}
        </span>
      </div>

      {/* Floating Animated Reaction Badge */}
      {showReaction && reaction && (
        <span
          key={`${reaction}-${Date.now()}`}
          className="absolute -top-2 -right-2 text-sm z-20 bg-white/90 shadow-md border border-slate-200 rounded-full px-1 py-0.5 animate-bounce pointer-events-none"
        >
          {REACTION_EMOJIS[reaction] || '✨'}
        </span>
      )}
    </div>
  );
};
