import asyncio
import json
import os
import sys

from dotenv import load_dotenv
from livekit import api

try:
    from src import db
except ImportError:
    import db

load_dotenv(".env.local")

LIVEKIT_URL = os.getenv("LIVEKIT_URL")
LIVEKIT_API_KEY = os.getenv("LIVEKIT_API_KEY")
LIVEKIT_API_SECRET = os.getenv("LIVEKIT_API_SECRET")
TRUNK_ID = os.getenv("LIVEKIT_SIP_OUTBOUND_TRUNK_ID") or os.getenv(
    "LIVEKIT_SIP_TRUNK_ID", "ST_u8DePhaZ6tcJ"
)
AGENT_NAME = os.getenv("AGENT_NAME", "my-agent")


async def make_call(phone_number: str, user_id: str = "usr_1001"):
    if not LIVEKIT_URL:
        raise RuntimeError("LIVEKIT_URL is missing in .env.local")

    if not LIVEKIT_API_KEY:
        raise RuntimeError("LIVEKIT_API_KEY is missing in .env.local")

    if not LIVEKIT_API_SECRET:
        raise RuntimeError("LIVEKIT_API_SECRET is missing in .env.local")

    if not TRUNK_ID:
        raise RuntimeError(
            "LIVEKIT_SIP_OUTBOUND_TRUNK_ID or LIVEKIT_SIP_TRUNK_ID is missing"
        )

    # Check opt-out status in SQLite DB
    db.init_db()
    profile = db.get_user_profile(user_id)
    if profile and profile.get("opted_out"):
        print("\n=== FinGuard AI Linphone Outbound Call ===")
        print(f"Destination : {phone_number}")
        print(f"Trunk ID    : {TRUNK_ID}")
        print("Status      : BLOCKED (User has opted out of outbound calls)")
        return None

    clean_phone = phone_number.replace("+", "").replace(" ", "").replace("-", "")
    room_name = f"outbound-finguard-{clean_phone}"

    print("=== FinGuard AI Linphone Outbound Call ===")
    print(f"Destination: {phone_number}")
    print(f"Trunk ID: {TRUNK_ID}")
    print(f"Room: {room_name}")

    lkapi = api.LiveKitAPI(
        url=LIVEKIT_URL,
        api_key=LIVEKIT_API_KEY,
        api_secret=LIVEKIT_API_SECRET,
    )

    try:
        # 1. Create Agent Dispatch for room
        dispatch_req = api.CreateAgentDispatchRequest(
            agent_name=AGENT_NAME,
            room=room_name,
            metadata=json.dumps({
                "is_outbound": True,
                "user_id": user_id,
                "phone": phone_number,
            }),
        )
        dispatch_res = await lkapi.agent_dispatch.create_dispatch(dispatch_req)
        print(f"[OUTBOUND] Agent dispatch created: ID={dispatch_res.id}")

        # 2. Create SIP Participant
        request = api.CreateSIPParticipantRequest(
            sip_trunk_id=TRUNK_ID,
            sip_call_to=phone_number,
            room_name=room_name,
            participant_identity=f"sip-caller-{clean_phone}",
            participant_name="FinGuard Caller",
            play_dialtone=True,
        )

        response = await lkapi.sip.create_sip_participant(request)

        print("Status: CALL INITIATED")
        print(f"SIP Participant: {response.participant_id}")
        return response

    except Exception as e:
        print(f"Status: FAILED ({e})")
        raise e
    finally:
        await lkapi.aclose()


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print(
            "Usage:\n"
            "  uv run python src/telephony/outbound/dial.py +919341215116 [user_id]"
        )
        sys.exit(1)

    user_id = sys.argv[2] if len(sys.argv) > 2 else "usr_1001"
    asyncio.run(make_call(sys.argv[1], user_id=user_id))
