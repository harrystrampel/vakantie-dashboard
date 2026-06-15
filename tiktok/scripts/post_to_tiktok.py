#!/usr/bin/env python3
"""Post a video to TikTok via the official Content Posting API.

Flow (Direct Post, PULL_FROM_URL):
  1. Refresh the access token using the stored refresh token.
  2. Init a publish request pointing at a public video URL.
  3. Poll publish status until it's done (or failed).

Required env vars (set as GitHub secrets — see ../SETUP.md):
  TIKTOK_CLIENT_KEY
  TIKTOK_CLIENT_SECRET
  TIKTOK_REFRESH_TOKEN     # long-lived; obtained once via the OAuth consent flow

Usage:
  python post_to_tiktok.py --video-url https://.../today.mp4 \
                           --title "caption with #hashtags"

Docs: https://developers.tiktok.com/doc/content-posting-api-get-started
"""
from __future__ import annotations

import argparse
import os
import sys
import time

import requests

API = "https://open.tiktokapis.com"
TOKEN_URL = f"{API}/v2/oauth/token/"
INIT_URL = f"{API}/v2/post/publish/video/init/"
STATUS_URL = f"{API}/v2/post/publish/status/fetch/"


def _require(name: str) -> str:
    val = os.environ.get(name)
    if not val:
        sys.exit(f"Missing required env var: {name}")
    return val


def refresh_access_token() -> str:
    """Exchange the long-lived refresh token for a fresh access token."""
    resp = requests.post(
        TOKEN_URL,
        headers={"Content-Type": "application/x-www-form-urlencoded"},
        data={
            "client_key": _require("TIKTOK_CLIENT_KEY"),
            "client_secret": _require("TIKTOK_CLIENT_SECRET"),
            "grant_type": "refresh_token",
            "refresh_token": _require("TIKTOK_REFRESH_TOKEN"),
        },
        timeout=30,
    )
    resp.raise_for_status()
    data = resp.json()
    token = data.get("access_token")
    if not token:
        sys.exit(f"Token refresh failed: {data}")
    return token


def init_direct_post(access_token: str, video_url: str, title: str) -> str:
    """Start a Direct Post pulling the video from a public URL. Returns publish_id."""
    resp = requests.post(
        INIT_URL,
        headers={
            "Authorization": f"Bearer {access_token}",
            "Content-Type": "application/json; charset=UTF-8",
        },
        json={
            "post_info": {
                "title": title,
                "privacy_level": "PUBLIC_TO_EVERYONE",
                "disable_comment": False,
                "disable_duet": False,
                "disable_stitch": False,
            },
            "source_info": {
                "source": "PULL_FROM_URL",
                "video_url": video_url,
            },
        },
        timeout=60,
    )
    resp.raise_for_status()
    data = resp.json()
    publish_id = (data.get("data") or {}).get("publish_id")
    if not publish_id:
        sys.exit(f"Init failed: {data}")
    return publish_id


def wait_until_done(access_token: str, publish_id: str, timeout_s: int = 300) -> None:
    """Poll publish status until terminal state or timeout."""
    deadline = time.time() + timeout_s
    while time.time() < deadline:
        resp = requests.post(
            STATUS_URL,
            headers={
                "Authorization": f"Bearer {access_token}",
                "Content-Type": "application/json; charset=UTF-8",
            },
            json={"publish_id": publish_id},
            timeout=30,
        )
        resp.raise_for_status()
        status = ((resp.json().get("data") or {}).get("status") or "").upper()
        print(f"status: {status}")
        if status in ("PUBLISH_COMPLETE", "SEND_TO_USER_INBOX"):
            print("✅ Posted (or sent to inbox for final user confirmation).")
            return
        if status in ("FAILED", "PUBLISH_FAILED"):
            sys.exit(f"❌ Publish failed: {resp.json()}")
        time.sleep(5)
    sys.exit("❌ Timed out waiting for publish status.")


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--video-url", required=True, help="Public URL to the .mp4")
    parser.add_argument("--title", required=True, help="Caption incl. hashtags")
    args = parser.parse_args()

    token = refresh_access_token()
    publish_id = init_direct_post(token, args.video_url, args.title)
    print(f"publish_id: {publish_id}")
    wait_until_done(token, publish_id)


if __name__ == "__main__":
    main()
