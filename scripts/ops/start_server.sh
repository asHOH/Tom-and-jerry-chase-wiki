#!/bin/bash

REPO_DIR="Tom-and-jerry-chase-wiki"
REPO_URL="https://github.com/asHOH/Tom-and-jerry-chase-wiki.git"
# Alternative URL if you need mirroring
# REPO_URL="https://githubfast.com/asHOH/Tom-and-jerry-chase-wiki.git"
TARGET_BRANCH="develop"
# Set this to a specific commit hash to deploy that version. Leave empty to deploy the latest.
TARGET_COMMIT=""
# Node.js memory limit in MB. Adjust based on server capacity (e.g., 2048 for 4GB RAM).
NODE_MEMORY_LIMIT="2048"
ENV_FILE=".env.production"

# Function to run a command with retries for git.
# Uses git's internal lowSpeedLimit/lowSpeedTime to handle stalls instead of hard timeouts.
run_with_retry() {
  local max_attempts=5
  local attempt=1

  # Configure git to abort if speed drops below 1KB/s for 60 seconds
  git config --global http.lowSpeedLimit 1000
  git config --global http.lowSpeedTime 60

  while [ $attempt -le $max_attempts ]; do
    echo "Attempt $attempt of $max_attempts..."
    if "$@"; then
      return 0
    fi

    echo "Command failed. Retrying in 5 seconds..."
    sleep 5
    ((attempt++))
  done

  echo "⚠️  Warning: Command failed after $max_attempts attempts. Giving up."
  return 1
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
    echo "Update successful."
    if [ -n "$TARGET_COMMIT" ]; then
      echo "⚠️ Resetting to specific commit: $TARGET_COMMIT"
      git reset --hard "$TARGET_COMMIT"
    else
      echo "Resetting to the latest version."
      git reset --hard "origin/$TARGET_BRANCH"
    fi
  else
    echo "Could not update from remote. Starting server with existing local code."
  fi
fi

# 2. Set up Production Environment Variables.
if [ ! -f "$ENV_FILE" ]; then
  if [ -f ".env.example" ]; then
    echo "Production environment file '$ENV_FILE' not found. Creating from .env.example..."
    cp .env.example "$ENV_FILE"
    echo "✅ Created '$ENV_FILE' from .env.example."
  else
    echo "Production environment file '$ENV_FILE' not found. Creating a template..."
    cat << EOF > "$ENV_FILE"
# Feedback Collection Configuration

# Email Service (Resend)
NEXT_PUBLIC_DISABLE_FEEDBACK_EMAIL=1
RESEND_API_KEY=your_resend_api_key_here
FEEDBACK_EMAIL=your-email@example.com
RESEND_FROM_EMAIL=feedback@email.tjwiki.com

# Analytics (set to 1 to force-enable, 0 to disable)
# NEXT_PUBLIC_ENABLE_VERCEL_ANALYTICS=0

# Disable Articles Feature (uncomment to disable)
# NEXT_PUBLIC_DISABLE_ARTICLES=1

# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://gehfogfxgbkwwwcamogj.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdlaGZvZ2Z4Z2Jrd3d3Y2Ftb2dqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUzMjYxMjgsImV4cCI6MjA3MDkwMjEyOH0.eDK3NqpJfYGnMcjlVEbes5K5gMzDy1HPQsC_Dm9dhng
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key_here
NEXT_PUBLIC_SUPABASE_AUTH_USER_EMAIL_DOMAIN=email.tjwiki.com

# Disable Wikitext Editor (uncomment to disable)
# NEXT_PUBLIC_DISABLE_WIKITEXT_EDITOR=1

# Enable Captcha for Pages ("hcaptcha" or "turnstile") (comment to disable)
NEXT_PUBLIC_CAPTCHA_PROVIDER=hcaptcha
NEXT_PUBLIC_CAPTCHA_SITE_KEY=your_hcaptcha_site_key_here
CAPTCHA_SECRET_KEY=your_hcaptcha_secret_key_here

# Chat Service (Gemini)
NEXT_PUBLIC_GEMINI_CHAT_MODEL=gemini-2.5-flash
GEMINI_API_KEY=your_gemini_api_key_here

# Image
# NEXT_PUBLIC_DISABLE_IMAGE_OPTIMIZATION=1

# Rate Limit
UPSTASH_REDIS_REST_URL=https://example.upstash.io
UPSTASH_REDIS_REST_TOKEN=your_upstash_redis_token_here

# Sentry (Error Monitoring)
# Get DSN from: Project Settings > Client Keys (DSN)
NEXT_PUBLIC_SENTRY_DSN=https://examplePublicKey@o0.ingest.sentry.io/0
# Get Auth Token from: User Settings > API > Auth Tokens (Scopes: project:releases, org:read)
SENTRY_AUTH_TOKEN=your_sentry_auth_token_here
# Organization Slug from: Organization Settings > General Settings
SENTRY_ORG=your_organization_slug
# Project Slug from: Project Settings > General Settings
SENTRY_PROJECT=your_project_slug

EOF
    echo "✅ Template '$ENV_FILE' created."
  fi
  echo "🛑 Please edit the file with production secrets and run this script again."
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
echo "Installing/updating project dependencies..."

for i in {1..3}; do
  echo "Attempt $i of 3..."

  # Smart Mirror Switching: Use CN mirror for first attempt, official for retries
  if [ $i -eq 1 ]; then
    echo "Using npmmirror.com for first attempt..."
    npm config set registry https://registry.npmmirror.com/
  else
    echo "Falling back to registry.npmjs.org..."
    npm config set registry https://registry.npmjs.org/
  fi

  # recommended for prod to avoid supabase CLI postinstall
  if npm install --ignore-scripts; then
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
# Get the commit timestamp in ISO 8601 format
export NEXT_PUBLIC_BUILD_TIMESTAMP=$(git show -s --format=%cI "$CURRENT_HASH")
LAST_BUILD_HASH=""
if [ -f "$BUILD_HASH_FILE" ]; then
  LAST_BUILD_HASH=$(cat "$BUILD_HASH_FILE")
fi

if [ "$CURRENT_HASH" != "$LAST_BUILD_HASH" ]; then
  echo "Code has changed since last build. Building application..."
  npm run set-runtime:node

  echo "Memory status before build:"
  free -h 2>/dev/null || echo "Unable to check memory"

  # Optimize Node.js memory usage
  # Lowering to leave more room for OS and worker threads
  export NODE_OPTIONS="--max-old-space-size=$NODE_MEMORY_LIMIT"
  
  # Limit concurrency to reduce memory usage
  # This forces Next.js to use fewer workers for static generation and webpack
  export NEXT_CPU_COUNT=1
  export UV_THREADPOOL_SIZE=1

  # Skip heavy checks during production build on server (we check locally)
  export SKIP_BUILD_CHECKS=true
  export NEXT_TELEMETRY_DISABLED=1

  npm run build
  BUILD_EXIT_CODE=$?

  if [ $BUILD_EXIT_CODE -eq 0 ]; then
    echo "✅ Build successful."
    mkdir -p .next && echo "$CURRENT_HASH" > "$BUILD_HASH_FILE"
  else
    echo "❌ Fatal: Build failed with exit code $BUILD_EXIT_CODE."
    if [ $BUILD_EXIT_CODE -eq 137 ]; then
      echo "   (Exit code 137 usually indicates Out Of Memory)"
    fi
    echo "Cannot start server."
    exit 1
  fi
else
  echo "No code changes detected. Skipping build."
fi

# 8. Start the application.
echo "Starting the application..."
cloudflared tunnel --config /workspace/cloudflared-config.yml run & npm start
