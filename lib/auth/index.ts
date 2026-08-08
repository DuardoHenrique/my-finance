import { cookies } from 'next/headers';
import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';
import { neon } from '@neondatabase/serverless';
import { initPostgresDatabase } from '../db/initDb';

export interface User {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  createdAt: string;
}

export interface SessionUser {
  id: string;
  name: string;
  email: string;
}

const USERS_FILE_PATH = path.join(process.cwd(), 'lib', 'db', 'users.json');
const SESSION_COOKIE_NAME = 'myfinance_session';
const SECRET_KEY = process.env.JWT_SECRET || 'myfinance-secret-key-2026-antigravity';
const databaseUrl = process.env.DATABASE_URL || process.env.NEON_DATABASE_URL;
const isValidPostgresUrl = typeof databaseUrl === 'string' && databaseUrl.startsWith('postgres');

let dbInitialized = false;
async function checkAndInitDb() {
  if (!dbInitialized && isValidPostgresUrl) {
    dbInitialized = true;
    await initPostgresDatabase();
  }
}

async function ensureUsersFile() {
  try {
    await fs.access(USERS_FILE_PATH);
  } catch {
    await fs.mkdir(path.dirname(USERS_FILE_PATH), { recursive: true });
    await fs.writeFile(USERS_FILE_PATH, JSON.stringify([], null, 2), 'utf8');
  }
}

export async function getUsers(): Promise<User[]> {
  await checkAndInitDb();

  if (isValidPostgresUrl) {
    try {
      const sql = neon(databaseUrl!);
      const rows = await sql`
        SELECT id, name, email, password_hash as "passwordHash", created_at as "createdAt"
        FROM users
      `;
      return rows as User[];
    } catch (err) {
      console.error('PostgreSQL getUsers error, falling back to JSON:', err);
    }
  }

  await ensureUsersFile();
  try {
    const data = await fs.readFile(USERS_FILE_PATH, 'utf8');
    return JSON.parse(data);
  } catch {
    return [];
  }
}

async function saveUsers(users: User[]) {
  await ensureUsersFile();
  await fs.writeFile(USERS_FILE_PATH, JSON.stringify(users, null, 2), 'utf8');
}

const PASSWORD_SALT = 'myfinance_password_salt_2026';

export function hashPassword(password: string): string {
  return crypto.createHmac('sha256', PASSWORD_SALT).update(password).digest('hex');
}

export function createToken(payload: SessionUser): string {
  const data = JSON.stringify({ ...payload, exp: Date.now() + 7 * 24 * 60 * 60 * 1000 });
  const base64Data = Buffer.from(data).toString('base64url');
  const signature = crypto.createHmac('sha256', SECRET_KEY).update(base64Data).digest('base64url');
  return `${base64Data}.${signature}`;
}

export function verifyToken(token: string): SessionUser | null {
  try {
    const [base64Data, signature] = token.split('.');
    if (!base64Data || !signature) return null;

    const expectedSignature = crypto.createHmac('sha256', SECRET_KEY).update(base64Data).digest('base64url');
    if (signature !== expectedSignature) return null;

    const decoded = JSON.parse(Buffer.from(base64Data, 'base64url').toString('utf8'));
    if (decoded.exp && Date.now() > decoded.exp) return null;

    return {
      id: decoded.id,
      name: decoded.name,
      email: decoded.email,
    };
  } catch {
    return null;
  }
}

export async function registerUser(name: string, email: string, password: string): Promise<{ success: boolean; user?: SessionUser; error?: string }> {
  await checkAndInitDb();
  const normalizedEmail = email.trim().toLowerCase();

  if (isValidPostgresUrl) {
    try {
      const sql = neon(databaseUrl!);
      const existing = await sql`SELECT id FROM users WHERE LOWER(email) = ${normalizedEmail}`;
      if (existing.length > 0) {
        return { success: false, error: 'Este e-mail já está cadastrado.' };
      }

      const newUser: User = {
        id: `usr_${Math.random().toString(36).substring(2, 9)}_${Date.now().toString(36)}`,
        name: name.trim(),
        email: normalizedEmail,
        passwordHash: hashPassword(password),
        createdAt: new Date().toISOString(),
      };

      await sql`
        INSERT INTO users (id, name, email, password_hash, created_at)
        VALUES (${newUser.id}, ${newUser.name}, ${newUser.email}, ${newUser.passwordHash}, ${newUser.createdAt});
      `;

      const sessionUser: SessionUser = { id: newUser.id, name: newUser.name, email: newUser.email };
      return { success: true, user: sessionUser };
    } catch (err: any) {
      console.error('PostgreSQL registerUser error, falling back to JSON:', err);
    }
  }

  // Fallback JSON
  const users = await getUsers();
  if (users.some(u => u.email.toLowerCase() === normalizedEmail)) {
    return { success: false, error: 'Este e-mail já está cadastrado.' };
  }

  const newUser: User = {
    id: `usr_${Math.random().toString(36).substring(2, 9)}_${Date.now().toString(36)}`,
    name: name.trim(),
    email: normalizedEmail,
    passwordHash: hashPassword(password),
    createdAt: new Date().toISOString(),
  };

  users.push(newUser);
  await saveUsers(users);

  const sessionUser: SessionUser = { id: newUser.id, name: newUser.name, email: newUser.email };
  return { success: true, user: sessionUser };
}

export async function authenticateUser(email: string, password: string): Promise<{ success: boolean; user?: SessionUser; error?: string }> {
  await checkAndInitDb();
  const normalizedEmail = email.trim().toLowerCase();

  if (isValidPostgresUrl) {
    try {
      const sql = neon(databaseUrl!);
      const rows = await sql`
        SELECT id, name, email, password_hash as "passwordHash" 
        FROM users 
        WHERE LOWER(email) = ${normalizedEmail}
      `;
      if (rows.length === 0 || rows[0].passwordHash !== hashPassword(password)) {
        return { success: false, error: 'E-mail ou senha incorretos.' };
      }

      const user = rows[0];
      const sessionUser: SessionUser = { id: user.id, name: user.name, email: user.email };
      return { success: true, user: sessionUser };
    } catch (err: any) {
      console.error('PostgreSQL authenticateUser error, falling back to JSON:', err);
    }
  }

  // Fallback JSON
  const users = await getUsers();
  const user = users.find(u => u.email.toLowerCase() === normalizedEmail);

  if (!user || user.passwordHash !== hashPassword(password)) {
    return { success: false, error: 'E-mail ou senha incorretos.' };
  }

  const sessionUser: SessionUser = { id: user.id, name: user.name, email: user.email };
  return { success: true, user: sessionUser };
}

export async function getSessionUser(): Promise<SessionUser | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
    if (!token) return null;
    return verifyToken(token);
  } catch {
    return null;
  }
}

export async function setSessionCookie(user: SessionUser) {
  const cookieStore = await cookies();
  const token = createToken(user);
  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 7 * 24 * 60 * 60, // 7 days
  });
}

export async function clearSessionCookie() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
}
