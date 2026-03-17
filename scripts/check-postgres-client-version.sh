#!/usr/bin/env bash
set -euo pipefail

if [[ $# -ne 2 ]]; then
  echo "Usage: $0 <DATABASE_URL_ENV_VAR> <label>" >&2
  exit 1
fi

database_url_env="$1"
label="$2"
database_url="${!database_url_env:-}"

if [[ -z "$database_url" ]]; then
  echo "${database_url_env} is required" >&2
  exit 1
fi

if ! command -v psql >/dev/null 2>&1 || ! command -v pg_dump >/dev/null 2>&1; then
  cat >&2 <<'EOF'
PostgreSQL client tools are required to verify DB contracts.

Install both `psql` and `pg_dump`, and make sure they match the same major
version as the target database server before rerunning the command.

Examples:
  Ubuntu/Debian:
    sudo apt-get install -y postgresql-common ca-certificates
    sudo /usr/share/postgresql-common/pgdg/apt.postgresql.org.sh -y
    sudo apt-get install -y postgresql-client-17

  Homebrew:
    brew install postgresql@17

After installation, ensure `psql --version` and `pg_dump --version` report the
same PostgreSQL major version as the DB server.
EOF
  exit 1
fi

server_major="$(
  psql "$database_url" -Atqc "SELECT current_setting('server_version_num')::int / 10000"
)"
pg_dump_version="$(pg_dump --version)"
client_major="$(
  printf '%s\n' "$pg_dump_version" \
    | sed -E 's/.* ([0-9]+)(\.[0-9]+)?([[:space:]].*)?$/\1/'
)"

if [[ -z "$server_major" || -z "$client_major" ]]; then
  echo "Unable to determine PostgreSQL client/server major versions for ${label}" >&2
  exit 1
fi

if [[ "$client_major" != "$server_major" ]]; then
  cat >&2 <<EOF
PostgreSQL client/server major version mismatch for ${label}.

  server major: ${server_major}
  pg_dump: ${pg_dump_version}

Install PostgreSQL client ${server_major} locally so schema snapshots match the
PostgreSQL ${server_major} service containers used in CI.

Examples:
  Ubuntu/Debian:
    sudo apt-get install -y postgresql-common ca-certificates
    sudo /usr/share/postgresql-common/pgdg/apt.postgresql.org.sh -y
    sudo apt-get install -y postgresql-client-${server_major}

  Homebrew:
    brew install postgresql@${server_major}

After installation, ensure `psql` and `pg_dump` resolve to PostgreSQL
${server_major} before rerunning this command.
EOF
  exit 1
fi

echo "Using ${pg_dump_version} against ${label} server major ${server_major}"
