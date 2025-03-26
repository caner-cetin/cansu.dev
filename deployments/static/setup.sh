#!/bin/sh
set -e

# Update and upgrade
apk update
apk upgrade
apk add wget

add_group_if_not_exists() {
    local group_name="$1"
    if getent group "$group_name" > /dev/null 2>&1; then
        echo "uroup $group_name already exists, skipping group creation"
    else
        addgroup -S "$group_name" || true
    fi
}

add_user_if_not_exists() {
    local username="$1"
    local group_name="$2"
    local home_dir="$3"

    if id "$username" > /dev/null 2>&1; then
        echo "user $username already exists, skipping user creation"
    else
        adduser -S -D -g "$group_name" -h "$home_dir" -s /sbin/nologin "$username" || true
    fi
}

add_group_if_not_exists static_cansu_dev_group
add_user_if_not_exists static_cansu_dev_user static_cansu_dev_group /var/www/servers/cansu.dev/static/

chown -R static_cansu_dev_user:static_cansu_dev_group /var/www/servers/cansu.dev/static/
chmod -R 755 /var/www/servers/cansu.dev/static/

mkdir -p /etc/nginx/bots.d

wget https://raw.githubusercontent.com/mitchellkrogza/nginx-ultimate-bad-bot-blocker/master/bots.d/blockbots.conf -O /etc/nginx/bots.d/blockbots.conf 
wget https://raw.githubusercontent.com/mitchellkrogza/nginx-ultimate-bad-bot-blocker/master/bots.d/ddos.conf -O /etc/nginx/bots.d/ddos.conf
wget "https://raw.githubusercontent.com/mitchellkrogza/nginx-ultimate-bad-bot-blocker/master/conf.d/globalblacklist.conf" -O "/etc/nginx/conf.d/globalblacklist.conf"

chown -R static_cansu_dev_user:static_cansu_dev_group /var/log/nginx
chmod -R 755 /var/log/nginx

exit 0