import React from 'react';
import { MOOD_META } from '../types';
import { Avatar } from './Avatar';

const EMOTION_PROMPT_PRESETS = [
  {
    category: 'Normal',
    mood: 'normal',
    text: 'Ellarkkum sugam alle? Enthokkeyund vishesham? 🙂',
  },
  {
    category: 'Happy',
    mood: 'happy',
    text: 'Guess what?! Enikku nalla oru promotion kitti, adipoli aayi! 🎉',
  },
  {
    category: 'Sad',
    mood: 'sad',
    text: 'Innu nalla kashtapadulla divasam aayirunnu, nalla vishamam thonni... 😔',
  },
  {
    category: 'Angry',
    mood: 'angry',
    text: 'Nee entha eppozhum kurachu mathram parayunne? Mindan thonnanille! 😤',
  },
  {
    category: 'Caring',
    mood: 'mother',
    text: "Njan innu food onnum kazhichilla, nalla thala vedhana edukkunnu 🤒",
  },
  {
    category: 'Drama',
    mood: 'drama',
    text: 'Ente daivame, ithu kando... nee orikkalum vishwasikkilla! 🎭',
  },
  {
    category: 'Curious',
    mood: 'curious',
    text: 'Athegana sambhavichath ennu enikku paranju tharumo? 🤔',
  },
  {
    category: 'Tired',
    mood: 'tired',
    text: "Samayam 3:30 AM aayi, nalla ksheenam undu... 🥱",
  },
];

export const EmptyState = ({
  characterName = 'Mira',
  currentMood = 'normal',
  intensity = 0.5,
  reaction = null,
  onSelectPrompt,
}) => {
  const meta = MOOD_META[currentMood] || MOOD_META.normal;

  return (
    <div className="flex flex-col items-center justify-center text-center px-4 max-w-2xl mx-auto py-8">
      {/* Hero Avatar with Animated Reaction */}
      <div className="mb-4">
        <Avatar
          mood={currentMood}
          intensity={intensity}
          reaction={reaction}
          size="lg"
          showReaction={true}
        />
      </div>

      {/* Greeting Title & Subtitle */}
      <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-on-surface mb-1">
        Chat with {characterName}
      </h1>

      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium my-2 bg-surface-container border border-outline-variant/30 text-on-surface">
        <span className="text-base">{meta.emoji}</span>
        <span className="font-semibold">{meta.label} Mood</span>
        <span className="opacity-40">•</span>
        <span className="text-on-surface-variant">{meta.tagline}</span>
      </div>

      <p className="text-xs text-on-surface-variant max-w-md mt-1 mb-6 leading-relaxed">
        {characterName}'s mood changes dynamically based on your words, tone, and conversational energy. Try saying something emotional below!
      </p>

      {/* Emotion Prompt Starter Chips */}
      <div className="flex flex-wrap justify-center gap-2 max-w-xl">
        {EMOTION_PROMPT_PRESETS.map((item, idx) => {
          const itemMeta = MOOD_META[item.mood] || MOOD_META.normal;
          return (
            <button
              key={idx}
              type="button"
              onClick={() => onSelectPrompt(item.text)}
              className="group px-3 py-1.5 rounded-full bg-surface-container-lowest hover:bg-surface-container-high border border-outline-variant/30 text-xs text-on-surface transition-all shadow-2xs hover:shadow-xs flex items-center gap-1.5 cursor-pointer text-left"
            >
              <span className="text-sm">{itemMeta.emoji}</span>
              <span className="line-clamp-1 group-hover:text-primary transition-colors">
                {item.text}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
