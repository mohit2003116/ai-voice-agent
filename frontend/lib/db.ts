import { DatabaseSync } from 'node:sqlite';
import path from 'path';
import fs from 'fs';

const getDbPath = () => {
  if (process.env.FINGUARD_DB_PATH) {
    return process.env.FINGUARD_DB_PATH;
  }
  // Default to backend/finguard.db relative to frontend directory
  return path.resolve(process.cwd(), '../backend/finguard.db');
};

let dbInstance: DatabaseSync | null = null;

export function getDb(): DatabaseSync {
  if (!dbInstance) {
    const dbPath = getDbPath();
    const dbDir = path.dirname(dbPath);
    if (!fs.existsSync(dbDir)) {
      fs.mkdirSync(dbDir, { recursive: true });
    }

    dbInstance = new DatabaseSync(dbPath);

    // Initialize tables if backend hasn't run yet
    dbInstance.exec(`
      CREATE TABLE IF NOT EXISTS sessions (
        id TEXT PRIMARY KEY,
        room_name TEXT NOT NULL,
        agent_name TEXT DEFAULT 'my-agent',
        status TEXT NOT NULL DEFAULT 'active',
        started_at TEXT NOT NULL,
        ended_at TEXT,
        duration_seconds REAL DEFAULT 0,
        total_messages INTEGER DEFAULT 0,
        summary TEXT,
        created_at TEXT DEFAULT (datetime('now'))
      );

      CREATE TABLE IF NOT EXISTS messages (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        session_id TEXT NOT NULL,
        role TEXT NOT NULL,
        content TEXT NOT NULL,
        created_at TEXT DEFAULT (datetime('now')),
        FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS safety_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        session_id TEXT NOT NULL,
        event_type TEXT NOT NULL,
        detail TEXT NOT NULL,
        timestamp TEXT DEFAULT (datetime('now')),
        FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS users (
        user_id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        language_preference TEXT DEFAULT 'Hinglish',
        facts TEXT NOT NULL DEFAULT '{}',
        last_interaction TEXT NOT NULL,
        created_at TEXT DEFAULT (datetime('now'))
      );

      CREATE TABLE IF NOT EXISTS user_feedback (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        session_id TEXT NOT NULL,
        rating INTEGER CHECK(rating >= 1 AND rating <= 5),
        feedback_text TEXT,
        created_at TEXT DEFAULT (datetime('now')),
        FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE
      );
    `);
  }
  return dbInstance;
}

export interface UserRecord {
  user_id: string;
  name: string;
  language_preference: string;
  facts: {
    schemes_checked?: string[];
    eligibility_answers?: Record<string, any>;
    [key: string]: any;
  };
  last_interaction: string;
  created_at: string;
}

export interface SessionRecord {
  id: string;
  room_name: string;
  agent_name: string;
  status: string;
  started_at: string;
  ended_at: string | null;
  duration_seconds: number;
  total_messages: number;
  summary: string | null;
  created_at: string;
}

export interface MessageRecord {
  id: number;
  session_id: string;
  role: string;
  content: string;
  created_at: string;
}

export interface SafetyLogRecord {
  id: number;
  session_id: string;
  event_type: string;
  detail: string;
  timestamp: string;
}

export interface FeedbackRecord {
  id: number;
  session_id: string;
  rating: number;
  feedback_text: string | null;
  created_at: string;
}

export function getRecentSessions(limit = 50): SessionRecord[] {
  const db = getDb();
  const query = db.prepare(`
    SELECT id, room_name, agent_name, status, started_at, ended_at, duration_seconds, total_messages, summary, created_at
    FROM sessions
    ORDER BY created_at DESC
    LIMIT ?
  `);
  return query.all(limit) as unknown as SessionRecord[];
}

export function getUsers(): UserRecord[] {
  const db = getDb();
  const query = db.prepare(`
    SELECT user_id, name, language_preference, facts, last_interaction, created_at
    FROM users
    ORDER BY last_interaction DESC
  `);
  const rows = query.all() as any[];
  return rows.map((r) => {
    let parsedFacts = {};
    try {
      parsedFacts = typeof r.facts === 'string' ? JSON.parse(r.facts) : r.facts;
    } catch {
      parsedFacts = {};
    }
    return {
      ...r,
      facts: parsedFacts,
    };
  });
}

export function getSessionDetails(sessionId: string) {
  const db = getDb();
  const sessionQuery = db.prepare(`SELECT * FROM sessions WHERE id = ?`);
  const session = sessionQuery.get(sessionId) as unknown as SessionRecord | undefined;

  if (!session) {
    return null;
  }

  const messagesQuery = db.prepare(`SELECT * FROM messages WHERE session_id = ? ORDER BY id ASC`);
  const messages = messagesQuery.all(sessionId) as unknown as MessageRecord[];

  const safetyQuery = db.prepare(`SELECT * FROM safety_logs WHERE session_id = ? ORDER BY id ASC`);
  const safetyLogs = safetyQuery.all(sessionId) as unknown as SafetyLogRecord[];

  const feedbackQuery = db.prepare(`SELECT * FROM user_feedback WHERE session_id = ? ORDER BY id ASC`);
  const feedback = feedbackQuery.all(sessionId) as unknown as FeedbackRecord[];

  return {
    session,
    messages,
    safetyLogs,
    feedback,
  };
}

export function saveUserFeedback(sessionId: string, rating: number, feedbackText?: string) {
  const db = getDb();
  const insert = db.prepare(`
    INSERT INTO user_feedback (session_id, rating, feedback_text)
    VALUES (?, ?, ?)
  `);
  insert.run(sessionId, rating, feedbackText || null);
  return { success: true };
}

export function getAnalyticsStats() {
  const db = getDb();
  const totalSessionsStmt = db.prepare(`SELECT COUNT(*) as count FROM sessions`);
  const totalSessions = (totalSessionsStmt.get() as any)?.count || 0;

  const totalMessagesStmt = db.prepare(`SELECT COUNT(*) as count FROM messages`);
  const totalMessages = (totalMessagesStmt.get() as any)?.count || 0;

  const safetyEventsStmt = db.prepare(`SELECT COUNT(*) as count FROM safety_logs`);
  const safetyEvents = (safetyEventsStmt.get() as any)?.count || 0;

  const totalUsersStmt = db.prepare(`SELECT COUNT(*) as count FROM users`);
  const totalUsers = (totalUsersStmt.get() as any)?.count || 0;

  const avgRatingStmt = db.prepare(`SELECT AVG(rating) as avg_rating FROM user_feedback`);
  const avgRatingRes = avgRatingStmt.get() as any;
  const avgRating = avgRatingRes?.avg_rating ? Math.round(avgRatingRes.avg_rating * 100) / 100 : null;

  return {
    totalSessions,
    totalMessages,
    safetyEvents,
    totalUsers,
    avgRating,
  };
}
