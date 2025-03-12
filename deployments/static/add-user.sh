#!/bin/bash

if [ "$#" -ne 2 ]; then
  echo "Usage: $0 username password"
  exit 1
fi

USERNAME="$1"
PASSWORD="$2"
CONTAINER_NAME="file-server"  # change this if you renamed service in docker-compose.yml

docker exec "$CONTAINER_NAME" sh -c "apt-get install -y apache2-utils && htpasswd -b /etc/lighttpd/lighttpd-htpasswd '$USERNAME' '$PASSWORD'"
docker exec "$CONTAINER_NAME" chown static_cansu_dev_user:static_cansu_dev_group /etc/lighttpd/lighttpd-htpasswd
docker exec "$CONTAINER_NAME" chmod 440 /etc/lighttpd/lighttpd-htpasswd

echo "user '$USERNAME' has been added to the password file."
echo "remember to restart lighttpd with: docker exec $CONTAINER_NAME kill -s HUP 1"