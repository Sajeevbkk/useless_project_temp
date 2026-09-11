import React from 'react';
import { MOOD_META } from '../types';
import { Avatar } from './Avatar';

export const TypingIndicator = ({
  mood = 'normal',
  typingStyle = 'normal',
  characterName = 'Mira',
}) => {
  const meta = MOOD_META[mood] || MOOD_META.normal;

  const getStatusText = () => {
    switch (mood) {
      case 'happy':
        return `${characterName} is typing excitedly... ✨`;
      case 'sad':
        return `${characterName} is typing slowly... 😔`;
      case 'angry':
        return `${characterName} is hesitating... 😤`;
      case 'drama':
        return `${characterName} is taking a dramatic pause... 🎭`;
      case 'tired':
        return `${characterName} is typing sleepily... 😴`;
      case 'mother':
        return `${characterName} is caring for you... ❤️`;
      case 'curious':
        return `${characterName} is thinking intently... 🤔`;
      default:
        return `${characterName} is typing...`;
    }
  };

  const dotSpeedClass = {
    excited: 'animate-bounce',
    slow: 'animate-pulse',
    dramatic: 'animate-bounce',
    playful: 'animate-bounce',
    normal: 'animate-bounce',
  }[typingStyle] || 'animate-bounce';

  return (
    <div className="flex items-start gap-3 my-2 animate-fade-in">
      <Avatar mood={mood} size="sm" showReaction={false} />

      <div className="flex flex-col gap-1">
        <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-2xl rounded-tl-xs px-4 py-3 shadow-xs flex items-center gap-2">
          <div className="flex items-center gap-1.5">
            <span
              className={`w-2 h-2 rounded-full ${dotSpeedClass}`}
              style={{ backgroundColor: meta.color, animationDelay: '0ms' }}
            />
            <span
              className={`w-2 h-2 rounded-full ${dotSpeedClass}`}
              style={{ backgroundColor: meta.color, animationDelay: '150ms' }}
            />
            <span
              className={`w-2 h-2 rounded-full ${dotSpeedClass}`}
              style={{ backgroundColor: meta.color, animationDelay: '300ms' }}
            />
          </div>
          <span className="text-xs text-on-surface-variant italic ml-1 select-none">
            {getStatusText()}
          </span>
        </div>
      </div>
    </div>
  );
};
