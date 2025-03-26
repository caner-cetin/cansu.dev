#!/bin/sh
set -e

# Update and upgrade
apk update
apk upgrade
apk add wget

addgroup -S static_cansu_dev_group
adduser -S -D -g static_cansu_dev_group -h /var/www/servers/cansu.dev/static/ -s /sbin/nologin static_cansu_dev_user

chown -R static_cansu_dev_user:static_cansu_dev_group /var/www/servers/cansu.dev/static/
chmod -R 755 /var/www/servers/cansu.dev/static/

mkdir -p /etc/nginx/bots.d

wget https://raw.githubusercontent.com/mitchellkrogza/nginx-ultimate-bad-bot-blocker/master/bots.d/blockbots.conf -O /etc/nginx/bots.d/blockbots.conf 
wget https://raw.githubusercontent.com/mitchellkrogza/nginx-ultimate-bad-bot-blocker/master/bots.d/ddos.conf -O /etc/nginx/bots.d/ddos.conf
wget "https://raw.githubusercontent.com/mitchellkrogza/nginx-ultimate-bad-bot-blocker/master/conf.d/globalblacklist.conf" -O "/etc/nginx/conf.d/globalblacklist.conf"

chown -R static_cansu_dev_user:static_cansu_dev_group /var/log/nginx
chmod -R 755 /var/log/nginx

exit 0