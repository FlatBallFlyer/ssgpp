#!/usr/bin/env python3
"""
Builds a lightweight GitHub Pages artifact in `_site/` (~200 MB, well under
GitHub Pages' 1 GB artifact limit) while rewriting deep-zoom multires tile URLs
in `_site/**/*data/*.xml` to stream directly from GitHub's Fastly-backed Raw CDN
(`https://raw.githubusercontent.com/FlatBallFlyer/ssgpp/main/...`).
"""

import json
import os
import re
import shutil
import sys

RAW_BASE = os.environ.get(
    "SSGPP_RAW_BASE",
    "https://raw.githubusercontent.com/FlatBallFlyer/ssgpp/main",
).rstrip("/")

OUT_DIR = sys.argv[1] if len(sys.argv) > 1 else "_site"


def copy_file(src: str, dst_root: str) -> int:
    rel = os.path.relpath(src, ".")
    dst = os.path.join(dst_root, rel)
    os.makedirs(os.path.dirname(dst), exist_ok=True)
    shutil.copy2(src, dst)
    return os.path.getsize(dst)


def rewrite_xml(xml_path: str, rel_data_dir: str, scene_dirs: set[str]) -> None:
    with open(xml_path, "r", encoding="utf-8", errors="ignore") as f:
        content = f.read()

    # Enable anonymous CORS so WebGL textures load cleanly from raw.githubusercontent.com
    content = re.sub(
        r'<security\s+cors="[^"]*"',
        '<security cors="anonymous"',
        content,
    )

    rel_data_url = rel_data_dir.replace(os.sep, "/")

    def replace_url(match: re.Match) -> str:
        raw_url = match.group(1)
        clean = raw_url
        if clean.startswith("%FIRSTXML%/"):
            clean = clean[len("%FIRSTXML%/") :]
        parts = clean.split("/")
        if len(parts) >= 2 and parts[0] in scene_dirs:
            scene_name = parts[0]
            rest = "/".join(parts[1:])
            # Keep preview.jpg and thumbnail.jpg local inside _site/ for instant load
            if rest in ("preview.jpg", "thumbnail.jpg"):
                return match.group(0)
            cdn_url = f"{RAW_BASE}/{rel_data_url}/{scene_name}/{rest}"
            return f'url="{cdn_url}"'
        return match.group(0)

    new_content = re.sub(r'url="([^"]+)"', replace_url, content)
    with open(xml_path, "w", encoding="utf-8") as f:
        f.write(new_content)


def main() -> None:
    if os.path.exists(OUT_DIR):
        shutil.rmtree(OUT_DIR)
    os.makedirs(OUT_DIR, exist_ok=True)

    # Always include .nojekyll so folders starting with '_' (e.g. _2014_10_03...) are served
    with open(os.path.join(OUT_DIR, ".nojekyll"), "w", encoding="utf-8") as f:
        f.write("")

    total_bytes = 0
    total_files = 0
    data_dirs: list[str] = []

    # 1. Copy all files outside *data directories (HTML, blog, outer thumbnails, LICENSE, README)
    for root, dirs, files in os.walk("."):
        for skip in (".git", ".github", "logs", OUT_DIR, "scripts"):
            if skip in dirs:
                dirs.remove(skip)
        for d in list(dirs):
            if d.endswith("data") or d.endswith("dataBackup"):
                data_dirs.append(os.path.join(root, d))
                dirs.remove(d)
        for fn in files:
            if fn == ".DS_Store":
                continue
            src = os.path.join(root, fn)
            total_bytes += copy_file(src, OUT_DIR)
            total_files += 1

    # 2. For each *data directory, copy top-level files (XML, JS, SWF, thumbnail),
    #    UI folders (graphics, lib, spots, sounds), and each scene's preview.jpg & thumbnail.jpg
    for dd in data_dirs:
        rel_dd = os.path.relpath(dd, ".")
        scene_dirs: set[str] = set()
        for entry in os.scandir(dd):
            if entry.name == ".DS_Store":
                continue
            if entry.is_file():
                total_bytes += copy_file(entry.path, OUT_DIR)
                total_files += 1
            elif entry.is_dir():
                if entry.name in ("graphics", "lib", "spots", "sounds"):
                    for r, _, fs in os.walk(entry.path):
                        for fn in fs:
                            if fn == ".DS_Store":
                                continue
                            total_bytes += copy_file(os.path.join(r, fn), OUT_DIR)
                            total_files += 1
                else:
                    scene_dirs.add(entry.name)
                    for fn in ("preview.jpg", "thumbnail.jpg"):
                        p = os.path.join(entry.path, fn)
                        if os.path.exists(p):
                            total_bytes += copy_file(p, OUT_DIR)
                            total_files += 1

        # Rewrite XML files in _site/<rel_dd> to stream deep-zoom tiles from RAW_BASE
        out_dd = os.path.join(OUT_DIR, rel_dd)
        if os.path.isdir(out_dd):
            for fn in os.listdir(out_dd):
                if fn.endswith(".xml"):
                    rewrite_xml(os.path.join(out_dd, fn), rel_dd, scene_dirs)

    # 3. Also copy the sample tile images referenced in index.html CATALOG.items[*].tiles
    if os.path.exists("index.html"):
        idx_txt = open("index.html", "r", encoding="utf-8", errors="ignore").read()
        m = re.search(r"const CATALOG = (\{.*?\});\s*\n", idx_txt, re.S)
        if m:
            catalog = json.loads(m.group(1))
            for item in catalog.get("items", []):
                for t in item.get("tiles", []):
                    if os.path.exists(t):
                        dst_path = os.path.join(OUT_DIR, t)
                        if not os.path.exists(dst_path):
                            total_bytes += copy_file(t, OUT_DIR)
                            total_files += 1

    print(
        f"Built {OUT_DIR}/ successfully: {total_files} files, "
        f"{total_bytes / (1024 * 1024):.2f} MB (limit: 1024 MB)"
    )


if __name__ == "__main__":
    main()
