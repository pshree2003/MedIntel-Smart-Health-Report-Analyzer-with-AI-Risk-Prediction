const configuredApiBaseUrl = import.meta.env.VITE_API_BASE_URL;
const apiBaseUrl = (configuredApiBaseUrl || (import.meta.env.DEV ? '' : window.location.origin)).replace(/\/$/, '');

export const requestGemini = async (path, payload) => {
  try {
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
  } catch (error) {
    if (error instanceof TypeError) {
      throw new Error('The AI service is not connected. Please configure the public backend URL.');
    }
    throw error;
  }
};
