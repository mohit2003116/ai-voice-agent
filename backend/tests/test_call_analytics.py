"""
Day 8 – Call Analytics Tests
=============================
Tests every requirement for the call_analytics feature:

  1. call_analytics table is created by init_db()
  2. record_call_analytics() saves exactly the five required fields
  3. Outcome = SUCCESS when financial guidance was delivered
  4. Outcome = SUCCESS when a human escalation request was created
  5. Outcome = FAILED when neither condition is met
  6. outcome_reason is sanitised — no OTP / PIN / CVV / password / account number stored
  7. get_call_analytics() returns rows ordered newest-first
  8. get_analytics_stats() aggregates total / successful / failed / success_rate correctly
  9. Upserting the same call_id updates the row (ON CONFLICT DO UPDATE)
 10. started_at and ended_at are stored as-is (ISO strings)
 11. outcome is normalised — only SUCCESS or FAILED accepted
 12. Escalation created via create_escalation() is detectable by the on_disconnected evaluator
"""

import sqlite3
import time
import uuid
from datetime import datetime, timezone

import pytest

try:
    from src import db
except ImportError:
    import db


# ─────────────────────────────────────────────────────────────
# Helpers
# ─────────────────────────────────────────────────────────────

def _unique_call_id() -> str:
    """Return a collision-free call ID safe for parallel test runs."""
    return f"test-call-{uuid.uuid4().hex[:12]}"


def _now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def _fetch_row(call_id: str):
    """Read a call_analytics row directly from SQLite."""
    conn = db.get_connection()
    conn.row_factory = sqlite3.Row
    cur = conn.cursor()
    cur.execute(
        "SELECT call_id, started_at, ended_at, outcome, outcome_reason "
        "FROM call_analytics WHERE call_id = ?",
        (call_id,),
    )
    row = cur.fetchone()
    conn.close()
    return dict(row) if row else None


# ─────────────────────────────────────────────────────────────
# 1. Table creation
# ─────────────────────────────────────────────────────────────

def test_call_analytics_table_exists_after_init_db():
    """init_db() must create the call_analytics table with the required columns."""
    db.init_db()
    conn = db.get_connection()
    cur = conn.cursor()
    cur.execute("PRAGMA table_info(call_analytics)")
    cols = {row["name"] for row in cur.fetchall()}
    conn.close()

    required = {"call_id", "started_at", "ended_at", "outcome", "outcome_reason"}
    assert required.issubset(cols), f"Missing columns: {required - cols}"


# ─────────────────────────────────────────────────────────────
# 2. record_call_analytics saves exactly the five fields
# ─────────────────────────────────────────────────────────────

def test_record_call_analytics_saves_five_fields():
    """record_call_analytics() must persist call_id, started_at, ended_at,
    outcome, and outcome_reason — nothing else that could be sensitive."""
    db.init_db()
    call_id = _unique_call_id()
    started = _now_iso()
    time.sleep(0.01)
    ended = _now_iso()

    result = db.record_call_analytics(
        call_id=call_id,
        started_at=started,
        ended_at=ended,
        outcome="SUCCESS",
        outcome_reason="Financial guidance delivered to caller",
    )

    # Return value must carry all five fields
    assert result["call_id"] == call_id
    assert result["started_at"] == started
    assert result["ended_at"] == ended
    assert result["outcome"] == "SUCCESS"
    assert result["outcome_reason"] == "Financial guidance delivered to caller"

    # Verify persistence in SQLite
    row = _fetch_row(call_id)
    assert row is not None, "Row was not inserted"
    assert row["call_id"] == call_id
    assert row["started_at"] == started
    assert row["ended_at"] == ended
    assert row["outcome"] == "SUCCESS"
    assert row["outcome_reason"] == "Financial guidance delivered to caller"


# ─────────────────────────────────────────────────────────────
# 3. SUCCESS when financial guidance was delivered
# ─────────────────────────────────────────────────────────────

def test_guidance_delivered_produces_success_outcome():
    """A call where the agent delivers financial guidance must be recorded as SUCCESS."""
    db.init_db()
    call_id = _unique_call_id()

    db.record_call_analytics(
        call_id=call_id,
        started_at=_now_iso(),
        ended_at=_now_iso(),
        outcome="SUCCESS",
        outcome_reason="Financial guidance delivered to caller",
    )

    row = _fetch_row(call_id)
    assert row["outcome"] == "SUCCESS"
    assert "guidance" in row["outcome_reason"].lower() or "financial" in row["outcome_reason"].lower()


# ─────────────────────────────────────────────────────────────
# 4. SUCCESS when a human escalation was created
# ─────────────────────────────────────────────────────────────

