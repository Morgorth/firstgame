#!/bin/bash
set -euo pipefail

# Only run in Claude Code remote (web) sessions
if [ "${CLAUDE_CODE_REMOTE:-}" != "true" ]; then
  exit 0
fi

# sonic-halfpipe has a package.json — install deps (caches on container snapshot)
cd "$CLAUDE_PROJECT_DIR/sonic-halfpipe"
npm install

# wave-assault has no package.json / no npm deps — nothing to install

echo "Session environment ready."
