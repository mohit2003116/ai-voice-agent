import json
import os
import re
import sqlite3
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional

DB_PATH = os.environ.get(
    "FINGUARD_DB_PATH",
    os.path.join(os.path.dirname(os.path.dirname(__file__)), "finguard.db"),
)


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
                opted_out INTEGER DEFAULT 0,
                last_interaction TEXT NOT NULL,
                created_at TEXT DEFAULT (datetime('now'))
            );
        """)

        try:
            cursor.execute("ALTER TABLE users ADD COLUMN opted_out INTEGER DEFAULT 0;")
        except Exception:
            pass

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

        # Human escalation requests table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS escalations (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                reference_id TEXT NOT NULL UNIQUE,
                user_id TEXT,
                session_id TEXT,
                issue_type TEXT NOT NULL,
                short_summary TEXT NOT NULL,
                urgency TEXT NOT NULL DEFAULT 'medium',
                language TEXT NOT NULL DEFAULT 'Hindi',
                preferred_followup_method TEXT NOT NULL DEFAULT 'phone_call',
                status TEXT NOT NULL DEFAULT 'open',
                created_at TEXT DEFAULT (datetime('now'))
            );
        """)

        # Migration: ensure status column exists if table was created previously
        cursor.execute("PRAGMA table_info(escalations)")
        esc_columns = [row["name"] for row in cursor.fetchall()]
        if "status" not in esc_columns:
            cursor.execute("ALTER TABLE escalations ADD COLUMN status TEXT NOT NULL DEFAULT 'open'")

        # Seed default caller if empty
        cursor.execute("SELECT COUNT(*) as count FROM users")
        if cursor.fetchone()["count"] == 0:
            default_facts = json.dumps(
                {
                    "schemes_checked": ["PM Kisan Samman Nidhi"],
                    "eligible_scheme": "PM Kisan Samman Nidhi",
                    "scheme_code": "pm_kisan",
                    "eligibility_status": "eligible",
                    "deadline_date": "15 August 2026",
                    "approaching_deadline": True,
                    "eligibility_answers": {
                        "is_small_farmer": True,
                        "land_holding_hectares": 1.5,
                        "bank_account_linked": "Jan Dhan Savings Account",
                    },
                    "scam_awareness_topics": [
                        "UPI Scam Warning",
                        "Fake Caller OTP Refusal",
                    ],
                }
            )
            now_iso = datetime.now(timezone.utc).isoformat()
            cursor.execute(
                """
                INSERT INTO users (user_id, name, language_preference, facts, last_interaction)
                VALUES (?, ?, ?, ?, ?)
            """,
                ("usr_1001", "Mohit Kumar", "Hindi", default_facts, now_iso),
            )

        conn.commit()


def create_session(
    session_id: str, room_name: str, agent_name: str = "my-agent"
) -> Dict[str, Any]:
    now_iso = datetime.now(timezone.utc).isoformat()
    init_db()
    with get_connection() as conn:
        cursor = conn.cursor()
        cursor.execute(
            """
            INSERT OR REPLACE INTO sessions (id, room_name, agent_name, status, started_at)
            VALUES (?, ?, ?, 'active', ?)
            """,
            (session_id, room_name, agent_name, now_iso),
        )
        conn.commit()
    return {
        "id": session_id,
        "room_name": room_name,
        "status": "active",
        "started_at": now_iso,
    }


def end_session(
    session_id: str, status: str = "completed", summary: Optional[str] = None
) -> Optional[Dict[str, Any]]:
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

        cursor.execute(
            "SELECT COUNT(*) as count FROM messages WHERE session_id = ?", (session_id,)
        )
        msg_row = cursor.fetchone()
        msg_count = msg_row["count"] if msg_row else 0

        cursor.execute(
            """
            UPDATE sessions
            SET status = ?, ended_at = ?, duration_seconds = ?, total_messages = ?, summary = ?
            WHERE id = ?
            """,
            (status, now_iso, duration, msg_count, summary, session_id),
        )
        conn.commit()
    return {
        "id": session_id,
        "status": status,
        "duration_seconds": duration,
        "total_messages": msg_count,
    }


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
            (session_id, role, content.strip()),
        )
        msg_id = cursor.lastrowid
        # Update total messages on session
        cursor.execute(
            "UPDATE sessions SET total_messages = total_messages + 1 WHERE id = ?",
            (session_id,),
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
            (session_id, event_type, detail),
        )
        conn.commit()
        return cursor.lastrowid or -1


