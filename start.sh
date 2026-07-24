#!/usr/bin/env bash
set -euo pipefail
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ENV_FILE="$ROOT_DIR/.env"
API_DIR="$ROOT_DIR/backend"
UI_DIR="$ROOT_DIR/frontend"
MIGRATION_DIR="$API_DIR/migrations"
load_env_file(){ local line key value;while IFS= read -r line||[ -n "$line" ];do [[ "$line" =~ ^[[:space:]]*# || "$line" =~ ^[[:space:]]*$ ]]&&continue;line="${line#export }";key="${line%%=*}";value="${line#*=}";key="${key//[[:space:]]/}";[[ "$key" =~ ^[A-Za-z_][A-Za-z0-9_]*$ ]]||continue;[ -n "${!key+x}" ]&&continue;if [[ "$value" == \"*\" && "$value" == *\" ]];then value="${value:1:${#value}-2}";elif [[ "$value" == \'*\' && "$value" == *\' ]];then value="${value:1:${#value}-2}";fi;export "$key=$value";done < "$ENV_FILE"; }
[ -f "$ENV_FILE" ]||{ echo "Missing required file: $ENV_FILE" >&2;exit 1; };load_env_file
BACKEND_PORT="${BACKEND_PORT:-${PORT:?PORT or BACKEND_PORT is required}}"; FRONTEND_PORT="${FRONTEND_PORT:?FRONTEND_PORT is required}"
fail(){ printf 'error: %s\n' "$*" >&2; exit 1; }
port_free(){ if command -v lsof >/dev/null 2>&1 && lsof -tiTCP:"$1" -sTCP:LISTEN >/dev/null 2>&1; then fail "port $1 is already in use; refusing to terminate another process"; fi; }
check_config(){ local secret="${JWT_SECRET:-}"; command -v node >/dev/null||fail "node is required";command -v npm >/dev/null||fail "npm is required";[ -n "${DATABASE_URL:-}" ]||fail "DATABASE_URL is required";[ -n "${GOVERNANCE_TENANT_ID:-}" ]||fail "GOVERNANCE_TENANT_ID is required";[ "${#secret}" -ge 32 ]||fail "JWT_SECRET must contain at least 32 characters";case "$DATABASE_URL" in *example*|*changeme*|*password@*) fail "DATABASE_URL contains a placeholder";;esac;[ "${ENABLE_GENERATED_FEATURES:-false}" != "true" ]||[ "${NODE_ENV:-development}" != "production" ]||fail "generated features are forbidden in production";printf 'configuration valid for tenant %s\n' "$GOVERNANCE_TENANT_ID"; }
migrate(){ check_config;[ "${ALLOW_SCHEMA_MIGRATION:-0}" = "1" ]||fail "set ALLOW_SCHEMA_MIGRATION=1 for explicit migration";command -v psql >/dev/null||fail "psql is required";for migration in "$MIGRATION_DIR"/*.sql;do [ -f "$migration" ]||continue;psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f "$migration";done; }
start_services(){ check_config;[ -d "$API_DIR/node_modules" ]||fail "API dependencies are missing; install explicitly";[ -d "$UI_DIR/node_modules" ]||fail "UI dependencies are missing; install explicitly";port_free "$BACKEND_PORT";port_free "$FRONTEND_PORT";(cd "$API_DIR" && ./node_modules/.bin/ts-node --transpile-only scripts/runtime-setup.ts);(cd "$API_DIR" && PORT="$BACKEND_PORT" ./node_modules/.bin/ts-node --transpile-only src/index.ts) & api_pid=$!;(cd "$UI_DIR" && VITE_BACKEND_PORT="$BACKEND_PORT" VITE_FRONT_PORT="$FRONTEND_PORT" BROWSER=none npm run dev -- --host "${FRONTEND_HOST:-127.0.0.1}" --port "$FRONTEND_PORT") & ui_pid=$!;trap 'kill "$api_pid" "$ui_pid" 2>/dev/null || true;wait "$api_pid" "$ui_pid" 2>/dev/null || true' INT TERM EXIT;wait "$api_pid" "$ui_pid"; }
case "${1:-start}" in check) check_config;;migrate) migrate;;start) start_services;;*) fail "usage: $0 {check|migrate|start}";;esac
