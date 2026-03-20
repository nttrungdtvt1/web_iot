"""
cloud/cleanup_job.py
Scheduled cleanup job — removes cloud images older than 30 days
that are no longer referenced in the database.

Run nightly via cron:
    0 3 * * * cd /app && python cloud/cleanup_job.py >> /var/log/smartdoor_cleanup.log 2>&1
"""

import asyncio
import logging
import os
import sys
from datetime import datetime, timezone, timedelta

# Make sure backend is on path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'backend'))

from dotenv import load_dotenv
load_dotenv(os.path.join(os.path.dirname(__file__), '..', 'backend', '.env'))

from sqlalchemy import select, text
from cloud.storage_client import get_storage_client

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)s | %(message)s"
)
logger = logging.getLogger(__name__)

RETENTION_DAYS = int(os.getenv("IMAGE_RETENTION_DAYS", "30"))


async def get_referenced_urls() -> set[str]:
    """
    Collect all image URLs currently referenced in the database.
    These should NOT be deleted.
    """
    from core.database import AsyncSessionLocal, init_db
    await init_db()

    referenced = set()
    async with AsyncSessionLocal() as db:
        # Resident face images
        result = await db.execute(
            text("SELECT face_image_public_id FROM residents WHERE face_image_public_id IS NOT NULL")
        )
        for (pub_id,) in result:
            referenced.add(pub_id)

    logger.info(f"Found {len(referenced)} referenced images in database")
    return referenced


async def cleanup_old_snapshots():
    """
    Main cleanup routine:
    1. Query cloud storage for objects older than RETENTION_DAYS
    2. Skip any that are still referenced in the database
    3. Delete the rest
    """
    logger.info(f"=== Smart Door Image Cleanup Job — {datetime.now(timezone.utc).isoformat()} ===")
    logger.info(f"Retention period: {RETENTION_DAYS} days")

    try:
        client = get_storage_client()
        referenced_ids = await get_referenced_urls()

        provider = os.getenv("STORAGE_PROVIDER", "cloudinary").lower()

        if provider == "s3":
            # List old S3 objects in the snapshots folder
            old_objects = client.list_objects(prefix="snapshots/", older_than_days=RETENTION_DAYS)
            keys_to_delete = [
                obj["key"] for obj in old_objects
                if obj["key"] not in referenced_ids
            ]
            if keys_to_delete:
                deleted = client.delete_batch(keys_to_delete)
                logger.info(f"Deleted {deleted} old S3 snapshots")
            else:
                logger.info("No old S3 snapshots to delete")

        else:  # Cloudinary
            old_ids = client.list_old_resources(folder="snapshots", older_than_days=RETENTION_DAYS)
            to_delete = [pid for pid in old_ids if pid not in referenced_ids]

            logger.info(f"Found {len(old_ids)} old Cloudinary resources, {len(to_delete)} to delete")

            deleted_count = 0
            for public_id in to_delete:
                if client.delete(public_id):
                    deleted_count += 1
                    logger.debug(f"Deleted: {public_id}")

            logger.info(f"Deleted {deleted_count} old Cloudinary snapshots")

        logger.info("=== Cleanup complete ===")

    except Exception as e:
        logger.exception(f"Cleanup job failed: {e}")
        sys.exit(1)


if __name__ == "__main__":
    asyncio.run(cleanup_old_snapshots())