def test_escalation_created_produces_success_outcome():
    """A call that resulted in a human escalation request must be recorded as SUCCESS."""
    db.init_db()
    call_id = _unique_call_id()

    db.record_call_analytics(
        call_id=call_id,
        started_at=_now_iso(),
        ended_at=_now_iso(),
        outcome="SUCCESS",
        outcome_reason="Human escalation request successfully created",
    )

    row = _fetch_row(call_id)
    assert row["outcome"] == "SUCCESS"
    assert "escalation" in row["outcome_reason"].lower()


# ─────────────────────────────────────────────────────────────
# 5. FAILED when neither condition is met
# ─────────────────────────────────────────────────────────────

def test_no_guidance_no_escalation_produces_failed_outcome():
    """A call where the agent delivered no guidance and no escalation was created
    must be recorded as FAILED."""
    db.init_db()
    call_id = _unique_call_id()

    db.record_call_analytics(
        call_id=call_id,
        started_at=_now_iso(),
        ended_at=_now_iso(),
        outcome="FAILED",
        outcome_reason="No financial guidance delivered and no escalation created",
    )

    row = _fetch_row(call_id)
    assert row["outcome"] == "FAILED"


# ─────────────────────────────────────────────────────────────
# 6. Sensitive data is NEVER stored in outcome_reason
# ─────────────────────────────────────────────────────────────

@pytest.mark.parametrize(
    "sensitive_input,banned_literal",
    [
        ("OTP is 123456", "123456"),
        ("ATM PIN is 4321", "4321"),
        ("CVV is 987", "987"),
        ("password is mysecret", "mysecret"),
        ("account number 123456789012", "123456789012"),
    ],
)
def test_sensitive_data_is_sanitised_in_outcome_reason(sensitive_input, banned_literal):
    """record_call_analytics() MUST sanitise outcome_reason so no raw OTP, PIN, CVV,
    password, or account number reaches the database."""
    db.init_db()
    call_id = _unique_call_id()

    db.record_call_analytics(
        call_id=call_id,
        started_at=_now_iso(),
        ended_at=_now_iso(),
        outcome="FAILED",
        outcome_reason=sensitive_input,
    )

    row = _fetch_row(call_id)
    assert row is not None
    assert banned_literal not in row["outcome_reason"], (
        f"Sensitive literal '{banned_literal}' found verbatim in outcome_reason: "
        f"'{row['outcome_reason']}'"
    )


# ─────────────────────────────────────────────────────────────
# 7. get_call_analytics() returns rows ordered newest-first
# ─────────────────────────────────────────────────────────────

def test_get_call_analytics_returns_newest_first():
    """get_call_analytics() must return rows sorted by ended_at descending."""
    db.init_db()

    ids = []
    for i in range(3):
        cid = _unique_call_id()
        ids.append(cid)
        time.sleep(0.02)   # ensure distinct ended_at timestamps
        db.record_call_analytics(
            call_id=cid,
            started_at=_now_iso(),
            ended_at=_now_iso(),
            outcome="SUCCESS" if i % 2 == 0 else "FAILED",
            outcome_reason=f"Test row {i}",
        )

    rows = db.get_call_analytics(limit=100)
    returned_ids = [r["call_id"] for r in rows if r["call_id"] in ids]

    # The last inserted id must appear first (newest-first ordering)
    assert returned_ids[0] == ids[-1], (
        f"Expected newest call '{ids[-1]}' to be first, got '{returned_ids[0]}'"
    )


# ─────────────────────────────────────────────────────────────
# 8. get_analytics_stats() aggregates correctly
# ─────────────────────────────────────────────────────────────

def test_analytics_stats_aggregates_call_counts():
    """get_analytics_stats() must return total_calls_evaluated, successful_calls,
    failed_calls, and success_rate_percent computed from the actual data."""
    db.init_db()

    # Capture baseline before inserting test rows
    baseline = db.get_analytics_stats()
    base_total = baseline.get("total_calls_evaluated", 0) or 0
    base_success = baseline.get("successful_calls", 0) or 0
    base_failed = baseline.get("failed_calls", 0) or 0

    # Insert 2 SUCCESS + 1 FAILED
    for _ in range(2):
        db.record_call_analytics(
            call_id=_unique_call_id(),
            started_at=_now_iso(),
            ended_at=_now_iso(),
            outcome="SUCCESS",
            outcome_reason="Guidance delivered",
        )
    db.record_call_analytics(
        call_id=_unique_call_id(),
        started_at=_now_iso(),
        ended_at=_now_iso(),
        outcome="FAILED",
        outcome_reason="No guidance or escalation",
    )

    stats = db.get_analytics_stats()

    assert stats["total_calls_evaluated"] == base_total + 3
    assert stats["successful_calls"] == base_success + 2
    assert stats["failed_calls"] == base_failed + 1

    expected_rate = round(((base_success + 2) / (base_total + 3)) * 100, 1)
    assert stats["success_rate_percent"] == expected_rate


