import json
import pytest

try:
    from src import db
    from src.agent import Assistant
except ImportError:
    import db
    from agent import Assistant


def test_create_escalation_basic_fields():
    """Test that create_escalation creates a human-help request containing all required fields:
    - reference ID
    - issue type
    - short summary
    - urgency
    - language
    - preferred follow-up method
    - timestamp
    """
    db.init_db()
    
    result = db.create_escalation(
        issue_type="suspected_fraud",
        short_summary="Caller reported receiving fake KYC link asking for urgent verification.",
        urgency="high",
        language="Hindi",
        preferred_followup_method="phone_call",
        user_id="usr_test_escalation",
        session_id="session_test_esc_01",
    )

    assert "reference_id" in result
    assert result["reference_id"].startswith("FG-")
    assert result["issue_type"] == "suspected_fraud"
    assert "fake KYC link" in result["short_summary"]
    assert result["urgency"] == "high"
    assert result["language"] == "Hindi"
    assert result["preferred_follow_up_method"] == "phone_call"
    assert "timestamp" in result
    assert result["timestamp"] is not None

    # Verify record in database
    db_rec = db.get_escalation(result["reference_id"])
    assert db_rec is not None
    assert db_rec["reference_id"] == result["reference_id"]
    assert db_rec["issue_type"] == "suspected_fraud"
    assert db_rec["user_id"] == "usr_test_escalation"


def test_sensitive_data_sanitization():
    """Test that create_escalation NEVER stores OTP, PIN, CVV, password, account number, or card number."""
    db.init_db()

    sensitive_summary = (
        "My OTP is 987654, PIN is 1234, CVV is 999, password is secretpass123, "
        "bank account is 987654321012345, and card number is 4111222233334444."
    )

    result = db.create_escalation(
        issue_type="dispute OTP: 654321 PIN: 4321",
        short_summary=sensitive_summary,
        urgency="critical",
        language="Hinglish",
        preferred_followup_method="callback",
        user_id="usr_sensitive_test",
    )

    summary = result["short_summary"]
    issue = result["issue_type"]

    # Verify no raw sensitive values are present in summary or issue type
    assert "987654" not in summary
    assert "999" not in summary
    assert "secretpass123" not in summary
    assert "987654321012345" not in summary
    assert "4111222233334444" not in summary
    assert "654321" not in issue

    # Verify redaction tokens exist
    assert "[REDACTED" in summary or "[REDACTED_OTP]" in summary or "[REDACTED_ACCOUNT]" in summary
    assert "[REDACTED" in issue or "[REDACTED_OTP]" in issue

    # Double check database row directly
    stored = db.get_escalation(result["reference_id"])
    assert stored is not None
    assert "987654" not in stored["short_summary"]
    assert "987654321012345" not in stored["short_summary"]


@pytest.mark.asyncio
async def test_assistant_create_escalation_tool():
    """Test executing Assistant create_escalation function tool."""
    assistant = Assistant()

    tool_response_json = await assistant.create_escalation(
        context=None,
        issue_type="scheme_eligibility_dispute",
        short_summary="Caller needs officer review for PM Kisan scheme rejection.",
        urgency="medium",
        language="Hindi",
        preferred_followup_method="sms",
        user_id="usr_tool_test",
    )

    parsed = json.loads(tool_response_json)
    assert "reference_id" in parsed
    assert parsed["reference_id"].startswith("FG-")
    assert parsed["issue_type"] == "scheme_eligibility_dispute"
    assert parsed["urgency"] == "medium"
    assert parsed["language"] == "Hindi"
    assert parsed["preferred_follow_up_method"] == "sms"
    assert parsed["user_id"] == "usr_tool_test"


def test_financial_fraud_condition_prompt_and_keywords():
    """Test Day 7 Condition 1: Financial fraud keywords (unauthorized transaction, money stolen, suspicious transaction, payment fraud)

    Verifies system prompt contains recognition guidelines and safety log records event.
    """
    try:
        from src.prompt import SYSTEM_PROMPT
    except ImportError:
        from prompt import SYSTEM_PROMPT

    # 1. Verify system prompt instructions for Day 7 Escalation Condition 1
    assert "DAY 7 ESCALATION CONDITION 1" in SYSTEM_PROMPT
    assert "Unauthorized transaction" in SYSTEM_PROMPT
    assert "Money stolen" in SYSTEM_PROMPT
    assert "Suspicious transaction" in SYSTEM_PROMPT
    assert "Payment fraud" in SYSTEM_PROMPT
    assert "DO NOT CREATE THE REQUEST UNTIL USER SAYS YES" in SYSTEM_PROMPT

    # 2. Verify safety event log for financial fraud report
    db.init_db()
    import uuid
    session_id = f"session_test_fraud_cond_{uuid.uuid4().hex[:8]}"
    db.create_session(session_id, room_name="room_fraud_test")
    
    fraud_reports = [
        "I have an unauthorized transaction on my account",
        "My money was stolen through payment fraud",
        "I noticed a suspicious transaction of 5000 rupees",
    ]

    for report in fraud_reports:
        lowered = report.lower()
        if any(k in lowered for k in ["unauthorized transaction", "money stolen", "suspicious transaction", "payment fraud"]):
            db.log_safety_event(session_id, "possible_financial_fraud_detected", f"Report: {report}")

    details = db.get_session_details(session_id)
    assert len(details["safety_logs"]) == 3
    for log in details["safety_logs"]:
        assert log["event_type"] == "possible_financial_fraud_detected"


