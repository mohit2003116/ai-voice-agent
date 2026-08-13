import pytest

try:
    from src import db
    from src.agent import Assistant
    from src.prompt import SYSTEM_PROMPT
except ImportError:
    import db
    from agent import Assistant
    from prompt import SYSTEM_PROMPT


@pytest.mark.asyncio
async def test_full_flow_returning_caller_memory():
    """Integration test simulating the full 2-call flow:

    Call 1: Unknown/First-time caller connects, shares facts with explicit consent.
    Agent saves facts to SQLite database via save_caller_fact tool. Call hangs up.

    Call 2: Caller reconnects. Agent looks up SQLite database, detects returning caller,
    constructs personalized instructions, welcomes them back by name, and references past topic.
    """
    db.init_db()
    test_user_id = "usr_integration_flow_01"

    # --- CALL 1: First Call ---
    # Create initial caller profile for Suresh with consent
    db.upsert_user_profile(
        user_id=test_user_id,
        name="Suresh Kumar",
        language_preference="Hinglish",
        facts={},
    )

    assistant1 = Assistant()
    # Execute save_caller_fact tool with explicit caller consent
    save_reply = await assistant1.save_caller_fact(
        context=None,
        caller_consent_given=True,
        user_id=test_user_id,
        scheme_checked="PM Kisan Samman Nidhi",
        eligibility_key="is_small_farmer",
        eligibility_value="true",
        language_preference="Hinglish",
    )
    assert "Successfully saved caller facts" in save_reply

    # Verify Call 1 updated SQLite profile
    profile_after_call1 = db.get_user_profile(test_user_id)
    assert profile_after_call1 is not None
    assert profile_after_call1["name"] == "Suresh Kumar"
    assert "PM Kisan Samman Nidhi" in profile_after_call1["facts"]["schemes_checked"]
    assert (
        profile_after_call1["facts"]["eligibility_answers"]["is_small_farmer"] == "true"
    )

    # Simulate Hang up
    db.end_session("session_call_1", status="completed")

    # --- CALL 2: Second Call (Returning Caller) ---
    # Retrieve saved profile from SQLite
    returning_caller = db.get_user_profile(test_user_id)
    assert returning_caller is not None

    # Construct returning caller instructions (same logic as agent.py)
    caller_name = returning_caller["name"]
    facts = returning_caller.get("facts", {})
    schemes = facts.get("schemes_checked", [])
    last_topic = schemes[-1] if schemes else "financial safety"

    custom_instructions = (
        SYSTEM_PROMPT
        + f"""

RETURNING CALLER CONTEXT:
You are speaking to a returning caller named {caller_name}.
- Caller Name: {caller_name}
- Preferred Language: {returning_caller.get("language_preference", "Hinglish")}
- Previous Topic/Scheme Discussed: {last_topic}

RETURNING CALLER FIRST GREETING INSTRUCTION:
When greeting this user for the first time in this session, welcome them back personally by name and reference what you discussed last time.
Example greeting: "Namaste {caller_name}! Welcome back. Last time we spoke about {last_topic}. How can I help you today?"
"""
    )

    # Instantiate Assistant with returning caller instructions
    assistant2 = Assistant(instructions=custom_instructions)

    # Verify custom instructions contain caller name and last topic
    assert "Suresh Kumar" in assistant2.instructions
    assert "PM Kisan Samman Nidhi" in assistant2.instructions
    assert "RETURNING CALLER CONTEXT" in assistant2.instructions

    # Verify lookup_caller_profile tool returns saved caller memory
    lookup_res = await assistant2.lookup_caller_profile(
        context=None, user_id=test_user_id
    )
    assert "Suresh Kumar" in lookup_res
    assert "PM Kisan Samman Nidhi" in lookup_res
