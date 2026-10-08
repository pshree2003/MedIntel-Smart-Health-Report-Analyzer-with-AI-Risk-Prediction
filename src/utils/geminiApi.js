const configuredApiBaseUrl = import.meta.env.VITE_API_BASE_URL;
const apiBaseUrl = (configuredApiBaseUrl || (import.meta.env.DEV ? '' : 'http://localhost:3002')).replace(/\/$/, '');

export const requestGemini = async (path, payload) => {
  const response = await fetch(`${apiBaseUrl}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  const result = await response.json().catch(() => ({}));
  if (!response.ok || !result.ok) {
    throw new Error(result.message || 'The AI service is temporarily unavailable.');
  }

  return result.text;
};
