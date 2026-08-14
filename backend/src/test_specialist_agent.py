import json

import pytest

from agent import Assistant
from prompt import GOVERNMENT_SCHEME_SPECIALIST_PROMPT
from specialist_agent import GovernmentSchemeSpecialist


@pytest.mark.asyncio
async def test_specialist_initialization_and_instructions():
    """Verify GovernmentSchemeSpecialist initializes with dedicated, focused system prompt."""
    specialist = GovernmentSchemeSpecialist()
    assert specialist is not None
    assert specialist.instructions == GOVERNMENT_SCHEME_SPECIALIST_PROMPT
    assert "Government Scheme Specialist" in specialist.instructions
    assert "Never ask for or accept OTP" in specialist.instructions
    assert "Never ask for or accept PIN" in specialist.instructions
    assert "Never ask for or accept CVV" in specialist.instructions
    assert "Never ask for or accept passwords" in specialist.instructions
    assert "Do NOT provide investment advice" in specialist.instructions
    assert "Do NOT pretend to be a government employee" in specialist.instructions


@pytest.mark.asyncio
async def test_specialist_eligibility_tool():
    """Verify check_scheme_eligibility tool works on GovernmentSchemeSpecialist."""
    specialist = GovernmentSchemeSpecialist()

    # Test PM Kisan eligibility
    res_str = await specialist.check_scheme_eligibility(
        context=None,
        scheme_name="pm_kisan",
        caller_age=35,
        land_holding_hectares=1.5,
        is_farmer=True,
    )
    res = json.loads(res_str)
    assert res["status"] == "success"
    assert res["eligible"] is True
    assert res["scheme_code"] == "pm_kisan"
    assert "10 August 2026" in res["data_as_of"]
    assert len(res["document_checklist_hi"]) > 0


@pytest.mark.asyncio
async def test_specialist_application_guide_tool():
    """Verify get_scheme_application_guide returns structured application steps and touchpoints."""
    specialist = GovernmentSchemeSpecialist()

    # Test PM Jan Dhan Yojana application guide
    res_str = await specialist.get_scheme_application_guide(
        context=None,
        scheme_name="jan_dhan",
    )
    res = json.loads(res_str)
    assert res["status"] == "success"
    assert res["scheme_code"] == "jan_dhan"
    assert "application_steps_hi" in res
    assert len(res["application_steps_hi"]) > 0
    assert "application_touchpoint_hi" in res
    assert "10 August 2026" in res["data_as_of"]


@pytest.mark.asyncio
async def test_specialist_transfer_back_to_main_assistant():
    """Verify transfer_to_main_assistant tool when user asks unrelated queries."""
    specialist = GovernmentSchemeSpecialist()

    res = await specialist.transfer_to_main_assistant(
        context=None,
        reason="user_reported_fraud",
    )
    assert "Caller is being transferred to the main FinGuard AI assistant" in res
    assert "main financial assistant" in res


@pytest.mark.asyncio
async def test_main_agent_handoff_to_government_scheme_specialist():
    """Verify Assistant executes handoff_to_government_scheme_specialist tool."""
    assistant = Assistant()

    res = await assistant.handoff_to_government_scheme_specialist(
        context=None,
        scheme_name="pm_kisan",
    )
    assert "Handoff completed to Government Scheme Specialist" in res
    assert "pm_kisan" in res


@pytest.mark.asyncio
async def test_main_agent_prompt_handoff_rules():
    """Verify main agent system prompt has strict rules and positive/negative examples for handoff."""
    from prompt import SYSTEM_PROMPT

    assert "handoff_to_government_scheme_specialist" in SYSTEM_PROMPT
    assert "I'll connect you to our government scheme specialist." in SYSTEM_PROMPT
    # Positive handoff triggers
    assert "Am I eligible for a government financial scheme?" in SYSTEM_PROMPT
    assert "Which government scheme can help me?" in SYSTEM_PROMPT
    assert "How do I apply for this government scheme?" in SYSTEM_PROMPT
    assert "What documents are required for this government scheme?" in SYSTEM_PROMPT
    assert "What benefits does this government scheme provide?" in SYSTEM_PROMPT
    # Negative handoff triggers (must be answered directly)
    assert "What is a savings account?" in SYSTEM_PROMPT
    assert "How can I save money?" in SYSTEM_PROMPT
    assert "What is a credit score?" in SYSTEM_PROMPT
    assert "What is compound interest?" in SYSTEM_PROMPT
    assert "How should I make a budget?" in SYSTEM_PROMPT



@pytest.mark.asyncio
async def test_specialist_context_preservation_and_intro():
    """Verify GovernmentSchemeSpecialist preserves conversation context, user question, and facts without making user repeat."""
    user_facts = {
        "is_small_farmer": True,
        "land_holding_hectares": 1.5,
        "eligible_scheme": "PM Kisan Samman Nidhi",
    }
    specialist = GovernmentSchemeSpecialist(
        handoff_reason="User asked for PM Kisan document requirements and eligibility",
        latest_question="Mujhe PM Kisan ke liye kaun se documents chahiye?",
        user_facts=user_facts,
        scheme_name="pm_kisan",
    )

    # Check preserved attributes
    assert specialist.handoff_reason == "User asked for PM Kisan document requirements and eligibility"
    assert specialist.latest_question == "Mujhe PM Kisan ke liye kaun se documents chahiye?"
    assert specialist.user_facts["is_small_farmer"] is True
    assert specialist.scheme_name == "pm_kisan"

    # Check that the synthesized instructions contain the mandatory introduction and continuation directives
    assert "Hi, I'm the government scheme specialist. I'll help you with your government scheme question." in specialist.instructions
    assert "Mujhe PM Kisan ke liye kaun se documents chahiye?" in specialist.instructions
    assert "User must NOT have to repeat their question" in specialist.instructions or "The user must NOT have to repeat their question" in specialist.instructions
    assert "is_small_farmer" in specialist.instructions


@pytest.mark.asyncio
async def test_main_agent_handoff_with_full_context():
    """Verify Assistant handoff tool passes user question, scheme, and facts to specialist."""
    assistant = Assistant()

    res = await assistant.handoff_to_government_scheme_specialist(
        context=None,
        scheme_name="pm_kisan",
        user_question="Kya mujhe 6000 rupaye milenge?",
        reason="Caller inquired about PM Kisan annual subsidy",
    )
    assert "Handoff completed to Government Scheme Specialist" in res
    assert "Context preserved" in res
    assert "Kya mujhe 6000 rupaye milenge?" in res


