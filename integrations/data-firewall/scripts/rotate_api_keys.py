#!/usr/bin/env python3
"""
rotate_api_keys.py — rotate an API key in Redis without touching job history.

Usage:
    python scripts/rotate_api_keys.py --old-key sk-abc --new-key sk-xyz
"""
from __future__ import annotations

import argparse
import sys

from core.auth import get_key_info, hash_api_key, register_api_key, revoke_api_key


def rotate(old_key: str, new_key: str) -> None:
    info = get_key_info(old_key)
    if not info["valid"]:
        print("ERROR: old key is invalid or already expired.", file=sys.stderr)
        sys.exit(1)

    credits  = info["credits"]
    plan     = info["plan"]
    ttl_left = info["expires_in_seconds"]

    new_hash = register_api_key(new_key, credits=credits, plan=plan, ttl_seconds=ttl_left)
    revoke_api_key(old_key)

    print("Rotated successfully.")
    print(f"  Old key hash : {hash_api_key(old_key)[:16]}... (revoked)")
    print(f"  New key hash : {new_hash[:16]}...")
    print(f"  Plan         : {plan}")
    print(f"  Credits      : {credits}")
    if ttl_left:
        print(f"  TTL remaining: {ttl_left}s")
    else:
        print("  TTL remaining: no expiry")


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--old-key", required=True)
    parser.add_argument("--new-key", required=True)
    args = parser.parse_args()
    rotate(args.old_key, args.new_key)