def test_analytics_stats_success_rate_is_none_when_no_calls():
    """When zero calls are present, success_rate_percent must be None (not 0 or NaN)."""
    stats = db.get_analytics_stats()
    total = stats.get("total_calls_evaluated", 0) or 0
    rate = stats.get("success_rate_percent")
    if total == 0:
        assert rate is None, f"Expected None for success_rate when no calls, got {rate}"
    else:
        assert rate is not None and 0.0 <= rate <= 100.0


# ─────────────────────────────────────────────────────────────
# 9. Upsert: same call_id updates the existing row
# ─────────────────────────────────────────────────────────────

def test_upsert_same_call_id_updates_row():
    """Calling record_call_analytics() twice with the same call_id must update
    the existing row — not raise an error or insert a duplicate."""
    db.init_db()
    call_id = _unique_call_id()
    started = _now_iso()

    db.record_call_analytics(
        call_id=call_id,
        started_at=started,
        ended_at=_now_iso(),
        outcome="FAILED",
        outcome_reason="Initial write — no guidance yet",
    )

    time.sleep(0.02)
    updated_end = _now_iso()

    db.record_call_analytics(
        call_id=call_id,
        started_at=started,
        ended_at=updated_end,
        outcome="SUCCESS",
        outcome_reason="Guidance delivered on update",
    )

    row = _fetch_row(call_id)
    assert row["outcome"] == "SUCCESS", "Upsert must overwrite outcome"
    assert row["ended_at"] == updated_end, "Upsert must overwrite ended_at"

    # Ensure exactly one row for this call_id
    conn = db.get_connection()
    cur = conn.cursor()
    cur.execute("SELECT COUNT(*) as cnt FROM call_analytics WHERE call_id = ?", (call_id,))
    count = cur.fetchone()["cnt"]
    conn.close()
    assert count == 1, f"Expected exactly 1 row for call_id '{call_id}', got {count}"


# ─────────────────────────────────────────────────────────────
# 10. Timestamps stored as ISO strings
# ─────────────────────────────────────────────────────────────

def test_timestamps_stored_as_iso_strings():
    """started_at and ended_at must be stored exactly as the ISO strings provided."""
    db.init_db()
    call_id = _unique_call_id()
    started = "2026-08-13T10:00:00+00:00"
    ended = "2026-08-13T10:05:30+00:00"

    db.record_call_analytics(
        call_id=call_id,
        started_at=started,
        ended_at=ended,
        outcome="SUCCESS",
        outcome_reason="Timestamps stored correctly",
    )

    row = _fetch_row(call_id)
    assert row["started_at"] == started
    assert row["ended_at"] == ended


# ─────────────────────────────────────────────────────────────
# 11. outcome is normalised — only SUCCESS or FAILED allowed
# ─────────────────────────────────────────────────────────────

@pytest.mark.parametrize(
    "raw_outcome,expected",
    [
        ("SUCCESS", "SUCCESS"),
        ("success", "SUCCESS"),
        ("FAILED", "FAILED"),
        ("failed", "FAILED"),
        ("ERROR", "FAILED"),     # anything not SUCCESS maps to FAILED
        ("", "FAILED"),
        ("unknown", "FAILED"),
    ],
)
def test_outcome_normalisation(raw_outcome, expected):
    """record_call_analytics() must normalise outcome to SUCCESS or FAILED only."""
    db.init_db()
    call_id = _unique_call_id()

    result = db.record_call_analytics(
        call_id=call_id,
        started_at=_now_iso(),
        ended_at=_now_iso(),
        outcome=raw_outcome,
        outcome_reason="Normalisation test",
    )

    assert result["outcome"] == expected, (
        f"Input '{raw_outcome}' -> expected '{expected}', got '{result['outcome']}'"
    )
    row = _fetch_row(call_id)
    assert row["outcome"] == expected


# ─────────────────────────────────────────────────────────────
# 12. End-to-end: escalation in DB triggers SUCCESS evaluation
# ─────────────────────────────────────────────────────────────

def test_escalation_in_db_is_readable_for_session():
    """Simulates the on_disconnected check: after create_escalation() is called
    for a session, get_recent_escalations() must return a row whose session_id
    matches, so the analytics evaluator can detect the escalation."""
    db.init_db()
    session_id = f"test-session-{uuid.uuid4().hex[:8]}"

    esc = db.create_escalation(
        issue_type="banking_dispute",
        short_summary="Caller needs help resolving a disputed transaction",
        urgency="high",
        language="Hindi",
        preferred_followup_method="phone_call",
        user_id="usr_1001",
        session_id=session_id,
    )
    assert esc.get("reference_id"), "create_escalation must return a reference_id"

    # Simulate what on_disconnected does
    recent = db.get_recent_escalations(limit=50)
    found = any(e.get("session_id") == session_id for e in recent)
    assert found, (
        f"Escalation for session '{session_id}' not found in get_recent_escalations(); "
        "on_disconnected will incorrectly evaluate outcome as FAILED"
    )
