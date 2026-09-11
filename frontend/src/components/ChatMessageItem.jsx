import React, { useState } from 'react';
import { MOOD_META, REACTION_EMOJIS } from '../types';
import { Avatar } from './Avatar';

export const ChatMessageItem = ({
  message,
  isLatestAssistant = false,
  onRegenerate,
  characterName = 'Mira',
}) => {
  const [copied, setCopied] = useState(false);
  const isUser = message.role === 'user';
  const mood = message.mood || 'normal';
  const meta = MOOD_META[mood] || MOOD_META.normal;

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const formattedTime = message.timestamp
    ? new Date(message.timestamp).toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      })
    : '';

  const renderContent = (text) => {
    if (text.includes('```')) {
      const parts = text.split(/(```[\s\S]*?```)/g);
      return parts.map((part, i) => {
        if (part.startsWith('```') && part.endsWith('```')) {
          const firstLineEnd = part.indexOf('\n');
          const lang = part.slice(3, firstLineEnd).trim() || 'code';
          const code = part.slice(firstLineEnd + 1, -3);
          return (
            <div key={i} className="my-2 rounded-lg overflow-hidden border border-slate-700 bg-slate-900 text-slate-100">
              <div className="flex justify-between items-center px-3 py-1 bg-slate-800 text-[11px] font-mono text-slate-400">
                <span>{lang}</span>
                <button
                  type="button"
                  onClick={() => navigator.clipboard.writeText(code)}
                  className="hover:text-white flex items-center gap-1 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[13px]">content_copy</span>
                  Copy
                </button>
              </div>
              <pre className="p-3 text-xs font-mono overflow-x-auto m-0">
                <code>{code}</code>
              </pre>
            </div>
          );
        }
        return (
          <p key={i} className="whitespace-pre-wrap leading-relaxed my-0.5">
            {part}
          </p>
        );
      });
    }

    return <p className="whitespace-pre-wrap leading-relaxed">{text}</p>;
  };

  return (
    <div
      className={`flex items-start gap-3 my-3 group transition-all duration-300 ${
        isUser ? 'flex-row-reverse' : 'flex-row'
      }`}
    >
      {!isUser && (
        <Avatar
          mood={mood}
          intensity={message.moodIntensity}
          reaction={message.reaction}
          size="sm"
        />
      )}

      <div className={`flex flex-col max-w-[85%] md:max-w-[75%] ${isUser ? 'items-end' : 'items-start'}`}>
        {!isUser && (
          <div className="flex items-center gap-1.5 mb-1 px-1 text-xs text-on-surface-variant font-medium">
            <span>{characterName}</span>
            <span className="opacity-40">•</span>
            <span
              className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded text-[10px] font-semibold"
              style={{ color: meta.color, backgroundColor: `${meta.color}15` }}
            >
              <span>{meta.emoji}</span>
              <span>{meta.label}</span>
            </span>
          </div>
        )}

        <div
          className={`px-4 py-3 rounded-2xl text-sm shadow-xs transition-all relative ${
            isUser
              ? 'bg-primary text-on-primary rounded-tr-xs'
              : 'bg-surface-container-lowest text-on-surface border border-outline-variant/30 rounded-tl-xs'
          }`}
          style={
            !isUser
              ? {
                  borderLeftColor: meta.color,
                  borderLeftWidth: '3px',
                }
              : {}
          }
        >
          {renderContent(message.content)}

          {message.reaction && (
            <span
              className="inline-flex items-center gap-1 mt-2 px-2 py-0.5 rounded-full text-xs font-medium bg-surface-container border border-outline-variant/30 text-on-surface select-none"
              title={`Reaction: ${message.reaction}`}
            >
              <span>{REACTION_EMOJIS[message.reaction] || '✨'}</span>
              <span className="capitalize text-[11px] text-on-surface-variant">
                {message.reaction.replace('_', ' ')}
              </span>
            </span>
          )}
        </div>

        <div
          className={`flex items-center gap-2 mt-1 px-1 text-[11px] text-on-surface-variant font-mono opacity-60 group-hover:opacity-100 transition-opacity ${
            isUser ? 'flex-row-reverse' : 'flex-row'
          }`}
        >
          {formattedTime && <span>{formattedTime}</span>}

          <button
            type="button"
            onClick={handleCopy}
            className="hover:text-on-surface transition-colors flex items-center gap-0.5 cursor-pointer"
            title="Copy text"
          >
            <span className="material-symbols-outlined text-[13px]">
              {copied ? 'check' : 'content_copy'}
            </span>
            <span>{copied ? 'Copied' : 'Copy'}</span>
          </button>

          {!isUser && isLatestAssistant && onRegenerate && (
            <button
              type="button"
              onClick={onRegenerate}
              className="hover:text-on-surface transition-colors flex items-center gap-0.5 cursor-pointer"
              title="Regenerate response"
            >
              <span className="material-symbols-outlined text-[13px]">refresh</span>
              <span>Regenerate</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
