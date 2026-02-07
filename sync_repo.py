#!/usr/bin/env python3
"""
2-way Git sync script for Lovable projects.

Keeps local work and Lovable/GitHub remote in sync:
  - Pulls remote changes (Lovable pushes to main)
  - Commits & pushes local changes (Cursor edits)
  - Runs continuously with a configurable interval

Usage:
    python sync_repo.py              # one-shot sync
    python sync_repo.py --watch      # continuous sync (default: every 30s)
    python sync_repo.py --watch -i 10  # continuous sync every 10s
"""

import argparse
import subprocess
import sys
import time
from datetime import datetime
from pathlib import Path

REPO_DIR = Path(__file__).resolve().parent
BRANCH = "main"
REMOTE = "origin"


def run(cmd: list[str], capture: bool = True) -> subprocess.CompletedProcess:
    """Run a git command inside the repo directory."""
    return subprocess.run(
        cmd,
        cwd=REPO_DIR,
        capture_output=capture,
        text=True,
    )


def log(msg: str) -> None:
    ts = datetime.now().strftime("%H:%M:%S")
    print(f"[{ts}] {msg}")


def has_local_changes() -> bool:
    """True if there are uncommitted tracked/untracked changes."""
    status = run(["git", "status", "--porcelain"])
    return bool(status.stdout.strip())


def stash_local() -> bool:
    """Stash any local changes. Returns True if something was stashed."""
    if not has_local_changes():
        return False
    result = run(["git", "stash", "push", "-m", "sync_repo: auto-stash"])
    return result.returncode == 0


def pop_stash() -> bool:
    """Pop the most recent stash if it's ours."""
    result = run(["git", "stash", "list"])
    if "sync_repo: auto-stash" in (result.stdout or ""):
        pop = run(["git", "stash", "pop"])
        if pop.returncode != 0:
            log(f"WARNING: stash pop conflict — resolve manually.\n{pop.stderr}")
            return False
    return True


def fetch_remote() -> bool:
    result = run(["git", "fetch", REMOTE])
    if result.returncode != 0:
        log(f"ERROR: fetch failed — {result.stderr.strip()}")
        return False
    return True


def local_behind_remote() -> bool:
    """Check if local branch is behind remote."""
    result = run(
        ["git", "rev-list", "--count", f"{BRANCH}..{REMOTE}/{BRANCH}"]
    )
    try:
        return int(result.stdout.strip()) > 0
    except ValueError:
        return False


def local_ahead_of_remote() -> bool:
    """Check if local branch has commits not yet pushed."""
    result = run(
        ["git", "rev-list", "--count", f"{REMOTE}/{BRANCH}..{BRANCH}"]
    )
    try:
        return int(result.stdout.strip()) > 0
    except ValueError:
        return False


def pull_remote() -> bool:
    """Rebase local commits on top of remote changes."""
    result = run(["git", "pull", "--rebase", REMOTE, BRANCH])
    if result.returncode != 0:
        log(f"ERROR: pull --rebase failed.\n{result.stderr.strip()}")
        log("Aborting rebase so you can fix manually.")
        run(["git", "rebase", "--abort"])
        return False
    return True


def commit_local() -> None:
    """Stage all changes and create an auto-commit."""
    if not has_local_changes():
        return

    run(["git", "add", "-A"])

    # Build a short summary of what changed
    diff = run(["git", "diff", "--cached", "--stat"])
    summary = diff.stdout.strip().split("\n")[-1] if diff.stdout.strip() else "updates"

    ts = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    msg = f"sync: local changes ({ts})\n\n{summary}"
    run(["git", "commit", "-m", msg])
    log("Committed local changes.")


def push_local() -> bool:
    result = run(["git", "push", REMOTE, BRANCH])
    if result.returncode != 0:
        log(f"ERROR: push failed — {result.stderr.strip()}")
        return False
    log("Pushed to remote.")
    return True


def sync_once() -> None:
    """Run a single pull-commit-push cycle."""
    log("Starting sync…")

    # 1. Fetch to see what's new
    if not fetch_remote():
        return

    # 2. If remote has new commits, pull them in
    if local_behind_remote():
        log("Remote has new changes — pulling…")
        stashed = stash_local()
        ok = pull_remote()
        if stashed:
            pop_stash()
        if not ok:
            return
        log("Pulled remote changes.")
    else:
        log("Already up-to-date with remote.")

    # 3. Commit any local changes
    commit_local()

    # 4. Push if we're ahead
    if local_ahead_of_remote():
        log("Local is ahead — pushing…")
        push_local()
    else:
        log("Nothing to push.")

    log("Sync complete.\n")


def watch(interval: int) -> None:
    """Continuously sync at the given interval (seconds)."""
    log(f"Watching for changes every {interval}s  (Ctrl+C to stop)\n")
    try:
        while True:
            sync_once()
            time.sleep(interval)
    except KeyboardInterrupt:
        log("\nStopped.")


def main() -> None:
    parser = argparse.ArgumentParser(description="2-way git sync for Lovable")
    parser.add_argument(
        "--watch", action="store_true", help="Run continuously"
    )
    parser.add_argument(
        "-i",
        "--interval",
        type=int,
        default=30,
        help="Seconds between sync cycles (default: 30)",
    )
    args = parser.parse_args()

    # Sanity check: are we in a git repo?
    if not (REPO_DIR / ".git").is_dir():
        print(f"ERROR: {REPO_DIR} is not a git repository.", file=sys.stderr)
        sys.exit(1)

    if args.watch:
        watch(args.interval)
    else:
        sync_once()


if __name__ == "__main__":
    main()
