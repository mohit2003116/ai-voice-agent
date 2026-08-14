import json
import logging
from typing import Optional

from livekit.agents import (
    Agent,
    RunContext,
    function_tool,
)

logger = logging.getLogger("specialist_agent")

try:
    from src import schemes_data
    from src.prompt import GOVERNMENT_SCHEME_SPECIALIST_PROMPT
except ImportError:
    import schemes_data
    from prompt import GOVERNMENT_SCHEME_SPECIALIST_PROMPT


class GovernmentSchemeSpecialist(Agent):
    """Specialist voice AI agent dedicated exclusively to government financial schemes.

    Scope:
    - Government financial schemes (PM Kisan, Jan Dhan, PM Mudra, PMSBY, APY, etc.)
    - Scheme eligibility assessment
    - Scheme benefits explanation
    - Basic application process & touchpoints (CSC centers, bank branches, portals)
    - General document checklists & requirements

    Guardrails:
    - Never asks for OTP, PIN, CVV, passwords, or banking credentials.
    - Never executes financial transactions.
    - Never provides investment advice.
    - Does not pretend to be a government employee or bank official.
    - Transfers unrelated queries (banking, scams, disputes) back to the main assistant.
    """

    def __init__(
        self,
        instructions: Optional[str] = None,
        handoff_reason: str = "",
        latest_question: str = "",
        user_facts: Optional[dict] = None,
        scheme_name: str = "",
        conversation_summary: str = "",
    ) -> None:
        self.handoff_reason = handoff_reason
        self.latest_question = latest_question
        self.user_facts = user_facts or {}
        self.scheme_name = scheme_name
        self.conversation_summary = conversation_summary

        if instructions is None:
            instructions = GOVERNMENT_SCHEME_SPECIALIST_PROMPT

        # Append structured handoff context if this specialist was initiated via handoff
        if handoff_reason or latest_question or user_facts or scheme_name or conversation_summary:
            context_block = "\n\nACTIVE HANDOFF CONTEXT (PRESERVED FROM MAIN ASSISTANT):\n"
            if handoff_reason:
                context_block += f"- Handoff Reason: {handoff_reason}\n"
            if scheme_name:
                context_block += f"- Target Scheme: {scheme_name}\n"
            if latest_question:
                context_block += f"- User's Original Question: {latest_question}\n"
            if user_facts:
                context_block += f"- User Profile & Facts: {json.dumps(user_facts, ensure_ascii=False)}\n"
            if conversation_summary:
                context_block += f"- Previous Conversation Summary: {conversation_summary}\n"

            context_block += (
                "\nCRITICAL CONTINUATION INSTRUCTION:\n"
                "You have just taken over this conversation. The user must NOT have to repeat their question.\n"
                "1. Introduce yourself briefly: \"Hi, I'm the government scheme specialist. I'll help you with your government scheme question.\"\n"
                f"2. Immediately answer the user's original question ({latest_question or scheme_name}) using your scheme tools.\n"
            )
            instructions = instructions + context_block

        super().__init__(instructions=instructions)

    @function_tool
    async def check_scheme_eligibility(
        self,
        context: RunContext,
        scheme_name: str,
        caller_age: Optional[int] = None,
        land_holding_hectares: Optional[float] = None,
        annual_income_inr: Optional[float] = None,
        is_farmer: Optional[bool] = None,
        has_bank_account: Optional[bool] = None,
        simulate_api_failure: bool = False,
    ) -> str:
        """Check real government scheme eligibility, benefits, and required document checklist based on caller's answers.

        Use this tool whenever the caller asks:
        - If they are eligible for a specific government scheme (e.g. PM Kisan, Jan Dhan Yojana, PM Mudra loan, PMSBY, APY)
        - What documents or document checklist are required to apply for a government scheme
        - What criteria, age, land holding, or income requirements apply for a government scheme

        Args:
            scheme_name: Name or code of government scheme (e.g. 'pm_kisan', 'jan_dhan', 'pm_mudra', 'pm_sby', 'atal_pension')
            caller_age: Optional integer age of the caller in years
            land_holding_hectares: Optional float land holding size in hectares for agricultural schemes
            annual_income_inr: Optional annual household income in INR
            is_farmer: Optional boolean indicating if caller is a small or marginal farmer
            has_bank_account: Optional boolean indicating if caller already possesses a bank account
            simulate_api_failure: Set to True ONLY if testing server connection timeout/failure handling out loud
        """
        logger.info(
            f"GovernmentSchemeSpecialist executing check_scheme_eligibility tool for scheme_name='{scheme_name}'"
        )
        res = schemes_data.evaluate_scheme_eligibility(
            scheme_name=scheme_name,
            caller_age=caller_age,
            land_holding_hectares=land_holding_hectares,
            annual_income_inr=annual_income_inr,
            is_farmer=is_farmer,
            has_bank_account=has_bank_account,
            simulate_api_failure=simulate_api_failure,
        )
        return json.dumps(res, ensure_ascii=False)

    @function_tool
    async def get_scheme_application_guide(
        self,
        context: RunContext,
        scheme_name: str,
    ) -> str:
        """Get official application process steps, nearest touchpoints (CSC / Bank branch), and submission guidelines for a government scheme.

        Use this tool when the caller asks:
        - How to apply for a government scheme (e.g. PM Kisan, Jan Dhan, Mudra Loan, PMSBY, APY)
        - Where to submit documents or application forms (e.g. CSC center, bank branch, online portal)
        - What are the step-by-step application instructions

        Args:
            scheme_name: Name or code of government scheme (e.g. 'pm_kisan', 'jan_dhan', 'pm_mudra', 'pm_sby', 'atal_pension')
        """
        logger.info(
            f"GovernmentSchemeSpecialist executing get_scheme_application_guide tool for scheme_name='{scheme_name}'"
        )
        res = schemes_data.get_scheme_application_guide(scheme_name=scheme_name)
        return json.dumps(res, ensure_ascii=False)

    @function_tool
    async def transfer_to_main_assistant(
        self,
        context: RunContext,
        reason: str = "general_financial_query",
    ) -> str:
        """Transfer the caller back to the main financial assistant (FinGuard AI) when they ask unrelated questions.

        Call this tool when the user asks about:
        - General banking (savings accounts, passbook, ATM, branch services)
        - Suspected financial scams, fraud, phishing links, or unauthorized transactions
        - Dispute resolution, human officer escalation, or complaints
        - Non-scheme topics that fall outside government schemes

        Args:
            reason: Short description of why the user is being transferred back (e.g. 'fraud_report', 'banking_inquiry', 'dispute')
        """
        logger.info(
            f"GovernmentSchemeSpecialist transferring caller back to main Assistant (reason='{reason}')"
        )
        try:
            # If running in an active AgentSession, update active agent
            if hasattr(self, "session") and self.session is not None:
                try:
                    from src.agent import Assistant
                except ImportError:
                    from agent import Assistant
                self.session.update_agent(Assistant())
                logger.info("Successfully updated session active agent to Assistant")
        except Exception as e:
            logger.warning(f"Note on agent session update during transfer: {e}")

        return (
            "Caller is being transferred to the main FinGuard AI assistant. "
            "Please inform the caller in Hindi: 'Main aapko hamare main financial assistant se connect kar raha hoon jo aapki is vishay par madad karenge.'"
        )
