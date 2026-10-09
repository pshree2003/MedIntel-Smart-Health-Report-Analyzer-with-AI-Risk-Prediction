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
      if (response.status === 404 && !import.meta.env.DEV && !configuredApiBaseUrl) {
        throw new Error('The public AI backend URL is not configured. Set VITE_API_BASE_URL and redeploy the frontend.');
      }
      if (response.status === 404) {
        throw new Error('The configured AI backend endpoint was not found. Check VITE_API_BASE_URL.');
      }
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
