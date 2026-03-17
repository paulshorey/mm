#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

export ANDROID_SDK_ROOT="${ANDROID_SDK_ROOT:-$ROOT_DIR/.android-sdk}"
export ANDROID_HOME="${ANDROID_HOME:-$ANDROID_SDK_ROOT}"
export ANDROID_USER_HOME="${ANDROID_USER_HOME:-$ROOT_DIR/.android-user-home}"
export CI="${CI:-true}"
export COREPACK_ENABLE_DOWNLOAD_PROMPT=0
export GRADLE_USER_HOME="${GRADLE_USER_HOME:-$ROOT_DIR/.gradle}"
export HUSKY="${HUSKY:-0}"
export JAVA_HOME="${JAVA_HOME:-/usr/lib/jvm/java-21-openjdk-amd64}"

mkdir -p \
  "$ROOT_DIR/.turbo" \
  "$ANDROID_SDK_ROOT" \
  "$ANDROID_USER_HOME" \
  "$GRADLE_USER_HOME"

bash scripts/install-workspace-deps.sh "$@"

bash scripts/install-android-sdk.sh

# Set up Gradle tools to build the Android app
(
  cd apps-marketing/notes-android
  ./gradlew --no-daemon :app:help >/dev/null
)


# Install PostgreSQL 17 client tools (psql, pg_dump) for db:migrate and db:verify
need_pg17=false
if ! command -v psql >/dev/null 2>&1 || ! command -v pg_dump >/dev/null 2>&1; then
  need_pg17=true
elif ! pg_dump --version | grep -qE '\b17[.[]'; then
  need_pg17=true
fi
if [[ "$need_pg17" == "true" ]]; then
  echo "Installing PostgreSQL 17 client tools..."
  sudo apt-get update -qq
  sudo apt-get install -y postgresql-common ca-certificates
  sudo /usr/share/postgresql-common/pgdg/apt.postgresql.org.sh -y
  sudo apt-get install -y postgresql-client-17
  echo "PostgreSQL client tools installed: $(pg_dump --version)"
fi

pnpm fetch --store-dir "$STORE_DIR"
pnpm install --frozen-lockfile --prefer-offline --store-dir "$STORE_DIR"
