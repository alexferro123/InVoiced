#!/usr/bin/env python3
"""
2_push_github.py
Cria um repositório no GitHub e faz push de todos os ficheiros do projecto.

Requisitos:
    pip install requests

Uso:
    python 2_push_github.py ./invoiced-app --token ghp_xxx [--repo invoiced] [--private]
"""

import argparse
import base64
import json
import os
import sys
import time

try:
    import requests
except ImportError:
    print("❌  Instala o pacote requests:  pip install requests")
    sys.exit(1)


# ── GitHub API helpers ────────────────────────────────────────────────────────

def gh(method: str, path: str, token: str, payload: dict | None = None) -> dict:
    url = f"https://api.github.com{path}"
    headers = {
        "Authorization": f"Bearer {token}",
        "Accept":        "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
    }
    r = requests.request(method, url, headers=headers, json=payload, timeout=30)
    if not r.ok:
        print(f"\n❌  GitHub API error {r.status_code} on {method} {path}")
        print(f"    {r.text[:400]}")
        sys.exit(1)
    return r.json() if r.text else {}


def get_username(token: str) -> str:
    return gh("GET", "/user", token)["login"]


def repo_exists(token: str, owner: str, name: str) -> bool:
    url = f"https://api.github.com/repos/{owner}/{name}"
    r = requests.get(url, headers={"Authorization": f"Bearer {token}"}, timeout=10)
    return r.status_code == 200


def create_repo(token: str, name: str, private: bool) -> dict:
    return gh("POST", "/user/repos", token, {
        "name":        name,
        "description": "Gestão de faturas com IA para PMEs portuguesas.",
        "private":     private,
        "auto_init":   False,
    })


def upsert_file(token: str, owner: str, repo: str, path: str, content: str, sha: str | None = None):
    payload: dict = {
        "message": f"chore: add {path}",
        "content": base64.b64encode(content.encode("utf-8")).decode(),
    }
    if sha:
        payload["sha"] = sha

    return gh("PUT", f"/repos/{owner}/{repo}/contents/{path}", token, payload)


def get_existing_sha(token: str, owner: str, repo: str, path: str) -> str | None:
    url = f"https://api.github.com/repos/{owner}/{repo}/contents/{path}"
    r = requests.get(url, headers={"Authorization": f"Bearer {token}"}, timeout=10)
    if r.status_code == 200:
        return r.json().get("sha")
    return None


def collect_files(project_dir: str) -> list[tuple[str, str]]:
    """Returns list of (relative_path, content) for all files in project_dir."""
    results = []
    skip_dirs = {".git", "node_modules", "dist", "__pycache__"}

    for root, dirs, files in os.walk(project_dir):
        dirs[:] = [d for d in dirs if d not in skip_dirs]
        for fname in files:
            abs_path = os.path.join(root, fname)
            rel_path = os.path.relpath(abs_path, project_dir).replace("\\", "/")
            try:
                with open(abs_path, encoding="utf-8") as f:
                    content = f.read()
                results.append((rel_path, content))
            except UnicodeDecodeError:
                # Binary file — skip (no assets in this project)
                print(f"  ⚠  Skipping binary: {rel_path}")

    return results


# ── main ──────────────────────────────────────────────────────────────────────

def main():
    parser = argparse.ArgumentParser(description="Push InVoiced project to GitHub.")
    parser.add_argument("project_dir", help="Path to the decomposed project directory")
    parser.add_argument("--token",   required=True, help="GitHub personal access token (repo scope)")
    parser.add_argument("--repo",    default="invoiced", help="Repository name (default: invoiced)")
    parser.add_argument("--private", action="store_true", help="Create private repository")
    args = parser.parse_args()

    if not os.path.isdir(args.project_dir):
        print(f"❌  Directory not found: {args.project_dir}")
        sys.exit(1)

    print("\n🔑  Validating token …")
    owner = get_username(args.token)
    print(f"    Authenticated as: {owner}")

    if repo_exists(args.token, owner, args.repo):
        print(f"\n⚠️   Repository '{owner}/{args.repo}' already exists. Files will be updated.")
        created = False
    else:
        print(f"\n📦  Creating repository '{args.repo}' ({'private' if args.private else 'public'}) …")
        create_repo(args.token, args.repo, args.private)
        created = True
        time.sleep(1)  # let GitHub settle

    files = collect_files(args.project_dir)
    total = len(files)
    print(f"\n📤  Uploading {total} files …\n")

    for i, (rel_path, content) in enumerate(files, 1):
        sha = None if created else get_existing_sha(args.token, owner, args.repo, rel_path)
        upsert_file(args.token, owner, args.repo, rel_path, content, sha)
        print(f"  [{i:>3}/{total}] {rel_path}")

    url = f"https://github.com/{owner}/{args.repo}"
    print(f"\n✅  Done!  →  {url}\n")


if __name__ == "__main__":
    main()
