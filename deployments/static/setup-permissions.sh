#!/bin/bash

STATIC_DIR="/var/www/servers/cansu.dev/static"

sudo groupadd static_cansu_dev_group
sudo useradd -r -g static_cansu_dev_group -d "$STATIC_DIR" -s /sbin/nologin static_cansu_dev_user

sudo chown -R static_cansu_dev_user:static_cansu_dev_group "$STATIC_DIR"
sudo chmod -R 550 "$STATIC_DIR"

mkdir -p ./logs
sudo chown -R static_cansu_dev_user:static_cansu_dev_group ./logs
sudo chmod -R 755 ./logs

echo "permissions have been set up. you can now start the docker container."
echo "run: docker compose up -d"