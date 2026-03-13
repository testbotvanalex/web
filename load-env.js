const fs = require('fs');
const path = require('path');

const ENV_FILE = path.join(__dirname, '.env');

function stripWrappingQuotes(value) {
  if (!value) return value;

  const first = value[0];
  const last = value[value.length - 1];
  if ((first === '"' || first === "'") && first === last) {
    return value.slice(1, -1);
  }

  return value;
}

function loadEnvFile() {
  if (!fs.existsSync(ENV_FILE)) return;

  const contents = fs.readFileSync(ENV_FILE, 'utf8');
  for (const rawLine of contents.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;

    const separatorIndex = line.indexOf('=');
    if (separatorIndex === -1) continue;

    const key = line.slice(0, separatorIndex).trim();
    if (!key) continue;

    const value = stripWrappingQuotes(line.slice(separatorIndex + 1).trim());
    process.env[key] = value;
  }
}

loadEnvFile();

