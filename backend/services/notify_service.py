"""
services/notify_service.py
Notification service supporting Telegram Bot and Firebase Cloud Messaging (FCM).
Sends alerts for critical security events.
"""

import logging
import os
from typing import Optional

from dotenv import load_dotenv

load_dotenv()

logger = logging.getLogger(__name__)

TELEGRAM_BOT_TOKEN = os.getenv("TELEGRAM_BOT_TOKEN")
TELEGRAM_CHAT_ID = os.getenv("TELEGRAM_CHAT_ID")
FIREBASE_CREDENTIALS_PATH = os.getenv("FIREBASE_CREDENTIALS_PATH")


# ─── Telegram ────────────────────────────────────────────────────────────────

async def send_telegram_alert(message: str, image_url: Optional[str] = None) -> bool:
    """
    Send an alert message via Telegram Bot API.

    Args:
        message: Text message to send
        image_url: Optional photo URL to include in the message

    Returns:
        True if sent successfully, False otherwise
    """
    if not TELEGRAM_BOT_TOKEN or not TELEGRAM_CHAT_ID:
        logger.warning("Telegram credentials not configured — skipping notification")
        return False

    try:
        import httpx

        async with httpx.AsyncClient(timeout=10.0) as client:
            if image_url:
                # Send photo with caption
                resp = await client.post(
                    f"https://api.telegram.org/bot{TELEGRAM_BOT_TOKEN}/sendPhoto",
                    json={
                        "chat_id": TELEGRAM_CHAT_ID,
                        "photo": image_url,
                        "caption": message,
                        "parse_mode": "HTML",
                    },
                )
            else:
                # Send text message only
                resp = await client.post(
                    f"https://api.telegram.org/bot{TELEGRAM_BOT_TOKEN}/sendMessage",
                    json={
                        "chat_id": TELEGRAM_CHAT_ID,
                        "text": message,
                        "parse_mode": "HTML",
                    },
                )

            resp.raise_for_status()
            logger.info("Telegram alert sent successfully")
            return True

    except Exception as e:
        logger.error(f"Failed to send Telegram alert: {e}")
        return False


# ─── Firebase FCM ─────────────────────────────────────────────────────────────

def _init_firebase():
    """Initialize Firebase Admin SDK if not already initialized."""
    try:
        import firebase_admin
        from firebase_admin import credentials

        if not firebase_admin._apps:
            cred_path = FIREBASE_CREDENTIALS_PATH
            if cred_path and os.path.exists(cred_path):
                cred = credentials.Certificate(cred_path)
                firebase_admin.initialize_app(cred)
                logger.info("Firebase Admin SDK initialized")
            else:
                logger.warning("Firebase credentials file not found")
                return False
        return True
    except ImportError:
        logger.warning("firebase_admin not installed")
        return False
    except Exception as e:
        logger.error(f"Firebase init error: {e}")
        return False


async def send_fcm_notification(
    title: str,
    body: str,
    topic: str = "door_alerts",
    data: Optional[dict] = None
) -> bool:
    """
    Send a push notification via Firebase Cloud Messaging.

    Args:
        title: Notification title
        body: Notification body text
        topic: FCM topic to publish to (all subscribed devices receive it)
        data: Optional key-value data payload

    Returns:
        True if sent successfully, False otherwise
    """
    if not _init_firebase():
        return False

    try:
        from firebase_admin import messaging

        message = messaging.Message(
            notification=messaging.Notification(title=title, body=body),
            topic=topic,
            data=data or {},
        )
        response = messaging.send(message)
        logger.info(f"FCM notification sent: {response}")
        return True

    except Exception as e:
        logger.error(f"Failed to send FCM notification: {e}")
        return False


# ─── High-level alert helpers ─────────────────────────────────────────────────

async def alert_unknown_face(image_url: Optional[str] = None):
    """Send alert when an unknown face is detected at the door."""
    msg = "🚨 <b>Unknown Person Detected</b>\nAn unrecognized face was detected at the door."
    await send_telegram_alert(msg, image_url)
    await send_fcm_notification(
        title="⚠️ Unknown Person",
        body="An unrecognized face was detected at your door.",
        data={"event": "face_unknown", "image_url": image_url or ""},
    )


async def alert_door_forced(image_url: Optional[str] = None):
    """Send alert when door is forced open."""
    msg = "🔴 <b>DOOR FORCED OPEN</b>\nYour door has been forced open!"
    await send_telegram_alert(msg, image_url)
    await send_fcm_notification(
        title="🔴 Door Forced Open",
        body="Your door has been forced open! Check immediately.",
        data={"event": "door_forced"},
    )


async def alert_alarm_triggered(image_url: Optional[str] = None):
    """Send alert when alarm is triggered."""
    msg = "🚨 <b>ALARM TRIGGERED</b>\nThe security alarm has been activated."
    await send_telegram_alert(msg, image_url)
    await send_fcm_notification(
        title="🚨 Alarm Triggered",
        body="The security alarm has been activated at your door.",
        data={"event": "alarm_triggered"},
    )
