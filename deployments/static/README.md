configuration files for `https://static.cansu.dev`

### run
```bash
docker compose up -d
# ready to go at 44444 port
#
# if you need password protection, change or add new password protected folder block within lighttpd.conf
#
# for example this block
#
# server.document-root = "/var/www/servers/cansu.dev/static/"
# $HTTP["url"] =~ "^/private/" {
#   auth.require = (
#     "" => (
#       "method" => "basic",
#       "realm" => "Protected Area",
#       "require" => "valid-user"
#     )
#   )
# }
#
# hosts a protected folder located at /var/www/servers/cansu.dev/static/private
# then check if config is correct
lighttpd -tt -f lighttpd.conf
# add a new user
./add-user.sh admin secretpassword
# then reload the lighttpd
docker exec file-server kill -s HUP 1
# warning that, created users will have access to all folders, so there is no "folder specific" authentication. ill change that later.
```
if tinkering with config, make sure config is ok
```bash
lighttpd -tt -f lighttpd.conf
```