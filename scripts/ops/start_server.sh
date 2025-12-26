#!/bin/bash

REPO_DIR="Tom-and-jerry-chase-wiki"
REPO_URL="https://github.com/asHOH/Tom-and-jerry-chase-wiki.git"
# Alternative URL if you need mirroring
# REPO_URL="https://githubfast.com/asHOH/Tom-and-jerry-chase-wiki.git"
TARGET_BRANCH="develop"
ENV_FILE=".env.production"

# Function to run a command with timeout and retries for git.
run_with_retry() {
  local start_time=$SECONDS
  local cmd_timeout=10
  local total_timeout=30

  while true; do
    timeout $cmd_timeout "$@" && return 0
    local elapsed_time=$((SECONDS - start_time))
    if [ $elapsed_time -ge $total_timeout ]; then
      echo "⚠️  Warning: Command failed after $total_timeout seconds. Giving up."
      return 1
    fi
    echo "Command failed or timed out. Retrying in 2 seconds..."
    sleep 2
  done
}

# 1. Clone or update the repository.
if [ ! -d "$REPO_DIR/.git" ]; then
  echo "Cloning repository..."
  if ! run_with_retry git clone --branch "$TARGET_BRANCH" --single-branch "$REPO_URL"; then
    echo "❌ Fatal: Initial clone failed. Cannot continue."
    exit 1
  fi
  cd "$REPO_DIR"
else
  echo "Repository exists. Attempting to update..."
  cd "$REPO_DIR"
  if run_with_retry git fetch origin "$TARGET_BRANCH"; then
    echo "Update successful. Resetting to the latest version."
    git reset --hard "origin/$TARGET_BRANCH"
  else
    echo "Could not update from remote. Starting server with existing local code."
  fi
fi

# 2. Set up Production Environment Variables.
if [ ! -f "$ENV_FILE" ]; then
  echo "Production environment file '$ENV_FILE' not found. Creating a template..."
  cat << EOF > "$ENV_FILE"
# --- Production Environment Variables ---
RESEND_API_KEY=<YOUR_PRODUCTION_RESEND_API_KEY>
FEEDBACK_EMAIL=tyzhang0001+tjwiki@gmail.com
RESEND_FROM_EMAIL=feedback@email.tjwiki.com
NEXT_PUBLIC_SUPABASE_URL=https://gehfogfxgbkwwwcamogj.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdlaGZvZ2Z4Z2Jrd3d3Y2Ftb2dqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUzMjYxMjgsImV4cCI6MjA3MDkwMjEyOH0.eDK3NqpJfYGnMcjlVEbes5K5gMzDy1HPQsC_Dm9dhng
SUPABASE_SERVICE_ROLE_KEY=<YOUR_PRODUCTION_SUPABASE_SERVICE_KEY>
NEXT_PUBLIC_SUPABASE_AUTH_USER_EMAIL_DOMAIN=email.tjwiki.com
NEXT_PUBLIC_DISABLE_NOPASSWD_USER_AUTH=1
NEXT_PUBLIC_CAPTCHA_PROVIDER=turnstile
NEXT_PUBLIC_CAPTCHA_SITE_KEY=0x4AAAAAABu0eWybq5gJHhNE
CAPTCHA_SECRET_KEY=<YOUR_PRODUCTION_CAPTCHA_SECRET_KEY>
NEXT_PUBLIC_GEMINI_CHAT_MODEL=gemini-2.5-flash
GEMINI_API_KEY=<YOUR_PRODUCTION_GEMINI_API_KEY>
NEXT_PUBLIC_ENABLE_VERCEL_ANALYTICS=0
APP_PUBLIC_HOST=<YOUR_PUBLIC_DOMAIN_OR_IP>
EOF
  echo "✅ Template '$ENV_FILE' created."
  echo "🛑 Please edit the file with your production secrets and run this script again."
  exit 1
fi

echo "Loading production environment variables from $ENV_FILE..."
export $(grep -v '^#' "$ENV_FILE" | xargs)

# 3. Install NVM if it's not properly installed.
# This check is more robust: it looks for the actual script, not just the directory.
if [ ! -s "$HOME/.nvm/nvm.sh" ]; then
  echo "NVM not found or installation is incomplete. Installing/Re-installing NVM..."
  # Clean up any partial installation first.
  rm -rf "$HOME/.nvm"
  # Force the installer to use the Gitee mirror for cloning.
  export NVM_SOURCE=https://gitee.com/mirrors/nvm.git
  if ! curl --connect-timeout 15 -o- https://gitee.com/mirrors/nvm/raw/master/install.sh | bash; then
    echo "❌ Fatal: NVM installation failed. Please check network or logs."
    exit 1
  fi
fi

# 4. Load NVM.
export NVM_DIR="$HOME/.nvm"
# This check is now the final gatekeeper.
if [ -s "$NVM_DIR/nvm.sh" ]; then
  \. "$NVM_DIR/nvm.sh"
else
  echo "❌ Fatal: NVM is still not correctly installed after attempting installation."
  exit 1
fi

# 5. Install Node.js.
echo "Ensuring correct Node.js version is installed..."
nvm install

# 6. Install dependencies with a retry loop.

# Resolve the npm binary that belongs to the Node version nvm just activated
NODE_BIN="$(command -v node)"
NPM_BIN="$(dirname "$NODE_BIN")/npm"

echo "Using node: $NODE_BIN"
echo "Using npm:  $NPM_BIN"

# Sanity check
"$NPM_BIN" -v || { echo "❌ Fatal: npm not runnable"; exit 1; }

# Set China mirror for npm packages
# echo "Configuring npm registry mirror..."
# "$NPM_BIN" config set registry https://registry.npmmirror.com/
"$NPM_BIN" config set registry https://registry.npmjs.org/

echo "Installing/updating project dependencies..."
for i in {1..3}; do
  echo "Attempt $i of 3..."
  # recommended for prod to avoid supabase CLI postinstall
  if "$NPM_BIN" i --ignore-scripts; then
    echo "✅ Dependencies installed successfully."
    break
  fi
  if [ $i -eq 3 ]; then
    echo "❌ Fatal: npm install failed after 3 attempts. Cannot start server."
    exit 1
  fi
  echo "⚠️ npm install failed. Retrying in 2 seconds..."
  sleep 2
done


# 7. Build the application only if code has changed.
BUILD_HASH_FILE=".next/.build_hash"
CURRENT_HASH=$(git rev-parse HEAD)
export COMMIT_SHA="$CURRENT_HASH"
LAST_BUILD_HASH=""
if [ -f "$BUILD_HASH_FILE" ]; then
  LAST_BUILD_HASH=$(cat "$BUILD_HASH_FILE")
fi

if [ "$CURRENT_HASH" != "$LAST_BUILD_HASH" ]; then
  echo "Code has changed since last build. Building application..."
  npm run set-runtime:node
  if npm run build; then
    echo "✅ Build successful."
    mkdir -p .next && echo "$CURRENT_HASH" > "$BUILD_HASH_FILE"
  else
    echo "❌ Fatal: Build failed. Cannot start server."
    exit 1
  fi
else
  echo "No code changes detected. Skipping build."
fi

# 8. Start the application.
echo "Starting the application..."
npm start
