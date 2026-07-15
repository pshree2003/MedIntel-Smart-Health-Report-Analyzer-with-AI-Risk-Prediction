/* global process */
import { createServer } from 'node:http';
import { existsSync, readFileSync, writeFileSync, appendFileSync } from 'node:fs';
import { resolve } from 'node:path';

const port = 3001;
const projectRoot = process.cwd();
const csvPath = resolve(projectRoot, 'patient_credentials.csv');
const header = 'name,email,password,mobile number\n';

if (!existsSync(csvPath)) {
  writeFileSync(csvPath, header, 'utf8');
} else {
  const currentContent = readFileSync(csvPath, 'utf8');
  if (!currentContent.endsWith('\n')) {
    writeFileSync(csvPath, `${currentContent}\n`, 'utf8');
  }
}

const escapeCsv = (value) => `"${String(value ?? '').replace(/"/g, '""')}"`;

const sendJson = (res, statusCode, payload) => {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type'
  });
  res.end(JSON.stringify(payload));
};

const server = createServer((req, res) => {
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    });
    res.end();
    return;
  }

  if (req.method === 'GET' && req.url === '/api/credentials') {
    sendJson(res, 200, {
      ok: true,
      file: csvPath,
      content: readFileSync(csvPath, 'utf8')
    });
    return;
  }

  if (req.method === 'POST' && req.url === '/api/credentials') {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk;
      if (body.length > 1_000_000) {
        req.destroy();
      }
    });

    req.on('end', () => {
      try {
        const payload = JSON.parse(body || '{}');
        const name = String(payload.name || '').trim();
        const email = String(payload.email || '').trim().toLowerCase();
        const password = String(payload.password || '');
        const phone = String(payload.phone || '').trim();

        if (!name || !email || !password || !phone) {
          sendJson(res, 400, { ok: false, message: 'name, email, password, and phone are required.' });
          return;
        }

        const currentContent = readFileSync(csvPath, 'utf8');
        if (!currentContent.endsWith('\n')) {
          writeFileSync(csvPath, `${currentContent}\n`, 'utf8');
        }

        const row = [escapeCsv(name), escapeCsv(email), escapeCsv(password), escapeCsv(phone)].join(',') + '\n';
        appendFileSync(csvPath, row, 'utf8');

        sendJson(res, 200, { ok: true, file: csvPath });
      } catch {
        sendJson(res, 400, { ok: false, message: 'Invalid JSON payload.' });
      }
    });

    return;
  }

  sendJson(res, 404, { ok: false, message: 'Not found' });
});

server.listen(port, () => {
  console.log(`Credential CSV server running at http://localhost:${port}`);
  console.log(`Writing to ${csvPath}`);
});