def save_user_feedback(
    session_id: str, rating: int, feedback_text: Optional[str] = None
) -> int:
    init_db()
    with get_connection() as conn:
        cursor = conn.cursor()
        cursor.execute(
            """
            INSERT INTO user_feedback (session_id, rating, feedback_text)
            VALUES (?, ?, ?)
            """,
            (session_id, rating, feedback_text),
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
            (limit,),
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

        cursor.execute(
            "SELECT * FROM messages WHERE session_id = ? ORDER BY id ASC", (session_id,)
        )
        messages = [dict(m) for m in cursor.fetchall()]

        cursor.execute(
            "SELECT * FROM safety_logs WHERE session_id = ? ORDER BY id ASC",
            (session_id,),
        )
        safety_logs = [dict(s) for s in cursor.fetchall()]

        cursor.execute(
            "SELECT * FROM user_feedback WHERE session_id = ? ORDER BY id ASC",
            (session_id,),
        )
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
        avg_rating = (
            round(avg_rating_row["avg_rating"], 2)
            if avg_rating_row and avg_rating_row["avg_rating"]
            else None
        )

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
    last_interaction: Optional[str] = None,
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
            (user_id, name, language_preference, facts_json, last_interaction),
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
        cursor.execute(
            "SELECT user_id, name, language_preference, facts, last_interaction, created_at FROM users ORDER BY last_interaction DESC"
        )
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


def record_user_scheme_inquiry(
    user_id: str, scheme_name: str, eligibility_facts: Optional[Dict[str, Any]] = None
):
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
        last_interaction=datetime.now(timezone.utc).isoformat(),
    )


def set_user_opt_out(user_id: str, opted_out: bool = True) -> bool:
    """Set opt-out preference for a user to block or allow future outbound call reminders."""
    init_db()
    with get_connection() as conn:
        cursor = conn.cursor()
        cursor.execute(
            "UPDATE users SET opted_out = ? WHERE user_id = ?",
            (1 if opted_out else 0, user_id),
        )
        conn.commit()
        return cursor.rowcount > 0


def sanitize_sensitive_data(text: str) -> str:
    """Sanitize sensitive financial credentials like OTP, PIN, CVV, password, account number, or card number."""
    if not text:
        return text

    sanitized = text

    # Redact keyword phrases like "OTP is 123456", "OTP: 123456", "my PIN is 1234", "CVV is 999", "password is secret"
    sanitized = re.sub(
        r"(?i)\b(otp|one[- ]time[- ]password|verification code)\s*(?:is|code|number)?\s*[:=]*\s*\d{4,8}\b",
        r"\1: [REDACTED_OTP]",
        sanitized,
    )
    sanitized = re.sub(
        r"(?i)\b(upi pin|atm pin|secret pin|pin)\s*(?:is|code|number)?\s*[:=]*\s*\d{4,6}\b",
        r"\1: [REDACTED_PIN]",
        sanitized,
    )
    sanitized = re.sub(
        r"(?i)\b(cvv2?|cvc)\s*(?:is|code|number)?\s*[:=]*\s*\d{3,4}\b",
        r"\1: [REDACTED_CVV]",
        sanitized,
    )
    sanitized = re.sub(
        r"(?i)\b(password|passcode|pwd)\s*(?:is|code)?\s*[:=]*\s*\S+",
        r"\1: [REDACTED_PASSWORD]",
        sanitized,
    )

    # Redact 13-19 digit card numbers (allowing spaces or hyphens)
    sanitized = re.sub(
        r"\b(?:\d[ -]*?){13,19}\b",
        "[REDACTED_CARD]",
        sanitized,
    )

    # Redact 9-18 digit standalone account numbers
    sanitized = re.sub(
        r"\b\d{9,18}\b",
        "[REDACTED_ACCOUNT]",
        sanitized,
    )

    # Redact any remaining numbers/digits that directly follow sensitive terms
    sanitized = re.sub(
        r"(?i)\b(otp|pin|cvv|password|passcode)\b[^\d\n]*?\b\d{3,8}\b",
        r"\1: [REDACTED]",
        sanitized,
    )

    return sanitized


