import logging

import json
from dotenv import load_dotenv
from livekit import rtc
from livekit.agents import (
    Agent,
    AgentServer,
    AgentSession,
    JobContext,
    JobProcess,
    cli,
    inference,
    tokenize,
    room_io,
    function_tool,
    RunContext,
)
from livekit.plugins import murf, silero, google, deepgram, noise_cancellation, openai
from livekit.plugins.turn_detector.multilingual import MultilingualModel

logger = logging.getLogger("agent")

load_dotenv(".env.local")

from typing import Optional

try:
    from src.prompt import SYSTEM_PROMPT
    from src import db, schemes_data
except ImportError:
    from prompt import SYSTEM_PROMPT
    import db
    import schemes_data


class Assistant(Agent):
    def __init__(self, instructions: str = SYSTEM_PROMPT) -> None:
        super().__init__(instructions=instructions)

    @function_tool
    async def lookup_caller_profile(self, context: RunContext, user_id: str = "usr_1001") -> str:
        """Lookup caller profile and saved financial facts from the SQLite database.

        Use this function when you need to find out who the caller is, their language preference, 
        which schemes they have already checked, or their recorded eligibility answers.

        Args:
            user_id: The ID of the caller to lookup (e.g. 'usr_1001')
        """
        logger.info(f"LLM executing lookup_caller_profile tool for user_id={user_id}")
        profile = db.get_user_profile(user_id)
        if not profile:
            return f"No caller profile found for ID '{user_id}'."
        return json.dumps(profile)

    @function_tool
    async def save_caller_fact(
        self, 
        context: RunContext, 
        caller_consent_given: bool = False,
        user_id: str = "usr_1001", 
        scheme_checked: str = "", 
        eligibility_key: str = "", 
        eligibility_value: str = "", 
        language_preference: str = ""
    ) -> str:
        """Save new facts learned about the caller during the session into the SQLite database ONLY IF explicit caller consent was granted.

        Strict Consent Rule: You MUST ask the caller for verbal consent BEFORE calling this function tool.
        Set caller_consent_given=True ONLY if the caller explicitly agreed (e.g. said Yes/Haan/Sure) to saving their information for future calls.
        If the caller said No/Nahi/Don't save, set caller_consent_given=False or do not call this tool.

        Strict Security Rule: NEVER accept or save OTP, PIN, CVV, passwords, Aadhaar numbers, or Bank Account numbers.

        Args:
            caller_consent_given: Set to True ONLY if caller verbally granted consent. Set to False if refused or unasked.
            user_id: The ID of the caller (defaults to 'usr_1001')
            scheme_checked: Name of government scheme checked (e.g. 'PM Kisan Samman Nidhi', 'Pradhan Mantri Jan Dhan Yojana')
            eligibility_key: Name of eligibility answer key (e.g. 'is_small_farmer', 'land_holding')
            eligibility_value: Eligibility answer value (e.g. 'true', 'Under 2 hectares')
            language_preference: Language preference of caller (e.g. 'Hindi', 'English', 'Hinglish')
        """
        logger.info(f"LLM executing save_caller_fact tool for user_id={user_id}: consent={caller_consent_given}, scheme={scheme_checked}")
        if not caller_consent_given:
            logger.warning(f"save_caller_fact aborted for {user_id}: Caller consent was NOT granted.")
            return "PRIVACY BLOCKED: Caller consent was not granted. Data was NOT saved into database."

        eligibility_facts = {}
        if eligibility_key:
            eligibility_facts[eligibility_key] = eligibility_value

        db.record_user_scheme_inquiry(user_id, scheme_checked or "General Financial Services", eligibility_facts if eligibility_facts else None)

        if language_preference:
            profile = db.get_user_profile(user_id) or {}
            db.upsert_user_profile(
                user_id=user_id,
                name=profile.get("name", "Mohit Kumar"),
                language_preference=language_preference,
                facts=profile.get("facts", {})
            )

        return f"Successfully saved caller facts for ID '{user_id}' in SQLite database with explicit consent."

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
        simulate_api_failure: bool = False
    ) -> str:
        """Check real government scheme eligibility, benefits, and required document checklist based on caller's answers.

        Use this function tool whenever the caller asks:
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
        logger.info(f"LLM executing check_scheme_eligibility tool for scheme_name='{scheme_name}' (simulate_api_failure={simulate_api_failure})")
        res = schemes_data.evaluate_scheme_eligibility(
            scheme_name=scheme_name,
            caller_age=caller_age,
            land_holding_hectares=land_holding_hectares,
            annual_income_inr=annual_income_inr,
            is_farmer=is_farmer,
            has_bank_account=has_bank_account,
            simulate_api_failure=simulate_api_failure
        )
        return json.dumps(res, ensure_ascii=False)


server = AgentServer()


def prewarm(proc: JobProcess):
    proc.userdata["vad"] = silero.VAD.load()
    db.init_db()


server.setup_fnc = prewarm


@server.rtc_session(agent_name="my-agent")
async def my_agent(ctx: JobContext):
    # Logging setup
    session_id = ctx.room.name
    ctx.log_context_fields = {
        "room": session_id,
    }

    # Associate caller user_id (defaults to default user usr_1001)
    user_id = "usr_1001"
    db.create_session(session_id, room_name=ctx.room.name, agent_name="my-agent")
    
    # Ensure default user profile exists
    caller = db.get_user_profile(user_id)
    if not caller:
        caller = db.upsert_user_profile(
            user_id=user_id,
            name="Mohit Kumar",
            language_preference="Hindi",
            facts={
                "schemes_checked": ["Financial fraud"],
                "eligibility_answers": {"received_suspicious_call": True, "fraud_type": "Fake OTP / KYC Call"}
            }
        )
    logger.info(f"Started SQLite tracking for session {session_id} (Caller: {user_id})")

    # Build personalized prompt if caller is returning with previous facts
    custom_instructions = SYSTEM_PROMPT
    if caller and caller.get("name"):
        caller_name = caller["name"]
        facts = caller.get("facts", {})
        schemes = facts.get("schemes_checked", [])
        last_topic = schemes[-1] if schemes else "financial safety and government schemes"
        lang = caller.get("language_preference", "Hinglish")
        
        custom_instructions += f"""

