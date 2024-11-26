- [dockercompose](#dockercompose)
  - [networks](#networks)
  - [.env](#env)
  - [run](#run)

## dockercompose
### networks
```bash
docker network create database_bridge
docker network create plane-dev
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
S3_ACCOUNT_ID=
S3_ACCESS_KEY_ID=
S3_ACCESS_KEY_SECRET=

# dynamic ports
PLANE_PROXY_PORT=
PLANE_CONTROLLER_PORT=
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
docker compose -f databases/postgres.docker-compose.yml   --env-file .env up -d
docker compose -f databases/redis.docker-compose.yml      --env-file .env up -d
docker compose -f monitoring/docker-compose.yml           --env-file .env up -d
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