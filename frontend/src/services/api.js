const API_BASE = '/api';

export async function sendMessage(message, modeOverride, characterName) {
  const res = await fetch(`${API_BASE}/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message, modeOverride, characterName }),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || errorData.error || 'Failed to send message.');
  }

  return res.json();
}

export async function getState() {
  const res = await fetch(`${API_BASE}/state`);
  if (!res.ok) throw new Error('Failed to fetch character state.');
  return res.json();
}

export async function resetAll() {
  const res = await fetch(`${API_BASE}/reset`, { method: 'POST' });
  if (!res.ok) throw new Error('Failed to reset state.');
  return res.json();
}

export async function resetMood() {
  const res = await fetch(`${API_BASE}/reset-mood`, { method: 'POST' });
  if (!res.ok) throw new Error('Failed to reset mood.');
  return res.json();
}

export async function regenerateLast() {
  const res = await fetch(`${API_BASE}/regenerate`, { method: 'POST' });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || err.error || 'Failed to regenerate.');
  }
  return res.json();
}

export async function getHistory() {
  const res = await fetch(`${API_BASE}/history`);
  if (!res.ok) throw new Error('Failed to load history.');
  const data = await res.json();
  return data.history || [];
}

export async function clearHistory() {
  const res = await fetch(`${API_BASE}/history`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Failed to clear history.');
}

export async function overrideMood(mood) {
  const res = await fetch(`${API_BASE}/mood/override`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ mood }),
  });
  if (!res.ok) throw new Error('Failed to override mood.');
  return res.json();
}

export async function updateName(name) {
  const res = await fetch(`${API_BASE}/settings/name`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name }),
  });
  if (!res.ok) throw new Error('Failed to update name.');
  return res.json();
}