RETURNING CALLER CONTEXT:
Aap ek returning caller se baat kar rahe hain jinka naam {caller_name} hai.
- Caller ka Naam: {caller_name}
- Bhaasha: {lang}
- Pichhli baar ki baat: {last_topic}

RETURNING CALLER FIRST GREETING INSTRUCTION (Hindi mein bolein):
Is session mein pehli baar greet karte waqt caller ko personally welcome karein.
Udaharan: "Namaste {caller_name} ji! Aapka swagat hai. Pichhli baar hum {last_topic} ke baare mein baat kar rahe the. Aaj main aapki kaise madad kar sakta hoon?"

STRICT LANGUAGE RULE: Hamesha SIRF Hindi mein jawab dein. Kisi bhi haal mein English mein mat bolein.
"""
        logger.info(f"Loaded returning caller context for {caller_name} (Last topic: {last_topic})")

    # Set up a voice AI pipeline using Murf Falcon, Gemini, Deepgram, and the LiveKit turn detector
    session = AgentSession(
        stt=deepgram.STT(model="nova-3", language="hi"),
        llm=google.LLM(
            model="gemini-3.5-flash-lite",
        ),
        tts=murf.TTS(
            voice="Anisha", 
            style="Conversation",
            tokenizer=tokenize.basic.SentenceTokenizer(min_sentence_len=2),
            text_pacing=True
        ),
        turn_detection=MultilingualModel(),
        vad=ctx.proc.userdata["vad"],
        preemptive_generation=True,
    )

    # Listen to conversation items added to log transcripts and safety events into SQLite
    @session.on("conversation_item_added")
    def on_conversation_item(ev):
        try:
            item = ev.item
            role = str(getattr(item, "role", "unknown"))
            text = item.text_content() if hasattr(item, "text_content") and callable(item.text_content) else str(getattr(item, "content", ""))
            
            if text and text.strip():
                db.log_message(session_id, role, text)
                
                lowered = text.lower()
                if any(k in lowered for k in ["otp", "upi pin", "atm pin", "cvv", "password"]):
                    db.log_safety_event(
                        session_id, 
                        "credentials_guardrail_trigger", 
                        f"Guardrail triggered for {role}: '{text[:120]}'"
                    )
                elif any(k in lowered for k in ["scam", "fraud", "fake link", "lottery", "phishing", "unauthorized"]):
                    db.log_safety_event(
                        session_id, 
                        "scam_inquiry", 
                        f"Scam inquiry in {role} message: '{text[:120]}'"
                    )
                elif any(k in lowered for k in ["pm kisan", "jan dhan", "scheme", "yojana", "mudra", "awas"]):
                    db.log_safety_event(
                        session_id, 
                        "scheme_inquiry", 
                        f"Scheme inquiry in {role} message: '{text[:120]}'"
                    )

                # Note: Caller facts are saved exclusively via save_caller_fact tool when explicit caller consent is granted.

        except Exception as e:
            logger.error(f"Error saving message to database: {e}")

    # Listen to disconnect event to finalize session in SQLite
    @ctx.room.on("disconnected")
    def on_disconnected(reason=None):
        try:
            db.end_session(session_id, status="completed")
            logger.info(f"Finalized session {session_id} in SQLite")
        except Exception as e:
            logger.error(f"Error completing session in database: {e}")

    # Start the session with personalized instructions
    await session.start(
        agent=Assistant(instructions=custom_instructions),
        room=ctx.room,
        room_options=room_io.RoomOptions(
            audio_input=room_io.AudioInputOptions(
                noise_cancellation=lambda params: (
                    noise_cancellation.BVCTelephony()
                    if params.participant.kind
                    == rtc.ParticipantKind.PARTICIPANT_KIND_SIP
                    else noise_cancellation.BVC()
                ),
            ),
        ),
    )

    # Join the room and connect to the user
    await ctx.connect()


if __name__ == "__main__":
    cli.run_app(server)