def create_escalation(
    issue_type: str,
    short_summary: str,
    urgency: str = "medium",
    language: str = "Hindi",
    preferred_followup_method: str = "phone_call",
    user_id: Optional[str] = "usr_1001",
    session_id: Optional[str] = None,
    reference_id: Optional[str] = None,
) -> Dict[str, Any]:
    """Create a human-help request record with reference ID, issue type, short summary, urgency, language, preferred follow-up method, and timestamp.

    Guarantees that sensitive data (OTP, PIN, CVV, password, account number, card number) is NOT stored.
    """
    init_db()

    now_dt = datetime.now(timezone.utc)
    timestamp = now_dt.isoformat()

    if not reference_id:
        year_str = now_dt.strftime("%Y")
        with get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT COUNT(*) as count FROM escalations")
            count_row = cursor.fetchone()
            next_id = (count_row["count"] + 1) if count_row else 1
            while True:
                candidate = f"FG-{year_str}-{next_id:03d}"
                cursor.execute("SELECT 1 FROM escalations WHERE reference_id = ?", (candidate,))
                if not cursor.fetchone():
                    reference_id = candidate
                    break
                next_id += 1

    clean_issue_type = sanitize_sensitive_data(issue_type.strip() if issue_type else "general_human_help")
    clean_summary = sanitize_sensitive_data(short_summary.strip() if short_summary else "Human help requested")
    clean_urgency = sanitize_sensitive_data(urgency.strip() if urgency else "medium")
    clean_language = sanitize_sensitive_data(language.strip() if language else "Hindi")
    clean_method = sanitize_sensitive_data(preferred_followup_method.strip() if preferred_followup_method else "phone_call")

    with get_connection() as conn:
        cursor = conn.cursor()
        cursor.execute(
            """
            INSERT INTO escalations (
                reference_id, user_id, session_id, issue_type, short_summary,
                urgency, language, preferred_followup_method, status, created_at
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                reference_id,
                user_id,
                session_id,
                clean_issue_type,
                clean_summary,
                clean_urgency,
                clean_language,
                clean_method,
                "open",
                timestamp,
            ),
        )
        conn.commit()

    if session_id:
        log_safety_event(
            session_id,
            "human_escalation_created",
            f"Escalation {reference_id} created for user {user_id}: {clean_issue_type}",
        )

    return {
        "reference_id": reference_id,
        "issue_type": clean_issue_type,
        "short_summary": clean_summary,
        "urgency": clean_urgency,
        "language": clean_language,
        "preferred_follow_up_method": clean_method,
        "preferred_followup_method": clean_method,
        "status": "open",
        "timestamp": timestamp,
        "user_id": user_id,
        "session_id": session_id,
    }


def get_escalation(reference_id: str) -> Optional[Dict[str, Any]]:
    """Retrieve an escalation request by reference ID."""
    init_db()
    with get_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM escalations WHERE reference_id = ?", (reference_id,))
        row = cursor.fetchone()
        if not row:
            return None
        res = dict(row)
        res["preferred_follow_up_method"] = res.get("preferred_followup_method")
        res["timestamp"] = res.get("created_at")
        if "status" not in res or not res["status"]:
            res["status"] = "open"
        return res


def get_recent_escalations(limit: int = 50) -> List[Dict[str, Any]]:
    """Retrieve recent escalation requests."""
    init_db()
    with get_connection() as conn:
        cursor = conn.cursor()
        cursor.execute(
            "SELECT * FROM escalations ORDER BY created_at DESC LIMIT ?", (limit,)
        )
        rows = cursor.fetchall()
        result = []
        for r in rows:
            d = dict(r)
            d["preferred_follow_up_method"] = d.get("preferred_followup_method")
            d["timestamp"] = d.get("created_at")
            if "status" not in d or not d["status"]:
                d["status"] = "open"
            result.append(d)
        return result

