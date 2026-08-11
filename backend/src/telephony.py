"""
FinGuard AI - Telephony & LiveKit SIP Integration Module
Provides outbound phone calling using LiveKit SIP trunking and Linphone integration.
"""

import json
import logging
import os
from typing import Any, Dict, Optional

from dotenv import load_dotenv
from livekit import api

load_dotenv(".env.local")

logger = logging.getLogger("telephony")

# Load environment configurations
LIVEKIT_URL = os.getenv("LIVEKIT_URL", "")
LIVEKIT_API_KEY = os.getenv("LIVEKIT_API_KEY", "")
LIVEKIT_API_SECRET = os.getenv("LIVEKIT_API_SECRET", "")
LIVEKIT_SIP_TRUNK_ID = os.getenv("LIVEKIT_SIP_OUTBOUND_TRUNK_ID") or os.getenv(
    "LIVEKIT_SIP_TRUNK_ID", "ST_u8DePhaZ6tcJ"
)
AGENT_NAME = os.getenv("AGENT_NAME", "my-agent")
LINPHONE_SIP_URI = os.getenv("LINPHONE_SIP_URI", "sip:mohitmahto116@sip.linphone.org")
SIP_OUTBOUND_HOST = os.getenv("SIP_OUTBOUND_HOST", "sip.linphone.org")

TWILIO_ACCOUNT_SID = os.getenv("TWILIO_ACCOUNT_SID", "")
TWILIO_AUTH_TOKEN = os.getenv("TWILIO_AUTH_TOKEN", "")
TWILIO_PHONE_NUMBER = os.getenv("TWILIO_PHONE_NUMBER", "+12015550123")


class TelephonyService:
    """Service class for LiveKit SIP Telephony integration."""

    def __init__(
        self,
        livekit_url: Optional[str] = None,
        api_key: Optional[str] = None,
        api_secret: Optional[str] = None,
        trunk_id: Optional[str] = None,
        agent_name: Optional[str] = None,
    ):
        self.livekit_url = livekit_url or LIVEKIT_URL
        self.api_key = api_key or LIVEKIT_API_KEY
        self.api_secret = api_secret or LIVEKIT_API_SECRET
        self.trunk_id = trunk_id or LIVEKIT_SIP_TRUNK_ID
        self.agent_name = agent_name or AGENT_NAME

    @property
    def is_configured(self) -> bool:
        """Check if LiveKit SIP credentials are set."""
        return bool(
            self.livekit_url
            and self.api_key
            and self.api_secret
            and self.trunk_id
        )

    async def initiate_outbound_call(
        self,
        to_phone_number: str,
        user_id: str = "usr_1001",
        scheme_name: str = "PM Kisan Samman Nidhi",
        deadline_date: str = "15 August 2026",
        simulate: bool = False,
    ) -> Dict[str, Any]:
        """Initiate an outbound call using LiveKit SIP Trunking and dispatch FinGuard AI agent to the room.

        Args:
            to_phone_number: Destination phone number or SIP user in E.164 format (e.g. +919341215116)
            user_id: ID of the user in SQLite database
            scheme_name: Government scheme for approaching deadline
            deadline_date: Deadline date string
            simulate: If True, run in mock simulation mode

        Returns:
            Dict containing call metadata, participant_id, status, and room_name.
        """
        clean_phone = to_phone_number.replace("+", "").replace(" ", "").replace("-", "")
        room_name = f"outbound-finguard-{clean_phone}"

        logger.info(
            f"Initiating LiveKit SIP outbound call to {to_phone_number} for user {user_id} (Scheme: {scheme_name}, Deadline: {deadline_date})"
        )

        if simulate:
            logger.info(
                f"[SIMULATION] LiveKit SIP Outbound call placed to {to_phone_number}. Room: {room_name}"
            )
            return {
                "success": True,
                "mode": "simulated",
                "call_sid": f"SIP_simulated_{user_id}_{int(os.urandom(3).hex(), 16)}",
                "to": to_phone_number,
                "user_id": user_id,
                "room_name": room_name,
                "scheme_name": scheme_name,
                "deadline_date": deadline_date,
                "status": "queued",
                "opening_greeting_preview": f"Sentence 1: Namaste Mohit Kumar ji, main FinGuard AI Financial Services se call kar raha hoon kyunki aapke eligible sarkaari yojana '{scheme_name}' ke aavedan ki deadline {deadline_date} ko samapt ho rahi hai. Sentence 2: Agar aap aage aisi calls ya reminders nahi chahte, toh aap kisi bhi samay 'Stop' bol sakte hain ya 9 dabakar in calls ko rok sakte hain.",
            }

        if not self.is_configured:
            return {
                "success": False,
                "mode": "livekit_sip",
                "error": "LiveKit SIP configuration missing (URL, API Key, API Secret, or Trunk ID).",
                "to": to_phone_number,
                "user_id": user_id,
            }

        lkapi = api.LiveKitAPI(
            url=self.livekit_url,
            api_key=self.api_key,
            api_secret=self.api_secret,
        )

        try:
            # 1. Dispatch FinGuard AI Agent worker to the outbound room
            logger.info(f"[OUTBOUND] Creating Agent Dispatch for room {room_name} (Agent: {self.agent_name})")
            dispatch_req = api.CreateAgentDispatchRequest(
                agent_name=self.agent_name,
                room=room_name,
                metadata=json.dumps({
                    "is_outbound": True,
                    "user_id": user_id,
                    "to_phone_number": to_phone_number,
                    "scheme_name": scheme_name,
                    "deadline_date": deadline_date,
                }),
            )
            dispatch_res = await lkapi.agent_dispatch.create_dispatch(dispatch_req)
            logger.info(f"[OUTBOUND] Agent dispatch created successfully: ID={dispatch_res.id}")

            # 2. Create SIP Participant for outbound dial
            request = api.CreateSIPParticipantRequest(
                sip_trunk_id=self.trunk_id,
                sip_call_to=to_phone_number,
                room_name=room_name,
                participant_identity=f"sip-caller-{clean_phone}",
                participant_name="FinGuard Caller",
                play_dialtone=True,
            )

            response = await lkapi.sip.create_sip_participant(request)

            logger.info(
                f"[OUTBOUND] LiveKit SIP outbound participant created: ID={response.participant_id}, Room={response.room_name}, CallID={response.sip_call_id}"
            )
            return {
                "success": True,
                "mode": "livekit_sip",
                "participant_id": response.participant_id,
                "dispatch_id": dispatch_res.id,
                "sip_call_id": response.sip_call_id,
                "to": to_phone_number,
                "user_id": user_id,
                "room_name": room_name,
                "trunk_id": self.trunk_id,
                "scheme_name": scheme_name,
                "deadline_date": deadline_date,
                "status": "CALL INITIATED",
            }
        except Exception as e:
            logger.error(f"Failed to initiate LiveKit SIP outbound call: {e}")
            return {
                "success": False,
                "mode": "livekit_sip",
                "error": str(e),
                "to": to_phone_number,
                "user_id": user_id,
            }
        finally:
            await lkapi.aclose()


# Default singleton instance
telephony_service = TelephonyService()
