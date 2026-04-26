#!/usr/bin/env python3
"""Submit URLs to IndexNow (Bing/Yandex/etc).

Reads https://tevaxia.lu/sitemap.xml, extracts <loc> URLs, then POSTs them
in batches of 10 000 (IndexNow batch limit) to api.indexnow.org.

Usage:
    python scripts/indexnow_submit.py            # all URLs in sitemap
    python scripts/indexnow_submit.py URL1 URL2  # specific URLs only

IndexNow protocol: https://www.indexnow.org/documentation
"""
from __future__ import annotations

import json
import sys
import urllib.request
import urllib.error
import xml.etree.ElementTree as ET

HOST = "tevaxia.lu"
KEY = "d92b4b8d50abf45f9ead4953c57a409a"
KEY_LOCATION = f"https://{HOST}/{KEY}.txt"
SITEMAP_URL = f"https://{HOST}/sitemap.xml"
ENDPOINT = "https://api.indexnow.org/IndexNow"
BATCH_SIZE = 10_000  # IndexNow accepts up to 10 000 URLs per request


def fetch_sitemap_urls() -> list[str]:
    print(f"Fetching {SITEMAP_URL}...")
    with urllib.request.urlopen(SITEMAP_URL, timeout=30) as r:
        body = r.read()
    root = ET.fromstring(body)
    ns = {"sm": "http://www.sitemaps.org/schemas/sitemap/0.9"}
    urls = [el.text.strip() for el in root.findall(".//sm:loc", ns) if el.text]
    print(f"Found {len(urls)} URLs in sitemap")
    return urls


def submit_batch(urls: list[str]) -> tuple[int, str]:
    payload = {
        "host": HOST,
        "key": KEY,
        "keyLocation": KEY_LOCATION,
        "urlList": urls,
    }
    data = json.dumps(payload).encode("utf-8")
    req = urllib.request.Request(
        ENDPOINT,
        data=data,
        method="POST",
        headers={"Content-Type": "application/json; charset=utf-8"},
    )
    try:
        with urllib.request.urlopen(req, timeout=60) as r:
            return r.status, r.read().decode("utf-8", errors="replace")
    except urllib.error.HTTPError as e:
        return e.code, e.read().decode("utf-8", errors="replace")


def main() -> int:
    if len(sys.argv) > 1:
        urls = sys.argv[1:]
        print(f"Using {len(urls)} URLs from CLI args")
    else:
        urls = fetch_sitemap_urls()

    if not urls:
        print("No URLs to submit.")
        return 1

    # Filter to ensure all URLs belong to the configured host
    bad = [u for u in urls if HOST not in u]
    if bad:
        print(f"WARNING: {len(bad)} URLs do not match host {HOST} — will be rejected")

    sent = 0
    for i in range(0, len(urls), BATCH_SIZE):
        batch = urls[i : i + BATCH_SIZE]
        status, body = submit_batch(batch)
        if 200 <= status < 300:
            print(f"[OK]  batch {i//BATCH_SIZE + 1}: {len(batch)} URLs (HTTP {status})")
            sent += len(batch)
        else:
            print(f"[ERR] batch {i//BATCH_SIZE + 1}: HTTP {status}")
            print(f"      body: {body[:500]}")
            return 2
    print(f"\nDone. Submitted {sent} URLs to {ENDPOINT}.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
