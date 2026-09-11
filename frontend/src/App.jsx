import React, { useState, useEffect, useRef } from 'react';
import { Header } from './components/Header';
import { EmptyState } from './components/EmptyState';
import { ChatMessageItem } from './components/ChatMessageItem';
import { TypingIndicator } from './components/TypingIndicator';
import { DevPanel } from './components/DevPanel';
import { SettingsModal } from './components/SettingsModal';
import { soundEffects } from './utils/audio';
import {
  sendMessage,
  getState,
  getHistory,
  clearHistory,
  resetMood,
  resetAll,
  overrideMood,
  regenerateLast,
  updateName,
} from './services/api';
import { DEFAULT_SETTINGS, MOOD_META } from './types';

export default function App() {
  const [messages, setMessages] = useState([]);
  const [prompt, setPrompt] = useState('');
  const [characterState, setCharacterState] = useState({
    characterName: 'Mira',
    currentMood: 'normal',
    moodIntensity: 0.5,
    energy: 0.7,
    patience: 0.8,
    angerLevel: 0.0,
    sadnessLevel: 0.0,
    messageCount: 0,
    ignoredMessages: 0,
    typingStyle: 'normal',
    lastMood: 'normal',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [activeModel, setActiveModel] = useState('gemini-2.5-flash');
  const [isDevPanelOpen, setIsDevPanelOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [errorToast, setErrorToast] = useState(null);

  // Settings persisted in localStorage
  const [settings, setSettings] = useState(() => {
    try {
      const saved = localStorage.getItem('mood_ai_settings');
      return saved ? { ...DEFAULT_SETTINGS, ...JSON.parse(saved) } : DEFAULT_SETTINGS;
    } catch {
      return DEFAULT_SETTINGS;
    }
  });

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Persist settings
  useEffect(() => {
    try {
      localStorage.setItem('mood_ai_settings', JSON.stringify(settings));
    } catch {
      // ignore
    }
  }, [settings]);

  // Initial load from backend (character state & conversation history)
  useEffect(() => {
    const initData = async () => {
      try {
        const [stateRes, historyRes] = await Promise.all([
          getState().catch(() => null),
          getHistory().catch(() => []),
        ]);

        if (stateRes) {
          const loadedState = stateRes.characterState || stateRes;
          setCharacterState(loadedState);
          const name = stateRes.characterName || loadedState.characterName;
          if (name) {
            setSettings((prev) => ({ ...prev, characterName: name }));
          }
        }

        if (historyRes && historyRes.length > 0) {
          setMessages(historyRes);
        }
      } catch (err) {
        console.warn('Initial data load notice:', err);
      }
    };

    initData();
  }, []);

  // Smooth auto-scroll to bottom on new messages or typing indicator
  useEffect(() => {
    if (messages.length > 0 || isLoading) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isLoading]);

  const triggerError = (msg) => {
    setErrorToast(msg);
    setTimeout(() => setErrorToast(null), 5000);
  };

  // Typing delay calculation based on mood for realistic personality pacing
  const getTypingDelay = (mood) => {
    if (!settings.typingAnimationEnabled) return 200;
    switch (mood) {
      case 'happy':
        return 700; // fast & excited
      case 'sad':
        return 1300; // slow & subdued
      case 'angry':
        return 1500; // hesitating / irritated
      case 'drama':
        return 1200; // theatrical pause
      case 'tired':
        return 1600; // drowsy & lagging
      case 'mother':
        return 900; // warm & attentive
      case 'curious':
        return 1100; // thoughtful
      default:
        return 800;
    }
  };

  const handleSend = async (customText) => {
    const textToSend = (customText || prompt).trim();
    if (!textToSend || isLoading) return;

    // Optional audio chime for user send
    if (settings.soundEnabled) {
      soundEffects.playSend();
    }

    const optimisticUserMsg = {
      id: `usr_${Date.now()}`,
      role: 'user',
      content: textToSend,
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, optimisticUserMsg]);
    setPrompt('');
    setIsLoading(true);

    const startTime = Date.now();

    try {
      const data = await sendMessage(
        textToSend,
        null,
        settings.characterName || characterState.characterName
      );

      // Model metadata
      if (data.model) {
        setActiveModel(data.model);
      }

      // Emotional typing delay
      const requiredDelay = getTypingDelay(data.characterState?.currentMood || characterState.currentMood);
      const elapsed = Date.now() - startTime;
      if (requiredDelay > elapsed) {
        await new Promise((r) => setTimeout(r, requiredDelay - elapsed));
      }

      // Audio feedback chime tuned to the AI's mood
      if (settings.soundEnabled && data.characterState?.currentMood) {
        soundEffects.playReceive(data.characterState.currentMood);
      }

      // Update state
      if (data.characterState) {
        setCharacterState(data.characterState);
      }

      // Append assistant message
      if (data.assistantMessage) {
        setMessages((prev) => [...prev, data.assistantMessage]);
      } else {
        setMessages((prev) => [
          ...prev,
          {
            id: `ast_${Date.now()}`,
            role: 'assistant',
            content: data.reply || '...',
            mood: data.characterState?.currentMood || 'normal',
            moodIntensity: data.characterState?.moodIntensity || 0.5,
            reaction: data.analysis?.reaction || null,
            timestamp: new Date().toISOString(),
          },
        ]);
      }
    } catch (err) {
      console.error('Send error:', err);
      triggerError(err.message || 'Failed to get response from Mood AI.');
      // Revert or add error message
      setMessages((prev) => [
        ...prev,
        {
          id: `err_${Date.now()}`,
          role: 'assistant',
          content: `⚠️ Error: ${err.message || 'Could not reach server. Please make sure the FastAPI backend is running.'}`,
          mood: 'angry',
          moodIntensity: 0.8,
          isError: true,
          timestamp: new Date().toISOString(),
        },
      ]);
    } finally {
      setIsLoading(false);
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleNewChat = async () => {
    try {
      await clearHistory();
      setMessages([]);
      setPrompt('');
      setTimeout(() => inputRef.current?.focus(), 100);
    } catch {
      setMessages([]);
    }
  };

  const handleClearChat = async () => {
    if (window.confirm('Clear the current chat messages? (Mood state is preserved)')) {
      await handleNewChat();
    }
  };

  const handleResetMood = async () => {
    try {
      const data = await resetMood();
      const newState = data.state || data.characterState;
      if (newState) {
        setCharacterState(newState);
      }
    } catch (err) {
      triggerError('Failed to reset mood: ' + err.message);
    }
  };

  const handleResetAll = async () => {
    try {
      const data = await resetAll();
      const newState = data.state || data.characterState;
      if (newState) {
        setCharacterState(newState);
      }
      setMessages([]);
    } catch (err) {
      triggerError('Failed to reset all data: ' + err.message);
    }
  };

  const handleOverrideMood = async (mood) => {
    try {
      const data = await overrideMood(mood);
      const newState = data.state || data.characterState;
      if (newState) {
        setCharacterState(newState);
      }
      if (settings.soundEnabled) {
        soundEffects.playReceive(mood);
      }
    } catch (err) {
      triggerError('Failed to override mood: ' + err.message);
    }
  };

  const handleRegenerate = async () => {
    if (isLoading || messages.length === 0) return;
    setIsLoading(true);

    try {
      // Optimistically remove last assistant message
      setMessages((prev) => {
        const lastIdx = prev.map((m) => m.role).lastIndexOf('assistant');
        if (lastIdx !== -1) {
          return prev.slice(0, lastIdx);
        }
        return prev;
      });

      const data = await regenerateLast();

      if (data.characterState) {
        setCharacterState(data.characterState);
      }

      if (settings.soundEnabled && data.characterState?.currentMood) {
        soundEffects.playReceive(data.characterState.currentMood);
      }

      if (data.assistantMessage) {
        setMessages((prev) => [...prev, data.assistantMessage]);
      }
    } catch (err) {
      triggerError('Failed to regenerate: ' + err.message);
    } finally {
      setIsLoading(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  };

  const handleUpdateCharacterName = async (name) => {
    try {
      await updateName(name);
      setCharacterState((prev) => ({ ...prev, characterName: name }));
    } catch (err) {
      triggerError('Failed to update character name: ' + err.message);
    }
  };

  const hasMessages = messages.length > 0;
  const currentMood = characterState.currentMood || 'normal';
  const intensity = characterState.moodIntensity ?? 0.5;
  const moodMeta = MOOD_META[currentMood] || MOOD_META.normal;

  return (
    <div className="flex flex-col min-h-screen bg-surface text-on-surface font-body-md selection:bg-secondary-fixed">
      {/* Top Header */}
      <Header
        characterName={settings.characterName || characterState.characterName}
        characterState={characterState}
        hasMessages={hasMessages}
        soundEnabled={settings.soundEnabled}
        onToggleSound={() => setSettings((s) => ({ ...s, soundEnabled: !s.soundEnabled }))}
        onToggleDevPanel={() => setIsDevPanelOpen((v) => !v)}
        isDevPanelOpen={isDevPanelOpen}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onNewChat={handleNewChat}
        onClearChat={handleClearChat}
        activeModel={activeModel}
      />

      {/* Transient Error Toast Banner */}
      {errorToast && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 bg-error-container text-on-error-container border border-error/30 px-4 py-2.5 rounded-full shadow-lg text-xs flex items-center gap-2 animate-in fade-in">
          <span className="material-symbols-outlined text-[16px] text-error">error</span>
          <span>{errorToast}</span>
          <button
            type="button"
            onClick={() => setErrorToast(null)}
            className="hover:opacity-75 cursor-pointer ml-1"
          >
            <span className="material-symbols-outlined text-[14px]">close</span>
          </button>
        </div>
      )}

      {/* Main Container */}
      <main className="flex-1 flex flex-col pt-14 w-full relative">
        {hasMessages ? (
          /* State A: Ongoing Conversation View */
          <div className="flex-1 flex flex-col justify-between w-full max-w-[840px] mx-auto px-4 pb-4">
            {/* Scrollable Message List */}
            <div className="flex-1 flex flex-col gap-1 py-4 overflow-y-auto">
              {messages.map((msg, index) => {
                const isLatestAssistant =
                  msg.role === 'assistant' &&
                  index === messages.map((m) => m.role).lastIndexOf('assistant');

                return (
                  <ChatMessageItem
                    key={msg.id || index}
                    message={msg}
                    isLatestAssistant={isLatestAssistant}
                    onRegenerate={handleRegenerate}
                    characterName={settings.characterName || characterState.characterName}
                  />
                );
              })}

              {/* Emotional Typing Indicator */}
              {isLoading && (
                <TypingIndicator
                  mood={currentMood}
                  typingStyle={characterState.typingStyle || 'normal'}
                  characterName={settings.characterName || characterState.characterName}
                />
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Docked Sticky Bottom Pill Input */}
            <div className="sticky bottom-0 bg-surface/90 backdrop-blur-md pt-2 pb-3 w-full">
              <div
                className="w-full bg-surface-container-lowest border rounded-full shadow-md px- space-md py-2 flex items-center gap-2 transition-all focus-within:ring-2"
                style={{ borderColor: `${moodMeta.color}40` }}
              >
                {/* Current Mood Mini Dot */}
                <div
                  className="w-8 h-8 flex items-center justify-center rounded-full shrink-0 text-base select-none cursor-pointer"
                  title={`Current Mood: ${moodMeta.label} (${Math.round(intensity * 100)}%)`}
                  onClick={() => setIsDevPanelOpen(true)}
                >
                  <span>{moodMeta.emoji}</span>
                </div>

                <input
                  ref={inputRef}
                  id="prompt-input"
                  className="flex-1 bg-transparent outline-none font-body-md text-sm md:text-base text-on-surface placeholder:text-outline-variant px-1"
                  placeholder={`Reply to ${settings.characterName || characterState.characterName}...`}
                  type="text"
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  onKeyDown={handleKeyDown}
                  autoComplete="off"
                  disabled={isLoading}
                />

                <div className="flex items-center gap-1.5 shrink-0 pr-1">
                  <button
                    className={`w-8 h-8 flex items-center justify-center rounded-full transition-all shrink-0 cursor-pointer ${
                      prompt.trim() && !isLoading
                        ? 'bg-primary text-on-primary hover:opacity-90 scale-100 shadow-xs'
                        : 'bg-surface-container text-on-surface-variant opacity-40 cursor-not-allowed scale-95'
                    }`}
                    title="Send message"
                    type="button"
                    disabled={!prompt.trim() || isLoading}
                    onClick={() => handleSend()}
                  >
                    <span className="material-symbols-outlined text-[18px]">arrow_upward</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* State B: Centered Initial Screen (Original Hero Layout with Emotional Presets) */
          <div className="flex-1 min-h-[calc(100vh-3.5rem)] flex flex-col justify-center items-center px-4 py-8">
            <div className="w-full max-w-[768px] flex flex-col items-center gap-6">
              {/* Hero Avatar & Presentation */}
              <EmptyState
                characterName={settings.characterName || characterState.characterName}
                currentMood={currentMood}
                intensity={intensity}
                reaction={null}
                onSelectPrompt={(text) => handleSend(text)}
              />

              {/* Centered Pill Input Bar */}
              <div
                className="w-full bg-surface-container-lowest border rounded-full shadow-sm hover:shadow-md px-4 py-2.5 flex items-center gap-2 transition-all focus-within:shadow-md focus-within:ring-2"
                style={{ borderColor: `${moodMeta.color}55` }}
              >
                <div
                  className="w-8 h-8 flex items-center justify-center rounded-full shrink-0 text-lg select-none cursor-pointer"
                  title={`Current Mood: ${moodMeta.label}`}
                  onClick={() => setIsDevPanelOpen(true)}
                >
                  <span>{moodMeta.emoji}</span>
                </div>

                <input
                  ref={inputRef}
                  id="prompt-input"
                  className="flex-1 bg-transparent outline-none font-body-md text-sm md:text-base text-on-surface placeholder:text-outline-variant px-1"
                  placeholder={`Chat with ${settings.characterName || characterState.characterName}...`}
                  type="text"
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  onKeyDown={handleKeyDown}
                  autoComplete="off"
                  disabled={isLoading}
                  autoFocus
                />

                <div className="flex items-center gap-1.5 shrink-0">
                  {prompt.trim() && (
                    <button
                      className="w-8 h-8 flex items-center justify-center rounded-full bg-primary text-on-primary hover:opacity-90 transition-opacity shrink-0 cursor-pointer shadow-xs"
                      title="Send message"
                      type="button"
                      disabled={isLoading}
                      onClick={() => handleSend()}
                    >
                      <span className="material-symbols-outlined text-[18px]">arrow_upward</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Developer Debug Panel Drawer */}
        {isDevPanelOpen && (
          <DevPanel
            state={characterState}
            onOverrideMood={handleOverrideMood}
            onClose={() => setIsDevPanelOpen(false)}
            characterName={settings.characterName || characterState.characterName}
          />
        )}

        {/* Settings Modal */}
        <SettingsModal
          isOpen={isSettingsOpen}
          onClose={() => setIsSettingsOpen(false)}
          settings={settings}
          onUpdateSettings={(newSettings) => setSettings((s) => ({ ...s, ...newSettings }))}
          onResetMood={handleResetMood}
          onResetAll={handleResetAll}
          onUpdateCharacterName={handleUpdateCharacterName}
        />
      </main>
    </div>
  );
}
