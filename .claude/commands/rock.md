---
description: Commit staged/unstaged changes, push, and append an entry to docs/commit-log.md
---

Commit all current changes, log them, and push:

1. Run `git status` and `git diff` to see what changed.
2. Stage the relevant files (avoid `git add -A` if anything looks like a secret or unrelated file).
3. Write a concise commit message describing the "why", following this repo's existing commit style, ending with:
   ```
   Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
   ```
4. Append one line to `docs/commit-log.md` (create the file with a `# Commit Log` header if it doesn't exist yet) in the form:
   ```
   - YYYY-MM-DD HH:MM — <commit message first line>
   ```
   using the current local date/time. Stage this file alongside the other changes so it's part of the same commit.
5. Create the commit.
6. Push to `origin main`.
7. Report the resulting commit hash and push status.

If there is nothing to commit (ignoring a no-op docs/commit-log.md), say so and stop — do not push with no new commit.
