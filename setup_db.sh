#!/usr/bin/env bash
#
# Sets up the database that APP_ENV in .env points at: installs deps, applies
# the migrations and loads the starting data. Only npm scripts, so no mysql
# client is needed.
#
#   ./setup_db.sh
#
# The database itself must already exist:
#   CREATE DATABASE onegp_fleet_v1 CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
#
# Note the seed step CLEARS the tables it fills, so running this against a
# database that already holds real data replaces that data with data/*.json.

set -euo pipefail
cd "$(dirname "$0")"

npm run db:deploy

# data/*.json was removed when the app moved to MySQL; restore it if missing.
[[ -d data ]] || git checkout "$(git log --diff-filter=D --format=%H -1 -- data/users.json)^" -- data/

# The seed refuses to run with APP_ENV=prod unless this is set, since it clears
# the tables it fills. Loading the data is the whole point of this script.
SEED_ALLOW_PROD=1 npm run db:seed

echo
echo "Done. APP_ENV=${APP_ENV:-(from .env)}"
