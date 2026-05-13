# Claude Code Instructions

## Git & Deployment Rules

After EVERY session that modifies any file, you MUST:

1. Run `git status` to confirm all changed files
2. Run `git add -A` to stage all changes
3. Run `git commit -m "<descriptive message of what changed>"`
4. Run `git push origin main`

This is NON-NEGOTIABLE. Vercel deploys automatically on push.
If you don't push, the changes are NOT live.

## Commit Message Format
"T[tier]-[task]: Brief description of what changed"
Examples:
- "T4-1: Complete email rewrite with Gmail-safe table layout"
- "T3-3: Add mobile performance dashboard section"
- "Fix: PDF header clipping and period badge centering"

## Never End a Session Without Pushing
Before saying any task is "done" or "complete", confirm:
- git status shows clean working tree after push, OR
- explicitly tell the user "I made changes but did not push — 
  run: git add -A && git commit -m '...' && git push origin main"

Do not assume the user will push manually.
