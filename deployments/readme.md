- [dockercompose](#dockercompose)
  - [networks](#networks)
  - [.env](#env)
  - [run](#run)

## dockercompose
### networks
```bash
docker network create cansu_dev_dj_backend_bridge
docker network create cansu_dev_code_judge0_bridge
```
### .env
```bash
POSTGRESQL_POSTGRES_PASSWORD= 
POSTGRESQL_USERNAME=
POSTGRESQL_PASSWORD=
POSTGRESQL_DB=
# comma delimited usernames
POSTGRESQL_ALL_USERNAMES=
# comma delimited passwords
POSTGRESQL_ALL_PASSWORDS=
# postgresql replica manager
REPMGR_USERNAME=
REPMGR_PASSWORD=
REDIS_PASSWORD=


# required for cansu.dev/dj
CANSU_DEV_DJ_API_PORT=
UPLOAD_ADMIN_USERNAME=
UPLOAD_ADMIN_PASSWORD=
S3_ACCOUNT_ID=
S3_ACCESS_KEY_ID=
S3_ACCESS_KEY_SECRET=
```
### run
```bash
docker compose -f databases/postgres.docker-compose.yml   --env-file .env up -d
docker compose -f databases/redis.docker-compose.yml      --env-file .env up -d
docker compose -f monitoring/docker-compose.yml           --env-file .env up -d
# https://api.cansu.dev/health
docker compose -f cansu.dev/backend.docker-compose.yml    --env-file .env up -d
# https://judge.cansu.dev/docs
git clone https://github.com/judge0/judge0.git cansu.dev
git clone https://github.com/judge0/compilers.git cansu.dev
#
rm cansu.dev/compilers/Dockerfile
rm cansu.dev/judge0/Dockerfile
rm cansu.dev/judge0/Gemfile.lock
rm cansu.dev/judge0/languages/active.rb
rm cansu.dev/judge0/languages/archived.rb
#
mv cansu.dev/judge0.compilers.Dockerfile  cansu.dev/compilers/Dockerfile
mv cansu.dev/judge0.Dockerfile            cansu.dev/judge0/Dockerfile
mv cansu.dev/judge0.Gemfile.lock          cansu.dev/judge0/Gemfile.lock
mv cansu.dev/judge0.languages.active.rb   cansu.dev/judge0/languages/active.rb
mv cansu.dev/judge0.languages.archived.rb cansu.dev/judge0/languages/archived.rb
mv cansu.dev/install-gcc.sh               cansu.dev/compilers/install-gcc.sh
# also change compile and run configs in judge0/app/jobs/isolate_job.rb
# -E PATH=\"/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin:/usr/local/.asdf/bin:/usr/local/.asdf/shims\" \
# -E LANG -E LANGUAGE -E LC_ALL -E JUDGE0_HOMEPAGE -E JUDGE0_SOURCE_CODE -E JUDGE0_MAINTAINER -E JUDGE0_VERSION -E ASDF_DATA_DIR=/usr/local/.asdf \
#
docker buildx create --use --name larger_log --driver-opt env.BUILDKIT_STEP_LOG_MAX_SIZE=500000000
docker buildx use larger_log
exec docker buildx build -f cansu.dev/compilers/Dockerfile cansu.dev/compilers -t judge0-compilers 2>&1 | multilog t s2000000 n10 ./logs &
#
docker buildx use default
docker build -f cansu.dev/judge0/Dockerfile cansu.dev/judge0 -t judge0
#
docker compose -f cansu.dev/judge0.docker-compose.yml --env-file .env up -d
```
all services are tunneled from Cloudflare Zero Trust, so there is no NGINX config.