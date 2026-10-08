/* global process */
import 'dotenv/config';
import { createServer } from 'node:http';

const port = Number(process.env.PORT || 3002);
const allowedOrigins = (process.env.FRONTEND_ORIGIN || 'http://localhost:5173')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);
const geminiApiKey = process.env.GEMINI_API_KEY;
const modelNames = ['gemini-2.0-flash', 'gemini-2.5-flash', 'gemini-2.0-flash-lite'];
const maxBodySize = 15 * 1024 * 1024;
const hasUsableGeminiKey = geminiApiKey && !geminiApiKey.startsWith('replace-') && !geminiApiKey.startsWith('your-');

const getCorsOrigin = (requestOrigin) => {
  if (!requestOrigin) return allowedOrigins[0] || '*';
  return allowedOrigins.includes('*') || allowedOrigins.includes(requestOrigin)
    ? requestOrigin
    : null;
};

const sendJson = (res, statusCode, payload, requestOrigin) => {
  const corsOrigin = getCorsOrigin(requestOrigin);
  const headers = {
    'Content-Type': 'application/json',
    'Vary': 'Origin',
    'Access-Control-Allow-Methods': 'POST,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type'
  };

  if (corsOrigin) headers['Access-Control-Allow-Origin'] = corsOrigin;
  res.writeHead(statusCode, headers);
  res.end(JSON.stringify(payload));
};

const readJsonBody = (req) => new Promise((resolve, reject) => {
  let body = '';
  req.setEncoding('utf8');

  req.on('data', (chunk) => {
    body += chunk;
    if (body.length > maxBodySize) {
      reject(new Error('Request payload is too large.'));
      req.destroy();
    }
  });
  req.on('end', () => {
    try {
      resolve(JSON.parse(body || '{}'));
    } catch {
      reject(new Error('Invalid JSON payload.'));
    }
  });
  req.on('error', reject);
});

const generateContent = async (contents, responseMimeType) => {
  if (!hasUsableGeminiKey) {
    throw new Error('The Gemini backend is not configured. Set GEMINI_API_KEY.');
  }

  let lastError;
  for (const model of modelNames) {
    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(geminiApiKey)}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents,
            generationConfig: responseMimeType ? { responseMimeType } : undefined
          })
        }
      );

      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(payload.error?.message || `Gemini request failed with status ${response.status}.`);
      }

      const text = payload.candidates?.[0]?.content?.parts
        ?.map((part) => part.text || '')
        .join('')
        .trim();
      if (!text) throw new Error('Gemini returned an empty response.');
      return text;
    } catch (error) {
      lastError = error;
      console.warn(`${model} request failed: ${error.message}`);
    }
  }

  throw new Error(lastError?.message || 'All Gemini models failed.');
};

const endpointConfig = {
  '/api/ai/chat': { responseMimeType: null },
  '/api/ai/analyze-report': { responseMimeType: 'application/json' },
  '/api/ai/analyze-manual': { responseMimeType: 'application/json' },
  '/api/ai/discover-doctors': { responseMimeType: 'application/json' }
};

const server = createServer(async (req, res) => {
  const requestOrigin = req.headers.origin;

  if (req.method === 'OPTIONS') {
    const corsOrigin = getCorsOrigin(requestOrigin);
    if (corsOrigin) res.setHeader('Access-Control-Allow-Origin', corsOrigin);
    res.setHeader('Vary', 'Origin');
    res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.writeHead(204);
    res.end();
    return;
  }

  const config = endpointConfig[req.url];
  if (req.method !== 'POST' || !config) {
    sendJson(res, 404, { ok: false, message: 'Not found.' }, requestOrigin);
    return;
  }

  try {
    const payload = await readJsonBody(req);
    const prompt = typeof payload.prompt === 'string' ? payload.prompt.trim() : '';
    if (!prompt) {
      sendJson(res, 400, { ok: false, message: 'A prompt is required.' }, requestOrigin);
      return;
    }

    const parts = [{ text: prompt }];
    if (payload.file) {
      const { data, mimeType } = payload.file;
      if (typeof data !== 'string' || !data || typeof mimeType !== 'string' || !mimeType) {
        sendJson(res, 400, { ok: false, message: 'A valid file payload is required.' }, requestOrigin);
        return;
      }
      parts.push({ inline_data: { data, mime_type: mimeType } });
    }

    const text = await generateContent([{ parts }], config.responseMimeType);
    sendJson(res, 200, { ok: true, text }, requestOrigin);
  } catch (error) {
    console.error('Gemini API error:', error.message);
    const isBadRequest = error.message.includes('payload') || error.message.includes('prompt') || error.message.includes('file');
    const isConfigurationError = !hasUsableGeminiKey || /api key|backend is not configured|authentication|permission/i.test(error.message);
    const statusCode = isBadRequest ? 400 : isConfigurationError ? 503 : 502;
    sendJson(res, statusCode, {
      ok: false,
      message: isBadRequest
        ? error.message
        : isConfigurationError
          ? 'The AI backend is not configured correctly. Set a valid GEMINI_API_KEY on the server.'
          : 'The AI service is temporarily unavailable. Please try again.'
    }, requestOrigin);
  }
});

server.listen(port, () => {
  console.log(`Gemini API server running at http://localhost:${port}`);
  console.log(`Allowed frontend origins: ${allowedOrigins.join(', ')}`);
});
