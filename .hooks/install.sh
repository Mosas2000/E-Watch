#!/bin/sh
#
# Install project git hooks into the local .git/hooks directory.
# Run this once after cloning the repository.

HOOK_DIR=".hooks"
GIT_HOOK_DIR=".git/hooks"

if [ ! -d "$GIT_HOOK_DIR" ]; then
  echo "Error: This script must be run from the repository root."
  exit 1
fi

for hook in "$HOOK_DIR"/*; do
  name=$(basename "$hook")
  cp "$hook" "$GIT_HOOK_DIR/$name"
  chmod +x "$GIT_HOOK_DIR/$name"
  echo "Installed $name hook"
done

echo "All hooks installed."