def test_non_delegable_decisions_condition_2():
    """Test Day 7 Condition 2: Non-delegable decisions & official disputes
    (loan approval, transaction dispute, refund dispute, account freeze/unfreeze).

    Verifies system prompt forbids agent from making these decisions itself and requires escalation.
    """
    try:
        from src.prompt import SYSTEM_PROMPT
    except ImportError:
        from prompt import SYSTEM_PROMPT

    # 1. Verify prompt contains Condition 2 guidelines & prohibitions
    assert "DAY 7 ESCALATION CONDITION 2" in SYSTEM_PROMPT
    assert "Loan approval" in SYSTEM_PROMPT
    assert "Transaction dispute" in SYSTEM_PROMPT
    assert "Refund dispute" in SYSTEM_PROMPT
    assert "Account freeze/unfreeze" in SYSTEM_PROMPT
    assert "STRICT NON-DELEGABLE DECISION RULE" in SYSTEM_PROMPT

    # 2. Verify safety event log for non-delegable decision requests
    db.init_db()
    import uuid
    session_id = f"session_test_condition2_{uuid.uuid4().hex[:8]}"
    db.create_session(session_id, room_name="room_condition2_test")

    dispute_requests = [
        "I need a loan approval for 50000 rupees",
        "Please resolve my transaction dispute immediately",
        "I want a refund dispute for my failed payment",
        "Please unfreeze account for me",
    ]

    for req in dispute_requests:
        lowered = req.lower()
        if any(k in lowered for k in ["loan approval", "transaction dispute", "refund dispute", "unfreeze account"]):
            db.log_safety_event(session_id, "official_decision_dispute_detected", f"Request: {req}")

    details = db.get_session_details(session_id)
    assert len(details["safety_logs"]) == 4
    for log in details["safety_logs"]:
        assert log["event_type"] == "official_decision_dispute_detected"


def test_mandatory_consent_before_escalation_request():
    """Test mandatory user consent phrasing and rules before creating escalation requests."""
    try:
        from src.prompt import SYSTEM_PROMPT
    except ImportError:
        from prompt import SYSTEM_PROMPT

    # 1. Verify exact required phrasing in system prompt
    assert "MANDATORY CONSENT BEFORE CREATING ESCALATION REQUEST" in SYSTEM_PROMPT
    exact_hindi_phrase = "Aapki problem ko human support tak bhejne ke liye main ek request create kar sakta hoon. Main sirf zaroori summary share karunga. Kya main request create kar doon?"
    assert exact_hindi_phrase in SYSTEM_PROMPT
    assert "ONLY CALL TOOL IF USER SAYS YES" in SYSTEM_PROMPT
    assert "IF USER SAYS NO" in SYSTEM_PROMPT

    # 2. Verify Assistant create_escalation docstring has consent instruction
    assistant = Assistant()
    doc = assistant.create_escalation.__doc__
    assert exact_hindi_phrase in doc


def test_escalation_success_response_and_reference_id_format():
    """Test FG-YYYY-XXX reference ID format generation and prompt instructions for spoken Hindi success response."""
    try:
        from src.prompt import SYSTEM_PROMPT
    except ImportError:
        from prompt import SYSTEM_PROMPT

    # 1. Verify prompt contains exact success phrase structure and strict rule against promising immediate response
    assert "SPOKEN RESPONSE AFTER CREATING ESCALATION" in SYSTEM_PROMPT
    success_template = "Aapki request create ho gayi hai. Aapka reference ID {reference_id} hai. Human support team is request ko review karegi."
    assert success_template in SYSTEM_PROMPT
    assert "Do NOT promise an immediate human response" in SYSTEM_PROMPT

    # 2. Verify db.create_escalation generates reference IDs in FG-YYYY-XXX format (e.g. FG-2026-001)
    db.init_db()
    res1 = db.create_escalation(
        issue_type="test_format",
        short_summary="Test reference ID format",
        user_id="usr_format_test_1",
    )
    ref_id = res1["reference_id"]
    assert ref_id.startswith("FG-2026-")
    parts = ref_id.split("-")
    assert len(parts) == 3
    assert parts[0] == "FG"
    assert parts[1] == "2026"
    assert len(parts[2]) == 3 and parts[2].isdigit()

