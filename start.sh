#!/bin/sh
set -e

echo "start.sh: wrapper entrypoint invoked"

# If the image-provided absolute entrypoint exists, use it.
if [ -x "/entrypoint.sh" ]; then
  echo "Found /entrypoint.sh, delegating to it"
  exec /entrypoint.sh "$@"
fi

# If a repository-mounted backend/entrypoint.sh exists, try to make it executable and run it.
if [ -f "backend/entrypoint.sh" ]; then
  echo "Found backend/entrypoint.sh in mounted project, attempting to use it"
  chmod +x backend/entrypoint.sh || true
  exec backend/entrypoint.sh "$@"
fi

echo "No entrypoint found in image or mounted project; executing passed command"
exec "$@"
