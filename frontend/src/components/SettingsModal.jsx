import React, { useState } from 'react';

export const SettingsModal = ({
  isOpen,
  onClose,
  settings,
  onUpdateSettings,
  onResetMood,
  onResetAll,
  onUpdateCharacterName,
}) => {
  const [characterNameInput, setCharacterNameInput] = useState(settings.characterName || 'Mira');
  const [isSavingName, setIsSavingName] = useState(false);
  const [nameSavedMsg, setNameSavedMsg] = useState(false);

  if (!isOpen) return null;

  const handleSaveName = async (e) => {
    e.preventDefault();
    if (!characterNameInput.trim()) return;
    setIsSavingName(true);
    try {
      if (onUpdateCharacterName) {
        await onUpdateCharacterName(characterNameInput.trim());
      }
      onUpdateSettings({ characterName: characterNameInput.trim() });
      setNameSavedMsg(true);
      setTimeout(() => setNameSavedMsg(false), 2000);
    } finally {
      setIsSavingName(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="w-full max-w-md bg-surface-container-lowest border border-outline-variant/40 rounded-2xl shadow-2xl p-6 text-on-surface overflow-hidden flex flex-col gap-5"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-outline-variant/30">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[22px] text-primary">settings</span>
            <h3 className="text-base font-semibold">Settings & Persona</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-on-surface-variant hover:text-on-surface hover:bg-surface-container transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* Character Name Setting */}
        <form onSubmit={handleSaveName} className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">
            AI Character Name
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={characterNameInput}
              onChange={(e) => setCharacterNameInput(e.target.value)}
              placeholder="e.g. Mira, Aria, Luna"
              className="flex-1 px-3 py-2 text-sm bg-surface-container rounded-xl border border-outline-variant/40 focus:outline-none focus:ring-2 focus:ring-primary/20"
              maxLength={24}
            />
            <button
              type="submit"
              disabled={isSavingName || !characterNameInput.trim()}
              className="px-4 py-2 bg-primary text-on-primary text-xs font-semibold rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50 cursor-pointer"
            >
              {isSavingName ? 'Saving...' : 'Save'}
            </button>
          </div>
          {nameSavedMsg && (
            <span className="text-xs text-emerald-600 font-medium">✓ Name updated!</span>
          )}
        </form>

        {/* Toggles */}
        <div className="flex flex-col gap-3 py-1">
          <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">
            Preferences
          </label>

          {/* Sound Toggle */}
          <div className="flex items-center justify-between py-1.5">
            <div className="flex flex-col">
              <span className="text-sm font-medium">Audio Mood Chimes</span>
              <span className="text-xs text-on-surface-variant">
                Play subtle Web Audio tones tuned to character emotion
              </span>
            </div>
            <button
              type="button"
              onClick={() => onUpdateSettings({ soundEnabled: !settings.soundEnabled })}
              className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors cursor-pointer ${
                settings.soundEnabled ? 'bg-primary' : 'bg-surface-container-high'
              }`}
            >
              <div
                className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                  settings.soundEnabled ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Typing Delay Toggle */}
          <div className="flex items-center justify-between py-1.5">
            <div className="flex flex-col">
              <span className="text-sm font-medium">Emotional Typing Animation</span>
              <span className="text-xs text-on-surface-variant">
                Simulate personality typing pacing (hesitations, excited bursts)
              </span>
            </div>
            <button
              type="button"
              onClick={() =>
                onUpdateSettings({ typingAnimationEnabled: !settings.typingAnimationEnabled })
              }
              className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors cursor-pointer ${
                settings.typingAnimationEnabled ? 'bg-primary' : 'bg-surface-container-high'
              }`}
            >
              <div
                className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                  settings.typingAnimationEnabled ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Developer Debug Toggle */}
          <div className="flex items-center justify-between py-1.5">
            <div className="flex flex-col">
              <span className="text-sm font-medium">Developer Debug Panel</span>
              <span className="text-xs text-on-surface-variant">
                Show live emotional meters and manual mood override triggers
              </span>
            </div>
            <button
              type="button"
              onClick={() => onUpdateSettings({ developerMode: !settings.developerMode })}
              className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors cursor-pointer ${
                settings.developerMode ? 'bg-primary' : 'bg-surface-container-high'
              }`}
            >
              <div
                className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                  settings.developerMode ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </div>

        {/* State Management / Reset Actions */}
        <div className="flex flex-col gap-2 pt-2 border-t border-outline-variant/30">
          <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">
            Mood & Memory Actions
          </label>
          <div className="flex flex-col sm:flex-row gap-2">
            <button
              type="button"
              onClick={async () => {
                if (window.confirm('Reset current mood back to neutral (Normal)?')) {
                  await onResetMood();
                  onClose();
                }
              }}
              className="flex-1 px-3 py-2 rounded-xl text-xs font-medium border border-outline-variant hover:bg-surface-container transition-colors flex items-center justify-center gap-1 cursor-pointer"
            >
              <span className="material-symbols-outlined text-[16px]">restart_alt</span>
              <span>Reset Mood to Normal</span>
            </button>

            <button
              type="button"
              onClick={async () => {
                if (window.confirm('Clear all conversation history and reset character emotional state?')) {
                  await onResetAll();
                  onClose();
                }
              }}
              className="flex-1 px-3 py-2 rounded-xl text-xs font-medium border border-error/30 text-error hover:bg-error/10 transition-colors flex items-center justify-center gap-1 cursor-pointer"
            >
              <span className="material-symbols-outlined text-[16px]">delete_forever</span>
              <span>Wipe All Data</span>
            </button>
          </div>
        </div>

        {/* Close Footer */}
        <div className="pt-2 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-surface-container hover:bg-surface-container-high text-on-surface text-xs font-semibold rounded-xl transition-colors cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
