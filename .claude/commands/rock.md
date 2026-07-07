---
description: Commit staged/unstaged changes with a generated message and push to origin main
---

Commit all current changes and push them:

1. Run `git status` and `git diff` to see what changed.
2. Stage the relevant files (avoid `git add -A` if anything looks like a secret or unrelated file).
3. Write a concise commit message describing the "why", following this repo's existing commit style, ending with:
   ```
   Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
   ```
4. Create the commit.
5. Push to `origin main`.
6. Report the resulting commit hash and push status.

If there is nothing to commit, say so and stop — do not push with no new commit.
