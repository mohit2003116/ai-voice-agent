"""
FinGuard AI - Outbound Call Trigger CLI & Script
Triggers an outbound call to a target phone number for scheme deadline reminders via LiveKit SIP.
"""

import argparse
import asyncio
import json
import logging
from typing import Any, Dict

try:
    from src import db
    from src.telephony import telephony_service
except ImportError:
    import db
    from telephony import telephony_service

logging.basicConfig(
    level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger("outbound_call")


async def place_outbound_deadline_call(
    to_phone_number: str,
    user_id: str = "usr_1001",
    name: str = "Mohit Kumar",
    scheme_name: str = "PM Kisan Samman Nidhi",
    deadline_date: str = "15 August 2026",
    simulate: bool = True,
) -> Dict[str, Any]:
    """Check database profile, verify opt-out status, and place an outbound deadline call via LiveKit SIP.

    Args:
        to_phone_number: Phone number or SIP user to call
        user_id: User ID in SQLite database
        name: Name of the caller
        scheme_name: Name of government scheme
        deadline_date: Deadline date string
        simulate: Whether to run in simulated mode
    """
    db.init_db()

    # Retrieve or update caller profile
    profile = db.get_user_profile(user_id)
    if not profile:
        profile = db.upsert_user_profile(
            user_id=user_id,
            name=name,
            language_preference="Hindi",
            facts={
                "eligible_scheme": scheme_name,
                "scheme_code": "pm_kisan",
                "eligibility_status": "eligible",
                "deadline_date": deadline_date,
                "approaching_deadline": True,
            },
        )

    # Check if user has opted out of outbound calls
    if profile.get("opted_out"):
        logger.warning(
            f"BLOCKED: User {user_id} ({name}) has opted out of outbound calls."
        )
        return {
            "success": False,
            "blocked": True,
            "reason": "User has opted out of receiving outbound calls.",
            "user_id": user_id,
            "name": name,
        }

    # Initiate telephony call via LiveKit SIP service
    res = await telephony_service.initiate_outbound_call(
        to_phone_number=to_phone_number,
        user_id=user_id,
        scheme_name=scheme_name,
        deadline_date=deadline_date,
        simulate=simulate,
    )
    return res


def main():
    parser = argparse.ArgumentParser(
        description="Trigger FinGuard AI Outbound Scheme Deadline Call via LiveKit SIP"
    )
    parser.add_argument(
        "--to",
        type=str,
        default="+919341215116",
        help="Destination phone number (E.164 format)",
    )
    parser.add_argument(
        "--user-id", type=str, default="usr_1001", help="SQLite User ID"
    )
    parser.add_argument("--name", type=str, default="Mohit Kumar", help="Caller Name")
    parser.add_argument(
        "--scheme",
        type=str,
        default="PM Kisan Samman Nidhi",
        help="Government Scheme Name",
    )
    parser.add_argument(
        "--deadline", type=str, default="15 August 2026", help="Scheme Deadline Date"
    )
    parser.add_argument(
        "--simulate",
        action="store_true",
        default=False,
        help="Run in simulation mode without placing a live call",
    )
    parser.add_argument(
        "--live",
        action="store_true",
        help="Make a live LiveKit SIP phone call using configured credentials",
    )

    args = parser.parse_args()
    simulate = args.simulate or (not args.live and False)

    logger.info("=== FinGuard AI Linphone Outbound Call Trigger ===")
    result = asyncio.run(
        place_outbound_deadline_call(
            to_phone_number=args.to,
            user_id=args.user_id,
            name=args.name,
            scheme_name=args.scheme,
            deadline_date=args.deadline,
            simulate=simulate,
        )
    )

    print("\n--- Call Initiation Result ---")
    print(json.dumps(result, indent=2, ensure_ascii=False))


if __name__ == "__main__":
    main()
