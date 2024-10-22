required networks:
```bash
docker network create cansu_dev_dj_backend_bridge
docker network create cansu_dev_code_judge0_bridge
```
put `.env` in this folder and run everything from here
```bash
docker compose -f databases/postgres.docker-compose.yml --env-file .env up -d
docker compose -f databases/redis.docker-compose.yml --env-file .env up -d
# runs grafana, prometheus, cadvisor, node-exporter, alertmanager.
docker compose -f monitoring/docker-compose.yml --env-file .env up -d
# https://api.cansu.dev/health
docker compose -f cansu.dev/backend.docker-compose.yml --env-file .env up -d
# https://judge.cansu.dev/docs
docker compose -f cansu.dev/judge0.docker-compose.yml --env-file .env up -d
```
all services are tunneled from Cloudflare Zero Trust, so there is no NGINX config. Depending on your setup, you might need one.