- [updates](#updates)
- [dockercompose](#dockercompose)
  - [networks](#networks)
  - [config](#config)
    - [.env](#env)
    - [config.monitoring](#configmonitoring)
  - [run](#run)


## updates

currently writing a small CLI for running services using 1password. wip.

## dockercompose
### networks
```bash
docker network create database_bridge
docker network create plane-dev
docker network create uptime_bridge
```
### config
#### .env
```bash
POSTGRESQL_POSTGRES_PASSWORD=
POSTGRESQL_PSQL_URL=
POSTGRESQL_USERNAME=
POSTGRESQL_PASSWORD=
POSTGRESQL_URL=
POSTGRESQL_DB=
POSTGRESQL_ALL_USERNAMES=
POSTGRESQL_ALL_PASSWORDS=

CANSU_DEV_DJ_API_PORT=

HF_TOKEN=
HF_MODEL_URL=


REDIS_PASSWORD=

REPMGR_USERNAME=
REPMGR_PASSWORD=

# cansu.dev/dj
UPLOAD_ADMIN_USERNAME=
UPLOAD_ADMIN_PASSWORD=

# dynamic ports
PLANE_PROXY_PORT=
PLANE_CONTROLLER_PORT=

# required for postgres backups
#
# for wal-g, any s3 compatible service works, minio, r2, etc.
# i have configured it to use with R2, but if you want you can use Azure, GCS, SSH, local filesystem (dont, seperate your backups with server please)
# check => https://github.com/wal-g/wal-g/blob/master/docs/STORAGES.md and the docker compose
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
WALG_S3_PREFIX=
AWS_ENDPOINT=
AWS_S3_FORCE_PATH_STYLE=
AWS_REGION=
```
#### config.monitoring
```bash
GF_SECURITY_ADMIN_PASSWORD=
GF_USERS_ALLOW_SIGN_UP=false
GF_PATHS_PROVISIONING=/etc/grafana/provisioning
GF_INSTALL_PLUGINS=https://storage.googleapis.com/integration-artifacts/grafana-lokiexplore-app/grafana-lokiexplore-app-latest.zip;grafana-lokiexplore-app
```
### run
```bash
# ====== common services ===
# => 1 replica 1 primary and 1 pgpool instances for postgres 16
# => dragonfly
# => monitoring stack with
# ==> grafana as dashboard
# ==> prometheus&cadvisor and loki&promtail as datasources
# ==> alert manager
# ==========================
#
# before launching the postgres container, modify the ofeliea (submodule) dockerfile first
# go into ofelia/Dockerfile and change
#
# FROM golang:1.22-alpine AS builder => FROM golang:1.22-bookworm AS builder
# FROM alpine:3.20 => FROM debian:bookworm
#
# and then build with
#
# cd ofelia
# docker build . -t ofelia-debian
#
# then run the docker compose. keep reading if you wonder why we do this.
#
#
# ofelia is based on alpine to be lightweight but, musl is a guaranteed pain in the ass and the tradeoff is definitely not worth it.
# what is the problem? alpine is the problem. you can run tasks with ofelia either
# 1. using an image
# 2. using an already running container
# 3. using the ofelia host itself
# i prefer to run everything inside the ofelia as it is the easiest, and, wal-g does not have musl/Alpine builds.
# not just wal-g, almost everything must be built from source on alpine and i seriously dont want hassle just to save 60 MB on a system that has 200 GB free space.
# this one is a good read https://pythonspeed.com/articles/alpine-docker-python/
docker compose -f databases/postgres.docker-compose.yml   --env-file .env up -d # modify userlist.txt for more users
docker compose -f databases/scheduler.docker-compose.yml  --env-file .env up -d
docker compose -f databases/redis.docker-compose.yml      --env-file .env up -d
docker compose -f monitoring/docker-compose.yml           --env-file .env up -d
docker compose -f kuma/docker-compose.yaml                 --env-file .env up -d
# ===== code.cansu.dev =======
# => compiler and backend image
# ============================
docker build -f cansu.dev/playground.compilers.Dockerfile cansu.dev -t code-cansu-dev-runner 2>&1 | multilog t s2000000 n10 ./logs &
docker compose -f cansu.dev/playground.docker-compose.yml --env-file .env up -d
# ======= plane.dev ===========
# 1x plane drone, controller and proxy
# =============================
mv cansu.dev/plane.docker-compose.yml plane/docker/docker-compose.yml
docker compose -f plane/docker/docker-compose.yml up -d
```
all services are tunneled from Cloudflare Zero Trust, so there is no NGINX config.

don't forget firewall:
```bash
sudo apt install ufw
# ensure that IPv6 is enabled
sudo nano /etc/default/ufw
# deny all
sudo ufw default deny incoming
# allow all
sudo ufw default allow outgoing
# allow ssh
sudo ufw allow ssh
# allow cloudflare tunnels
sudo ufw allow 443
# change to your reverse proxy, zero trust is using 7844 and 443
sudo ufw allow 7844
# allow yourself
sudo ufw allow from 203.0.113.101
sudo ufw allow enable
```
