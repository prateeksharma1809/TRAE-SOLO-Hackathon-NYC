import { randomBytes } from 'crypto';
import { promisify } from 'util';
import { scrypt, timingSafeEqual } from 'crypto';

const scryptAsync = promisify(scrypt);

export interface Session {
  id: string;
  userId: string;
  createdAt: Date;
  expiresAt: Date;
}

// In-memory session store (in production, use Redis or database)
const sessions = new Map<string, Session>();

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString('hex');
  const derivedKey = await scryptAsync(password, salt, 64) as Buffer;
  return salt + ':' + derivedKey.toString('hex');
}

export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  const [salt, key] = hashedPassword.split(':');
  const keyBuffer = Buffer.from(key, 'hex');
  const derivedKey = await scryptAsync(password, salt, 64) as Buffer;
  
  return timingSafeEqual(keyBuffer, derivedKey);
}

export async function createSession(userId: string): Promise<Session> {
  const sessionId = randomBytes(32).toString('hex');
  const session: Session = {
    id: sessionId,
    userId,
    createdAt: new Date(),
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
  };
  
  sessions.set(sessionId, session);
  return session;
}

export async function getSession(sessionId: string): Promise<Session | null> {
  const session = sessions.get(sessionId);
  
  if (!session) {
    return null;
  }
  
  if (session.expiresAt < new Date()) {
    sessions.delete(sessionId);
    return null;
  }
  
  return session;
}

export async function deleteSession(sessionId: string): Promise<void> {
  sessions.delete(sessionId);
}