import sqlite3
import os
import json
import time
from datetime import datetime, timezone
from typing import List, Dict, Any, Optional

DB_PATH = os.environ.get("FINGUARD_DB_PATH", os.path.join(os.path.dirname(os.path.dirname(__file__)), "finguard.db"))

def get_connection():
    os.makedirs(os.path.dirname(os.path.abspath(DB_PATH)), exist_ok=True)
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    """Initialize SQLite database tables if they do not exist."""
    with get_connection() as conn:
        cursor = conn.cursor()
        
        # Caller Profiles / Users table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS users (
                user_id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                language_preference TEXT DEFAULT 'Hinglish',
                facts TEXT NOT NULL DEFAULT '{}',
                last_interaction TEXT NOT NULL,
                created_at TEXT DEFAULT (datetime('now'))
            );
        """)

        # Sessions table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS sessions (
                id TEXT PRIMARY KEY,
                room_name TEXT NOT NULL,
                user_id TEXT,
                agent_name TEXT DEFAULT 'my-agent',
                status TEXT NOT NULL DEFAULT 'active',
                started_at TEXT NOT NULL,
                ended_at TEXT,
                duration_seconds REAL DEFAULT 0,
                total_messages INTEGER DEFAULT 0,
                summary TEXT,
                created_at TEXT DEFAULT (datetime('now')),
                FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE SET NULL
            );
        """)
        
        # Add user_id column to sessions if existing database didn't have it
        try:
            cursor.execute("ALTER TABLE sessions ADD COLUMN user_id TEXT;")
        except Exception:
            pass
        
        # Messages / Transcripts table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS messages (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                session_id TEXT NOT NULL,
                role TEXT NOT NULL,
                content TEXT NOT NULL,
                created_at TEXT DEFAULT (datetime('now')),
                FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE
            );
        """)

        # Safety & Scam alerts log table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS safety_logs (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                session_id TEXT NOT NULL,
                event_type TEXT NOT NULL,
                detail TEXT NOT NULL,
                timestamp TEXT DEFAULT (datetime('now')),
                FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE
            );
        """)

        # User feedback ratings table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS user_feedback (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                session_id TEXT NOT NULL,
                rating INTEGER CHECK(rating >= 1 AND rating <= 5),
                feedback_text TEXT,
                created_at TEXT DEFAULT (datetime('now')),
                FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE
            );
        """)

        # Seed default caller if empty
        cursor.execute("SELECT COUNT(*) as count FROM users")
        if cursor.fetchone()["count"] == 0:
            default_facts = json.dumps({
                "schemes_checked": ["Financial fraud"],
                "eligibility_answers": {
                    "received_suspicious_call": True,
                    "fraud_type": "Fake OTP / KYC Call",
                    "bank_account_linked": "Jan Dhan Savings Account"
                },
                "scam_awareness_topics": ["UPI Scam Warning", "Fake Caller OTP Refusal"]
            })
            now_iso = datetime.now(timezone.utc).isoformat()
            cursor.execute("""
                INSERT INTO users (user_id, name, language_preference, facts, last_interaction)
                VALUES (?, ?, ?, ?, ?)
            """, ("usr_1001", "Mohit Kumar", "Hindi", default_facts, now_iso))

        conn.commit()

def create_session(session_id: str, room_name: str, agent_name: str = "my-agent") -> Dict[str, Any]:
    now_iso = datetime.now(timezone.utc).isoformat()
    init_db()
    with get_connection() as conn:
        cursor = conn.cursor()
        cursor.execute(
            """
            INSERT OR REPLACE INTO sessions (id, room_name, agent_name, status, started_at)
            VALUES (?, ?, ?, 'active', ?)
            """,
            (session_id, room_name, agent_name, now_iso)
        )
        conn.commit()
    return {"id": session_id, "room_name": room_name, "status": "active", "started_at": now_iso}

def end_session(session_id: str, status: str = "completed", summary: Optional[str] = None) -> Optional[Dict[str, Any]]:
    now_dt = datetime.now(timezone.utc)
    now_iso = now_dt.isoformat()
    with get_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT started_at FROM sessions WHERE id = ?", (session_id,))
        row = cursor.fetchone()
        
        duration = 0.0
        if row and row["started_at"]:
            try:
                start_dt = datetime.fromisoformat(row["started_at"])
                duration = round((now_dt - start_dt).total_seconds(), 1)
            except Exception:
                pass
                
        cursor.execute("SELECT COUNT(*) as count FROM messages WHERE session_id = ?", (session_id,))
        msg_row = cursor.fetchone()
        msg_count = msg_row["count"] if msg_row else 0

        cursor.execute(
            """
            UPDATE sessions
            SET status = ?, ended_at = ?, duration_seconds = ?, total_messages = ?, summary = ?
            WHERE id = ?
            """,
            (status, now_iso, duration, msg_count, summary, session_id)
        )
        conn.commit()
    return {"id": session_id, "status": status, "duration_seconds": duration, "total_messages": msg_count}

def log_message(session_id: str, role: str, content: str) -> int:
    if not content or not content.strip():
        return -1
    init_db()
    with get_connection() as conn:
        cursor = conn.cursor()
        cursor.execute(
            """
            INSERT INTO messages (session_id, role, content)
            VALUES (?, ?, ?)
            """,
            (session_id, role, content.strip())
        )
        msg_id = cursor.lastrowid
        # Update total messages on session
        cursor.execute(
            "UPDATE sessions SET total_messages = total_messages + 1 WHERE id = ?",
            (session_id,)
        )
        conn.commit()
        return msg_id or -1

def log_safety_event(session_id: str, event_type: str, detail: str) -> int:
    init_db()
    with get_connection() as conn:
        cursor = conn.cursor()
        cursor.execute(
            """
            INSERT INTO safety_logs (session_id, event_type, detail)
            VALUES (?, ?, ?)
            """,
            (session_id, event_type, detail)
        )
        conn.commit()
        return cursor.lastrowid or -1

def save_user_feedback(session_id: str, rating: int, feedback_text: Optional[str] = None) -> int:
    init_db()
    with get_connection() as conn:
        cursor = conn.cursor()
        cursor.execute(
            """
            INSERT INTO user_feedback (session_id, rating, feedback_text)
            VALUES (?, ?, ?)
            """,
            (session_id, rating, feedback_text)
        )
        conn.commit()
        return cursor.lastrowid or -1

def get_recent_sessions(limit: int = 50) -> List[Dict[str, Any]]:
    init_db()
    with get_connection() as conn:
        cursor = conn.cursor()
        cursor.execute(
            """
            SELECT id, room_name, agent_name, status, started_at, ended_at, duration_seconds, total_messages, summary, created_at
            FROM sessions
            ORDER BY created_at DESC
            LIMIT ?
            """,
            (limit,)
        )
        rows = cursor.fetchall()
        return [dict(r) for r in rows]

def get_session_details(session_id: str) -> Dict[str, Any]:
    init_db()
    with get_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM sessions WHERE id = ?", (session_id,))
        session_row = cursor.fetchone()
        if not session_row:
            return {}
        
        cursor.execute("SELECT * FROM messages WHERE session_id = ? ORDER BY id ASC", (session_id,))
        messages = [dict(m) for m in cursor.fetchall()]
        
        cursor.execute("SELECT * FROM safety_logs WHERE session_id = ? ORDER BY id ASC", (session_id,))
        safety_logs = [dict(s) for s in cursor.fetchall()]
        
        cursor.execute("SELECT * FROM user_feedback WHERE session_id = ? ORDER BY id ASC", (session_id,))
        feedback = [dict(f) for f in cursor.fetchall()]

        result = dict(session_row)
        result["messages"] = messages
        result["safety_logs"] = safety_logs
        result["feedback"] = feedback
        return result

def get_analytics_stats() -> Dict[str, Any]:
    init_db()
    with get_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT COUNT(*) as total FROM sessions")
        total_sessions = cursor.fetchone()["total"]
        
        cursor.execute("SELECT COUNT(*) as total FROM messages")
        total_messages = cursor.fetchone()["total"]

        cursor.execute("SELECT COUNT(*) as total FROM safety_logs")
        safety_events = cursor.fetchone()["total"]

        cursor.execute("SELECT AVG(rating) as avg_rating FROM user_feedback")
        avg_rating_row = cursor.fetchone()
        avg_rating = round(avg_rating_row["avg_rating"], 2) if avg_rating_row and avg_rating_row["avg_rating"] else None

        return {
            "total_sessions": total_sessions,
            "total_messages": total_messages,
            "safety_events_triggered": safety_events,
            "average_rating": avg_rating,
        }

def upsert_user_profile(
    user_id: str,
    name: str,
    language_preference: str = "Hinglish",
    facts: Optional[Dict[str, Any]] = None,
    last_interaction: Optional[str] = None
) -> Dict[str, Any]:
    init_db()
    if not last_interaction:
        last_interaction = datetime.now(timezone.utc).isoformat()
    if facts is None:
        facts = {}

    facts_json = json.dumps(facts) if isinstance(facts, dict) else str(facts)

    with get_connection() as conn:
        cursor = conn.cursor()
        cursor.execute(
            """
            INSERT INTO users (user_id, name, language_preference, facts, last_interaction)
            VALUES (?, ?, ?, ?, ?)
            ON CONFLICT(user_id) DO UPDATE SET
                name = excluded.name,
                language_preference = excluded.language_preference,
                facts = excluded.facts,
                last_interaction = excluded.last_interaction
            """,
            (user_id, name, language_preference, facts_json, last_interaction)
        )
        conn.commit()

    return {
        "user_id": user_id,
        "name": name,
        "language_preference": language_preference,
        "facts": facts,
        "last_interaction": last_interaction,
    }

def get_user_profile(user_id: str) -> Optional[Dict[str, Any]]:
    init_db()
    with get_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM users WHERE user_id = ?", (user_id,))
        row = cursor.fetchone()
        if not row:
            return None
        user_dict = dict(row)
        try:
            user_dict["facts"] = json.loads(user_dict["facts"])
        except Exception:
            user_dict["facts"] = {}
        return user_dict

def get_all_users() -> List[Dict[str, Any]]:
    init_db()
    with get_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT user_id, name, language_preference, facts, last_interaction, created_at FROM users ORDER BY last_interaction DESC")
        rows = cursor.fetchall()
        result = []
        for r in rows:
            u = dict(r)
            try:
                u["facts"] = json.loads(u["facts"])
            except Exception:
                u["facts"] = {}
            result.append(u)
        return result

def record_user_scheme_inquiry(user_id: str, scheme_name: str, eligibility_facts: Optional[Dict[str, Any]] = None):
    init_db()
    profile = get_user_profile(user_id)
    if not profile:
        profile = upsert_user_profile(user_id, "Mohit Kumar", "Hindi", {})

    facts = profile.get("facts", {})
    if not isinstance(facts, dict):
        facts = {}

    schemes = facts.get("schemes_checked", [])
    if scheme_name and scheme_name not in schemes:
        schemes.append(scheme_name)
    facts["schemes_checked"] = schemes

    if eligibility_facts and isinstance(eligibility_facts, dict):
        existing_eligibility = facts.get("eligibility_answers", {})
        existing_eligibility.update(eligibility_facts)
        facts["eligibility_answers"] = existing_eligibility

    upsert_user_profile(
        user_id=user_id,
        name=profile.get("name", "Mohit Kumar"),
        language_preference=profile.get("language_preference", "Hindi"),
        facts=facts,
        last_interaction=datetime.now(timezone.utc).isoformat()
    )

