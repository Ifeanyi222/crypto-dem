import { Low } from 'lowdb';
import { JSONFile } from 'lowdb/node';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dataDir = path.join(__dirname, 'data');
const file = path.join(dataDir, 'db.json');

const adapter = new JSONFile(file);
const defaultData = { users: [] };
export const db = new Low(adapter, defaultData);

export async function initDB() {
  fs.mkdirSync(dataDir, { recursive: true });
  await db.read();
  db.data ||= defaultData;
  await db.write();
}

// --- User helpers ---
export async function findUserByEmail(email) {
  await db.read();
  return db.data.users.find(u => u.email === email.toLowerCase());
}

export async function findUserById(id) {
  await db.read();
  return db.data.users.find(u => u.id === id);
}

export async function createUser(user) {
  await db.read();
  db.data.users.push(user);
  await db.write();
  return user;
}

export async function updateUser(id, patch) {
  await db.read();
  const user = db.data.users.find(u => u.id === id);
  if (!user) return null;
  Object.assign(user, patch);
  await db.write();
  return user;
}
