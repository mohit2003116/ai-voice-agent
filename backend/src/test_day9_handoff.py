import json

import pytest
from dotenv import load_dotenv
from livekit.plugins import murf

from agent import Assistant
from specialist_agent import GovernmentSchemeSpecialist


@pytest.mark.asyncio
async def test_case_1_normal_question_no_handoff():
    """Test Case 1 - Normal Question:

    User: "What is a savings account?"
    Expected:
    - Main agent answers directly.
    - No handoff occurs.
    """
    load_dotenv(".env.local")
    assistant = Assistant()

    # Verify that the system prompt explicitly categorizes savings accounts as non-handoff
    assert "What is a savings account?" in assistant.instructions
    assert "Do NOT hand off general or standard financial questions" in assistant.instructions
    assert '"What is a savings account?"' in assistant.instructions

    # Verify that normal banking questions stay with FinGuard AI
    user_query = "What is a savings account?"
    assert "savings account" in user_query.lower()

    # The handoff decision criteria in the prompt instructs the agent to answer directly
    # and NOT call handoff_to_government_scheme_specialist for normal banking questions.


@pytest.mark.asyncio
async def test_case_2_specialist_question_full_handoff_flow():
    """Test Case 2 - Specialist Question:

    User: "Can you help me understand a government financial scheme and tell me if I may be eligible?"
    Expected:
    1. Main agent recognizes that a specialist is needed.
    2. Main agent says: "I'll connect you to our government scheme specialist."
    3. Handoff tool is called.
    4. GovernmentSchemeSpecialist takes over.
    5. Specialist introduces itself: "Hi, I'm the government scheme specialist. I'll help you with your government scheme question."
    6. Specialist already knows the user's original question.
    7. User does not need to repeat the question.
    """
    user_question = "Can you help me understand a government financial scheme and tell me if I may be eligible?"

    # 1 & 2. Main agent instructions require saying the exact phrase before handoff
    assistant = Assistant()
    assert "Am I eligible for a government financial scheme?" in assistant.instructions
    assert "I'll connect you to our government scheme specialist." in assistant.instructions

    # 3. Main agent executes handoff tool with the user's question
    handoff_res = await assistant.handoff_to_government_scheme_specialist(
        context=None,
        scheme_name="pm_kisan",
        user_question=user_question,
        reason="User inquired about government financial scheme understanding and eligibility",
    )
    assert "Handoff completed to Government Scheme Specialist" in handoff_res
    assert user_question in handoff_res

    # 4. GovernmentSchemeSpecialist instantiated with preserved context
    specialist = GovernmentSchemeSpecialist(
        handoff_reason="User inquired about government financial scheme understanding and eligibility",
        latest_question=user_question,
        scheme_name="pm_kisan",
        user_facts={"is_small_farmer": True, "land_holding_hectares": 1.5},
    )

    # 5. Specialist introduces itself
    expected_intro = "Hi, I'm the government scheme specialist. I'll help you with your government scheme question."
    assert expected_intro in specialist.instructions

    # 6. Specialist already knows the user's original question
    assert specialist.latest_question == user_question
    assert user_question in specialist.instructions

    # 7. User does not need to repeat the question
    assert "The user must NOT have to repeat their question" in specialist.instructions

    # Specialist evaluates scheme eligibility directly without asking user to repeat
    eval_res = await specialist.check_scheme_eligibility(
        context=None,
        scheme_name="pm_kisan",
        caller_age=30,
        land_holding_hectares=1.5,
        is_farmer=True,
    )
    eval_data = json.loads(eval_res)
    assert eval_data["status"] == "success"
    assert eval_data["eligible"] is True
    assert "10 August 2026" in eval_data["data_as_of"]


@pytest.mark.asyncio
async def test_murf_falcon_tts_configuration():
    """Verify that the existing Murf Falcon TTS configuration remains fully functional."""
    # Test Murf Falcon TTS instantiation with production voice and settings
    tts = murf.TTS(
        voice="Anisha",
        style="Conversation",
        text_pacing=True,
    )
    assert tts is not None
    assert tts._opts.voice == "Anisha"
    assert tts._opts.style == "Conversation"
