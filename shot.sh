#!/bin/bash
OUT=$1; QS="${2:-}"; W=${3:-900}; H=${4:-700}
# Prefer local http server if up; else file URL (modules need http)
BASE="${BASE_URL:-http://127.0.0.1:8765/}"
google-chrome --headless=new --no-sandbox --hide-scrollbars --window-size=$W,$H \
  --virtual-time-budget=${VT:-2000} --user-data-dir=/tmp/eye-chrome-$$ \
  --screenshot="$OUT" "${BASE}${QS}" 2>/dev/null
rm -rf /tmp/eye-chrome-$$
echo "wrote $OUT"
